import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ElementType } from '../config';
import { SCENES, EVENTS } from '../utils/constants';
import Player from '../objects/Player';
import Platform from '../objects/Platform';
import Enemy from '../objects/Enemy';
import Spirit from '../objects/Spirit';
import Projectile from '../objects/Projectile';
import LevelGenerator from '../systems/LevelGenerator';
import { calculateElementalMultiplier } from '../utils/helpers';

export default class GameScene extends Phaser.Scene {
  // Game objects
  private player!: Player;
  private platforms: Platform[] = [];
  private enemies: Enemy[] = [];
  private spirits: Spirit[] = [];
  
  // Game state
  private level: number = 1;
  private score: number = 0;
  private paused: boolean = false;
  private gameOver: boolean = false;
  private isTutorialLevel: boolean = true;
  
  // Systems
  private levelGenerator!: LevelGenerator;
  
  // Audio
  private bgMusic!: Phaser.Sound.BaseSound;
  
  constructor() {
    super({ key: SCENES.GAME });
  }
  
  init(data: { level?: number, score?: number }): void {
    // Initialize game state
    this.level = data.level || 1;
    this.score = data.score || 0;
    this.paused = false;
    this.gameOver = false;
    this.isTutorialLevel = this.level === 1;
    
    // Store game state in registry for access by other scenes
    this.registry.set('level', this.level);
    this.registry.set('score', this.score);
    this.registry.set('isTutorialLevel', this.isTutorialLevel);
    
    // Clear previous objects
    this.platforms = [];
    this.enemies = [];
    this.spirits = [];
  }
  
  create(): void {
    // Set world bounds
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    
    // Create background
    this.createBackground();
    
    // Create level generator
    this.levelGenerator = new LevelGenerator(this, GAME_WIDTH * 2, GAME_HEIGHT);
    
    // Generate level
    this.generateLevel();
    
    // Create player
    this.createPlayer();
    
    // Set up collision detection
    this.setupCollision();
    
    // Set up camera to follow player
    this.setupCamera();
    
    // Start background music
    this.bgMusic = this.sound.add('music-game', { volume: 0.3, loop: true });
    this.bgMusic.play();
    
    // Set up event listeners
    this.setupEvents();
    
    // Start UI scene
    this.scene.launch(SCENES.UI);
    
    // Emit level start event
    this.events.emit(EVENTS.LEVEL_COMPLETE, this.level - 1, this.score);
  }
  
  update(time: number, delta: number): void {
    // Skip updates if game is paused or over
    if (this.paused || this.gameOver) {
      return;
    }
    
    // Update player
    if (this.player) {
      this.player.update(time, delta);
    }
    
    // Update enemies
    this.enemies.forEach(enemy => {
      enemy.update(time, delta);
      
      // Make enemies target player if close enough
      if (Math.abs(enemy.x - this.player.x) < 400) {
        enemy.setTarget(this.player.x);
      } else {
        enemy.clearTarget();
      }
    });
    
    // Update spirits
    this.spirits.forEach(spirit => {
      spirit.update(time, delta);
    });
    
    // Update platforms with particle effects
    this.platforms.forEach(platform => {
      platform.update();
    });
    
    // Check if player has reached the end of the level
    if (this.player.x > GAME_WIDTH * 1.9) {
      this.completeLevel();
    }
    
    // Check if player has fallen off the world
    if (this.player.y > GAME_HEIGHT + 100) {
      this.events.emit(EVENTS.GAME_OVER);
    }
  }
  
  private createBackground(): void {
    // Create a parallax background
    const bg = this.add.tileSprite(0, 0, GAME_WIDTH * 2, GAME_HEIGHT, 'background');
    bg.setOrigin(0, 0);
    bg.setScrollFactor(0.1); // Parallax effect
    
    // Add stars or other decorative elements
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH * 2);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      
      const star = this.add.circle(x, y, size, 0xffffff, alpha);
      star.setScrollFactor(0.2); // Stars move a bit with camera
    }
  }
  
  private generateLevel(): void {
    // Use level generator to create the level
    if (this.isTutorialLevel) {
      const { platforms, enemies, spirits } = this.levelGenerator.generateTutorialLevel();
      this.platforms = platforms;
      this.enemies = enemies;
      this.spirits = spirits;
    } else {
      const { platforms, enemies, spirits } = this.levelGenerator.generateLevel();
      this.platforms = platforms;
      this.enemies = enemies;
      this.spirits = spirits;
    }
  }
  
  private createPlayer(): void {
    // Create player at level start
    this.player = new Player(this, 100, GAME_HEIGHT - 200);
    
    // Set initial state from registry if resuming game
    const savedElement = this.registry.get('currentElement');
    if (savedElement) {
      this.player.changeElement(savedElement);
    }
  }
  
  private setupCollision(): void {
    // Player and platforms
    this.physics.add.collider(this.player, this.platforms, this.handlePlayerPlatformCollision, this.checkPlayerPlatformCollision, this);
    
    // Enemies and platforms
    this.physics.add.collider(this.enemies, this.platforms);
    
    // Player and enemies
    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, undefined, this);
    
    // Player and spirits
    this.physics.add.overlap(this.player, this.spirits, this.handlePlayerSpiritCollision, undefined, this);
    
    // Player projectiles and enemies
    this.physics.add.overlap(this.player.getProjectiles(), this.enemies, this.handleProjectileEnemyCollision, undefined, this);
    
    // Player projectiles and platforms
    this.physics.add.collider(this.player.getProjectiles(), this.platforms, this.handleProjectilePlatformCollision, this.checkProjectilePlatformCollision, this);
  }
  
  private handlePlayerPlatformCollision(player: Player, platform: Platform): void {
    // Handle player landing on platforms
  }
  
  private checkPlayerPlatformCollision(player: any, platform: any): boolean {
    // Special handling for one-way platforms
    const platformObj = platform as Platform;
    
    if (platformObj.getCanPassThrough()) {
      // Allow passing through from below
      return player.body.velocity.y <= 0 || player.body.y + player.body.height <= platform.body.y + 5;
    }
    
    return true;
  }
  
  private handlePlayerEnemyCollision(player: any, enemy: any): void {
    const playerObj = player as Player;
    const enemyObj = enemy as Enemy;
    
    // Calculate damage based on enemy
    const damage = enemyObj.getDamage();
    
    // Player takes damage
    playerObj.takeDamage(damage);
  }
  
  private handlePlayerSpiritCollision(player: any, spirit: any): void {
    const playerObj = player as Player;
    const spiritObj = spirit as Spirit;
    
    // Skip if already collected
    if (spiritObj.isCollected()) {
      return;
    }
    
    // Collect the spirit
    spiritObj.collect();
    
    // Change player's element to match the collected spirit
    playerObj.changeElement(spiritObj.getElement());
    
    // Give player a small health boost
    playerObj.heal(10);
    
    // Refill some energy
    playerObj.addEnergy(30);
    
    // Award points
    this.score += 50;
    this.registry.set('score', this.score);
    this.events.emit(EVENTS.SCORE_CHANGE, this.score);
  }
  
  private handleProjectileEnemyCollision(projectile: any, enemy: any): void {
    const projectileObj = projectile as Projectile;
    const enemyObj = enemy as Enemy;
    
    // Skip if projectile is not active
    if (!projectileObj.isActive()) {
      return;
    }
    
    // Calculate damage with elemental multipliers
    const baseDamage = projectileObj.getDamage();
    const attackElement = projectileObj.getElement();
    const defenseElement = enemyObj.getElement();
    
    const damageMultiplier = calculateElementalMultiplier(attackElement, defenseElement);
    const finalDamage = baseDamage * damageMultiplier;
    
    // Apply damage to enemy
    enemyObj.takeDamage(finalDamage, attackElement);
    
    // Deactivate projectile
    projectileObj.onHit();
    
    // Award points if enemy is defeated
    if (enemyObj.getHealth() <= 0) {
      this.score += 10;
      this.registry.set('score', this.score);
      this.events.emit(EVENTS.SCORE_CHANGE, this.score);
    }
  }
  
  private handleProjectilePlatformCollision(projectile: any, platform: any): void {
    const projectileObj = projectile as Projectile;
    
    // Skip if projectile is not active
    if (!projectileObj.isActive()) {
      return;
    }
    
    // Trigger hit effect
    projectileObj.onHit();
  }
  
  private checkProjectilePlatformCollision(projectile: any, platform: any): boolean {
    const platformObj = platform as Platform;
    
    // Don't collide with pass-through platforms
    return !platformObj.getCanPassThrough();
  }
  
  private setupCamera(): void {
    // Set camera bounds
    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    
    // Have camera follow player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    
    // Add a slight lerp for smoother camera movement
    this.cameras.main.followOffset.set(-200, 0);
  }
  
  private setupEvents(): void {
    // Listen for pause event
    this.events.on(EVENTS.PAUSE_GAME, this.pauseGame, this);
    
    // Listen for resume event
    this.events.on(EVENTS.RESUME_GAME, this.resumeGame, this);
    
    // Listen for game over event
    this.events.on(EVENTS.GAME_OVER, this.handleGameOver, this);
    
    // Clean up when scene shuts down
    this.events.once('shutdown', () => {
      this.events.off(EVENTS.PAUSE_GAME, this.pauseGame, this);
      this.events.off(EVENTS.RESUME_GAME, this.resumeGame, this);
      this.events.off(EVENTS.GAME_OVER, this.handleGameOver, this);
      
      // Stop the music
      if (this.bgMusic && this.bgMusic.isPlaying) {
        this.bgMusic.stop();
      }
    });
  }
  
  public pauseGame(): void {
    // Set paused flag
    this.paused = true;
    
    // Pause physics
    this.physics.pause();
    
    // Launch pause scene
    this.scene.launch(SCENES.PAUSE);
    
    // Pause game scene
    this.scene.pause();
  }
  
  public resumeGame(): void {
    // Clear paused flag
    this.paused = false;
    
    // Resume physics
    this.physics.resume();
  }
  
  private handleGameOver(): void {
    // Set game over flag
    this.gameOver = true;
    
    // Pause physics
    this.physics.pause();
    
    // Stop background music
    if (this.bgMusic && this.bgMusic.isPlaying) {
      this.bgMusic.stop();
    }
    
    // Play death sound
    this.sound.play('death');
    
    // Launch game over scene
    this.scene.launch(SCENES.GAME_OVER, { score: this.score, level: this.level });
    
    // Pause game scene
    this.scene.pause();
  }
  
  private completeLevel(): void {
    // Play level complete sound
    this.sound.play('level-complete');
    
    // Save current state
    this.registry.set('level', this.level + 1);
    this.registry.set('score', this.score);
    this.registry.set('currentElement', this.player.getCurrentElement());
    
    // Emit level complete event
    this.events.emit(EVENTS.LEVEL_COMPLETE, this.level, this.score);
    
    // Restart scene with next level
    this.scene.restart({
      level: this.level + 1,
      score: this.score
    });
}
}