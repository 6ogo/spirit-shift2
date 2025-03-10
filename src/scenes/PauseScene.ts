// PauseScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { SCENES, EVENTS, STORAGE_KEYS } from '../utils/constants';
import { createSaveData, saveGame } from '../utils/helpers';

export default class PauseScene extends Phaser.Scene {
  // UI elements
  private resumeButton!: Phaser.GameObjects.Text;
  private restartButton!: Phaser.GameObjects.Text;
  private saveButton!: Phaser.GameObjects.Text;
  private quitButton!: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: SCENES.PAUSE });
  }
  
  create(): void {
    // Get game state from registry
    const level = this.registry.get('level') || 1;
    const score = this.registry.get('score') || 0;
    const currentElement = this.registry.get('currentElement');
    
    // Create semi-transparent overlay
    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    
    // Create pause menu panel
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 400, 450, 0x111111, 0.9);
    panel.setStrokeStyle(2, 0xffffff, 0.8);
    
    // Create title text
    const titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 180, 'PAUSED', {
      fontFamily: 'Arial',
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    });
    titleText.setOrigin(0.5, 0.5);
    
    // Create game info
    const levelText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, `Level: ${level}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    });
    levelText.setOrigin(0.5, 0.5);
    
    const scoreText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, `Score: ${score}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    });
    scoreText.setOrigin(0.5, 0.5);
    
    // Create buttons
    this.resumeButton = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'RESUME', () => {
      this.resumeGame();
    });
    
    this.restartButton = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'RESTART LEVEL', () => {
      this.restartLevel();
    });
    
    this.saveButton = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 'SAVE GAME', () => {
      this.saveGame();
    });
    
    this.quitButton = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130, 'QUIT TO MENU', () => {
      this.quitToMenu();
    });
    
    // Add ESC key handler
    this.input.keyboard.on('keydown-ESC', () => {
      this.resumeGame();
    });
  }
  
  private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#333333',
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
  
  private resumeGame(): void {
    // Resume the game scene
    this.scene.resume(SCENES.GAME);
    
    // Emit resume event
    this.game.events.emit(EVENTS.RESUME_GAME);
    
    // Close this scene
    this.scene.stop();
  }
  
  private restartLevel(): void {
    // Get current level
    const level = this.registry.get('level') || 1;
    
    // Stop all active scenes
    this.scene.stop(SCENES.GAME);
    this.scene.stop(SCENES.UI);
    this.scene.stop();
    
    // Start game scene with same level but reset score
    this.scene.start(SCENES.GAME, {
      level: level,
      score: 0
    });
  }
  
  private saveGame(): void {
    // Get game state from registry
    const level = this.registry.get('level') || 1;
    const score = this.registry.get('score') || 0;
    const health = this.registry.get('health') || 100;
    const energy = this.registry.get('energy') || 100;
    const currentElement = this.registry.get('currentElement');
    const unlockedElements = this.registry.get('unlockedElements') || [
      'spirit', 'fire', 'water', 'earth', 'air'
    ];
    
    // Create save data
    const saveData = createSaveData(
      level,
      score,
      health,
      energy,
      currentElement,
      unlockedElements
    );
    
    // Save to local storage
    saveGame(saveData, STORAGE_KEYS.SAVE_DATA);
    
    // Show save confirmation
    this.saveButton.setText('GAME SAVED ✓');
    this.saveButton.setStyle({ color: '#00ff00' });
    
    // Reset button text after a delay
    this.time.delayedCall(2000, () => {
      this.saveButton.setText('SAVE GAME');
      this.saveButton.setStyle({ color: '#ffffff' });
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