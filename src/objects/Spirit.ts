import Phaser from 'phaser';
import { ElementType, ELEMENT_COLORS } from '../config';
import { DEPTHS } from '../utils/constants';
import { createParticles } from '../utils/helpers';

export default class Spirit extends Phaser.Physics.Arcade.Sprite {
  private element: ElementType;
  private hoverTween: Phaser.Tweens.Tween | null;
  private glowEffect: Phaser.GameObjects.Sprite | null;
  private collected: boolean;
  private floatOffset: number;
  
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    element: ElementType = ElementType.SPIRIT
  ) {
    super(scene, x, y, 'spirit');
    
    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Store element type
    this.element = element;
    
    // Set up physics body
    if (this.body) {
      this.body.allowGravity = false;
    }
    this.setImmovable(true);
    this.setCircle(this.width / 4);
    this.setOffset(this.width / 4, this.height / 4);
    this.setDepth(DEPTHS.COLLECTIBLES);
    
    // Initialize state variables
    this.hoverTween = null;
    this.glowEffect = null;
    this.collected = false;
    this.floatOffset = Math.random() * Math.PI * 2; // Random starting point for floating effect
    
    // Play element-specific animation
    this.play(`${element}-idle`);
    
    // Create glow effect
    this.createGlowEffect();
    
    // Start floating animation
    this.startFloatingAnimation();
  }
  
  private createGlowEffect(): void {
    // Create a sprite for the glow effect
    this.glowEffect = this.scene.add.sprite(this.x, this.y, 'particle');
    this.glowEffect.setScale(3);
    this.glowEffect.setAlpha(0.7);
    this.glowEffect.setDepth(DEPTHS.COLLECTIBLES - 1); // Place behind the spirit
    this.glowEffect.setBlendMode(Phaser.BlendModes.ADD);
    
    // Apply element color
    const color = ELEMENT_COLORS[this.element];
    this.glowEffect.setTint(color);
    
    // Add pulsing effect to the glow
    this.scene.tweens.add({
      targets: this.glowEffect,
      scale: { from: 3, to: 3.5 },
      alpha: { from: 0.7, to: 0.4 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  private startFloatingAnimation(): void {
    // Create a floating hover effect
    this.hoverTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 10,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  update(time: number, delta: number): void {
    // Skip if collected
    if (this.collected) {
      return;
    }
    
    // Update glow effect position
    if (this.glowEffect) {
      this.glowEffect.x = this.x;
      this.glowEffect.y = this.y;
    }
    
    // Create occasional particles
    if (Math.random() > 0.95) {
      this.createRandomParticle();
    }
    
    // Make the spirit rotate slowly
    this.rotation += 0.001 * delta;
  }
  
  private createRandomParticle(): void {
    // Get color based on element
    const color = ELEMENT_COLORS[this.element];
    
    // Create a particle that moves outward from the spirit
    const angle = Math.random() * Math.PI * 2;
    const distance = this.width / 2;
    const particleX = this.x + Math.cos(angle) * distance;
    const particleY = this.y + Math.sin(angle) * distance;
    
    createParticles(
      this.scene,
      particleX,
      particleY,
      color,
      1,
      10,
      0.3,
      800
    );
  }
  
  public collect(): void {
    // Skip if already collected
    if (this.collected) {
      return;
    }
    
    // Set collected flag
    this.collected = true;
    
    // Play collection sound
    this.scene.sound.play('collect', { volume: 0.6 });
    
    // Play collection animation
    this.play('spirit-collect');
    
    // Create collection particle effect
    this.createCollectionParticles();
    
    // Stop hover tween
    if (this.hoverTween) {
      this.hoverTween.stop();
    }
    
    // Grow and fade out the spirit
    this.scene.tweens.add({
      targets: this,
      scale: 1.5,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        // Remove physics body
        if (this.body) {
          this.body.enable = false;
        }
        
        // Destroy the sprite after animation
        this.destroy();
      }
    });
    
    // Grow and fade out the glow effect
    if (this.glowEffect) {
      this.scene.tweens.add({
        targets: this.glowEffect,
        scale: 5,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          if (this.glowEffect) {
            this.glowEffect.destroy();
          }
        }
      });
    }
  }
  
  private createCollectionParticles(): void {
    // Get color based on element
    const color = ELEMENT_COLORS[this.element];
    
    // Create explosion-like particle effect
    createParticles(
      this.scene,
      this.x,
      this.y,
      color,
      20,
      100,
      1,
      1000
    );
    
    // Create secondary particles with white color
    this.scene.time.delayedCall(100, () => {
      createParticles(
        this.scene,
        this.x,
        this.y,
        0xFFFFFF,
        10,
        80,
        0.8,
        800
      );
    });
  }
  
  public getElement(): ElementType {
    return this.element;
  }
  
  public isCollected(): boolean {
    return this.collected;
  }
}