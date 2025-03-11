import Phaser from 'phaser';
import { ElementType, ENEMY_CONFIG } from '../config';
import { DEPTHS, EVENTS } from '../utils/constants';
import { createParticles } from '../utils/helpers';

export default class Boss extends Phaser.Physics.Arcade.Sprite {
    private element: ElementType;
    private health: number;
    private maxHealth: number;
    private damage: number;
    private speed: number;
    private attackCooldown: number;
    private lastAttackTime: number;
    private attackPatterns: string[];
    private currentPattern: string;
    private isAggro: boolean;
    private targetX: number | null;
    private isDying: boolean;
    private bossName: string;
    private attackPhase: number;
    private attackTimer: Phaser.Time.TimerEvent | null;
    private stunned: boolean;
    private stunTimer: Phaser.Time.TimerEvent | null;
    private projectiles: Phaser.GameObjects.Group;
    private specialAttacksEnabled: boolean;

    private healthBar: Phaser.GameObjects.Graphics;
    private elementIcon: Phaser.GameObjects.Sprite;
    private bossNameText: Phaser.GameObjects.Text;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        element: ElementType,
        bossName: string = 'Corrupted Guardian'
    ) {
        super(scene, x, y, 'boss');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set up boss properties
        this.element = element;
        this.bossName = bossName;
        const level = scene.registry.get('level') || 1;
        this.maxHealth = ENEMY_CONFIG.BASE_HEALTH * 10 + (level * 20);  // Bosses have 10x health of regular enemies
        this.health = this.maxHealth;
        this.damage = ENEMY_CONFIG.BASE_DAMAGE * 2 + (level * 3);  // Bosses deal more damage
        this.speed = ENEMY_CONFIG.BASE_SPEED * 0.8;  // Slower but more powerful
        this.attackCooldown = 3000 - (level * 200);  // Attack cooldown reduces with level
        this.lastAttackTime = 0;
        this.attackPatterns = ['projectile', 'charge', 'summon', 'areaOfEffect'];
        this.currentPattern = 'projectile';
        this.isAggro = false;
        this.targetX = null;
        this.isDying = false;
        this.attackPhase = 1;
        this.attackTimer = null;
        this.stunned = false;
        this.stunTimer = null;
        this.specialAttacksEnabled = false;
        
        // Set physics properties
        this.body.setSize(80, 80);
        this.setOffset((this.width - 80) / 2, this.height - 80);
        this.setDepth(DEPTHS.ENEMIES);
        this.setCollideWorldBounds(true);
        this.setScale(2);  // Bosses are larger
        
        // Set up health bar and UI elements
        this.healthBar = scene.add.graphics();
        this.drawHealthBar();
        
        this.elementIcon = scene.add.sprite(x, y - 90, `element-icon-${element}`);
        this.elementIcon.setScale(0.8);
        this.elementIcon.setDepth(DEPTHS.ENEMIES + 1);
        
        this.bossNameText = scene.add.text(x, y - 110, this.bossName, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.bossNameText.setOrigin(0.5, 0.5);
        this.bossNameText.setDepth(DEPTHS.ENEMIES + 1);
        
        // Set up projectiles group
        this.projectiles = scene.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            maxSize: 10,
            runChildUpdate: true
        });
        
        // Start with the appropriate animation based on element
        this.play(`boss-${element}-idle`);
        
        // Start attack timer
        this.startAttackTimer();
    }

    update(time: number, delta: number): void {
        if (this.isDying) return;
        
        // Update UI elements
        this.drawHealthBar();
        this.elementIcon.setPosition(this.x, this.y - 90);
        this.bossNameText.setPosition(this.x, this.y - 110);
        
        // If stunned, don't move or attack
        if (this.stunned) return;
        
        // Movement logic
        if (this.isAggro && this.targetX !== null) {
            if (this.targetX < this.x - 20) {
                this.setVelocityX(-this.speed);
                this.setFlipX(true);
            } else if (this.targetX > this.x + 20) {
                this.setVelocityX(this.speed);
                this.setFlipX(false);
            } else {
                this.setVelocityX(0);
            }
        } else {
            this.setVelocityX(0);
        }
        
        // Attack logic
        if (time - this.lastAttackTime > this.attackCooldown && this.isAggro && this.targetX !== null) {
            this.lastAttackTime = time;
            this.performAttack();
        }
        
        // Create ambient particles
        if (Math.random() > 0.95) {
            this.createElementalEffect();
        }
    }

    private drawHealthBar(): void {
        this.healthBar.clear();
        
        // Draw background bar
        this.healthBar.fillStyle(0x000000, 0.8);
        this.healthBar.fillRect(this.x - 100, this.y - 70, 200, 10);
        
        // Calculate health percentage
        const healthPercent = this.health / this.maxHealth;
        
        // Determine color based on health
        let healthColor = 0x00ff00;
        if (healthPercent < 0.3) healthColor = 0xff0000;
        else if (healthPercent < 0.6) healthColor = 0xffff00;
        
        // Draw health bar
        this.healthBar.fillStyle(healthColor, 1);
        this.healthBar.fillRect(this.x - 98, this.y - 68, 196 * healthPercent, 6);
        
        // Draw phase indicators
        if (this.maxHealth > 0) {
            // Phase 2 threshold at 66% health
            const phase2Pos = this.x - 98 + (196 * 0.66);
            this.healthBar.fillStyle(0xffffff, 1);
            this.healthBar.fillRect(phase2Pos, this.y - 74, 2, 16);
            
            // Phase 3 threshold at 33% health
            const phase3Pos = this.x - 98 + (196 * 0.33);
            this.healthBar.fillStyle(0xffffff, 1);
            this.healthBar.fillRect(phase3Pos, this.y - 74, 2, 16);
        }
    }

    private startAttackTimer(): void {
        this.attackTimer = this.scene.time.addEvent({
            delay: this.attackCooldown,
            callback: () => {
                if (this.isAggro && !this.stunned && !this.isDying) {
                    this.performAttack();
                }
            },
            loop: true
        });
    }

    private performAttack(): void {
        // Choose attack pattern based on health phase
        if (!this.specialAttacksEnabled) return;
        
        const healthPercent = this.health / this.maxHealth;
        
        // Update attack phase based on health
        if (healthPercent < 0.33 && this.attackPhase < 3) {
            this.attackPhase = 3;
            this.enterPhase3();
        } else if (healthPercent < 0.66 && this.attackPhase < 2) {
            this.attackPhase = 2;
            this.enterPhase2();
        }
        
        // Select an attack pattern
        let availablePatterns = [...this.attackPatterns];
        if (this.attackPhase === 1) {
            // In phase 1, limit available attacks
            availablePatterns = ['projectile', 'charge'];
        }
        
        // Choose a random attack from available patterns
        const patternIndex = Math.floor(Math.random() * availablePatterns.length);
        this.currentPattern = availablePatterns[patternIndex];
        
        // Perform the selected attack
        switch (this.currentPattern) {
            case 'projectile':
                this.projectileAttack();
                break;
            case 'charge':
                this.chargeAttack();
                break;
            case 'summon':
                this.summonAttack();
                break;
            case 'areaOfEffect':
                this.areaOfEffectAttack();
                break;
        }
    }

    private projectileAttack(): void {
        if (!this.targetX) return;
        
        // Play attack animation
        this.play(`boss-${this.element}-attack`, true);
        
        const projectileCount = 1 + this.attackPhase; // More projectiles in higher phases
        
        // Set the spread and direction based on target position
        const direction = this.targetX < this.x ? -1 : 1;
        const angleSpread = 20 * (this.attackPhase - 1); // Wider spread in higher phases
        
        // Launch projectiles
        for (let i = 0; i < projectileCount; i++) {
            this.scene.time.delayedCall(i * 150, () => {
                if (this.active && !this.isDying) {
                    const angle = -90 + (direction * 45) + (i - (projectileCount - 1) / 2) * angleSpread;
                    this.fireProjectile(angle);
                }
            });
        }
        
        // Play sound
        this.scene.sound.play('shoot', { volume: 0.6 });
        
        // Create effect
        createParticles(this.scene, this.x, this.y - 40, this.getElementColor(), 5, 60, 1, 500);
    }

    private chargeAttack(): void {
        if (!this.targetX) return;
        
        // Show warning
        this.scene.time.delayedCall(200, () => {
            if (this.active && !this.isDying) {
                createParticles(this.scene, this.x, this.y, 0xff0000, 10, 30, 1, 300);
            }
        });
        
        // Prepare for charge
        this.scene.time.delayedCall(500, () => {
            if (this.active && !this.isDying) {
                // Play charge animation
                this.play(`boss-${this.element}-charge`, true);
                
                // Determine charge direction
                const direction = this.targetX < this.x ? -1 : 1;
                
                // Increase speed during charge
                const chargeSpeed = this.speed * 3;
                
                // Charge!
                this.setVelocityX(direction * chargeSpeed);
                
                // Create trail effect
                const interval = this.scene.time.addEvent({
                    delay: 50,
                    callback: () => {
                        if (this.active && !this.isDying) {
                            createParticles(
                                this.scene,
                                this.x - (direction * 30),
                                this.y,
                                this.getElementColor(),
                                3,
                                20,
                                0.8,
                                400
                            );
                        }
                    },
                    repeat: 10
                });
                
                // End charge after a duration
                this.scene.time.delayedCall(800, () => {
                    if (this.active && !this.isDying) {
                        this.setVelocityX(0);
                        interval.remove();
                    }
                });
            }
        });
        
        // Play sound
        this.scene.sound.play('hit', { volume: 0.5 });
    }

    private summonAttack(): void {
        // Only available in phase 2 and 3
        if (this.attackPhase < 2) return;
        
        // Play summon animation
        this.play(`boss-${this.element}-summon`, true);
        
        // Show effect
        createParticles(this.scene, this.x, this.y, 0xffffff, 15, 100, 1.2, 1000);
        
        // Emit event for GameScene to spawn minions
        this.scene.events.emit(EVENTS.BOSS_SUMMON, this.x, this.y, this.element);
        
        // Play sound
        this.scene.sound.play('switch-element', { volume: 0.7 });
    }

    private areaOfEffectAttack(): void {
        // Only available in phase 3
        if (this.attackPhase < 3) return;
        
        // Play AOE animation
        this.play(`boss-${this.element}-special`, true);
        
        // Create expanding ring effect
        const ringCount = 3;
        for (let i = 0; i < ringCount; i++) {
            this.scene.time.delayedCall(i * 200, () => {
                if (this.active && !this.isDying) {
                    this.createAOERing(100 + (i * 50));
                }
            });
        }
        
        // Emit event for GameScene to create AOE damage zone
        this.scene.events.emit(EVENTS.BOSS_AOE_ATTACK, this.x, this.y, 200, this.damage, this.element);
        
        // Play sound
        this.scene.sound.play('level-complete', { volume: 0.5 });
    }

    private createAOERing(radius: number): void {
        const circle = this.scene.add.circle(this.x, this.y, radius, this.getElementColor(), 0.5);
        circle.setStrokeStyle(3, this.getElementColor(), 1);
        
        this.scene.tweens.add({
            targets: circle,
            alpha: 0,
            scale: 1.5,
            duration: 500,
            onComplete: () => circle.destroy()
        });
    }

    private fireProjectile(angle: number): void {
        const projectile = this.projectiles.get() as Phaser.Physics.Arcade.Sprite;
        if (!projectile) return;
        
        // Position at boss's location
        projectile.enableBody(true, this.x, this.y - 30, true, true);
        
        // Set properties
        projectile.setTexture('projectile');
        projectile.setTint(this.getElementColor());
        projectile.setScale(1.5);
        projectile.setDepth(DEPTHS.PROJECTILES);
        
        // Calculate velocity from angle
        const speed = 300;
        const velocityX = speed * Math.cos(angle * Math.PI / 180);
        const velocityY = speed * Math.sin(angle * Math.PI / 180);
        
        // Set velocity and properties
        projectile.setVelocity(velocityX, velocityY);
        projectile.body.setAllowGravity(false);
        
        // Store damage and element information on the projectile
        projectile.setData('damage', this.damage);
        projectile.setData('element', this.element);
        
        // Add rotation
        projectile.setRotation(angle * Math.PI / 180);
        
        // Create particle trail
        this.scene.time.addEvent({
            delay: 50,
            callback: () => {
                if (projectile.active) {
                    createParticles(
                        this.scene,
                        projectile.x,
                        projectile.y,
                        this.getElementColor(),
                        1,
                        10,
                        0.4,
                        200
                    );
                }
            },
            repeat: 20
        });
        
        // Auto-destroy after time
        this.scene.time.delayedCall(2000, () => {
            if (projectile.active) {
                projectile.disableBody(true, true);
            }
        });
    }

    private enterPhase2(): void {
        // Visual effect for phase transition
        createParticles(this.scene, this.x, this.y, 0xffffff, 30, 150, 1.5, 1500);
        
        // Play transition animation
        this.play(`boss-${this.element}-transform`, true);
        
        // Stun briefly during transition
        this.stun(1000);
        
        // Speed up attacks in phase 2
        this.attackCooldown *= 0.8;
        
        // Update attack timer
        if (this.attackTimer) {
            this.attackTimer.remove();
        }
        this.startAttackTimer();
        
        // Display phase change text
        const phaseText = this.scene.add.text(this.x, this.y - 150, "Phase 2", {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        });
        phaseText.setOrigin(0.5, 0.5);
        
        // Fade out the text
        this.scene.tweens.add({
            targets: phaseText,
            alpha: 0,
            y: this.y - 200,
            duration: 1500,
            onComplete: () => phaseText.destroy()
        });
        
        // Play sound
        this.scene.sound.play('switch-element', { volume: 0.8 });
    }

    private enterPhase3(): void {
        // More dramatic effect for final phase
        createParticles(this.scene, this.x, this.y, 0xffffff, 50, 200, 2, 2000);
        
        // Play transformation animation
        this.play(`boss-${this.element}-transform`, true);
        
        // Stun longer for more dramatic effect
        this.stun(1500);
        
        // Speed up attacks further in phase 3
        this.attackCooldown *= 0.7;
        
        // Update attack timer
        if (this.attackTimer) {
            this.attackTimer.remove();
        }
        this.startAttackTimer();
        
        // Increase damage in final phase
        this.damage = Math.floor(this.damage * 1.2);
        
        // Display dramatic phase change text
        const phaseText = this.scene.add.text(this.x, this.y - 150, "FINAL PHASE", {
            fontFamily: 'Arial',
            fontSize: '36px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 5
        });
        phaseText.setOrigin(0.5, 0.5);
        
        // Create pulsing effect
        this.scene.tweens.add({
            targets: phaseText,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: phaseText,
                    alpha: 0,
                    y: this.y - 250,
                    duration: 1000,
                    onComplete: () => phaseText.destroy()
                });
            }
        });
        
        // Play sound
        this.scene.sound.play('death', { volume: 0.7 });
    }

    private stun(duration: number): void {
        this.stunned = true;
        this.setVelocity(0, 0);
        this.setTint(0xaaaaaa);
        
        if (this.stunTimer) {
            this.stunTimer.remove();
        }
        
        this.stunTimer = this.scene.time.delayedCall(duration, () => {
            this.stunned = false;
            this.clearTint();
        });
    }

    public takeDamage(damage: number, attackerElement: ElementType): void {
        if (this.isDying || this.stunned) return;
        
        // Calculate damage based on elemental effectiveness
        let damageMultiplier = 1;
        
        if (attackerElement === this.element) {
            // Same element = reduced damage
            damageMultiplier = 0.25;
        } else if (this.isWeakTo(attackerElement)) {
            // Weak to attacking element = increased damage
            damageMultiplier = 2;
        } else if (this.isStrongAgainst(attackerElement)) {
            // Strong against attacking element = reduced damage
            damageMultiplier = 0.5;
        }
        
        const actualDamage = Math.floor(damage * damageMultiplier);
        this.health = Math.max(0, this.health - actualDamage);
        
        // Visual feedback for hit
        this.createHitEffect(damageMultiplier);
        this.flashOnHit();
        
        // Play sound based on effectiveness
        if (damageMultiplier >= 2) {
            this.scene.sound.play('hit', { volume: 0.7 });
        } else if (damageMultiplier <= 0.5) {
            this.scene.sound.play('hit', { volume: 0.3 });
        } else {
            this.scene.sound.play('hit', { volume: 0.5 });
        }
        
        // Emit damage event
        this.scene.events.emit(EVENTS.BOSS_DAMAGE, actualDamage, this.health, this.maxHealth);
        
        // Check if boss is defeated
        if (this.health <= 0) {
            this.die();
        }
        
        // Become aggressive
        this.isAggro = true;
    }

    private createHitEffect(damageMultiplier: number): void {
        let color = 0xffff00;
        let particleCount = 10;
        
        if (damageMultiplier >= 2) {
            // Super effective hit
            color = 0xff0000;
            particleCount = 15;
        } else if (damageMultiplier <= 0.5) {
            // Not very effective hit
            color = 0xcccccc;
            particleCount = 5;
        }
        
        createParticles(this.scene, this.x, this.y - 30, color, particleCount, 60, 0.8, 500);
    }

    private flashOnHit(): void {
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (this.active && !this.isDying) {
                this.clearTint();
            }
        });
    }

    public die(): void {
        this.isDying = true;
        this.setVelocity(0, 0);
        
        // Stop any ongoing attacks
        if (this.attackTimer) {
            this.attackTimer.remove();
        }
        
        // Play death animation
        this.play('boss-death');
        
        // Create spectacular death effect
        this.createDeathParticles();
        
        // Disable physics body
        this.body.enable = false;
        
        // Emit boss defeated event
        this.scene.events.emit(EVENTS.BOSS_DEFEATED, this.element);
        
        // Clean up after animation completes
        this.once('animationcomplete-boss-death', () => {
            // Create final explosion
            createParticles(this.scene, this.x, this.y, 0xffffff, 50, 200, 2, 2000);
            
            // Clean up UI elements
            this.healthBar.destroy();
            this.elementIcon.destroy();
            this.bossNameText.destroy();
            
            // Destroy projectiles
            this.projectiles.clear(true, true);
            
            // Destroy the boss
            this.destroy();
        });
        
        // Play death sound
        this.scene.sound.play('death', { volume: 1 });
    }

    private createDeathParticles(): void {
        // Create element-colored explosion
        createParticles(
            this.scene,
            this.x,
            this.y,
            this.getElementColor(),
            30,
            150,
            1.5,
            2000
        );
        
        // Create white flash effect after delay
        this.scene.time.delayedCall(300, () => {
            createParticles(
                this.scene,
                this.x,
                this.y,
                0xffffff,
                20,
                100,
                1.2,
                1500
            );
        });
        
        // Create final element-colored explosion
        this.scene.time.delayedCall(600, () => {
            createParticles(
                this.scene,
                this.x,
                this.y,
                this.getElementColor(),
                40,
                200,
                1.8,
                2500
            );
        });
    }

    private createElementalEffect(): void {
        // Create ambient elemental particles based on element type
        const color = this.getElementColor();
        
        switch (this.element) {
            case ElementType.FIRE:
                // Fire emits upward flames
                createParticles(
                    this.scene,
                    this.x + (Math.random() * 60 - 30),
                    this.y + 20,
                    color,
                    2,
                    50,
                    0.7,
                    800
                );
                break;
            case ElementType.WATER:
                // Water creates ripple effects
                createParticles(
                    this.scene,
                    this.x + (Math.random() * 60 - 30),
                    this.y + (Math.random() * 40 - 20),
                    color,
                    1,
                    30,
                    0.5,
                    1000
                );
                break;
            case ElementType.EARTH:
                // Earth creates dust/rock particles
                if (Math.random() > 0.7) {
                    createParticles(
                        this.scene,
                        this.x + (Math.random() * 80 - 40),
                        this.y + 30,
                        color,
                        3,
                        20,
                        0.6,
                        600
                    );
                }
                break;
            case ElementType.AIR:
                // Air creates swirling wind particles
                createParticles(
                    this.scene,
                    this.x + (Math.random() * 80 - 40),
                    this.y + (Math.random() * 60 - 30),
                    color,
                    1,
                    40,
                    0.4,
                    1200
                );
                break;
            case ElementType.SPIRIT:
                // Spirit creates ethereal glow
                if (Math.random() > 0.8) {
                    createParticles(
                        this.scene,
                        this.x,
                        this.y,
                        color,
                        5,
                        30,
                        0.5,
                        1000
                    );
                }
                break;
        }
    }

    private getElementColor(): number {
        switch (this.element) {
            case ElementType.FIRE: return 0xFF6600;
            case ElementType.WATER: return 0x66CCFF;
            case ElementType.EARTH: return 0x66AA66;
            case ElementType.AIR: return 0xCCCCFF;
            case ElementType.SPIRIT: default: return 0xCCCCCC;
        }
    }

    private isWeakTo(element: ElementType): boolean {
        switch (this.element) {
            case ElementType.FIRE: return element === ElementType.WATER;
            case ElementType.WATER: return element === ElementType.EARTH;
            case ElementType.EARTH: return element === ElementType.AIR;
            case ElementType.AIR: return element === ElementType.FIRE;
            default: return false;
        }
    }

    private isStrongAgainst(element: ElementType): boolean {
        switch (this.element) {
            case ElementType.FIRE: return element === ElementType.AIR;
            case ElementType.WATER: return element === ElementType.FIRE;
            case ElementType.EARTH: return element === ElementType.WATER;
            case ElementType.AIR: return element === ElementType.EARTH;
            default: return false;
        }
    }

    public setTarget(x: number): void {
        this.targetX = x;
        this.isAggro = true;
    }

    public clearTarget(): void {
        this.targetX = null;
        this.isAggro = false;
    }

    public getElement(): ElementType {
        return this.element;
    }

    public getDamage(): number {
        return this.damage;
    }

    public getProjectiles(): Phaser.GameObjects.Group {
        return this.projectiles;
    }

    public enableSpecialAttacks(): void {
        this.specialAttacksEnabled = true;
    }
}