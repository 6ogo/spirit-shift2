import Phaser from 'phaser';
import { DEPTHS, EVENTS } from '../utils/constants';

export default class SoulEssence extends Phaser.Physics.Arcade.Sprite {
    private amount: number;
    private collected: boolean;
    private floatTween: Phaser.Tweens.Tween | null;
    private glowEffect: Phaser.GameObjects.Sprite | null;
    private floatOffset: number;
    private magnetized: boolean;
    private magnetTarget: Phaser.GameObjects.GameObject | null;
    private magnetSpeed: number;

    constructor(scene: Phaser.Scene, x: number, y: number, amount: number = 1) {
        super(scene, x, y, 'soul-essence');
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set properties
        this.amount = amount;
        this.collected = false;
        this.floatTween = null;
        this.glowEffect = null;
        this.floatOffset = Math.random() * Math.PI * 2; // Random starting point
        this.magnetized = false;
        this.magnetTarget = null;
        this.magnetSpeed = 300;
        
        // Configure physics
        if (this.body instanceof Phaser.Physics.Arcade.Body) {
            this.body.allowGravity = false;
        }
        this.setCircle(this.width / 3);
        this.setOffset(this.width / 3, this.height / 3);
        this.setDepth(DEPTHS.COLLECTIBLES);
        
        // Set scale based on amount
        this.setScale(0.7 + (amount * 0.1));

        // Randomize initial velocity for a "burst" effect
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 50;
        this.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );

        // Slow down over time
        this.scene.time.delayedCall(300, () => {
            if (this.active) {
                this.scene.tweens.add({
                    targets: this,
                    velocity: { x: 0, y: 0 },
                    duration: 500,
                    ease: 'Power2',
                    onComplete: () => {
                        if (this.active) {
                            this.startFloatingAnimation();
                            this.createGlowEffect();
                        }
                    }
                });
            }
        });
        
        // Auto-collect after a long time
        this.scene.time.delayedCall(15000, () => {
            if (this.active && !this.collected) {
                this.magnetize(this.scene.registry.get('player'));
            }
        });
    }

    update(time: number, delta: number): void {
        if (this.collected) return;
        
        // Update glow effect position
        if (this.glowEffect) {
            this.glowEffect.x = this.x;
            this.glowEffect.y = this.y;
        }
        
        // Handle magnetization
        if (this.magnetized && this.magnetTarget && this.magnetTarget.active) {
            // Calculate direction to target
            const targetX = (this.magnetTarget as any).x;
            const targetY = (this.magnetTarget as any).y;
            
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) {
                // Close enough to collect
                this.collect();
            } else {
                // Move toward target
                const speedFactor = 1 + (1 - Math.min(distance, 200) / 200);
                const vx = (dx / distance) * this.magnetSpeed * speedFactor;
                const vy = (dy / distance) * this.magnetSpeed * speedFactor;
                this.setVelocity(vx, vy);
            }
        }
        
        // Create occasional particles
        if (Math.random() > 0.95) {
            this.createRandomParticle();
        }
        
        // Make the essence rotate slowly
        this.rotation += 0.001 * delta;
    }

    private createGlowEffect(): void {
        // Create a glow effect sprite
        this.glowEffect = this.scene.add.sprite(this.x, this.y, 'particle');
        this.glowEffect.setScale(2 + this.amount * 0.5);
        this.glowEffect.setAlpha(0.5);
        this.glowEffect.setDepth(DEPTHS.COLLECTIBLES - 1); // Place behind essence
        this.glowEffect.setBlendMode(Phaser.BlendModes.ADD);
        this.glowEffect.setTint(0x6677ff);
        
        // Add pulsing effect
        this.scene.tweens.add({
            targets: this.glowEffect,
            scale: { from: 2 + this.amount * 0.5, to: 2.5 + this.amount * 0.5 },
            alpha: { from: 0.5, to: 0.3 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private startFloatingAnimation(): void {
        // Create a floating hover effect
        this.floatTween = this.scene.tweens.add({
            targets: this,
            y: this.y - 10,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createRandomParticle(): void {
        // Create a small particle that moves outward
        const angle = Math.random() * Math.PI * 2;
        const distance = this.width / 3;
        const particleX = this.x + Math.cos(angle) * distance;
        const particleY = this.y + Math.sin(angle) * distance;
        
        const particle = this.scene.add.circle(
            particleX,
            particleY,
            2,
            0x6677ff,
            0.7
        );
        
        // Animate the particle
        this.scene.tweens.add({
            targets: particle,
            x: particleX + Math.cos(angle) * 20,
            y: particleY + Math.sin(angle) * 20,
            alpha: 0,
            scale: 0.5,
            duration: 800,
            onComplete: () => particle.destroy()
        });
    }

    public collect(): void {
        if (this.collected) return;
        
        this.collected = true;
        
        // Play collection sound
        this.scene.sound.play('collect', { volume: 0.4 });
        
        // Stop floating animation
        if (this.floatTween) {
            this.floatTween.stop();
        }
        
        // Create collection effect
        this.createCollectionEffect();
        
        // Emit collection event with amount
        this.scene.events.emit(EVENTS.SOUL_ESSENCE_COLLECTED, this.amount);
        
        // Scale up and fade out
        this.scene.tweens.add({
            targets: this,
            scale: this.scale * 1.5,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // Clean up
                if (this.glowEffect) {
                    this.glowEffect.destroy();
                }
                this.destroy();
            }
        });
    }

    private createCollectionEffect(): void {
        // Create particles
        for (let i = 0; i < 5 + this.amount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 30;
            const distance = 5 + Math.random() * 15;
            
            const particle = this.scene.add.circle(
                this.x,
                this.y,
                2 + Math.random() * 2,
                0x6677ff,
                0.8
            );
            
            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.5,
                duration: 400 + Math.random() * 200,
                onComplete: () => particle.destroy()
            });
        }
        
        // Create a flash effect
        const flash = this.scene.add.circle(
            this.x,
            this.y,
            20,
            0xffffff,
            0.7
        );
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 300,
            onComplete: () => flash.destroy()
        });
    }

    public magnetize(target: Phaser.GameObjects.GameObject): void {
        this.magnetized = true;
        this.magnetTarget = target;
        
        // Stop floating animation
        if (this.floatTween) {
            this.floatTween.stop();
        }
    }

    public getAmount(): number {
        return this.amount;
    }

    public isCollected(): boolean {
        return this.collected;
    }
}