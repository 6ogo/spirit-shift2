import Phaser from 'phaser';
import { ElementType, ENEMY_CONFIG } from '../config';
import { DEPTHS, EVENTS } from '../utils/constants';
import { createParticles } from '../utils/helpers';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  // Enemy properties
  private id: number;
  private element: ElementType;
  private health: number;
  private maxHealth: number;
  private damage: number;
  private speed: number;
  private direction: 'left' | 'right';
  private moveTimer: Phaser.Time.TimerEvent | null;
  private isAggro: boolean;
  private targetX: number | null;
  private isDying: boolean;

  // UI elements
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
    
    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set unique ID
    this.id = id;
    
    // Set element
    this.element = element;
    
    // Set health based on level
    const level = scene.registry.get('level') || 1;
    this.maxHealth = ENEMY_CONFIG.BASE_HEALTH + (level * 5);
    this.health = this.maxHealth;
    
    // Set damage
    this.damage = ENEMY_CONFIG.BASE_DAMAGE + (level * 2);
    
    // Set speed
    this.speed = ENEMY_CONFIG.BASE_SPEED + (Math.random() * level * 10);
    
    // Set initial direction randomly
    this.direction = Math.random() > 0.5 ? 'left' : 'right';
    
    // Set up physics body
    this.body.setSize(30, 30);
    this.setOffset((this.width - 30) / 2, this.height - 30);
    this.setDepth(DEPTHS.ENEMIES);
    this.setCollideWorldBounds(true);
    
    // Create health bar
    this.healthBar = this.scene.add.graphics();
    this.drawHealthBar();
    
    // Create element icon
    this.elementIcon = this.scene.add.sprite(x, y - 35, `element-icon-${element}`);
    this.elementIcon.setScale(0.5);
    this.elementIcon.setDepth(DEPTHS.ENEMIES);
    
    // Initialize state variables
    this.isAggro = false;
    this.targetX = null;
    this.isDying = false;
    
    // Start random movement timer
    this.startMovementTimer();
    
    // Set initial animation
    this.play(`enemy-${element}-move`);
  }
  
  update(time: number, delta: number): void {
    // Skip update if enemy is dead
    if (this.isDying) {
      return;
    }
    
    // Update health bar and element icon position
    this.drawHealthBar();
    this.elementIcon.setPosition(this.x, this.y - 35);
    
    // Move the enemy
    this.moveEnemy();
    
    // Flip sprite based on direction
    this.setFlipX(this.direction === 'left');
  }
  
  private drawHealthBar(): void {
    // Clear previous graphics
    this.healthBar.clear();
    
    // Draw background
    this.healthBar.fillStyle(0x000000, 0.8);
    this.healthBar.fillRect(this.x - 20, this.y - 25, 40, 5);
    
    // Calculate health percentage
    const healthPercent = this.health / this.maxHealth;
    
    // Draw health
    let healthColor = 0x00ff00; // Green for high health
    if (healthPercent < 0.3) {
      healthColor = 0xff0000; // Red for low health
    } else if (healthPercent < 0.6) {
      healthColor = 0xffff00; // Yellow for medium health
    }
    
    this.healthBar.fillStyle(healthColor, 1);
    this.healthBar.fillRect(this.x - 19, this.y - 24, 38 * healthPercent, 3);
  }
  
  private moveEnemy(): void {
    // Check if the enemy should be pursuing a target
    if (this.isAggro && this.targetX !== null) {
      // Determine direction to target
      if (this.targetX < this.x - 10) {
        this.direction = 'left';
        this.setVelocityX(-this.speed);
      } else if (this.targetX > this.x + 10) {
        this.direction = 'right';
        this.setVelocityX(this.speed);
      } else {
        // Close enough, stop
        this.setVelocityX(0);
      }
    } else {
      // Simple back and forth movement
      if (this.direction === 'left') {
        this.setVelocityX(-this.speed * 0.5);
      } else {
        this.setVelocityX(this.speed * 0.5);
      }
    }
    
    // Create movement particles
    if (Math.random() > 0.9) {
      this.createMovementParticles();
    }
  }
  
  private createMovementParticles(): void {
    // Different particles based on element
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
    
    // Create particles at enemy's feet
    createParticles(
      this.scene,
      this.x,
      this.y,
      color,
      1,
      20,
      0.5,
      300
    );
  }
  
  private startMovementTimer(): void {
    // Change direction randomly every 2-5 seconds if not pursuing a target
    this.moveTimer = this.scene.time.addEvent({
      delay: 2000 + Math.random() * 3000,
      callback: () => {
        if (!this.isAggro) {
          // Randomly change direction
          this.direction = Math.random() > 0.5 ? 'left' : 'right';
        }
      },
      loop: true
    });
  }
  
  public takeDamage(damage: number, attackerElement: ElementType): void {
    // Skip if already dying
    if (this.isDying) {
      return;
    }
    
    // Calculate elemental advantages
    let damageMultiplier = 1;
    
    // Same element: reduced damage
    if (attackerElement === this.element) {
      damageMultiplier = 0.25;
    }
    
    // Elemental advantages
    if (
      (attackerElement === ElementType.FIRE && this.element === ElementType.AIR) ||
      (attackerElement === ElementType.WATER && this.element === ElementType.FIRE) ||
      (attackerElement === ElementType.EARTH && this.element === ElementType.WATER) ||
      (attackerElement === ElementType.AIR && this.element === ElementType.EARTH)
    ) {
      damageMultiplier = 2;
    }
    
    // Elemental disadvantages
    if (
      (attackerElement === ElementType.AIR && this.element === ElementType.FIRE) ||
      (attackerElement === ElementType.FIRE && this.element === ElementType.WATER) ||
      (attackerElement === ElementType.WATER && this.element === ElementType.EARTH) ||
      (attackerElement === ElementType.EARTH && this.element === ElementType.AIR)
    ) {
      damageMultiplier = 0.5;
    }
    
    // Apply damage
    const actualDamage = damage * damageMultiplier;
    this.health = Math.max(0, this.health - actualDamage);
    
    // Create hit effect
    this.createHitEffect(damageMultiplier);
    
    // Flash enemy on hit
    this.flashOnHit();
    
    // Become aggressive when hit
    this.isAggro = true;
    
    // Emit damage event
    this.scene.events.emit(EVENTS.ENEMY_DAMAGE, this.id, actualDamage);
    
    // Check if dead
    if (this.health <= 0) {
      this.die();
    }
  }
  
  private createHitEffect(damageMultiplier: number): void {
    // Create particles based on damage multiplier
    let color;
    let particleCount;
    
    if (damageMultiplier >= 2) {
      // Critical hit
      color = 0xFF0000;
      particleCount = 15;
    } else if (damageMultiplier <= 0.5) {
      // Weak hit
      color = 0xCCCCCC;
      particleCount = 5;
    } else {
      // Normal hit
      color = 0xFFFF00;
      particleCount = 10;
    }
    
    // Create hit particles
    createParticles(
      this.scene,
      this.x,
      this.y - 15,
      color,
      particleCount,
      60,
      0.8,
      500
    );
  }
  
  private flashOnHit(): void {
    // Flash red when hit
    this.setTint(0xff0000);
    
    // Clear tint after a short time
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });
  }
  
  public die(): void {
    // Set dying state to prevent further updates
    this.isDying = true;
    
    // Stop movement
    this.setVelocity(0, 0);
    
    // Play death animation
    this.play('enemy-death');
    
    // Create death particles
    this.createDeathParticles();
    
    // Remove physics body
    this.body.enable = false;
    
    // Emit death event
    this.scene.events.emit(EVENTS.ENEMY_DEFEATED, this.id);
    
    // Remove the enemy after the death animation
    this.once('animationcomplete-enemy-death', () => {
      this.healthBar.destroy();
      this.elementIcon.destroy();
      this.destroy();
    });
  }
  
  private createDeathParticles(): void {
    // Create explosion effect based on element
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
    
    // First wave of particles
    createParticles(
      this.scene,
      this.x,
      this.y,
      color,
      20,
      80,
      1,
      800
    );
    
    // Second wave of particles (delayed)
    this.scene.time.delayedCall(100, () => {
      createParticles(
        this.scene,
        this.x,
        this.y,
        0xFFFFFF,
        10,
        60,
        0.8,
        600
      );
    });
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