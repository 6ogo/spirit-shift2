import Phaser from 'phaser';
import { ElementType, PLAYER_CONFIG, PROJECTILE_CONFIG } from '../config';
import { DEPTHS, EVENTS } from '../utils/constants';
import Projectile from './Projectile';
import { createParticles } from '../utils/helpers';

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

    private jumpSound: Phaser.Sound.BaseSound;
    private shootSound: Phaser.Sound.BaseSound;
    private hitSound: Phaser.Sound.BaseSound;
    private switchElementSound: Phaser.Sound.BaseSound;

    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private keySpace: Phaser.Input.Keyboard.Key;
    private keyShift: Phaser.Input.Keyboard.Key;
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

        this.currentElement = ElementType.SPIRIT;
        this.health = PLAYER_CONFIG.MAX_HEALTH;
        this.energy = PLAYER_CONFIG.MAX_ENERGY;
        this.maxHealth = PLAYER_CONFIG.MAX_HEALTH;
        this.maxEnergy = PLAYER_CONFIG.MAX_ENERGY;
        this.isJumping = false;
        this.isDucking = false;
        this.lastShootTime = 0;
        this.facingDirection = 'right';
        this.aimDirection = new Phaser.Math.Vector2(1, 0);
        this.onPlatform = false;
        this.isInvulnerable = false;
        this.invulnerabilityTimer = null;

        this.projectiles = scene.add.group({ classType: Projectile, maxSize: 20, runChildUpdate: true });

        this.setCollideWorldBounds(true);
        this.setSize(PLAYER_CONFIG.WIDTH, PLAYER_CONFIG.HEIGHT);
        this.setOffset((this.width - PLAYER_CONFIG.WIDTH) / 2, this.height - PLAYER_CONFIG.HEIGHT);
        this.setDepth(DEPTHS.PLAYER);

        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keySpace = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyShift = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.key1 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.key3 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        this.key4 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
        this.key5 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);

        this.jumpSound = scene.sound.add('jump', { volume: 0.5 });
        this.shootSound = scene.sound.add('shoot', { volume: 0.4 });
        this.hitSound = scene.sound.add('hit', { volume: 0.6 });
        this.switchElementSound = scene.sound.add('switch-element', { volume: 0.5 });

        this.play('player-spirit-idle');

        scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => this.updateAimDirection(pointer.x, pointer.y));
        scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) this.shoot();
        });
    }

    update(time: number, delta: number): void {
        this.handleInput();
        this.updateAnimation();
        this.regenerateEnergy(delta);
        this.updateElementEffects(delta);
    }

    private handleInput(): void {
        this.onPlatform = this.body.blocked.down || this.body.touching.down;
        if (this.onPlatform) this.isJumping = false;

        if (this.cursors.left.isDown || this.keyA.isDown) this.moveLeft();
        else if (this.cursors.right.isDown || this.keyD.isDown) this.moveRight();
        else this.stopHorizontal();

        if ((this.cursors.up.isDown || this.keyW.isDown || this.keySpace.isDown) && this.onPlatform && !this.isJumping) this.jump();

        if (this.cursors.down.isDown || this.keyS.isDown) this.duck();
        else if (this.isDucking) this.standUp();

        if (this.key1.isDown) this.changeElement(ElementType.SPIRIT);
        else if (this.key2.isDown) this.changeElement(ElementType.FIRE);
        else if (this.key3.isDown) this.changeElement(ElementType.WATER);
        else if (this.key4.isDown) this.changeElement(ElementType.EARTH);
        else if (this.key5.isDown) this.changeElement(ElementType.AIR);
    }

    private moveLeft(): void {
        const speedMultiplier = this.isDucking ? 0.5 : 1;
        this.setVelocityX(-PLAYER_CONFIG.SPEED * speedMultiplier);
        this.facingDirection = 'left';
        this.setFlipX(true);
    }

    private moveRight(): void {
        const speedMultiplier = this.isDucking ? 0.5 : 1;
        this.setVelocityX(PLAYER_CONFIG.SPEED * speedMultiplier);
        this.facingDirection = 'right';
        this.setFlipX(false);
    }

    private stopHorizontal(): void {
        this.setVelocityX(0);
    }

    private jump(): void {
        this.isJumping = true;
        let jumpVelocity = PLAYER_CONFIG.JUMP_VELOCITY;
        switch (this.currentElement) {
            case ElementType.AIR: jumpVelocity *= 1.1; break;
            case ElementType.EARTH: jumpVelocity *= 1.2; break;
            case ElementType.WATER: jumpVelocity *= 0.9; break;
        }
        this.setVelocityY(jumpVelocity);
        this.jumpSound.play();
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

    private updateAnimation(): void {
        const elementPrefix = `player-${this.currentElement}`;
        if (this.isDucking) this.play(`${elementPrefix}-duck`, true);
        else if (this.isJumping) this.play(`${elementPrefix}-jump`, true);
        else if (this.body.velocity.x !== 0) this.play(`${elementPrefix}-run`, true);
        else this.play(`${elementPrefix}-idle`, true);
    }

    private regenerateEnergy(delta: number): void {
        this.energy = Math.min(this.maxEnergy, this.energy + PLAYER_CONFIG.ENERGY_REGEN[this.currentElement] * delta / 16);
        this.scene.events.emit(EVENTS.PLAYER_ENERGY_CHANGE, this.energy, this.maxEnergy);
    }

    private updateElementEffects(delta: number): void {
        switch (this.currentElement) {
            case ElementType.AIR:
                if (this.isJumping && this.body.velocity.y > 0) this.body.velocity.y *= 0.98;
                break;
            case ElementType.WATER:
                if (this.isJumping && Math.abs(this.body.velocity.y) < 50) this.body.velocity.y *= 0.9;
                break;
            case ElementType.EARTH:
                if (this.isJumping && this.body.velocity.y > 0) this.body.velocity.y *= 1.02;
                break;
        }
        if (!this.isJumping && !this.isDucking && this.body.velocity.x !== 0) this.createMovementParticles();
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
        createParticles(this.scene, particleX, particleY, colors[this.currentElement], 2, [ElementType.AIR, ElementType.EARTH].includes(this.currentElement) ? 60 : 50, 0.5, [ElementType.AIR, ElementType.EARTH].includes(this.currentElement) ? 600 : 400);
    }

    public updateAimDirection(pointerX: number, pointerY: number): void {
        const dx = pointerX - this.x;
        const dy = pointerY - this.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        this.aimDirection.x = dx / length;
        this.aimDirection.y = dy / length;
        if (dx < 0) {
            this.facingDirection = 'left';
            this.setFlipX(true);
        } else {
            this.facingDirection = 'right';
            this.setFlipX(false);
        }
    }

    public shoot(): void {
        const now = this.scene.time.now;
        if (now - this.lastShootTime < PLAYER_CONFIG.SHOOT_COOLDOWN || this.energy < PLAYER_CONFIG.SHOOT_ENERGY_COST) return;

        this.lastShootTime = now;
        this.energy -= PLAYER_CONFIG.SHOOT_ENERGY_COST;
        this.scene.events.emit(EVENTS.PLAYER_ENERGY_CHANGE, this.energy, this.maxEnergy);

        const projectile = this.projectiles.get() as Projectile;
        if (projectile) {
            projectile.fire(
                this.x,
                this.y - this.height / 4,
                this.aimDirection.x * PROJECTILE_CONFIG.BASE_SPEED,
                this.aimDirection.y * PROJECTILE_CONFIG.BASE_SPEED,
                this.currentElement,
                PROJECTILE_CONFIG.BASE_DAMAGE[this.currentElement],
                PROJECTILE_CONFIG.SIZE[this.currentElement]
            );
            this.shootSound.play();
        }
    }

    public changeElement(element: ElementType): void {
        if (this.currentElement === element) return;
        this.currentElement = element;
        this.switchElementSound.play();
        this.createElementChangeParticles();
        this.scene.events.emit(EVENTS.PLAYER_ELEMENT_CHANGE, this.currentElement);
    }

    private createElementChangeParticles(): void {
        createParticles(this.scene, this.x, this.y - this.height / 4, ELEMENT_COLORS[this.currentElement], 20, 100, 1, 1000);
    }

    public takeDamage(damage: number): void {
        if (this.isInvulnerable) return;
        if (this.currentElement === ElementType.EARTH) damage *= 0.7;
        this.health = Math.max(0, this.health - damage);
        this.hitSound.play();
        this.setTint(0xff0000);
        this.isInvulnerable = true;

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

        if (this.invulnerabilityTimer) this.invulnerabilityTimer.remove();
        this.invulnerabilityTimer = this.scene.time.delayedCall(1000, () => this.isInvulnerable = false);

        this.scene.events.emit(EVENTS.PLAYER_DAMAGE, this.health, this.maxHealth);
        if (this.health <= 0) this.die();
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

    public setHealth(value: number): void {
        this.health = Math.min(this.maxHealth, Math.max(0, value));
        this.scene.events.emit(EVENTS.PLAYER_HEAL, this.health, this.maxHealth);
    }

    public setEnergy(value: number): void {
        this.energy = Math.min(this.maxEnergy, Math.max(0, value));
        this.scene.events.emit(EVENTS.PLAYER_ENERGY_CHANGE, this.energy, this.maxEnergy);
    }
}