import Phaser from 'phaser';
import { ELEMENT_STRENGTHS, ELEMENT_WEAKNESSES, ElementType, ENEMY_CONFIG } from '../config';
import { DEPTHS, EVENTS } from '../utils/constants';
import { createParticles } from '../utils/helpers';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    private id: number;
    private element: ElementType;
    private health: number;
    private maxHealth: number;
    private damage: number;
    private speed: number;
    private direction: 'left' | 'right';
    private moveTimer!: Phaser.Time.TimerEvent | null;
    private isAggro: boolean;
    private targetX: number | null;
    private isDying: boolean;

    private healthBar: Phaser.GameObjects.Graphics;
    private elementIcon: Phaser.GameObjects.Sprite;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        element: ElementType = ElementType.SPIRIT,
        id: number = 0
    ) {
        super(scene, x, y, 'enemy');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.id = id;
        this.element = element;
        const level = scene.registry.get('level') || 1;
        this.maxHealth = ENEMY_CONFIG.BASE_HEALTH + (level * 5);
        this.health = this.maxHealth;
        this.damage = ENEMY_CONFIG.BASE_DAMAGE + (level * 2);
        this.speed = ENEMY_CONFIG.BASE_SPEED + (Math.random() * level * 10);
        this.direction = Math.random() > 0.5 ? 'left' : 'right';

        if (this.body) {
            this.body.setSize(30, 30);
        }
        this.setOffset((this.width - 30) / 2, this.height - 30);
        this.setDepth(DEPTHS.ENEMIES);
        this.setCollideWorldBounds(true);

        this.healthBar = scene.add.graphics();
        this.drawHealthBar();
        this.elementIcon = scene.add.sprite(x, y - 35, `element-icon-${element}`);
        this.elementIcon.setScale(0.5);
        this.elementIcon.setDepth(DEPTHS.ENEMIES);

        this.isAggro = false;
        this.targetX = null;
        this.isDying = false;

        this.startMovementTimer();
        this.play(`enemy-${element}-move`);
    }

    update(time: number, delta: number): void {
        if (this.isDying) return;

        this.drawHealthBar();
        this.elementIcon.setPosition(this.x, this.y - 35);
        this.moveEnemy();
        this.setFlipX(this.direction === 'left');
    }

    private drawHealthBar(): void {
        this.healthBar.clear();
        this.healthBar.fillStyle(0x000000, 0.8);
        this.healthBar.fillRect(this.x - 20, this.y - 25, 40, 5);
        const healthPercent = this.health / this.maxHealth;
        let healthColor = healthPercent < 0.3 ? 0xff0000 : healthPercent < 0.6 ? 0xffff00 : 0x00ff00;
        this.healthBar.fillStyle(healthColor, 1);
        this.healthBar.fillRect(this.x - 19, this.y - 24, 38 * healthPercent, 3);
    }

    private moveEnemy(): void {
        if (this.isAggro && this.targetX !== null) {
            if (this.targetX < this.x - 10) {
                this.direction = 'left';
                this.setVelocityX(-this.speed);
            } else if (this.targetX > this.x + 10) {
                this.direction = 'right';
                this.setVelocityX(this.speed);
            } else {
                this.setVelocityX(0);
            }
        } else {
            this.setVelocityX(this.direction === 'left' ? -this.speed * 0.5 : this.speed * 0.5);
        }
        if (Math.random() > 0.9) this.createMovementParticles();
    }

    private createMovementParticles(): void {
        const color = {
            [ElementType.FIRE]: 0xFF6600,
            [ElementType.WATER]: 0x66CCFF,
            [ElementType.EARTH]: 0x66AA66,
            [ElementType.AIR]: 0xCCCCFF,
            [ElementType.SPIRIT]: 0xCCCCCC
        }[this.element];
        createParticles(this.scene, this.x, this.y, color, 1, 20, 0.5, 300);
    }

    private startMovementTimer(): void {
        this.moveTimer = this.scene.time.addEvent({
            delay: 2000 + Math.random() * 3000,
            callback: () => {
                if (!this.isAggro) this.direction = Math.random() > 0.5 ? 'left' : 'right';
            },
            loop: true
        });
    }

    public takeDamage(damage: number, attackerElement: ElementType): void {
        if (this.isDying) return;

        let damageMultiplier = attackerElement === this.element ? 0.25 :
            ELEMENT_STRENGTHS[attackerElement] === this.element ? 2 :
            ELEMENT_WEAKNESSES[attackerElement] === this.element ? 0.5 : 1;

        const actualDamage = damage * damageMultiplier;
        this.health = Math.max(0, this.health - actualDamage);
        this.createHitEffect(damageMultiplier);
        this.flashOnHit();
        this.isAggro = true;
        this.scene.events.emit(EVENTS.ENEMY_DAMAGE, this.id, actualDamage);

        if (this.health <= 0) this.die();
    }

    private createHitEffect(damageMultiplier: number): void {
        const [color, particleCount] = damageMultiplier >= 2 ? [0xFF0000, 15] :
            damageMultiplier <= 0.5 ? [0xCCCCCC, 5] : [0xFFFF00, 10];
        createParticles(this.scene, this.x, this.y - 15, color, particleCount, 60, 0.8, 500);
    }

    private flashOnHit(): void {
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => this.clearTint());
    }

    public die(): void {
        this.isDying = true;
        this.setVelocity(0, 0);
        this.play('enemy-death');
        this.createDeathParticles();
        if (this.body) {
            this.body.enable = false;
        }
        this.scene.events.emit(EVENTS.ENEMY_DEFEATED, this.id);
        this.once('animationcomplete-enemy-death', () => {
            this.healthBar.destroy();
            this.elementIcon.destroy();
            this.destroy();
        });
    }

    private createDeathParticles(): void {
        const color = {
            [ElementType.FIRE]: 0xFF6600,
            [ElementType.WATER]: 0x66CCFF,
            [ElementType.EARTH]: 0x66AA66,
            [ElementType.AIR]: 0xCCCCFF,
            [ElementType.SPIRIT]: 0xCCCCCC
        }[this.element];
        createParticles(this.scene, this.x, this.y, color, 20, 80, 1, 800);
        this.scene.time.delayedCall(100, () => createParticles(this.scene, this.x, this.y, 0xFFFFFF, 10, 60, 0.8, 600));
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

    public getId(): number {
        return this.id;
    }
}