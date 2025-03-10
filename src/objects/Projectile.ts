import Phaser from 'phaser';
import { ElementType } from '../config';
import { DEPTHS } from '../utils/constants';
import { createParticles } from '../utils/helpers';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  private element: ElementType;
  private damage: number;
  private active: boolean;
  private lifespan: number; // Time in ms before auto-destroying
  private creationTime: number;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'projectile');
    
    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set default properties
    this.element = ElementType.SPIRIT;
    this.damage = 10;
    this.active = false;
    this.lifespan = 2000; // Default lifespan: 2 seconds
    this.creationTime = 0;
    
    // Set depth
    this.setDepth(DEPTHS.PROJECTILES);
    
    // Set up physics body
    this.body.setAllowGravity(false);
    
    // Disable by default
    this.disableBody(true, true);
  }
  
  fire(
    x: number, 
    y: number, 
    velocityX: number, 
    velocityY: number, 
    element: ElementType,
    damage: number,
    size: number
  ): void {
    // Enable projectile
    this.enableBody(true, x, y, true, true);
    
    // Set properties
    this.element = element;
    this.damage = damage;
    this.active = true;
    this.creationTime = this.scene.time.now;
    
    // Set velocity
    this.setVelocity(velocityX, velocityY);
    
    // Set size
    this.setScale(size / 10);
    this.body.setSize(size, size);
    this.body.setOffset((this.width - size) / 2, (this.height - size) / 2);
    
    // Set rotation to follow trajectory
    const angle = Math.atan2(velocityY, velocityX);
    this.setRotation(angle);
    
    // Set animation based on element
    this.play(`projectile-${element}`);
    
    // Add trail effect
    this.createTrailEffect();
  }
  
  update(time: number, delta: number): void {
    // Check if projectile is active
    if (!this.active) {
      return;
    }
    
    // Check if projectile has exceeded its lifespan
    if (time - this.creationTime > this.lifespan) {
      this.deactivate();
      return;
    }
    
    // Create trailing particles
    if (Math.random() > 0.7) { // Only create particles occasionally for performance
      this.createTrailParticle();
    }
  }
  
  private createTrailEffect(): void {
    // Create particle emitter that follows the projectile
    const particles = this.scene.add.particles(this.x, this.y, 'particle', {
      speed: 50,
      scale: { start: this.scale * 0.6, end: 0 },
      blendMode: 'ADD',
      lifespan: 300,
      follow: this
    });
    
    // Get color based on element
    let color;
    switch (this.element) {
      case ElementType.FIRE:
        color = 0xFF6600;
        break;
      case ElementType.WATER:
        color = 0x66CCFF;
        break;
      case ElementType.EARTH:
        color = 0x66AA66;
        break;
      case ElementType.AIR:
        color = 0xCCCCFF;
        break;
      case ElementType.SPIRIT:
      default:
        color = 0xCCCCCC;
        break;
    }
    
    // Create a single particle at the current position
    createParticles(
      this.scene,
      this.x,
      this.y,
      color,
      1,
      10,
      this.scale * 0.4,
      200
    );
  }
  
  public onHit(): void {
    // Play impact animation
    this.play('impact');
    
    // Create impact particles
    this.createImpactParticles();
    
    // Deactivate after impact animation completes
    this.on('animationcomplete-impact', this.deactivate, this);
    
    // Stop the projectile
    this.setVelocity(0, 0);
  }
  
  private createImpactParticles(): void {
    // Get color based on element
    let color;
    switch (this.element) {
      case ElementType.FIRE:
        color = 0xFF6600;
        break;
      case ElementType.WATER:
        color = 0x66CCFF;
        break;
      case ElementType.EARTH:
        color = 0x66AA66;
        break;
      case ElementType.AIR:
        color = 0xCCCCFF;
        break;
      case ElementType.SPIRIT:
      default:
        color = 0xCCCCCC;
        break;
    }
    
    // Create impact particles
    createParticles(
      this.scene,
      this.x,
      this.y,
      color,
      10,
      80,
      this.scale * 0.8,
      500
    );
  }
  
  public deactivate(): void {
    this.active = false;
    this.disableBody(true, true);
  }
  
  public getElement(): ElementType {
    return this.element;
  }
  
  public getDamage(): number {
    return this.damage;
  }
  
  public isActive(): boolean {
    return this.active;
  }CCFF;
        break;
      case ElementType.EARTH:
        color = 0x66AA66;
        break;
      case ElementType.AIR:
        color = 0xCCCCFF;
        break;
      case ElementType.SPIRIT:
      default:
        color = 0xCCCCCC;
        break;
    }
    
    // Set emitter properties
    particles.setTint(color);
    
    // Create emitter
    const emitter = particles.createEmitter({
      scale: { start: this.scale * 0.5, end: 0 },
      speed: { min: 10, max: 30 },
      angle: { min: 0, max: 360 },
      rotate: { min: 0, max: 360 },
      lifespan: { min: 200, max: 300 },
      alpha: { start: 0.6, end: 0 },
      quantity: 1,
      frequency: 60
    });
    
    // Auto-destroy particles when projectile is deactivated
    this.on('destroy', () => {
      particles.destroy();
    });
    
    this.on('disable', () => {
      particles.destroy();
    });
  }
  
  private createTrailParticle(): void {
    // Get color based on element
    let color;
    switch (this.element) {
      case ElementType.FIRE:
        color = 0xFF6600;
        break;
      case ElementType.WATER:
        color = 0x66