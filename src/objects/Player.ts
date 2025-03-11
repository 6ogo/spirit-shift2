import Phaser from 'phaser';
import { ElementType, PLAYER_CONFIG, PROJECTILE_CONFIG, ELEMENT_COLORS } from '../config';
import { DEPTHS, EVENTS } from '../utils/constants';
import Projectile from './Projectile.ts';
import { createParticles } from '../utils/helpers';
import UpgradeSystem, { PlayerUpgrades } from '../systems/UpgradeSystems.ts';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    private currentElement: ElementType;
    private health: number;
    private energy: number;
    private maxHealth: number;
    private maxEnergy: number;
    private isJumping: boolean;
    private isDucking: boolean;
    private lastShootTime: number;
    private facingDirection: 'left' | 'right';
    private aimDirection: Phaser.Math.Vector2;
    private projectiles: Phaser.GameObjects.Group;
    private onPlatform: boolean;
    private isInvulnerable: boolean;
    private invulnerabilityTimer: Phaser.Time.TimerEvent | null;
    
    // Upgrade-related properties
    private upgrades: PlayerUpgrades;
    private hasDoubleJump: boolean;
    private canDoubleJump: boolean;
    private hasDash: boolean;
    private isDashing: boolean;
    private dashCooldown: number;
    private lastDashTime: number;
    private hasChargeAttack: boolean;
    private isCharging: boolean;
    private chargeStartTime: number;
    private maxChargeTime: number;
    private hasElementalCombo: boolean;
    private lastElementChangeTime: number;
    private elementComboCount: number;
    private comboResetTimer: Phaser.Time.TimerEvent | null;
    
    // Element-specific ability flags
    private fireTrailEnabled: boolean;
    private fireExplosionEnabled: boolean;
    private waterShieldEnabled: boolean;
    private waterShieldActive: boolean;
    private waterShieldTimer: Phaser.Time.TimerEvent | null;
    private waterSurfingEnabled: boolean;
    private earthQuakeEnabled: boolean;
    private earthShieldEnabled: boolean;
    private earthShieldActive: boolean;
    private earthShieldTimer: Phaser.Time.TimerEvent | null;
    private airDashEnabled: boolean;
    private airDashesAvailable: number;
    private airTornadoEnabled: boolean;
    private spiritDoppelgangerEnabled: boolean;
    private spiritDoppelganger: Phaser.GameObjects.Sprite | null;
    private spiritPhasingEnabled: boolean;
    private isPhasingActive: boolean;
    private phasingTimer: Phaser.Time.TimerEvent | null;
    
    // Special attack cooldowns
    private specialAttackCooldowns: Map<string, number>;
    private lastSpecialAttackTimes: Map<string, number>;

    // Sound effects
    private jumpSound: Phaser.Sound.BaseSound;
    private shootSound: Phaser.Sound.BaseSound;
    private hitSound: Phaser.Sound.BaseSound;
    private switchElementSound: Phaser.Sound.BaseSound;
    private dashSound: Phaser.Sound.BaseSound;
    private specialSound: Phaser.Sound.BaseSound;

    // Input controls
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private keySpace: Phaser.Input.Keyboard.Key;
    private keyShift: Phaser.Input.Keyboard.Key;
    private keyF: Phaser.Input.Keyboard.Key;  // For special abilities
    private keyW: Phaser.Input.Keyboard.Key;
    private keyA: Phaser.Input.Keyboard.Key;
    private keyS: Phaser.Input.Keyboard.Key;
    private keyD: Phaser.Input.Keyboard.Key;
    private key1: Phaser.Input.Keyboard.Key;
    private key2: Phaser.Input.Keyboard.Key;
    private key3: Phaser.Input.Keyboard.Key;
    private key4: Phaser.Input.Keyboard.Key;
    private key5: Phaser.Input.Keyboard.Key;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string = 'player', frame: number = 0) {
        super(scene, x, y, texture, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Initialize basic properties
        this.currentElement = ElementType.SPIRIT;
        this.isJumping = false;
        this.isDucking = false;
        this.lastShootTime = 0;
        this.facingDirection = 'right';
        this.aimDirection = new Phaser.Math.Vector2(1, 0);
        this.onPlatform = false;
        this.isInvulnerable = false;
        this.invulnerabilityTimer = null;

        // Load upgrades
        UpgradeSystem.initialize();
        this.upgrades = UpgradeSystem.getPlayerUpgrades();
        
        // Set stats based on upgrades
        this.maxHealth = PLAYER_CONFIG.MAX_HEALTH * this.upgrades.maxHealth;
        this.maxEnergy = PLAYER_CONFIG.MAX_ENERGY * this.upgrades.maxEnergy;
        this.health = this.maxHealth;
        this.energy = this.maxEnergy;
        
        // Initialize ability flags
        this.hasDoubleJump = this.upgrades.doubleJump;
        this.canDoubleJump = this.hasDoubleJump;
        this.hasDash = this.upgrades.dashAbility;
        this.isDashing = false;
        this.dashCooldown = 1000; // 1 second cooldown
        this.lastDashTime = 0;
        this.hasChargeAttack = this.upgrades.chargeAttack;
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.maxChargeTime = 1500; // 1.5 seconds for full charge
        this.hasElementalCombo = this.upgrades.elementalCombo;
        this.lastElementChangeTime = 0;
        this.elementComboCount = 0;
        this.comboResetTimer = null;
        
        // Initialize element-specific abilities
        this.fireTrailEnabled = this.upgrades.fireTrail;
        this.fireExplosionEnabled = this.upgrades.fireExplosion;
        this.waterShieldEnabled = this.upgrades.waterShield;
        this.waterShieldActive = false;
        this.waterShieldTimer = null;
        this.waterSurfingEnabled = this.upgrades.waterSurfing;
        this.earthQuakeEnabled = this.upgrades.earthQuake;
        this.earthShieldEnabled = this.upgrades.earthShield;
        this.earthShieldActive = false;
        this.earthShieldTimer = null;
        this.airDashEnabled = this.upgrades.airDash;
        this.airDashesAvailable = 0;
        this.airTornadoEnabled = this.upgrades.airTornado;
        this.spiritDoppelgangerEnabled = this.upgrades.spiritDoppelganger;
        this.spiritDoppelganger = null;
        this.spiritPhasingEnabled = this.upgrades.spiritPhasing;
        this.isPhasingActive = false;
        this.phasingTimer = null;
        
        // Initialize cooldown trackers
        this.specialAttackCooldowns = new Map([
            ['fireExplosion', 5000],
            ['waterShield', 10000],
            ['earthQuake', 3000],
            ['airTornado', 8000],
            ['spiritDoppelganger', 15000],
            ['spiritPhasing', 12000]
        ]);
        
        this.lastSpecialAttackTimes = new Map([
            ['fireExplosion', 0],
            ['waterShield', 0],
            ['earthQuake', 0],
            ['airTornado', 0],
            ['spiritDoppelganger', 0],
            ['spiritPhasing', 0]
        ]);

        // Set up projectiles group
        this.projectiles = scene.add.group({ classType: Projectile, maxSize: 20, runChildUpdate: true });

        // Set up physics and visuals
        this.setCollideWorldBounds(true);
        this.setSize(PLAYER_CONFIG.WIDTH, PLAYER_CONFIG.HEIGHT);
        this.setOffset((this.width - PLAYER_CONFIG.WIDTH) / 2, this.height - PLAYER_CONFIG.HEIGHT);
        this.setDepth(DEPTHS.PLAYER);

        // Set up input controls
        this.cursors = scene.input.keyboard!.createCursorKeys();
        this.keySpace = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyShift = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.keyF = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.keyW = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.key1 = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.key3 = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        this.key4 = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
        this.key5 = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);

        // Load sounds
        this.jumpSound = scene.sound.add('jump', { volume: 0.5 });
        this.shootSound = scene.sound.add('shoot', { volume: 0.4 });
        this.hitSound = scene.sound.add('hit', { volume: 0.6 });
        this.switchElementSound = scene.sound.add('switch-element', { volume: 0.5 });
        this.dashSound = scene.sound.add('dash', { volume: 0.5 }) || scene.sound.add('jump', { volume: 0.5 });
        this.specialSound = scene.sound.add('special', { volume: 0.6 }) || scene.sound.add('level-complete', { volume: 0.4 });

        // Start with idle animation
        this.play('player-spirit-idle');

        // Set up input handlers
        scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => this.updateAimDirection(pointer.x, pointer.y));
        scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                if (this.hasChargeAttack) {
                    this.startCharging();
                } else {
                    this.shoot();
                }
            }
        });
        
        scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (this.isCharging) {
                this.releaseChargedShot();
            }
        });
    }

    update(time: number, delta: number): void {
        // Skip update if dashing (movement controlled by dash tween)
        if (this.isDashing) return;
        
        this.handleInput(time);
        this.updateAnimation();
        this.regenerateEnergy(delta);
        this.updateElementEffects(delta);
        this.updateSpecialEffects(time, delta);
        
        // Update charge indicator if charging
        if (this.isCharging) {
            this.updateChargeEffect(time);
        }
        
        // Update doppelganger if active
        if (this.spiritDoppelganger && this.spiritDoppelganger.active) {
            this.updateDoppelganger();
        }
    }

    private handleInput(time: number): void {
        // Check if on platform
        this.onPlatform = this.body.blocked.down || this.body.touching.down;
        
        // Reset double jump ability when landing
        if (this.onPlatform) {
            this.isJumping = false;
            this.canDoubleJump = this.hasDoubleJump;
            
            // Reset air dashes when touching ground
            if (this.currentElement === ElementType.AIR && this.airDashEnabled) {
                this.airDashesAvailable = 2;
            }
        }

        // Movement
        if (this.cursors.left.isDown || this.keyA.isDown) {
            this.moveLeft();
        } else if (this.cursors.right.isDown || this.keyD.isDown) {
            this.moveRight();
        } else {
            this.stopHorizontal();
        }

        // Jump (regular or double jump)
        if ((this.cursors.up.isDown || this.keyW.isDown || this.keySpace.isDown) && Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            if (this.onPlatform && !this.isJumping) {
                this.jump();
            } else if (this.canDoubleJump && this.isJumping) {
                this.doubleJump();
            }
        }

        // Duck/crouch
        if (this.cursors.down.isDown || this.keyS.isDown) {
            // If in Earth form and earthquake ability is unlocked, check for ground slam
            if (this.earthQuakeEnabled && this.currentElement === ElementType.EARTH && 
                this.isJumping && !this.onPlatform) {
                this.useGroundSlam();
            } else {
                this.duck();
            }
        } else if (this.isDucking) {
            this.standUp();
        }

        // Dash (on shift key press)
        if (Phaser.Input.Keyboard.JustDown(this.keyShift)) {
            // Regular dash
            if (this.hasDash && time - this.lastDashTime > this.dashCooldown) {
                this.dash();
            }
            // Air-specific multiple dashes
            else if (this.currentElement === ElementType.AIR && this.airDashEnabled && 
                    this.airDashesAvailable > 0 && this.isJumping) {
                this.airDash();
            }
        }
        
        // Special ability (F key)
        if (Phaser.Input.Keyboard.JustDown(this.keyF)) {
            this.useSpecialAbility(time);
        }

        // Element switching
        if (this.key1.isDown) this.changeElement(ElementType.SPIRIT);
        else if (this.key2.isDown) this.changeElement(ElementType.FIRE);
        else if (this.key3.isDown) this.changeElement(ElementType.WATER);
        else if (this.key4.isDown) this.changeElement(ElementType.EARTH);
        else if (this.key5.isDown) this.changeElement(ElementType.AIR);
    }

    private moveLeft(): void {
        // Calculate speed with upgrades and element bonuses
        let speedMultiplier = this.isDucking ? 0.5 : 1.0;
        
        // Apply base speed upgrade
        speedMultiplier *= this.upgrades.speed;
        
        // Apply element-specific bonuses
        if (this.currentElement === ElementType.FIRE) {
            speedMultiplier *= this.upgrades.fireSpeedBoost;
        } else if (this.currentElement === ElementType.WATER && this.waterSurfingEnabled && this.onPlatform) {
            speedMultiplier *= 1.3; // Water surfing bonus
        }
        
        // Apply motion
        this.setVelocityX(-PLAYER_CONFIG.SPEED * speedMultiplier);
        this.facingDirection = 'left';
        this.setFlipX(true);
        
        // Create fire trail if enabled and in fire form
        if (this.fireTrailEnabled && this.currentElement === ElementType.FIRE && this.onPlatform &&
           (Math.random() > 0.85)) {
            this.createFireTrail();
        }
    }

    private moveRight(): void {
        // Calculate speed with upgrades and element bonuses
        let speedMultiplier = this.isDucking ? 0.5 : 1.0;
        
        // Apply base speed upgrade
        speedMultiplier *= this.upgrades.speed;
        
        // Apply element-specific bonuses
        if (this.currentElement === ElementType.FIRE) {
            speedMultiplier *= this.upgrades.fireSpeedBoost;
        } else if (this.currentElement === ElementType.WATER && this.waterSurfingEnabled && this.onPlatform) {
            speedMultiplier *= 1.3; // Water surfing bonus
        }
        
        // Apply motion
        this.setVelocityX(PLAYER_CONFIG.SPEED * speedMultiplier);
        this.facingDirection = 'right';
        this.setFlipX(false);
        
        // Create fire trail if enabled and in fire form
        if (this.fireTrailEnabled && this.currentElement === ElementType.FIRE && this.onPlatform &&
           (Math.random() > 0.85)) {
            this.createFireTrail();
        }
    }

    private stopHorizontal(): void {
        this.setVelocityX(0);
    }

    private jump(): void {
        this.isJumping = true;
        
        // Calculate jump power with upgrades and element bonuses
        let jumpMultiplier = 1.0;
        
        // Apply base jump upgrade
        jumpMultiplier *= this.upgrades.jumpPower;
        
        // Apply element-specific bonuses
        switch (this.currentElement) {
            case ElementType.AIR: 
                jumpMultiplier *= 1.1; 
                break;
            case ElementType.EARTH: 
                jumpMultiplier *= 1.2 * this.upgrades.earthJumpBoost; 
                break;
            case ElementType.WATER: 
                jumpMultiplier *= 0.9; 
                break;
        }
        
        // Apply jump
        const jumpVelocity = PLAYER_CONFIG.JUMP_VELOCITY * jumpMultiplier;
        this.setVelocityY(jumpVelocity);
        this.jumpSound.play();
        
        // Create jump effect
        this.createJumpEffect();
    }
    
    private doubleJump(): void {
        if (!this.canDoubleJump) return;
        
        this.canDoubleJump = false;
        this.scene.events.emit(EVENTS.PLAYER_DOUBLE_JUMP);
        
        // Calculate jump power with upgrades and element bonuses
        let jumpMultiplier = 0.8; // Double jump is slightly weaker than normal jump
        
        // Apply base jump upgrade
        jumpMultiplier *= this.upgrades.jumpPower;
        
        // Apply element-specific bonuses
        switch (this.currentElement) {
            case ElementType.AIR: 
                jumpMultiplier *= 1.2; // Air gets bigger bonus on double jump
                break;
            case ElementType.EARTH: 
                jumpMultiplier *= 1.1 * this.upgrades.earthJumpBoost; 
                break;
            case ElementType.WATER: 
                jumpMultiplier *= 0.9; 
                break;
        }
        
        // Apply jump (reset vertical velocity first)
        this.setVelocityY(0);
        const jumpVelocity = PLAYER_CONFIG.JUMP_VELOCITY * jumpMultiplier;
        this.setVelocityY(jumpVelocity);
        this.jumpSound.play();
        
        // Create more prominent double jump effect
        this.createJumpEffect(true);
    }

    private createJumpEffect(isDoubleJump: boolean = false): void {
        // Create particles at feet
        const color = isDoubleJump ? 0xffffff : ELEMENT_COLORS[this.currentElement];
        const particleCount = isDoubleJump ? 15 : 8;
        
        createParticles(
            this.scene, 
            this.x, 
            this.y + this.height / 2, 
            color, 
            particleCount, 
            isDoubleJump ? 80 : 50, 
            isDoubleJump ? 0.8 : 0.5, 
            isDoubleJump ? 800 : 500
        );
    }

    private dash(): void {
        if (this.isDashing) return;
        
        this.isDashing = true;
        this.lastDashTime = this.scene.time.now;
        this.scene.events.emit(EVENTS.PLAYER_DASH);
        
        // Make player temporarily invulnerable during dash
        this.isInvulnerable = true;
        
        // Determine dash direction based on facing direction
        const dashDistance = 200 * this.upgrades.speed;
        const dashDirection = this.facingDirection === 'right' ? 1 : -1;
        
        // Create dash effect (motion blur)
        this.createDashEffect();
        
        // Play dash sound
        this.dashSound.play();
        
        // Apply dash movement using a tween for smoother motion
        this.scene.tweens.add({
            targets: this,
            x: this.x + (dashDistance * dashDirection),
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.isDashing = false;
                this.isInvulnerable = false;
            }
        });
    }
    
    private airDash(): void {
        if (this.isDashing || !this.airDashEnabled || this.airDashesAvailable <= 0) return;
        
        this.airDashesAvailable--;
        this.isDashing = true;
        this.scene.events.emit(EVENTS.PLAYER_DASH);
        
        // Make player temporarily invulnerable during dash
        this.isInvulnerable = true;
        
        // Air dash can go in any direction aimed
        const dashDistance = 150;
        
        // Create air dash effect (wind streaks)
        this.createAirDashEffect();
        
        // Play dash sound
        this.dashSound.play({ volume: 0.7 });
        
        // Zero out velocity and apply dash in aim direction
        this.setVelocity(0, 0);
        
        // Apply dash movement
        this.scene.tweens.add({
            targets: this,
            x: this.x + (this.aimDirection.x * dashDistance),
            y: this.y + (this.aimDirection.y * dashDistance),
            duration: 200,
            ease: 'Power1',
            onComplete: () => {
                this.isDashing = false;
                this.isInvulnerable = false;
            }
        });
    }
    
    private createDashEffect(): void {
        // Create motion blur effect
        const trailCount = 5;
        const trailSpacing = 10;
        const direction = this.facingDirection === 'right' ? -1 : 1;
        
        for (let i = 0; i < trailCount; i++) {
            // Create a "ghost" trail image of the player
            const trail = this.scene.add.sprite(
                this.x + (i * trailSpacing * direction),
                this.y,
                'player'
            );
            
            // Match current frame and flip state
            trail.setFrame(this.frame.name);
            trail.setFlipX(this.flipX);
            
            // Make it transparent and fade out
            trail.setAlpha(0.5 - (i / trailCount * 0.5));
            trail.setTint(ELEMENT_COLORS[this.currentElement]);
            
            // Make it disappear quickly
            this.scene.tweens.add({
                targets: trail,
                alpha: 0,
                duration: 200 + (i * 50),
                onComplete: () => trail.destroy()
            });
        }
        
        // Add particle burst in dash direction
        createParticles(
            this.scene,
            this.x,
            this.y,
            ELEMENT_COLORS[this.currentElement],
            15,
            70,
            0.8,
            400
        );
    }
    
    private createAirDashEffect(): void {
        // Create wind streak particles in the opposite direction of movement
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.atan2(this.aimDirection.y, this.aimDirection.x) + Math.PI;
            const distance = Phaser.Math.Between(20, 40);
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            const particle = this.scene.add.rectangle(
                this.x + offsetX,
                this.y + offsetY,
                Phaser.Math.Between(5, 15),
                2,
                0xccccff,
                0.7
            );
            
            particle.rotation = angle;
            
            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                x: particle.x + (offsetX * 2),
                y: particle.y + (offsetY * 2),
                scaleX: 0.5,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
    }

    private duck(): void {
        if (!this.isDucking) {
            this.isDucking = true;
            const newHeight = PLAYER_CONFIG.HEIGHT * (1 - PLAYER_CONFIG.DUCK_HEIGHT_REDUCTION);
            this.setSize(PLAYER_CONFIG.WIDTH, newHeight);
            this.setOffset((this.width - PLAYER_CONFIG.WIDTH) / 2, this.height - newHeight);
            if (this.body.velocity.x !== 0) this.setVelocityX(this.body.velocity.x * 0.5);
        }
    }

    private standUp(): void {
        this.isDucking = false;
        this.setSize(PLAYER_CONFIG.WIDTH, PLAYER_CONFIG.HEIGHT);
        this.setOffset((this.width - PLAYER_CONFIG.WIDTH) / 2, this.height - PLAYER_CONFIG.HEIGHT);
    }
    
    private useGroundSlam(): void {
        // Can only use if in air and Earth element 
        if (!this.isJumping || this.onPlatform || this.currentElement !== ElementType.EARTH) return;
        
        const now = this.scene.time.now;
        if (now - this.getLastSpecialAttackTime('earthQuake') < this.getSpecialCooldown('earthQuake')) return;
        
        // Update cooldown
        this.setLastSpecialAttackTime('earthQuake', now);
        
        // Fast-fall with earthquake effect
        this.setVelocityY(1000);
        
        // Play animation and sound
        this.specialSound.play();
        
        // Create visual effect
        createParticles(
            this.scene,
            this.x,
            this.y,
            ELEMENT_COLORS[ElementType.EARTH],
            10,
            40,
            0.7,
            500
        );
        
        // Set up impact event when hitting ground
        const impactCheck = this.scene.time.addEvent({
            delay: 50,
            callback: () => {
                if (this.onPlatform) {
                    this.createEarthquakeEffect();
                    impactCheck.remove();
                }
            },
            loop: true
        });
        
        // Cancel check after 2 seconds if never hit ground
        this.scene.time.delayedCall(2000, () => {
            impactCheck.remove();
        });
    }
    
    private createEarthquakeEffect(): void {
        // Emit event for GameScene to create actual damage zone
        this.scene.events.emit(EVENTS.PLAYER_SPECIAL_ATTACK, 'earthquake', this.x, this.y, 200);
        
        // Create shockwave visual effect
        const shockwave = this.scene.add.circle(this.x, this.y + this.height / 2, 10, 0xaa7722, 0.8);
        shockwave.setStrokeStyle(3, 0x66aa66);
        
        // Camera shake
        this.scene.cameras.main.shake(300, 0.01);
        
        // Expand and fade the shockwave
        this.scene.tweens.add({
            targets: shockwave,
            scaleX: 20,
            scaleY: 20,
            alpha: 0,
            duration: 500,
            onComplete: () => shockwave.destroy()
        });
        
        // Create dust particles
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            const distance = 30 + Math.random() * 150;
            
            const particle = this.scene.add.circle(
                this.x,
                this.y + this.height / 2,
                2 + Math.random() * 4,
                0xaa7722,
                0.7
            );
            
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * distance,
                y: particle.y + Math.sin(angle) * distance,
                alpha: 0,
                duration: 500 + Math.random() * 500,
                onComplete: () => particle.destroy()
            });
        }
    }

    private updateAnimation(): void {
        // Skip animation updates during dash
        if (this.isDashing) return;
        
        const elementPrefix = `player-${this.currentElement}`;
        
        // Choose animation based on state
        if (this.isCharging) {
            this.play(`${elementPrefix}-charge`, true);
        } else if (this.isDucking) {
            this.play(`${elementPrefix}-duck`, true);
        } else if (this.isJumping) {
            this.play(`${elementPrefix}-jump`, true);
        } else if (this.body.velocity.x !== 0) {
            this.play(`${elementPrefix}-run`, true);
        } else {
            this.play(`${elementPrefix}-idle`, true);
        }
    }

    private regenerateEnergy(delta: number): void {
        // Calculate base regen rate with upgrades
        let regenRate = PLAYER_CONFIG.ENERGY_REGEN[this.currentElement];
        
        // Apply base energy regen upgrade
        regenRate *= this.upgrades.energyRegen;
        
        // Apply fire-specific energy regen boost
        if (this.currentElement === ElementType.FIRE) {
            regenRate *= this.upgrades.fireEnergyRegenBoost;
        }
        
        // Regenerate energy
        this.energy = Math.min(this.maxEnergy, this.energy + regenRate * delta / 16);
        
        // Update UI
        this.scene.events.emit(EVENTS.PLAYER_ENERGY_CHANGE, this.energy, this.maxEnergy);
    }

    private updateElementEffects(delta: number): void {
        // Apply element-specific movement effects
        switch (this.currentElement) {
            case ElementType.AIR:
                // Air has reduced gravity/floatiness when falling
                if (this.isJumping && this.body.velocity.y > 0) {
                    this.body.velocity.y *= (0.98 - (this.upgrades.airFloatiness - 1) * 0.01);
                }
                break;
                
            case ElementType.WATER:
                // Water has momentary floating when at apex of jump
                if (this.isJumping && Math.abs(this.body.velocity.y) < 50) {
                    this.body.velocity.y *= (0.9 - (this.upgrades.waterFloatTime - 1) * 0.05);
                }
                break;
                
            case ElementType.EARTH:
                // Earth falls faster
                if (this.isJumping && this.body.velocity.y > 0) {
                    this.body.velocity.y *= 1.02;
                }
                break;
        }
        
        // Create movement particles
        if (!this.isJumping && !this.isDucking && this.body.velocity.x !== 0) {
            this.createMovementParticles();
        }
    }
    
    private updateSpecialEffects(time: number, delta: number): void {
        // Handle water shield regeneration
        if (this.waterShieldEnabled && this.currentElement === ElementType.WATER && 
            !this.waterShieldActive && 
            time - this.getLastSpecialAttackTime('waterShield') > this.getSpecialCooldown('waterShield')) {
            
            this.activateWaterShield();
        }
        
        // Handle earth shield effects
        if (this.earthShieldActive) {
            if (Math.random() > 0.9) {
                // Create occasional rock particles
                const angle = Math.random() * Math.PI * 2;
                const distance = 20;
                
                createParticles(
                    this.scene,
                    this.x + Math.cos(angle) * distance,
                    this.y + Math.sin(angle) * distance,
                    0xaa7722,
                    1,
                    20,
                    0.6,
                    400
                );
            }
        }
        
        // Handle spirit phasing effects
        if (this.isPhasingActive) {
            // Create ghostly trail effect
            if (Math.random() > 0.8) {
                createParticles(
                    this.scene,
                    this.x,
                    this.y,
                    0xcccccc,
                    1,
                    20,
                    0.3,
                    500
                );
            }
        }
    }

    private createMovementParticles(): void {
        if (Math.random() > 0.1) return;
        
        const particleX = this.x;
        const particleY = this.y + this.height / 2 - 4;
        const colors = {
            [ElementType.FIRE]: 0xFF6600,
            [ElementType.WATER]: 0x66CCFF,
            [ElementType.EARTH]: 0x66AA66,
            [ElementType.AIR]: 0xCCCCFF,
            [ElementType.SPIRIT]: 0xCCCCCC
        };
        
        createParticles(
            this.scene, 
            particleX, 
            particleY, 
            colors[this.currentElement], 
            2, 
            [ElementType.AIR, ElementType.EARTH].includes(this.currentElement) ? 60 : 50, 
            0.5, 
            [ElementType.AIR, ElementType.EARTH].includes(this.currentElement) ? 600 : 400
        );
    }
    
    private createFireTrail(): void {
        // Create a fire particle on the ground that stays for a moment
        const trail = this.scene.add.circle(
            this.x,
            this.y + this.height / 2,
            6 + Math.random() * 4,
            0xFF6600,
            0.7
        );
        
        // Create a glow effect
        trail.setBlendMode(Phaser.BlendModes.ADD);
        
        // Make it pulse and fade out
        this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 1000 + Math.random() * 500,
            onComplete: () => trail.destroy()
        });
        
        // Emit event to GameScene to register this as a damage source
        this.scene.events.emit(EVENTS.PLAYER_SPECIAL_ATTACK, 'fireTrail', this.x, this.y + this.height / 2);
    }

    public updateAimDirection(pointerX: number, pointerY: number): void {
        // Calculate vector from player to pointer
        const dx = pointerX - this.x;
        const dy = pointerY - this.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize the vector
        this.aimDirection.x = dx / length;
        this.aimDirection.y = dy / length;
        
        // Update facing direction based on aim
        if (dx < 0) {
            this.facingDirection = 'left';
            this.setFlipX(true);
        } else {
            this.facingDirection = 'right';
            this.setFlipX(false);
        }
    }
    
    private startCharging(): void {
        // Start a charge-up shot
        if (!this.hasChargeAttack || this.isCharging) return;
        
        // Check if we have minimum energy to start charging
        if (this.energy < PLAYER_CONFIG.SHOOT_ENERGY_COST) return;
        
        this.isCharging = true;
        this.chargeStartTime = this.scene.time.now;
        
        // Create a charging effect around the player
        this.createChargeEffect();
    }
    
    private updateChargeEffect(time: number): void {
        // Update charge effect based on charge time
        const chargeTime = time - this.chargeStartTime;
        const chargeRatio = Math.min(chargeTime / this.maxChargeTime, 1);
        
        // Create particles occasionally based on charge level
        if (Math.random() > 0.8 - 0.6 * chargeRatio) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + 10 * chargeRatio;
            
            const particle = this.scene.add.circle(
                this.x + Math.cos(angle) * distance,
                this.y + Math.sin(angle) * distance,
                3 + chargeRatio * 3,
                ELEMENT_COLORS[this.currentElement],
                0.7
            );
            
            this.scene.tweens.add({
                targets: particle,
                x: this.x,
                y: this.y,
                alpha: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    private releaseChargedShot(): void {
        if (!this.isCharging) return;
        
        const chargeTime = this.scene.time.now - this.chargeStartTime;
        const chargeRatio = Math.min(chargeTime / this.maxChargeTime, 1);
        
        // Minimum energy cost plus additional based on charge
        const energyCost = PLAYER_CONFIG.SHOOT_ENERGY_COST * (1 + chargeRatio);
        
        // Check if we still have enough energy
        if (this.energy < energyCost) {
            // Not enough energy - cancel charge
            this.isCharging = false;
            this.scene.sound.play('hit', { volume: 0.3 });
            return;
        }
        
        // Consume energy
        this.energy -= energyCost;
        this.scene.events.emit(EVENTS.PLAYER_ENERGY_CHANGE, this.energy, this.maxEnergy);
        
        // Create projectile with increased damage and size based on charge
        const projectile = this.projectiles.get() as Projectile;
        if (projectile) {
            const damageMult = 1 + chargeRatio * 2; // Up to 3x damage for full charge
            const sizeMult = 1 + chargeRatio;       // Up to 2x size for full charge
            
            projectile.fire(
                this.x,
                this.y - this.height / 4,
                this.aimDirection.x * PROJECTILE_CONFIG.BASE_SPEED,
                this.aimDirection.y * PROJECTILE_CONFIG.BASE_SPEED,
                this.currentElement,
                PROJECTILE_CONFIG.BASE_DAMAGE[this.currentElement] * damageMult * this.upgrades.damage,
                PROJECTILE_CONFIG.SIZE[this.currentElement] * sizeMult
            );
            
            // Set projectile properties
            if (chargeRatio > 0.8 && this.currentElement === ElementType.FIRE && this.fireExplosionEnabled) {
                projectile.setExplosive(true);
            }
            
            // Play sound with volume based on charge
            this.shootSound.play({ volume: 0.4 + chargeRatio * 0.3 });
        }
        
        // Reset charging state
        this.isCharging = false;
        this.lastShootTime = this.scene.time.now;
    }

    public shoot(): void {
        // Regular non-charged shot
        const now = this.scene.time.now;
        if (now - this.lastShootTime < PLAYER_CONFIG.SHOOT_COOLDOWN || this.energy < PLAYER_CONFIG.SHOOT_ENERGY_COST) {
            return;
        }
        
        // Update shooting time
        this.lastShootTime = now;
        
        // Consume energy
        this.energy -= PLAYER_CONFIG.SHOOT_ENERGY_COST;
        this.scene.events.emit(EVENTS.PLAYER_ENERGY_CHANGE, this.energy, this.maxEnergy);

        // Create projectile
        const projectile = this.projectiles.get() as Projectile;
        if (projectile) {
            // Apply damage upgrade to projectile
            const damage = PROJECTILE_CONFIG.BASE_DAMAGE[this.currentElement] * this.upgrades.damage;
            
            // Create projectile
            projectile.fire(
                this.x,
                this.y - this.height / 4,
                this.aimDirection.x * PROJECTILE_CONFIG.BASE_SPEED,
                this.aimDirection.y * PROJECTILE_CONFIG.BASE_SPEED,
                this.currentElement,
                damage,
                PROJECTILE_CONFIG.SIZE[this.currentElement]
            );
            
            // Check for fire explosion
            if (this.currentElement === ElementType.FIRE && this.fireExplosionEnabled &&
                Math.random() > 0.7) { // 30% chance for explosive projectile
                projectile.setExplosive(true);
            }
            
            // Play sound
            this.shootSound.play();
        }
    }
    
    private createChargeEffect(): void {
        // Charging effect around player
        const chargeRadius = this.scene.add.circle(this.x, this.y, 20, ELEMENT_COLORS[this.currentElement], 0.3);
        chargeRadius.setDepth(DEPTHS.PARTICLES - 1);
        
        // Start with small size and grow
        chargeRadius.setScale(0.5);
        
        // Add pulsating effect
        const chargeTween = this.scene.tweens.add({
            targets: chargeRadius,
            scale: 1.5,
            alpha: 0.6,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        // Follow player position
        const updatePos = () => {
            if (chargeRadius.active) {
                chargeRadius.setPosition(this.x, this.y);
            }
        };
        
        // Update position in scene update
        const updateEvent = this.scene.events.on('update', updatePos);
        
        // Clean up when charging stops
        const cleanupCheck = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.isCharging) {
                    chargeRadius.destroy();
                    chargeTween.stop();
                    this.scene.events.off('update', updatePos);
                    cleanupCheck.remove();
                }
            },
            loop: true
        });
    }

    public changeElement(element: ElementType): void {
        // Don't change if already this element
        if (this.currentElement === element) return;
        
        // Store previous element for combo detection
        const previousElement = this.currentElement;
        
        // Change to new element
        this.currentElement = element;
        this.switchElementSound.play();
        this.createElementChangeParticles();
        
        // Emit event
        this.scene.events.emit(EVENTS.PLAYER_ELEMENT_CHANGE, this.currentElement);
        
        // Handle element combo system
        if (this.hasElementalCombo) {
            const now = this.scene.time.now;
            
            // Check if this is a rapid element change (within 2 seconds)
            if (now - this.lastElementChangeTime < 2000) {
                this.elementComboCount++;
                
                // Element combo effects at different levels
                if (this.elementComboCount >= 3) {
                    this.activateElementCombo();
                }
            } else {
                // Reset combo if too slow
                this.elementComboCount = 1;
            }
            
            // Update last change time
            this.lastElementChangeTime = now;
            
            // Set up combo reset timer
            if (this.comboResetTimer) {
                this.comboResetTimer.remove();
            }
            
            this.comboResetTimer = this.scene.time.delayedCall(2000, () => {
                this.elementComboCount = 0;
            });
        }
        
        // Element-specific ability resets
        if (element === ElementType.AIR && this.airDashEnabled && !this.onPlatform) {
            // Refresh air dashes when switching to air in mid-air
            this.airDashesAvailable = 2;
        }
    }
    
    private activateElementCombo(): void {
        // Create an elemental resonance effect - briefly gain benefits of all elements
        
        // Create visual effect - energy burst
        const burstColors = [
            ELEMENT_COLORS[ElementType.FIRE],
            ELEMENT_COLORS[ElementType.WATER],
            ELEMENT_COLORS[ElementType.EARTH],
            ELEMENT_COLORS[ElementType.AIR],
            ELEMENT_COLORS[ElementType.SPIRIT]
        ];
        
        // Create sequential bursts of each element
        for (let i = 0; i < burstColors.length; i++) {
            this.scene.time.delayedCall(i * 100, () => {
                createParticles(
                    this.scene,
                    this.x,
                    this.y,
                    burstColors[i],
                    15,
                    80,
                    0.8,
                    800
                );
            });
        }
        
        // Play special sound
        this.specialSound.play({ volume: 0.7 });
        
        // Grant temporary bonuses
        this.scene.events.emit(EVENTS.PLAYER_ABILITY_USE, 'elementalCombo');
        
        // Restore some health and energy
        this.heal(10);
        this.addEnergy(20);
        
        // Reset cooldowns for special abilities
        this.specialAttackCooldowns.forEach((_, key) => {
            this.setLastSpecialAttackTime(key, 0);
        });
        
        // Reset combo count
        this.elementComboCount = 0;
    }

    private createElementChangeParticles(): void {
        createParticles(
            this.scene, 
            this.x, 
            this.y - this.height / 4, 
            ELEMENT_COLORS[this.currentElement], 
            20, 
            100, 
            1, 
            1000
        );
    }
    
    private useSpecialAbility(time: number): void {
        // Use elemental special ability based on current element
        switch (this.currentElement) {
            case ElementType.FIRE:
                this.useFireSpecial(time);
                break;
                
            case ElementType.WATER:
                this.useWaterSpecial(time);
                break;
                
            case ElementType.EARTH:
                this.useEarthSpecial(time);
                break;
                
            case ElementType.AIR:
                this.useAirSpecial(time);
                break;
                
            case ElementType.SPIRIT:
                this.useSpiritSpecial(time);
                break;
        }
    }
    
    private useFireSpecial(time: number): void {
        // Fire explosion ability - create explosion in front of player
        if (!this.fireExplosionEnabled) return;
        
        // Check cooldown
        if (time - this.getLastSpecialAttackTime('fireExplosion') < this.getSpecialCooldown('fireExplosion')) return;
        
        // Update cooldown
        this.setLastSpecialAttackTime('fireExplosion', time);
        
        // Calculate explosion position in front of player
        const direction = this.facingDirection === 'right' ? 1 : -1;
        const explosionX = this.x + (direction * 80);
        const explosionY = this.y - 10;
        
        // Create explosion effect
        const explosion = this.scene.add.circle(explosionX, explosionY, 10, 0xff6600, 0.8);
        
        // Expand and fade the explosion
        this.scene.tweens.add({
            targets: explosion,
            scale: 12,
            alpha: 0,
            duration: 400,
            onComplete: () => explosion.destroy()
        });
        
        // Create particle effect
        createParticles(
            this.scene,
            explosionX,
            explosionY,
            0xff6600,
            30,
            100,
            1,
            500
        );
        
        // Emit event for GameScene to register explosion damage
        this.scene.events.emit(EVENTS.PLAYER_SPECIAL_ATTACK, 'fireExplosion', explosionX, explosionY);
        
        // Play sound
        this.specialSound.play();
    }
    
    private useWaterSpecial(time: number): void {
        // Water shield ability - create protective bubble
        if (!this.waterShieldEnabled) return;
        
        // Shield is passive and activates automatically, but we can force-refresh it
        if (!this.waterShieldActive) {
            this.activateWaterShield();
        }
    }
    
    private activateWaterShield(): void {
        // Create water shield effect
        if (this.waterShieldActive) return;
        
        this.waterShieldActive = true;
        this.setLastSpecialAttackTime('waterShield', this.scene.time.now);
        
        // Create shield visual
        const shield = this.scene.add.circle(this.x, this.y, 30, 0x66ccff, 0.5);
        shield.setStrokeStyle(2, 0x3399ff, 1);
        shield.setDepth(DEPTHS.PLAYER - 1);
        
        // Create ripple effect
        this.scene.tweens.add({
            targets: shield,
            scale: 1.2,
            alpha: 0.3,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
        
        // Play sound
        this.scene.sound.play('collect', { volume: 0.4 });
        
        // Shield follows player
        const updateShield = () => {
            if (shield.active) {
                shield.setPosition(this.x, this.y);
            }
        };
        
        this.scene.events.on('update', updateShield);
        
        // Shield blocks one hit then disappears
        const shieldHitSubscription = this.scene.events.on(EVENTS.PLAYER_DAMAGE, () => {
            if (this.waterShieldActive) {
                // Shield absorbed the damage
                this.waterShieldActive = false;
                
                // Show shield break effect
                this.scene.tweens.add({
                    targets: shield,
                    scale: 2,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        shield.destroy();
                        this.scene.events.off('update', updateShield);
                        this.scene.events.off(EVENTS.PLAYER_DAMAGE, shieldHitSubscription);
                    }
                });
                
                // Create particle burst
                createParticles(
                    this.scene,
                    this.x,
                    this.y,
                    0x66ccff,
                    20,
                    80,
                    0.8,
                    500
                );
                
                // Play shield break sound
                this.scene.sound.play('hit', { volume: 0.5 });
            }
        });
        
        // Destroy shield after element change
        const elementChangeSubscription = this.scene.events.on(EVENTS.PLAYER_ELEMENT_CHANGE, (element: ElementType) => {
            if (element !== ElementType.WATER && this.waterShieldActive) {
                this.waterShieldActive = false;
                
                this.scene.tweens.add({
                    targets: shield,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        shield.destroy();
                        this.scene.events.off('update', updateShield);
                        this.scene.events.off(EVENTS.PLAYER_DAMAGE, shieldHitSubscription);
                        this.scene.events.off(EVENTS.PLAYER_ELEMENT_CHANGE, elementChangeSubscription);
                    }
                });
            }
        });
        
        // Shield timer
        this.waterShieldTimer = this.scene.time.delayedCall(10000, () => {
            if (this.waterShieldActive) {
                this.waterShieldActive = false;
                
                this.scene.tweens.add({
                    targets: shield,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        shield.destroy();
                        this.scene.events.off('update', updateShield);
                        this.scene.events.off(EVENTS.PLAYER_DAMAGE, shieldHitSubscription);
                        this.scene.events.off(EVENTS.PLAYER_ELEMENT_CHANGE, elementChangeSubscription);
                    }
                });
            }
        });
    }
    
    private useEarthSpecial(time: number): void {
        // Earth shield ability - become temporarily invulnerable but slower
        if (!this.earthShieldEnabled) return;
        
        // Check cooldown
        if (time - this.getLastSpecialAttackTime('earthShield') < this.getSpecialCooldown('earthShield')) return;
        
        // Update cooldown
        this.setLastSpecialAttackTime('earthShield', time);
        
        // Activate earth shield
        this.earthShieldActive = true;
        this.isInvulnerable = true;
        
        // Create visual effect
        const shield = this.scene.add.circle(this.x, this.y, 25, 0x66aa66, 0.6);
        shield.setStrokeStyle(3, 0x448844, 1);
        shield.setDepth(DEPTHS.PLAYER - 1);
        
        // Play sound
        this.specialSound.play({ volume: 0.6 });
        
        // Create stone particles
        createParticles(
            this.scene,
            this.x,
            this.y,
            0x66aa66,
            15,
            60,
            0.8,
            800
        );
        
        // Slow down player
        const originalSpeed = this.upgrades.speed;
        this.upgrades.speed *= 0.7;
        
        // Shield follows player
        const updateShield = () => {
            if (shield.active) {
                shield.setPosition(this.x, this.y);
            }
        };
        
        this.scene.events.on('update', updateShield);
        
        // Shield duration
        this.earthShieldTimer = this.scene.time.delayedCall(5000, () => {
            if (this.earthShieldActive) {
                // End shield
                this.earthShieldActive = false;
                this.isInvulnerable = false;
                this.upgrades.speed = originalSpeed;
                
                // Fade out shield
                this.scene.tweens.add({
                    targets: shield,
                    alpha: 0,
                    scale: 1.5,
                    duration: 300,
                    onComplete: () => {
                        shield.destroy();
                        this.scene.events.off('update', updateShield);
                    }
                });
                
                // Create particle effect on end
                createParticles(
                    this.scene,
                    this.x,
                    this.y,
                    0x66aa66,
                    10,
                    50,
                    0.7,
                    500
                );
            }
        });
    }
    
    private useAirSpecial(time: number): void {
        // Air tornado ability - create damaging whirlwind
        if (!this.airTornadoEnabled) return;
        
        // Check cooldown
        if (time - this.getLastSpecialAttackTime('airTornado') < this.getSpecialCooldown('airTornado')) return;
        
        // Update cooldown
        this.setLastSpecialAttackTime('airTornado', time);
        
        // Calculate tornado position in front of player
        const direction = this.facingDirection === 'right' ? 1 : -1;
        const tornadoX = this.x + (direction * 100);
        const tornadoY = this.y;
        
        // Create tornado visual
        const tornado = this.scene.add.ellipse(tornadoX, tornadoY, 40, 80, 0xccccff, 0.7);
        tornado.setDepth(DEPTHS.PLAYER - 1);
        
        // Add spinning effect
        let rotation = 0;
        
        // Create particle system for the tornado
        const tornadoParticles = () => {
            if (!tornado.active) return;
            
            // Create particles at different heights in the tornado
            for (let i = 0; i < 2; i++) {
                const angle = rotation + (i * Math.PI);
                const offsetX = Math.cos(angle) * 20;
                const offsetY = (Math.random() * 80) - 40;
                
                const particle = this.scene.add.circle(
                    tornado.x + offsetX,
                    tornado.y + offsetY,
                    2 + Math.random() * 3,
                    0xccccff,
                    0.7
                );
                
                // Animate particle
                this.scene.tweens.add({
                    targets: particle,
                    alpha: 0,
                    scale: 0,
                    x: particle.x + (Math.random() * 40 - 20),
                    y: particle.y - 30,
                    duration: 500 + Math.random() * 300,
                    onComplete: () => particle.destroy()
                });
            }
            
            // Update rotation
            rotation += 0.1;
        };
        
        // Start particle system
        const particleTimer = this.scene.time.addEvent({
            delay: 50,
            callback: tornadoParticles,
            loop: true
        });
        
        // Move tornado forward
        this.scene.tweens.add({
            targets: tornado,
            x: tornadoX + (direction * 200),
            scaleX: 1.5,
            scaleY: 1.2,
            duration: this.facingDirection === 'right' ? 2000 : 1000, // Move with direction
            ease: 'Sine.easeOut'
        });
        
        // Fade out at end
        this.scene.tweens.add({
            targets: tornado,
            alpha: 0,
            delay: 1800,
            duration: 200,
            onComplete: () => {
                tornado.destroy();
                particleTimer.remove();
            }
        });
        
        // Emit event for GameScene to register tornado damage
        this.scene.events.emit(EVENTS.PLAYER_SPECIAL_ATTACK, 'airTornado', tornado);
        
        // Play sound
        this.specialSound.play({ volume: 0.5 });
    }
    
    private useSpiritSpecial(time: number): void {
        // Choose between doppelganger and phasing based on which is unlocked
        if (this.spiritDoppelgangerEnabled) {
            this.createDoppelganger(time);
        } else if (this.spiritPhasingEnabled) {
            this.activatePhasing(time);
        }
    }
    
    private createDoppelganger(time: number): void {
        // Create a ghost clone that mirrors player actions
        if (!this.spiritDoppelgangerEnabled) return;
        
        // Check cooldown
        if (time - this.getLastSpecialAttackTime('spiritDoppelganger') < this.getSpecialCooldown('spiritDoppelganger')) return;
        
        // Update cooldown
        this.setLastSpecialAttackTime('spiritDoppelganger', time);
        
        // Remove existing doppelganger if any
        if (this.spiritDoppelganger && this.spiritDoppelganger.active) {
            this.spiritDoppelganger.destroy();
        }
        
        // Create doppelganger on opposite side
        const offsetX = this.facingDirection === 'right' ? -80 : 80;
        
        this.spiritDoppelganger = this.scene.add.sprite(
            this.x + offsetX,
            this.y,
            'player'
        );
        
        // Match current animation
        this.spiritDoppelganger.setFrame(this.frame.name);
        this.spiritDoppelganger.setFlipX(!this.flipX);
        this.spiritDoppelganger.setAlpha(0.7);
        this.spiritDoppelganger.setTint(0xaaaaff);
        this.spiritDoppelganger.setDepth(DEPTHS.PLAYER - 1);
        
        // Initial appearance effect
        this.spiritDoppelganger.setScale(0);
        this.scene.tweens.add({
            targets: this.spiritDoppelganger,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
        
        // Create particle effect
        createParticles(
            this.scene,
            this.spiritDoppelganger.x,
            this.spiritDoppelganger.y,
            0xaaaaff,
            15,
            60,
            0.8,
            800
        );
        
        // Play sound
        this.specialSound.play({ volume: 0.4 });
        
        // Emit event for GameScene to register doppelganger as an attack source
        this.scene.events.emit(EVENTS.PLAYER_SPECIAL_ATTACK, 'spiritDoppelganger', this.spiritDoppelganger);
        
        // Doppelganger disappears after 15 seconds
        this.scene.time.delayedCall(15000, () => {
            if (this.spiritDoppelganger && this.spiritDoppelganger.active) {
                // Fade out
                this.scene.tweens.add({
                    targets: this.spiritDoppelganger,
                    alpha: 0,
                    scale: 0,
                    duration: 300,
                    onComplete: () => {
                        this.spiritDoppelganger?.destroy();
                        this.spiritDoppelganger = null;
                    }
                });
            }
        });
    }
    
    private updateDoppelganger(): void {
        if (!this.spiritDoppelganger || !this.spiritDoppelganger.active) return;
        
        // Mirror player position with offset
        const offsetX = this.facingDirection === 'right' ? -80 : 80;
        const targetX = this.x + offsetX;
        
        // Move toward target position with slight delay
        this.spiritDoppelganger.x += (targetX - this.spiritDoppelganger.x) * 0.1;
        this.spiritDoppelganger.y += (this.y - this.spiritDoppelganger.y) * 0.1;
        
        // Mirror player animation
        this.spiritDoppelganger.setFrame(this.frame.name);
        this.spiritDoppelganger.setFlipX(!this.flipX);
        
        // Create ghost trail effect
        if (Math.random() > 0.9) {
            const trail = this.scene.add.sprite(
                this.spiritDoppelganger.x,
                this.spiritDoppelganger.y,
                'player'
            );
            
            trail.setFrame(this.spiritDoppelganger.frame.name);
            trail.setFlipX(this.spiritDoppelganger.flipX);
            trail.setAlpha(0.3);
            trail.setTint(0xaaaaff);
            trail.setDepth(DEPTHS.PLAYER - 2);
            
            this.scene.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0.8,
                duration: 300,
                onComplete: () => trail.destroy()
            });
        }
    }
    
    private activatePhasing(time: number): void {
        // Spirit phasing - become intangible and pass through obstacles
        if (!this.spiritPhasingEnabled || this.isPhasingActive) return;
        
        // Check cooldown
        if (time - this.getLastSpecialAttackTime('spiritPhasing') < this.getSpecialCooldown('spiritPhasing')) return;
        
        // Update cooldown
        this.setLastSpecialAttackTime('spiritPhasing', time);
        
        // Activate phasing
        this.isPhasingActive = true;
        this.setAlpha(0.7);
        this.setTint(0xaaaaaa);
        
        // Create phase-in effect
        createParticles(
            this.scene,
            this.x,
            this.y,
            0xaaaaaa,
            20,
            70,
            0.8,
            1000
        );
        
        // Play sound
        this.specialSound.play({ volume: 0.5 });
        
        // Emit event for GameScene to handle collision layer changes
        this.scene.events.emit(EVENTS.PLAYER_SPECIAL_ATTACK, 'spiritPhasing', true);
        
        // Set phasing timer
        this.phasingTimer = this.scene.time.delayedCall(5000, () => {
            if (this.isPhasingActive) {
                // End phasing
                this.isPhasingActive = false;
                this.setAlpha(1);
                this.clearTint();
                
                // Create phase-out effect
                createParticles(
                    this.scene,
                    this.x,
                    this.y,
                    0xaaaaaa,
                    15,
                    60,
                    0.7,
                    800
                );
                
                // Emit event to restore collision
                this.scene.events.emit(EVENTS.PLAYER_SPECIAL_ATTACK, 'spiritPhasing', false);
            }
        });
    }

    public takeDamage(damage: number): void {
        // Check invulnerability
        if (this.isInvulnerable) return;
        
        // Check if water shield is active
        if (this.waterShieldActive) {
            // Shield absorbs the hit
            this.hitSound.play({ volume: 0.3 });
            
            // Emit event that shield absorbed damage
            this.scene.events.emit(EVENTS.PLAYER_DAMAGE, this.health, this.maxHealth);
            return;
        }
        
        // Calculate damage with earth form damage resistance
        if (this.currentElement === ElementType.EARTH) {
            damage *= (0.7 - (this.upgrades.earthDamageResist - 1) * 0.05);
        }
        
        // Apply damage
        this.health = Math.max(0, this.health - damage);
        
        // Play hit sound
        this.hitSound.play();
        
        // Visual feedback
        this.setTint(0xff0000);
        this.isInvulnerable = true;

        // Flash effect
        this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.clearTint();
                this.alpha = 1;
            }
        });

        // Set invulnerability timer
        if (this.invulnerabilityTimer) {
            this.invulnerabilityTimer.remove();
        }
        this.invulnerabilityTimer = this.scene.time.delayedCall(1000, () => {
            this.isInvulnerable = false;
        });

        // Emit damage event
        this.scene.events.emit(EVENTS.PLAYER_DAMAGE, this.health, this.maxHealth);
        
        // Check for death
        if (this.health <= 0) {
            this.die();
        }
    }

    public heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.scene.events.emit(EVENTS.PLAYER_HEAL, this.health, this.maxHealth);
    }

    public addEnergy(amount: number): void {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
        this.scene.events.emit(EVENTS.PLAYER_ENERGY_CHANGE, this.energy, this.maxEnergy);
    }

    private die(): void {
        this.scene.sound.play('death');
        createParticles(this.scene, this.x, this.y - this.height / 4, 0xffffff, 30, 150, 1.5, 1500);
        this.scene.events.emit(EVENTS.GAME_OVER);
        this.setActive(false);
        this.setVisible(false);
    }
    
    // Helper methods for special attack cooldowns
    private getSpecialCooldown(ability: string): number {
        return this.specialAttackCooldowns.get(ability) || 5000;
    }
    
    private getLastSpecialAttackTime(ability: string): number {
        return this.lastSpecialAttackTimes.get(ability) || 0;
    }
    
    private setLastSpecialAttackTime(ability: string, time: number): void {
        this.lastSpecialAttackTimes.set(ability, time);
    }

    // Getters and setters
    public getProjectiles(): Phaser.GameObjects.Group {
        return this.projectiles;
    }

    public getCurrentElement(): ElementType {
        return this.currentElement;
    }

    public getHealth(): number {
        return this.health;
    }

    public getMaxHealth(): number {
        return this.maxHealth;
    }

    public getEnergy(): number {
        return this.energy;
    }

    public getMaxEnergy(): number {
        return this.maxEnergy;
    }

    public getDoppelganger(): Phaser.GameObjects.Sprite | null {
        return this.spiritDoppelganger;
    }
    
    public getUpgrades(): PlayerUpgrades {
        return this.upgrades;
    }
    
    public updateUpgrades(): void {
        // Reload upgrades from the upgrade system
        this.upgrades = UpgradeSystem.getPlayerUpgrades();
        
        // Update stats
        this.maxHealth = PLAYER_CONFIG.MAX_HEALTH * this.upgrades.maxHealth;
        this.maxEnergy = PLAYER_CONFIG.MAX_ENERGY * this.upgrades.maxEnergy;
        
        // Update ability flags
        this.hasDoubleJump = this.upgrades.doubleJump;
        this.hasDash = this.upgrades.dashAbility;
        this.hasChargeAttack = this.upgrades.chargeAttack;
        this.hasElementalCombo = this.upgrades.elementalCombo;
        
        // Update element-specific abilities
        this.fireTrailEnabled = this.upgrades.fireTrail;
        this.fireExplosionEnabled = this.upgrades.fireExplosion;
        this.waterShieldEnabled = this.upgrades.waterShield;
        this.waterSurfingEnabled = this.upgrades.waterSurfing;
        this.earthQuakeEnabled = this.upgrades.earthQuake;
        this.earthShieldEnabled = this.upgrades.earthShield;
        this.airDashEnabled = this.upgrades.airDash;
        this.airTornadoEnabled = this.upgrades.airTornado;
        this.spiritDoppelgangerEnabled = this.upgrades.spiritDoppelganger;
        this.spiritPhasingEnabled = this.upgrades.spiritPhasing;
    }

    public setHealth(value: number): void {
        this.health = Math.min(this.maxHealth, Math.max(0, value));
        this.scene.events.emit(EVENTS.PLAYER_HEAL, this.health, this.maxHealth);
    }

    public setEnergy(value: number): void {
        this.energy = Math.min(this.maxEnergy, Math.max(0, value));
        this.scene.events.emit(EVENTS.PLAYER_ENERGY_CHANGE, this.energy, this.maxEnergy);
    }
}