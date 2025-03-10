// GameOverScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { SCENES, STORAGE_KEYS } from '../utils/constants';
import { loadGame, saveGame } from '../utils/helpers';

export default class GameOverScene extends Phaser.Scene {
  // UI elements
  private retryButton!: Phaser.GameObjects.Text;
  private quitButton!: Phaser.GameObjects.Text;
  
  // Game state
  private score: number = 0;
  private level: number = 1;
  private highScore: number = 0;
  
  constructor() {
    super({ key: SCENES.GAME_OVER });
  }
  
  init(data: { score?: number, level?: number }): void {
    // Get score and level from data or registry
    this.score = data.score ?? this.registry.get('score') ?? 0;
    this.level = data.level ?? this.registry.get('level') ?? 1;
    
    // Get high score from local storage
    const savedHighScore = loadGame(STORAGE_KEYS.HIGH_SCORE);
    this.highScore = savedHighScore ?? 0;
    
    // Update high score if needed
    if (this.score > this.highScore) {
      this.highScore = this.score;
      saveGame(this.highScore, STORAGE_KEYS.HIGH_SCORE);
    }
  }
  
  create(): void {
    // Create dark overlay
    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);
    overlay.setOrigin(0, 0);
    
    // Create game over panel
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 500, 400, 0x220000, 0.9);
    panel.setStrokeStyle(4, 0xff0000, 0.7);
    
    // Create title text
    const titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 150, 'GAME OVER', {
      fontFamily: 'Arial',
      fontSize: '64px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    });
    titleText.setOrigin(0.5, 0.5);
    
    // Create score text
    const scoreText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, `Score: ${this.score}`, {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff'
    });
    scoreText.setOrigin(0.5, 0.5);
    
    // Create level text
    const levelText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, `Level Reached: ${this.level}`, {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff'
    });
    levelText.setOrigin(0.5, 0.5);
    
    // Create high score text
    const highScoreText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, `High Score: ${this.highScore}`, {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffff00'
    });
    highScoreText.setOrigin(0.5, 0.5);
    
    // Highlight if new high score
    if (this.score >= this.highScore) {
      const newHighScoreText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 'NEW HIGH SCORE!', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffff00',
        fontStyle: 'bold'
      });
      newHighScoreText.setOrigin(0.5, 0.5);
      
      // Add pulsing animation to new high score text
      this.tweens.add({
        targets: newHighScoreText,
        scale: { from: 1, to: 1.2 },
        alpha: { from: 1, to: 0.8 },
        duration: 800,
        yoyo: true,
        repeat: -1
      });
    }
    
    // Create buttons
    this.retryButton = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, 'TRY AGAIN', () => {
      this.retryLevel();
    });
    
    this.quitButton = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 150, 'QUIT TO MENU', () => {
      this.quitToMenu();
    });
    
    // Create particles for game over effect
    this.createParticleEffect();
  }
  
  private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#550000',
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
    });
    
    button.on('pointerout', () => {
      button.setStyle({ color: '#ffffff' });
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
      this.sound.play('collect', { volume: 0.3 });
      
      this.tweens.add({
        targets: button,
        scale: 1,
        duration: 100,
        onComplete: () => {
          callback();
        }
      });
    });
    
    return button;
  }
  
  private createParticleEffect(): void {
    // Create particles emitter
    const particles = this.add.particles(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, 'particle', {
      speed: 100,
      lifespan: 3000,
      quantity: 1,
      scale: { start: 1, end: 0 },
      emitting: true,
      blendMode: 'ADD',
      frequency: 50
    });
    
    // Configure particles
    particles.createEmitter({
      speed: { min: 50, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1000,
      frequency: 50,
      tint: [0xff0000, 0xff6600, 0xffff00]
    });
  }
  
  private retryLevel(): void {
    // Stop all active scenes
    this.scene.stop(SCENES.GAME);
    this.scene.stop(SCENES.UI);
    this.scene.stop();
    
    // Start game scene with same level but reset score
    this.scene.start(SCENES.GAME, {
      level: this.level,
      score: 0
    });
  }
  
  private quitToMenu(): void {
    // Stop all active scenes
    this.scene.stop(SCENES.GAME);
    this.scene.stop(SCENES.UI);
    this.scene.stop();
    
    // Start main menu
    this.scene.start(SCENES.MAIN_MENU);
  }
}