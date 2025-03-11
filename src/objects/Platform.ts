import Phaser from 'phaser';
import { ElementType, ELEMENT_COLORS, PLATFORM_CONFIG } from '../config';
import { DEPTHS } from '../utils/constants';

export default class Platform extends Phaser.Physics.Arcade.Sprite {
    private element: ElementType;
    private platformWidth: number;
    private platformHeight: number;
    private canPassThrough: boolean;
    private particles: Phaser.GameObjects.Particles.ParticleEmitter | null;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        width: number,
        height: number = PLATFORM_CONFIG.DEFAULT_HEIGHT,
        element: ElementType = ElementType.SPIRIT,
        canPassThrough: boolean = false
    ) {
        super(scene, x, y, 'platform');
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        this.element = element;
        this.platformWidth = width;
        this.platformHeight = height;
        this.canPassThrough = canPassThrough;
        this.particles = null;

        this.setDisplaySize(width, height);
        if (this.body) {
            this.body.setSize(width, height);
        }
        this.setOffset(0, 0);
        this.setDepth(DEPTHS.PLATFORMS);

        this.applyElementStyle();
        if (canPassThrough) this.setupOneWayPlatform();
        this.createElementParticles();
    }

    private applyElementStyle(): void {
        this.setTint(ELEMENT_COLORS[this.element]);
        if (this.canPassThrough) this.setAlpha(0.8);
    }

    private setupOneWayPlatform(): void {
        const body = this.body as Phaser.Physics.Arcade.StaticBody;
        body.checkCollision.down = false;
        body.checkCollision.left = false;
        body.checkCollision.right = false;
    }

    private createElementParticles(): void {
        if (this.element === ElementType.SPIRIT) return;

        const color = ELEMENT_COLORS[this.element];
        switch (this.element) {
            case ElementType.FIRE:
                this.createFireParticles(color);
                break;
            case ElementType.WATER:
                this.createWaterParticles(color);
                break;
            case ElementType.EARTH:
                this.createEarthParticles(color);
                break;
            case ElementType.AIR:
                this.createAirParticles(color);
                break;
        }
    }

    private createFireParticles(color: number): void {
        const particles = this.scene.add.particles(0, 0, 'particle', {
            color: [color],
            lifespan: 800,
            scale: { start: 0.4, end: 0.1 },
            speed: { min: 10, max: 30 },
            blendMode: 'ADD',
            frequency: 50,
            alpha: { start: 0.7, end: 0 }
        });
        const emitterCount = Math.max(1, Math.floor(this.platformWidth / 40));
        for (let i = 0; i < emitterCount; i++) {
            const emitterX = this.x - this.platformWidth / 2 + (i + 0.5) * (this.platformWidth / emitterCount);
            particles.createEmitter({
                x: emitterX,
                y: this.y - this.platformHeight / 2,
                angle: { min: 270, max: 110 },
                frequency: 200 + Math.random() * 300,
                quantity: 1
            });
        }
        this.particles = particles;
    }

    private createWaterParticles(color: number): void {
        const particles = this.scene.add.particles(0, 0, 'particle', {
            color: [color],
            lifespan: 1200,
            scale: { start: 0.2, end: 0.4 },
            speed: { min: 5, max: 20 },
            blendMode: 'ADD',
            frequency: 80,
            alpha: { start: 0.5, end: 0 }
        });
        const emitterCount = Math.max(1, Math.floor(this.platformWidth / 40));
        for (let i = 0; i < emitterCount; i++) {
            const emitterX = this.x - this.platformWidth / 2 + (i + 0.5) * (this.platformWidth / emitterCount);
            particles.createEmitter({
                x: emitterX,
                y: this.y - this.platformHeight / 2,
                angle: { min: 80, max: 100 },
                frequency: 300 + Math.random() * 400,
                quantity: 1,
                moveToX: { min: emitterX - 20, max: emitterX + 20 },
                moveToY: { min: this.y - 50, max: this.y - 100 }
            });
        }
        this.particles = particles;
    }

    private createEarthParticles(color: number): void {
        const particles = this.scene.add.particles(0, 0, 'particle', {
            color: [color],
            lifespan: 1000,
            scale: { start: 0.3, end: 0.1 },
            speed: { min: 5, max: 10 },
            blendMode: 'NORMAL',
            frequency: 100,
            alpha: { start: 0.6, end: 0 }
        });
        particles.createEmitter({
            x: { min: this.x - this.platformWidth / 2, max: this.x - this.platformWidth / 2 + 20 },
            y: this.y - this.platformHeight / 2,
            angle: { min: 60, max: 120 },
            frequency: 500 + Math.random() * 500,
            quantity: 1
        });
        particles.createEmitter({
            x: { min: this.x + this.platformWidth / 2 - 20, max: this.x + this.platformWidth / 2 },
            y: this.y - this.platformHeight / 2,
            angle: { min: 60, max: 120 },
            frequency: 500 + Math.random() * 500,
            quantity: 1
        });
        this.particles = particles;
    }

    private createAirParticles(color: number): void {
        const particles = this.scene.add.particles(0, 0, 'particle', {
            color: [color],
            lifespan: 1500,
            scale: { start: 0.1, end: 0.3 },
            speed: { min: 10, max: 30 },
            blendMode: 'ADD',
            frequency: 50,
            alpha: { start: 0.3, end: 0 }
        });
        particles.createEmitter({
            x: { min: this.x - this.platformWidth / 2, max: this.x + this.platformWidth / 2 },
            y: { min: this.y - this.platformHeight / 2 - 10, max: this.y + this.platformHeight / 2 + 10 },
            angle: { min: 0, max: 360 },
            frequency: 100,
            quantity: 1,
            rotate: { min: 0, max: 360 }
        });
        this.particles = particles;
    }

    public update(): void {}

    public getElement(): ElementType {
        return this.element;
    }

    public getCanPassThrough(): boolean {
        return this.canPassThrough;
    }

    public getPlatformWidth(): number {
        return this.platformWidth;
    }

    public getPlatformHeight(): number {
        return this.platformHeight;
    }
}