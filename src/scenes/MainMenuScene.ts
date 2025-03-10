import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ElementType, ELEMENT_COLORS } from '../config';
import { SCENES, STORAGE_KEYS } from '../utils/constants';
import { loadGame } from '../utils/helpers';

export default class MainMenuScene extends Phaser.Scene {
  // UI elements
  private logo!: Phaser.GameObjects.Image;
  private playButton!: Phaser.GameObjects.Text;
  private continueButton!: Phaser.GameObjects.Text;
  private settingsButton!: Phaser.GameObjects.Text;
  private aboutButton!: Phaser.GameObjects.Text;
  
  // Particle effects
  private particles!: Phaser.GameObjects.Particles.ParticleEmitterManager;
  
  // Background elements
  private spiritOrbs: Phaser.GameObjects.Sprite[] = [];
  
  // Audio
  private bgMusic!: Phaser.Sound.BaseSound;
  
  // Game state
  private hasSaveGame: boolean = false;
  
  constructor() {
    super({ key: SCENES.MAIN_MENU });
  }
  
  create(): void {
    // Check for saved game
    const savedGame = loadGame(STORAGE_KEYS.SAVE_DATA);
    this.hasSaveGame = !!savedGame;
    
    // Create background
    this.createBackground();
    
    // Create animated spirit orbs
    this.createSpiritOrbs();
    
    // Create UI
    this.createUI();
    
    // Start background music
    this.bgMusic = this.sound.add('music-menu', { volume: 0.4, loop: true });
    this.bgMusic.play();
  }
  
  update(time: number, delta: number): void {
    // Animate spirit orbs
    this.updateSpiritOrbs(time, delta);
  }
  
  private createBackground(): void {
    // Create a starry background
    const bg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000);
    bg.setOrigin(0, 0);
    
    // Add stars
    this.particles = this.add.particles('particle');
    
    // Background stars (small, slow)
    this.particles.createEmitter({
      x: { min: 0, max: GAME_WIDTH },
      y: { min: 0, max: GAME_HEIGHT },
      scale: { start: 0.1, end: 0.1 },
      alpha: { start: 0.5, end: 0.2 },
      speed: 0,
      lifespan: 10000,
      quantity: 1,
      frequency: 200,
      blendMode: 'ADD',
      tint: 0xFFFFFF
    });
    
    // Foreground stars (larger, twinkling)
    this.particles.createEmitter({
      x: { min: 0, max: GAME_WIDTH },
      y: { min: 0, max: GAME_HEIGHT },
      scale: { start: 0.2, end: 0.2 },
      alpha: { start: 0.8, end: 0.1 },
      speed: 0,
      lifespan: 3000,
      quantity: 1,
      frequency: 500,
      blendMode: 'ADD',
      tint: 0xFFFFFF
    });
    
    // Create nebula effect
    const nebula1 = this.add.ellipse(GAME_WIDTH * 0.2, GAME_HEIGHT * 0.7, 600, 400, 0x4400AA, 0.2);
    const nebula2 = this.add.ellipse(GAME_WIDTH * 0.8, GAME_HEIGHT * 0.3, 500, 300, 0x0066AA, 0.2);
    
    // Add blur filter if supported
    if (this.renderer.pipelines) {
      try {
        nebula1.setBlendMode(Phaser.BlendModes.ADD);
        nebula2.setBlendMode(Phaser.BlendModes.ADD);
      } catch (e) {
        console.warn('Blend modes not fully supported');
      }
    }
  }
  
  private createSpiritOrbs(): void {
    // Create animated spirit orbs for each element
    const elements = [
      ElementType.SPIRIT,
      ElementType.FIRE,
      ElementType.WATER,
      ElementType.EARTH,
      ElementType.AIR
    ];
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const angle = (i / elements.length) * Math.PI * 2;
      
      // Calculate position in a circle around the center
      const radius = 250;
      const x = GAME_WIDTH / 2 + Math.cos(angle) * radius;
      const y = GAME_HEIGHT / 2 + Math.sin(angle) * radius;
      
      // Create spirit orb
      const orb = this.add.sprite(x, y, 'spirit');
      orb.setScale(2);
      orb.play(`${element}-idle`);
      
      // Add glow effect
      const glow = this.add.sprite(x, y, 'particle');
      glow.setScale(6);
      glow.setAlpha(0.7);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setTint(ELEMENT_COLORS[element]);
      
      // Add to spirit orbs array
      this.spiritOrbs.push(orb);
      this.spiritOrbs.push(glow);
      
      // Create orbit data
      orb.setData('angle', angle);
      orb.setData('radius', radius);
      orb.setData('speed', 0.0002 + Math.random() * 0.0003);
      orb.setData('glow', glow);
      
      // Create particle effect for each orb
      const orbParticles = this.particles.createEmitter({
        x: x,
        y: y,
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.5, end: 0 },
        speed: 20,
        angle: { min: 0, max: 360 },
        lifespan: 1000,
        quantity: 1,
        frequency: 200,
        blendMode: 'ADD',
        tint: ELEMENT_COLORS[element]
      });
      
      // Store particles reference
      orb.setData('particles', orbParticles);
    }
  }
  
  private updateSpiritOrbs(time: number, delta: number): void {
    // Update spirit orb positions
    for (let i = 0; i < this.spiritOrbs.length; i += 2) {
      const orb = this.spiritOrbs[i];
      const glow = orb.getData('glow');
      const particles = orb.getData('particles');
      
      // Update orbit angle
      let angle = orb.getData('angle');
      const speed = orb.getData('speed');
      const radius = orb.getData('radius');
      
      angle += speed * delta;
      orb.setData('angle', angle);
      
      // Calculate new position
      const x = GAME_WIDTH / 2 + Math.cos(angle) * radius;
      const y = GAME_HEIGHT / 2 + Math.sin(angle) * radius;
      
      // Update position
      orb.x = x;
      orb.y = y;
      glow.x = x;
      glow.y = y;
      
      // Update particle emitter position
      if (particles) {
        particles.setPosition(x, y);
      }
    }
  }
  
  private createUI(): void {
    // Create logo
    this.logo = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT * 0.2, 'logo');
    this.logo.setScale(0.8);
    
    // Create title text
    const titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, 'SPIRIT SHIFT', {
      fontFamily: 'Arial',
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    });
    titleText.setOrigin(0.5, 0.5);
    
    // Add subtitle
    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.36, 'Possess. Adapt. Conquer.', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#cccccc',
      stroke: '#000000',
      strokeThickness: 2
    });
    subtitle.setOrigin(0.5, 0.5);
    
    // Create buttons container
    const buttonsContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT * 0.6);
    
    // Play button
    this.playButton = this.createButton(0, 0, 'New Game', () => {
      // Start new game
      this.startNewGame();
    });
    buttonsContainer.add(this.playButton);
    
    // Continue button (only if save game exists)
    if (this.hasSaveGame) {
      this.continueButton = this.createButton(0, 60, 'Continue', () => {
        // Continue saved game
        this.continueSavedGame();
      });
      buttonsContainer.add(this.continueButton);
    }
    
    // Settings button
    this.settingsButton = this.createButton(0, this.hasSaveGame ? 120 : 60, 'Settings', () => {
      // Show settings
      console.log('Settings button clicked');
      // This would open settings menu in a full implementation
    });
    buttonsContainer.add(this.settingsButton);
    
    // About button
    this.aboutButton = this.createButton(0, this.hasSaveGame ? 180 : 120, 'About', () => {
      // Show about
      console.log('About button clicked');
      // This would show about info in a full implementation
    });
    buttonsContainer.add(this.aboutButton);
    
    // Add version text
    const versionText = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 20, 'v1.0.0', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#999999'
    });
    versionText.setOrigin(1, 1);
    
    // Add animation to buttons
    this.tweens.add({
      targets: buttonsContainer,
      y: GAME_HEIGHT * 0.6 + 10,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }
  
  private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      padding: {
        x: 20,
        y: 10
      }
    });
    
    button.setOrigin(0.5, 0.5);
    button.setInteractive({ useHandCursor: true });
    
    // Hover effect
    button.on('pointerover', () => {
      button.setStyle({ color: '#ffff00' });
      this.tweens.add({
        targets: button,
        scale: 1.1,
        duration: 100
      });
    });
    
    button.on('pointerout', () => {
      button.setStyle({ color: '#ffffff' });
      this.tweens.add({
        targets: button,
        scale: 1,
        duration: 100
      });
    });
    
    // Click effect
    button.on('pointerdown', () => {
      button.setStyle({ color: '#ff8800' });
      this.tweens.add({
        targets: button,
        scale: 0.95,
        duration: 100
      });
    });
    
    button.on('pointerup', () => {
      button.setStyle({ color: '#ffff00' });
      this.sound.play('collect');
      
      this.tweens.add({
        targets: button,
        scale: 1.1,
        duration: 100,
        onComplete: () => {
          callback();
        }
      });
    });
    
    return button;
  }
  
  private startNewGame(): void {
    // Stop background music
    if (this.bgMusic && this.bgMusic.isPlaying) {
      this.bgMusic.stop();
    }
    
    // Reset game state
    this.registry.set('level', 1);
    this.registry.set('score', 0);
    this.registry.set('currentElement', ElementType.SPIRIT);
    
    // Start tutorial level
    this.scene.start(SCENES.TUTORIAL);
  }
  
  private continueSavedGame(): void {
    // Load saved game
    const savedGame = loadGame(STORAGE_KEYS.SAVE_DATA);
    
    if (!savedGame) {
      // Fallback to new game if save data is corrupted
      this.startNewGame();
      return;
    }
    
    // Stop background music
    if (this.bgMusic && this.bgMusic.isPlaying) {
      this.bgMusic.stop();
    }
    
    // Set game state from saved data
    this.registry.set('level', savedGame.level);
    this.registry.set('score', savedGame.score);
    this.registry.set('currentElement', savedGame.currentElement);
    
    // Start game at saved level
    this.scene.start(SCENES.GAME, {
      level: savedGame.level,
      score: savedGame.score
    });
  }
}