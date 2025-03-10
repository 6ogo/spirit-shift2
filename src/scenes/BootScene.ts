import Phaser from 'phaser';
import { SCENES } from '../utils/constants';

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload(): void {
    // Update loading progress
    this.load.on('progress', (value: number) => {
      if (window.updateLoadingProgress) {
        window.updateLoadingProgress(value * 100);
      }
    });

    this.load.on('complete', () => {
      if (window.hideLoadingScreen) {
        window.hideLoadingScreen();
      }
    });

    // Load sprite sheets
    this.load.spritesheet('player', 'assets/sprites/player.png', { 
      frameWidth: 64, 
      frameHeight: 64 
    });
    
    this.load.spritesheet('enemy', 'assets/sprites/enemy.png', { 
      frameWidth: 48, 
      frameHeight: 48 
    });
    
    this.load.spritesheet('spirit', 'assets/sprites/spirit.png', { 
      frameWidth: 32, 
      frameHeight: 32 
    });
    
    this.load.spritesheet('projectile', 'assets/sprites/projectile.png', { 
      frameWidth: 16, 
      frameHeight: 16 
    });
    
    // Load images
    this.load.image('platform', 'assets/sprites/platform.png');
    this.load.image('background', 'assets/backgrounds/background.png');
    this.load.image('particle', 'assets/sprites/particle.png');
    this.load.image('logo', 'assets/sprites/logo.png');
    
    // Load audio
    this.load.audio('music-menu', 'assets/audio/menu-music.mp3');
    this.load.audio('music-game', 'assets/audio/game-music.mp3');
    this.load.audio('jump', 'assets/audio/jump.wav');
    this.load.audio('shoot', 'assets/audio/shoot.wav');
    this.load.audio('hit', 'assets/audio/hit.wav');
    this.load.audio('collect', 'assets/audio/collect.wav');
    this.load.audio('switch-element', 'assets/audio/switch-element.wav');
    this.load.audio('death', 'assets/audio/death.wav');
    this.load.audio('level-complete', 'assets/audio/level-complete.wav');
    
    // Load UI elements
    this.load.image('button', 'assets/ui/button.png');
    this.load.image('button-hover', 'assets/ui/button-hover.png');
    this.load.image('health-bar', 'assets/ui/health-bar.png');
    this.load.image('energy-bar', 'assets/ui/energy-bar.png');
    this.load.image('element-icon-spirit', 'assets/ui/element-spirit.png');
    this.load.image('element-icon-fire', 'assets/ui/element-fire.png');
    this.load.image('element-icon-water', 'assets/ui/element-water.png');
    this.load.image('element-icon-earth', 'assets/ui/element-earth.png');
    this.load.image('element-icon-air', 'assets/ui/element-air.png');
    
    // Load fonts
    this.load.bitmapFont('pixel-font', 'assets/fonts/pixel.png', 'assets/fonts/pixel.xml');
  }

  create(): void {
    // Create animations
    
    // Player animations
    this.createPlayerAnimations();
    
    // Enemy animations
    this.createEnemyAnimations();
    
    // Spirit animations
    this.createSpiritAnimations();
    
    // Projectile animations
    this.createProjectileAnimations();
    
    // Start the main menu scene
    this.scene.start(SCENES.MAIN_MENU);
  }
  
  private createPlayerAnimations(): void {
    // Spirit animations
    this.anims.create({
      key: 'player-spirit-idle',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    
    this.anims.create({
      key: 'player-spirit-run',
      frames: this.anims.generateFrameNumbers('player', { start: 4, end: 9 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'player-spirit-jump',
      frames: this.anims.generateFrameNumbers('player', { start: 10, end: 12 }),
      frameRate: 8,
      repeat: 0
    });
    
    this.anims.create({
      key: 'player-spirit-duck',
      frames: this.anims.generateFrameNumbers('player', { start: 13, end: 13 }),
      frameRate: 1,
      repeat: 0
    });
    
    // Fire animations
    this.anims.create({
      key: 'player-fire-idle',
      frames: this.anims.generateFrameNumbers('player', { start: 16, end: 19 }),
      frameRate: 8,
      repeat: -1
    });
    
    this.anims.create({
      key: 'player-fire-run',
      frames: this.anims.generateFrameNumbers('player', { start: 20, end: 25 }),
      frameRate: 12,
      repeat: -1
    });
    
    this.anims.create({
      key: 'player-fire-jump',
      frames: this.anims.generateFrameNumbers('player', { start: 26, end: 28 }),
      frameRate: 8,
      repeat: 0
    });
    
    this.anims.create({
      key: 'player-fire-duck',
      frames: this.anims.generateFrameNumbers('player', { start: 29, end: 29 }),
      frameRate: 1,
      repeat: 0
    });
    
    // Water animations
    this.anims.create({
      key: 'player-water-idle',
      frames: this.anims.generateFrameNumbers('player', { start: 32, end: 35 }),
      frameRate: 6,
      repeat: -1
    });
    
    this.anims.create({
      key: 'player-water-run',
      frames: this.anims.generateFrameNumbers('player', { start: 36, end: 41 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'player-water-jump',
      frames: this.anims.generateFrameNumbers('player', { start: 42, end: 44 }),
      frameRate: 8,
      repeat: 0
    });
    
    this.anims.create({
      key: 'player-water-duck',
      frames: this.anims.generateFrameNumbers('player', { start: 45, end: 45 }),
      frameRate: 1,
      repeat: 0
    });
    
    // Earth animations
    this.anims.create({
      key: 'player-earth-idle',
      frames: this.anims.generateFrameNumbers('player', { start: 48, end: 51 }),
      frameRate: 6,
      repeat: -1
    });
    
    this.anims.create({
      key: 'player-earth-run',
      frames: this.anims.generateFrameNumbers('player', { start: 52, end: 57 }),
      frameRate: 8,
      repeat: -1
    });
    
    this.anims.create({
      key: 'player-earth-jump',
      frames: this.anims.generateFrameNumbers('player', { start: 58, end: 60 }),
      frameRate: 8,
      repeat: 0
    });
    
    this.anims.create({
      key: 'player-earth-duck',
      frames: this.anims.generateFrameNumbers('player', { start: 61, end: 61 }),
      frameRate: 1,
      repeat: 0
    });
    
    // Air animations
    this.anims.create({
      key: 'player-air-idle',
      frames: this.anims.generateFrameNumbers('player', { start: 64, end: 67 }),
      frameRate: 8,
      repeat: -1
    });
    
    this.anims.create({
      key: 'player-air-run',
      frames: this.anims.generateFrameNumbers('player', { start: 68, end: 73 }),
      frameRate: 12,
      repeat: -1
    });
    
    this.anims.create({
      key: 'player-air-jump',
      frames: this.anims.generateFrameNumbers('player', { start: 74, end: 76 }),
      frameRate: 8,
      repeat: 0
    });
    
    this.anims.create({
      key: 'player-air-duck',
      frames: this.anims.generateFrameNumbers('player', { start: 77, end: 77 }),
      frameRate: 1,
      repeat: 0
    });
  }
  
  private createEnemyAnimations(): void {
    // Spirit enemy
    this.anims.create({
      key: 'enemy-spirit-move',
      frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Fire enemy
    this.anims.create({
      key: 'enemy-fire-move',
      frames: this.anims.generateFrameNumbers('enemy', { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Water enemy
    this.anims.create({
      key: 'enemy-water-move',
      frames: this.anims.generateFrameNumbers('enemy', { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Earth enemy
    this.anims.create({
      key: 'enemy-earth-move',
      frames: this.anims.generateFrameNumbers('enemy', { start: 12, end: 15 }),
      frameRate: 6,
      repeat: -1
    });
    
    // Air enemy
    this.anims.create({
      key: 'enemy-air-move',
      frames: this.anims.generateFrameNumbers('enemy', { start: 16, end: 19 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Enemy death animations
    this.anims.create({
      key: 'enemy-death',
      frames: this.anims.generateFrameNumbers('enemy', { start: 20, end: 23 }),
      frameRate: 10,
      repeat: 0
    });
  }
  
  private createSpiritAnimations(): void {
    // Spirit collectibles
    this.anims.create({
      key: 'spirit-idle',
      frames: this.anims.generateFrameNumbers('spirit', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1
    });
    
    this.anims.create({
      key: 'fire-idle',
      frames: this.anims.generateFrameNumbers('spirit', { start: 6, end: 11 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'water-idle',
      frames: this.anims.generateFrameNumbers('spirit', { start: 12, end: 17 }),
      frameRate: 8,
      repeat: -1
    });
    
    this.anims.create({
      key: 'earth-idle',
      frames: this.anims.generateFrameNumbers('spirit', { start: 18, end: 23 }),
      frameRate: 6,
      repeat: -1
    });
    
    this.anims.create({
      key: 'air-idle',
      frames: this.anims.generateFrameNumbers('spirit', { start: 24, end: 29 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Spirit collection animation
    this.anims.create({
      key: 'spirit-collect',
      frames: this.anims.generateFrameNumbers('spirit', { start: 30, end: 35 }),
      frameRate: 15,
      repeat: 0
    });
  }
  
  private createProjectileAnimations(): void {
    // Projectile animations for each element
    this.anims.create({
      key: 'projectile-spirit',
      frames: this.anims.generateFrameNumbers('projectile', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'projectile-fire',
      frames: this.anims.generateFrameNumbers('projectile', { start: 4, end: 7 }),
      frameRate: 12,
      repeat: -1
    });
    
    this.anims.create({
      key: 'projectile-water',
      frames: this.anims.generateFrameNumbers('projectile', { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'projectile-earth',
      frames: this.anims.generateFrameNumbers('projectile', { start: 12, end: 15 }),
      frameRate: 8,
      repeat: -1
    });
    
    this.anims.create({
      key: 'projectile-air',
      frames: this.anims.generateFrameNumbers('projectile', { start: 16, end: 19 }),
      frameRate: 14,
      repeat: -1
    });
    
    // Impact animations
    this.anims.create({
      key: 'impact',
      frames: this.anims.generateFrameNumbers('projectile', { start: 20, end: 23 }),
      frameRate: 20,
      repeat: 0
    });
  }
}