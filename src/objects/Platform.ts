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
    
    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static body
    
    // Store properties
    this.element = element;
    this.platformWidth = width;
    this.platformHeight = height;
    this.canPassThrough = canPassThrough;
    this.particles = null;
    
    // Set up body size
    this.setDisplaySize(width, height);
    this.body.setSize(width, height);
    this.setOffset(0, 0);
    
    // Set depth for proper layering
    this.setDepth(DEPTHS.PLATFORMS);
    
    // Apply element-specific styling
    this.applyElementStyle();
    
    // Set up one-way platform if needed
    if (canPassThrough) {
      this.setupOneWayPlatform();
    }
    
    // Create element-specific particles
    this.createElementParticles();
  }
  
  private applyElementStyle(): void {
    // Apply color tint based on element
    const colorValue = ELEMENT_COLORS[this.element];
    this.setTint(colorValue);
    
    // If it's a pass-through platform, make it semi-transparent
    if (this.canPassThrough) {
      this.setAlpha(0.8);
    }
  }
  
  private setupOneWayPlatform(): void {
    // For one-way platforms, only allow collision from the top
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
  }
  
  private createElementParticles(): void {
    // Don't create particles for standard spirit platforms
    if (this.element === ElementType.SPIRIT) {
      return;
    }
    
    // Get the color for the particle
    const color = ELEMENT_COLORS[this.element];
    
    // Different particle effects based on element
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
    // Create fire particles rising from the platform
    const particles = this.scene.add.particles(0, 0, 'particle', {
      color: [color],
      colorEase: 'quad.out',
      lifespan: 800,
      scale: { start: 0.4, end: 0.1 },
      speed: { min: 10, max: 30 },
      advance: 2000,
      blendMode: 'ADD',
      frequency: 50,
      alpha: { start: 0.7, end: 0 },
      emitting: true
    });
    
    // Create multiple emitters along the platform width
    const emitterCount = Math.max(1, Math.floor(this.platformWidth / 40));
    for (let i = 0; i < emitterCount; i++) {
      const emitterX = this.x - this.platformWidth / 2 + (i + 0.5) * (this.platformWidth / emitterCount);
      const emitter = particles.createEmitter({
        x: emitterX,
        y: this.y - this.platformHeight / 2,
        angle: { min: 270, max: 110 },
        frequency: 200 + Math.random() * 300,
        quantity: 1
      });
    }
    
    this.particles = particles.emitters.first;
  }
  
  private createWaterParticles(color: number): void {
    // Create water particles (bubbles) rising from the platform
    const particles = this.scene.add.particles(0, 0, 'particle', {
      color: [color],
      colorEase: 'quad.out',
      lifespan: 1200,
      scale: { start: 0.2, end: 0.4 },
      speed: { min: 5, max: 20 },
      advance: 2000,
      blendMode: 'ADD',
      frequency: 80,
      alpha: { start: 0.5, end: 0 },
      emitting: true
    });
    
    // Create multiple emitters along the platform width
    const emitterCount = Math.max(1, Math.floor(this.platformWidth / 40));
    for (let i = 0; i < emitterCount; i++) {
      const emitterX = this.x - this.platformWidth / 2 + (i + 0.5) * (this.platformWidth / emitterCount);
      const emitter = particles.createEmitter({
        x: emitterX,
        y: this.y - this.platformHeight / 2,
        angle: { min: 80, max: 100 },
        frequency: 300 + Math.random() * 400,
        quantity: 1,
        moveToX: { min: emitterX - 20, max: emitterX + 20 },
        moveToY: { min: this.y - 50, max: this.y - 100 }
      });
    }
    
    this.particles = particles.emitters.first;
  }
  
  private createEarthParticles(color: number): void {
    // Create earth particles (small pebbles or dust) occasionally falling
    const particles = this.scene.add.particles(0, 0, 'particle', {
      color: [color],
      colorEase: 'quad.out',
      lifespan: 1000,
      scale: { start: 0.3, end: 0.1 },
      speed: { min: 5, max: 10 },
      advance: 2000,
      blendMode: 'NORMAL',
      frequency: 100,
      alpha: { start: 0.6, end: 0 },
      emitting: true
    });
    
    // Create emitters near the edges of the platform
    const emitter1 = particles.createEmitter({
      x: { min: this.x - this.platformWidth / 2, max: this.x - this.platformWidth / 2 + 20 },
      y: this.y - this.platformHeight / 2,
      angle: { min: 60, max: 120 },
      frequency: 500 + Math.random() * 500,
      quantity: 1
    });
    
    const emitter2 = particles.createEmitter({
      x: { min: this.x + this.platformWidth / 2 - 20, max: this.x + this.platformWidth / 2 },
      y: this.y - this.platformHeight / 2,
      angle: { min: 60, max: 120 },
      frequency: 500 + Math.random() * 500,
      quantity: 1
    });
    
    this.particles = particles.emitters.first;
  }
  
  private createAirParticles(color: number): void {
    // Create swirling air particles around the platform
    const particles = this.scene.add.particles(0, 0, 'particle', {
      color: [color],
      colorEase: 'quad.out',
      lifespan: 1500,
      scale: { start: 0.1, end: 0.3 },
      speed: { min: 10, max: 30 },
      advance: 2000,
      blendMode: 'ADD',
      frequency: 50,
      alpha: { start: 0.3, end: 0 },
      emitting: true
    });
    
    // Create emitters along the platform
    const emitter = particles.createEmitter({
      x: { min: this.x - this.platformWidth / 2, max: this.x + this.platformWidth / 2 },
      y: { min: this.y - this.platformHeight / 2 - 10, max: this.y + this.platformHeight / 2 + 10 },
      angle: { min: 0, max: 360 },
      frequency: 100,
      quantity: 1,
      rotate: { min: 0, max: 360 }
    });
    
    this.particles = particles.emitters.first;
  }
  
  public update(): void {
    // Update particle effects if needed
  }
  
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