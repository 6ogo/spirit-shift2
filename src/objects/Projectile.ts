import Phaser from 'phaser';
import { ElementType, ELEMENT_COLORS } from '../config';
import { DEPTHS, EVENTS } from '../utils/constants';
import { createParticles } from '../utils/helpers';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
    private element: ElementType;
    private damage: number;
    private isActive: boolean;
    private lifespan: number;
    private creationTime: number;
    private isExplosive: boolean;
    private explosionRadius: number;
    private isHoming: boolean;
    private homingTarget: Phaser.GameObjects.GameObject | null;
    private homingForce: number;
    private penetrating: boolean;
    private penetrationCount: number;
    private trailParticles: boolean;
    private trailColor: number;
    private trailFrequency: number;
    
    private trailEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'projectile');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Basic properties
        this.element = ElementType.SPIRIT;
        this.damage = 10;
        this.isActive = false;
        this.lifespan = 2000;
        this.creationTime = 0;
        
        // Special properties
        this.isExplosive = false;
        this.explosionRadius = 100;
        this.isHoming = false;
        this.homingTarget = null;
        this.homingForce = 0.02;
        this.penetrating = false;
        this.penetrationCount = 0;
        this.trailParticles = true;
        this.trailColor = 0xFFFFFF;
        this.trailFrequency = 0.5; // 0-1, higher means more particles
        
        this.trailEmitter = null;

        // Set physics properties
        this.setDepth(DEPTHS.PROJECTILES);
        if (this.body instanceof Phaser.Physics.Arcade.Body) {
            this.body.allowGravity = false;
        }        
        this.disableBody(true, true);
    }

    fire(x: number, y: number, velocityX: number, velocityY: number, element: ElementType, damage: number, size: number): void {
        // Enable the projectile
        this.enableBody(true, x, y, true, true);
        
        // Set basic properties
        this.element = element;
        this.damage = damage;
        this.isActive = true;
        this.creationTime = this.scene.time.now;
        
        // Reset special properties
        this.penetrationCount = 0;
        
        // Set element-specific behaviors
        this.setupElementBehavior();

        // Set velocity and appearance
        this.setVelocity(velocityX, velocityY);
        this.setScale(size / 10);
        this.body.setSize(size, size);
        this.body.setOffset((this.width - size) / 2, (this.height - size) / 2);

        // Set rotation to match trajectory
        const angle = Math.atan2(velocityY, velocityX);
        this.setRotation(angle);
        
        // Play appropriate animation
        this.play(`projectile-${element}`);
        
        // Create trail effect if enabled
        if (this.trailParticles) {
            this.createTrailEffect();
        }
    }

    update(time: number, delta: number): void {
        if (!this.isActive) return;
        
        // Check for lifespan expiration
        if (time - this.creationTime > this.lifespan) {
            this.deactivate();
            return;
        }
        
        // Apply homing behavior if enabled
        if (this.isHoming && this.homingTarget && this.homingTarget.active) {
            this.applyHomingForce();
        }
        
        // Create occasional trail particles
        if (this.trailParticles && Math.random() > 1 - this.trailFrequency) {
            this.createTrailParticle();
        }
        
        // Apply element-specific behavior
        this.updateElementBehavior(time, delta);
    }
    
    private setupElementBehavior(): void {
        // Set element-specific properties
        switch (this.element) {
            case ElementType.FIRE:
                // Fire projectiles leave a trail and can be explosive
                this.trailFrequency = 0.8;
                this.trailColor = 0xFF6600;
                this.lifespan = 1500;
                // Fire is already potentially explosive based on player upgrades
                break;
                
            case ElementType.WATER:
                // Water projectiles move in a wave pattern and can pierce through enemies
                this.trailFrequency = 0.6;
                this.trailColor = 0x66CCFF;
                this.lifespan = 2000;
                this.penetrating = true;
                this.penetrationCount = 2; // Can hit up to 2 enemies
                break;
                
            case ElementType.EARTH:
                // Earth projectiles are slower but more powerful, can ricochet
                this.trailFrequency = 0.3;
                this.trailColor = 0x66AA66;
                this.lifespan = 2500;
                this.body.bounce.set(0.8); // Can bounce off surfaces
                // Adjust velocity (slower)
                this.body.velocity.x *= 0.8;
                this.body.velocity.y *= 0.8;
                break;
                
            case ElementType.AIR:
                // Air projectiles are faster and can home in on enemies
                this.trailFrequency = 0.7;
                this.trailColor = 0xCCCCFF;
                this.lifespan = 3000;
                // Add slight acceleration
                this.body.velocity.x *= 1.2;
                this.body.velocity.y *= 1.2;
                // Homing set by player's upgrades
                break;
                
            case ElementType.SPIRIT:
                // Spirit projectiles have neutral properties
                this.trailFrequency = 0.5;
                this.trailColor = 0xCCCCCC;
                this.lifespan = 2000;
                break;
        }
    }
    
    private updateElementBehavior(time: number, delta: number): void {
        // Apply element-specific behavior during flight
        switch (this.element) {
            case ElementType.WATER:
                // Water projectiles move in a wave pattern
                this.applyWaveMotion(time);
                break;
                
            case ElementType.AIR:
                // Air projectiles accelerate slightly over time
                this.body.velocity.x *= 1.001;
                this.body.velocity.y *= 1.001;
                break;
        }
    }
    
    private applyWaveMotion(time: number): void {
        // Calculate wave offset based on time
        const elapsed = time - this.creationTime;
        const frequency = 0.005;
        const amplitude = 3;
        
        // Get current velocity direction
        const speed = Math.sqrt(this.body.velocity.x * this.body.velocity.x + this.body.velocity.y * this.body.velocity.y);
        const normalX = this.body.velocity.x / speed;
        const normalY = this.body.velocity.y / speed;
        
        // Calculate perpendicular direction
        const perpX = -normalY;
        const perpY = normalX;
        
        // Apply sine wave motion perpendicular to direction
        const waveOffset = Math.sin(elapsed * frequency) * amplitude;
        this.body.velocity.x = normalX * speed + perpX * waveOffset;
        this.body.velocity.y = normalY * speed + perpY * waveOffset;
    }
    
    private applyHomingForce(): void {
        if (!this.homingTarget) return;
        
        // Get target position
        const targetX = (this.homingTarget as any).x;
        const targetY = (this.homingTarget as any).y;
        
        // Calculate direction to target
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Normalize direction
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Calculate current velocity and speed
            const speed = Math.sqrt(this.body.velocity.x * this.body.velocity.x + this.body.velocity.y * this.body.velocity.y);
            
            // Apply homing force (adjust velocity towards target)
            this.body.velocity.x += dirX * this.homingForce * speed;
            this.body.velocity.y += dirY * this.homingForce * speed;
            
            // Normalize velocity to maintain speed
            const newSpeed = Math.sqrt(this.body.velocity.x * this.body.velocity.x + this.body.velocity.y * this.body.velocity.y);
            this.body.velocity.x = (this.body.velocity.x / newSpeed) * speed;
            this.body.velocity.y = (this.body.velocity.y / newSpeed) * speed;
            
            // Update rotation to match new direction
            this.setRotation(Math.atan2(this.body.velocity.y, this.body.velocity.x));
        }
    }

    private createTrailEffect(): void {
        // Create continuous particle trail that follows the projectile
        const particles = this.scene.add.particles(this.x, this.y, 'particle', {
            speed: 50,
            scale: { start: this.scale * 0.6, end: 0 },
            blendMode: 'ADD',
            lifespan: 300,
            follow: this
        });
        
        // Store reference to emitter for cleanup
        this.trailEmitter = particles.createEmitter({
            quantity: 1,
            frequency: 30,
            tint: this.trailColor
        });
    }

    private createTrailParticle(): void {
        createParticles(
            this.scene,
            this.x,
            this.y,
            this.trailColor,
            1,
            10,
            this.scale * 0.4,
            200
        );
    }

    public onHit(target?: any): void {
        // Check if the projectile should penetrate
        if (this.penetrating && this.penetrationCount > 0) {
            this.penetrationCount--;
            
            // Create impact effect but don't destroy projectile
            this.createImpactParticles();
            return;
        }
        
        // Check if projectile should explode
        if (this.isExplosive) {
            this.explode();
        } else {
            // Regular impact
            this.play('impact');
            this.createImpactParticles();
            this.on('animationcomplete-impact', this.deactivate, this);
            this.setVelocity(0, 0);
        }
    }
    
    private explode(): void {
        // Create explosion effect
        const explosion = this.scene.add.circle(this.x, this.y, 10, 0xFF6600, 0.8);
        explosion.setDepth(DEPTHS.PARTICLES);
        
        // Grow and fade explosion
        this.scene.tweens.add({
            targets: explosion,
            scale: 10,
            alpha: 0,
            duration: 300,
            onComplete: () => explosion.destroy()
        });
        
        // Create particles
        createParticles(
            this.scene,
            this.x,
            this.y,
            0xFF6600,
            20,
            100,
            1,
            500
        );
        
        // Play explosion sound
        this.scene.sound.play('hit', { volume: 0.7 });
        
        // Emit explosion event for damage calculation
        this.scene.events.emit(EVENTS.PLAYER_SPECIAL_ATTACK, 'explosion', this.x, this.y, this.explosionRadius, this.damage);
        
        // Deactivate projectile
        this.deactivate();
    }

    private createImpactParticles(): void {
        // Create impact effect based on element
        createParticles(
            this.scene,
            this.x,
            this.y,
            this.trailColor,
            10,
            50,
            0.5,
            300
        );
    }

    private deactivate(): void {
        // Stop any particle effects
        if (this.trailEmitter) {
            (this.trailEmitter as any).remove();
            this.trailEmitter = null;
        }
        
        // Disable projectile
        this.isActive = false;
        this.disableBody(true, true);
    }
    
    // Setters for special behaviors
    
    public setExplosive(isExplosive: boolean, radius: number = 100): void {
        this.isExplosive = isExplosive;
        this.explosionRadius = radius;
    }
    
    public setHoming(isHoming: boolean, target?: Phaser.GameObjects.GameObject): void {
        this.isHoming = isHoming;
        if (target) {
            this.homingTarget = target;
        }
    }
    
    public setPenetrating(penetrating: boolean, count: number = 2): void {
        this.penetrating = penetrating;
        this.penetrationCount = count;
    }

    // Getters
    
    public getElement(): ElementType {
        return this.element;
    }

    public getDamage(): number {
        return this.damage;
    }
    
    public isStillActive(): boolean {
        return this.isActive;
    }
}