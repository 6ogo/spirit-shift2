import Phaser from 'phaser';
import { ElementType } from '../config';
import { DEPTHS } from '../utils/constants';
import { createParticles } from '../utils/helpers';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
    private element: ElementType;
    private damage: number;
    private isActive: boolean;
    private lifespan: number;
    private creationTime: number;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'projectile');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.element = ElementType.SPIRIT;
        this.damage = 10;
        this.isActive = false;
        this.lifespan = 2000;
        this.creationTime = 0;

        this.setDepth(DEPTHS.PROJECTILES);
        this.body.allowGravity;
        this.disableBody(true, true);
    }

    fire(x: number, y: number, velocityX: number, velocityY: number, element: ElementType, damage: number, size: number): void {
        this.enableBody(true, x, y, true, true);
        this.element = element;
        this.damage = damage;
        this.isActive = true;
        this.creationTime = this.scene.time.now;

        this.setVelocity(velocityX, velocityY);
        this.setScale(size / 10);
        this.body.setSize(size, size);
        this.body.setOffset((this.width - size) / 2, (this.height - size) / 2);

        const angle = Math.atan2(velocityY, velocityX);
        this.setRotation(angle);
        this.play(`projectile-${element}`);
        this.createTrailEffect();
    }

    update(time: number, delta: number): void {
        if (!this.isActive) return;
        if (time - this.creationTime > this.lifespan) {
            this.deactivate();
            return;
        }
        if (Math.random() > 0.7) this.createTrailParticle();
    }

    private createTrailEffect(): void {
        const particles = this.scene.add.particles(this.x, this.y, 'particle', {
            speed: 50,
            scale: { start: this.scale * 0.6, end: 0 },
            blendMode: 'ADD',
            lifespan: 300,
            follow: this
        });
        const color = {
            [ElementType.FIRE]: 0xFF6600,
            [ElementType.WATER]: 0x66CCFF,
            [ElementType.EARTH]: 0x66AA66,
            [ElementType.AIR]: 0xCCCCFF,
            [ElementType.SPIRIT]: 0xCCCCCC
        }[this.element];
        createParticles(this.scene, this.x, this.y, color, 1, 10, this.scale * 0.4, 200);
    }

    private createTrailParticle(): void {
        const color = {
            [ElementType.FIRE]: 0xFF6600,
            [ElementType.WATER]: 0x66CCFF,
            [ElementType.EARTH]: 0x66AA66,
            [ElementType.AIR]: 0xCCCCFF,
            [ElementType.SPIRIT]: 0xCCCCCC
        }[this.element];
        createParticles(this.scene, this.x, this.y, color, 1, 10, this.scale * 0.4, 200);
    }

    public onHit(): void {
        this.play('impact');
        this.createImpactParticles();
        this.on('animationcomplete-impact', this.deactivate, this);
        this.setVelocity(0, 0);
    }

    private createImpactParticles(): void {
        const color = {
            [ElementType.FIRE]: 0xFF6600,
            [ElementType.WATER]: 0x66CCFF,
            [ElementType.EARTH]: 0x66AA66,
            [ElementType.AIR]: 0xCCCCFF,
            [ElementType.SPIRIT]: 0xCCCCCC
        }[this.element];
        createParticles(this.scene, this.x, this.y, color, 10, 50, 0.5, 300);
    }

    private deactivate(): void {
        this.active = false;
        this.disableBody(true, true);
    }

    public getElement(): ElementType {
        return this.element;
    }

    public getDamage(): number {
        return this.damage;
    }
}