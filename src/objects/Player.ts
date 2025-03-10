import Phaser from 'phaser';
import { ElementType, PLAYER_CONFIG, PROJECTILE_CONFIG } from '../config';
import { DEPTHS, EVENTS } from '../utils/constants';
import Projectile from './Projectile';
import { createParticles } from '../utils/helpers';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  // Player state
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
  
  // Audio
  private jumpSound: Phaser.Sound.BaseSound;
  private shootSound: Phaser.Sound.BaseSound;
  private hitSound: Phaser.Sound.BaseSound;
  private switchElementSound: Phaser.Sound.BaseSound;
  
  // Input
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
  
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string = 'player',
    frame: number = 0
  ) {
    super(scene, x, y, texture, frame);
    
    // Add player to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Initialize properties
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
    
    // Set up projectiles group
    this.projectiles = this.scene.add.group({
      classType: Projectile,
      maxSize: 20,
      runChildUpdate: true
    });
    
    // Set up physics body
    this.setCollideWorldBounds(true);
    this.setSize(PLAYER_CONFIG.WIDTH, PLAYER_CONFIG.HEIGHT);
    this.setOffset((this.width - PLAYER_CONFIG.WIDTH) / 2, this.height - PLAYER_CONFIG.HEIGHT);
    this.setDepth(DEPTHS.PLAYER);
    
    // Set up input
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.keySpace = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyShift = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyW = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.key1 = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.key3 = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.key4 = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
    this.key5 = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);
    
    // Setup sounds
    this.jumpSound = this.scene.sound.add('jump', { volume: 0.5 });
    this.shootSound = this.scene.sound.add('shoot', { volume: 0.4 });
    this.hitSound = this.scene.sound.add('hit', { volume: 0.6 });
    this.switchElementSound = this.scene.sound.add('switch-element', { volume: 0.5 });
    
    // Play initial animation
    this.play('player-spirit-idle');
    
    // Set up mouse input for aiming
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.updateAimDirection(pointer.x, pointer.y);
    });
    
    // Set up click for shooting
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.shoot();
      }
    });
  }
  
  update(time: number, delta: number): void {
    // Handle input
    this.handleInput();
    
    // Update animation based on state
    this.updateAnimation();
    
    // Auto-regenerate energy
    this.regenerateEnergy(delta);
    
    // Update player effects based on current element
    this.updateElementEffects(delta);
  }
  
  private handleInput(): void {
    // Check if player is on ground for jumping
    this.onPlatform = this.body.blocked.down || this.body.touching.down;
    
    if (this.onPlatform) {
      this.isJumping = false;
    }
    
    // Horizontal movement
    if (this.cursors.left.isDown || this.keyA.isDown) {
      this.moveLeft();
    } else if (this.cursors.right.isDown || this.keyD.isDown) {
      this.moveRight();
    } else {
      this.stopHorizontal();
    }
    
    // Jumping
    if ((this.cursors.up.isDown || this.keyW.isDown || this.keySpace.isDown) && this.onPlatform && !this.isJumping) {
      this.jump();
    }
    
    // Ducking
    if (this.cursors.down.isDown || this.keyS.isDown) {
      this.duck();
    } else if (this.isDucking) {
      this.standUp();
    }
    
    // Element switching
    if (this.key1.isDown) {
      this.changeElement(ElementType.SPIRIT);
    } else if (this.key2.isDown) {
      this.changeElement(ElementType.FIRE);
    } else if (this.key3.isDown) {
      this.changeElement(ElementType.WATER);
    } else if (this.key4.isDown) {
      this.changeElement(ElementType.EARTH);
    } else if (this.key5.isDown) {
      this.changeElement(ElementType.AIR);
    }
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
    
    // Different jump heights for different elements
    let jumpVelocity = PLAYER_CONFIG.JUMP_VELOCITY;
    
    switch (this.currentElement) {
      case ElementType.AIR:
        jumpVelocity *= 1.1; // Air jumps higher
        break;
      case ElementType.EARTH:
        jumpVelocity *= 1.2; // Earth jumps highest
        break;
      case ElementType.WATER:
        jumpVelocity *= 0.9; // Water jumps slightly lower
        break;
    }
    
    this.setVelocityY(jumpVelocity);
    this.jumpSound.play();
  }
  
  private duck(): void {
    if (!this.isDucking) {
      this.isDucking = true;
      
      // Reduce hitbox height when ducking
      const newHeight = PLAYER_CONFIG.HEIGHT * (1 - PLAYER_CONFIG.DUCK_HEIGHT_REDUCTION);
      this.setSize(PLAYER_CONFIG.WIDTH, newHeight);
      this.setOffset((this.width - PLAYER_CONFIG.WIDTH) / 2, this.height - newHeight);
      
      // Slow down when ducking
      if (this.body.velocity.x !== 0) {
        this.setVelocityX(this.body.velocity.x * 0.5);
      }
    }
  }
  
  private standUp(): void {
    this.isDucking = false;
    
    // Restore original hitbox
    this.setSize(PLAYER_CONFIG.WIDTH, PLAYER_CONFIG.HEIGHT);
    this.setOffset((this.width - PLAYER_CONFIG.WIDTH) / 2, this.height - PLAYER_CONFIG.HEIGHT);
  }
  
  private updateAnimation(): void {
    // Determine animation based on movement state and current element
    const elementPrefix = `player-${this.currentElement}`;
    
    if (this.isDucking) {
      this.play(`${elementPrefix}-duck`, true);
    } else if (this.isJumping) {
      this.play(`${elementPrefix}-jump`, true);
    } else if (this.body.velocity.x !== 0) {
      this.play(`${elementPrefix}-run`, true);
    } else {
      this.play(`${elementPrefix}-idle`, true);
    }
  }
  
  private regenerateEnergy(delta: number): void {
    // Regenerate energy based on current element
    const regenRate = PLAYER_CONFIG.ENERGY_REGEN[this.currentElement];
    this.energy = Math.min(this.maxEnergy, this.energy + regenRate * delta / 16);
    
    // Emit energy change event for UI
    this.scene.events.emit(EVENTS.PLAYER_ENERGY_CHANGE, this.energy, this.maxEnergy);
  }
  
  private updateElementEffects(delta: number): void {
    // Apply element-specific effects
    switch (this.currentElement) {
      case ElementType.AIR:
        // Air spirit falls slower
        if (this.isJumping && this.body.velocity.y > 0) {
          this.body.velocity.y *= 0.98;
        }
        break;
      case ElementType.WATER:
        // Water spirits can "float" briefly at jump apex
        if (this.isJumping && Math.abs(this.body.velocity.y) < 50) {
          this.body.velocity.y *= 0.9;
        }
        break;
      case ElementType.EARTH:
        // Earth spirits fall faster but are more resilient
        if (this.isJumping && this.body.velocity.y > 0) {
          this.body.velocity.y *= 1.02;
        }
        break;
    }
    
    // Create element-specific particles
    if (!this.isJumping && !this.isDucking && this.body.velocity.x !== 0) {
      this.createMovementParticles();
    }
  }
  
  private createMovementParticles(): void {
    // Only create particles every few frames to reduce load
    if (Math.random() > 0.1) return;
    
    // Create particles at player's feet
    const particleX = this.x;
    const particleY = this.y + this.height / 2 - 4;
    
    // Different particles for different elements
    switch (this.currentElement) {
      case ElementType.FIRE:
        createParticles(this.scene, particleX, particleY, 0xFF6600, 2, 50, 0.5, 500);
        break;
      case ElementType.WATER:
        createParticles(this.scene, particleX, particleY, 0x66CCFF, 2, 30, 0.5, 400);
        break;
      case ElementType.EARTH:
        createParticles(this.scene, particleX, particleY, 0x66AA66, 2, 20, 0.5, 300);
        break;
      case ElementType.AIR:
        createParticles(this.scene, particleX, particleY, 0xCCCCFF, 2, 60, 0.5, 600);
        break;
      case ElementType.SPIRIT:
        createParticles(this.scene, particleX, particleY, 0xCCCCCC, 2, 40, 0.5, 400);
        break;
    }
  }
  
  public updateAimDirection(pointerX: number, pointerY: number): void {
    // Calculate direction from player to pointer
    const dx = pointerX - this.x;
    const dy = pointerY - this.y;
    
    // Normalize direction
    const length = Math.sqrt(dx * dx + dy * dy);
    this.aimDirection.x = dx / length;
    this.aimDirection.y = dy / length;
    
    // Update facing direction based on aim
    if (dx < 0) {
      this.facingDirection = 'left';
      this.setFlipX(true);
    } else {
      this.facingDirection = 'right';
      this.setFlipX(false);
    }
  }
  
  public shoot(): void {
    // Check cooldown
    const now = this.scene.time.now;
    if (now - this.lastShootTime < PLAYER_CONFIG.SHOOT_COOLDOWN) {
      return;
    }
    
    // Check energy
    if (this.energy < PLAYER_CONFIG.SHOOT_ENERGY_COST) {
      return;
    }
    
    // Update last shoot time
    this.lastShootTime = now;
    
    // Consume energy
    this.energy -= PLAYER_CONFIG.SHOOT_ENERGY_COST;
    this.scene.events.emit(EVENTS.PLAYER_ENERGY_CHANGE, this.energy, this.maxEnergy);
    
    // Create projectile
    const projectile = this.projectiles.get() as Projectile;
    if (projectile) {
      const projectileSpeed = PROJECTILE_CONFIG.BASE_SPEED;
      const projectileDamage = PROJECTILE_CONFIG.BASE_DAMAGE[this.currentElement];
      const projectileSize = PROJECTILE_CONFIG.SIZE[this.currentElement];
      
      projectile.fire(
        this.x, 
        this.y - this.height / 4, 
        this.aimDirection.x * projectileSpeed,
        this.aimDirection.y * projectileSpeed,
        this.currentElement,
        projectileDamage,
        projectileSize
      );
    }
    
    // Play sound
    this.shootSound.play();
  }
  
  public changeElement(element: ElementType): void {
    // Don't switch if already using this element
    if (this.currentElement === element) {
      return;
    }
    
    // Switch element
    this.currentElement = element;
    
    // Play sound
    this.switchElementSound.play();
    
    // Create particle effect
    this.createElementChangeParticles();
    
    // Emit event for UI update
    this.scene.events.emit(EVENTS.PLAYER_ELEMENT_CHANGE, this.currentElement);
  }
  
  private createElementChangeParticles(): void {
    createParticles(
      this.scene, 
      this.x, 
      this.y - this.height / 4, 
      parseInt(ELEMENT_COLORS[this.currentElement].toString(16), 16), 
      20, 
      100, 
      1, 
      1000
    );
  }
  
  public takeDamage(damage: number): void {
    // Check invulnerability
    if (this.isInvulnerable) {
      return;
    }
    
    // Reduce damage for earth element
    if (this.currentElement === ElementType.EARTH) {
      damage *= 0.7; // Earth takes less damage
    }
    
    // Apply damage
    this.health = Math.max(0, this.health - damage);
    
    // Play hit sound
    this.hitSound.play();
    
    // Create hit effect
    this.setTint(0xff0000);
    
    // Set temporary invulnerability
    this.isInvulnerable = true;
    
    // Flash effect while invulnerable
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
    
    // Reset invulnerability after a short time
    if (this.invulnerabilityTimer) {
      this.invulnerabilityTimer.remove();
    }
    
    this.invulnerabilityTimer = this.scene.time.delayedCall(1000, () => {
      this.isInvulnerable = false;
    });
    
    // Emit damage event for UI
    this.scene.events.emit(EVENTS.PLAYER_DAMAGE, this.health, this.maxHealth);
    
    // Check for death
    if (this.health <= 0) {
      this.die();
    }
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
    // Play death animation and sound
    this.scene.sound.play('death');
    
    // Create death particles
    createParticles(
      this.scene, 
      this.x, 
      this.y - this.height / 4, 
      0xffffff, 
      30, 
      150, 
      1.5, 
      1500
    );
    
    // Emit game over event
    this.scene.events.emit(EVENTS.GAME_OVER);
    
    // Disable player
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
}