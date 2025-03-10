import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ElementType, ELEMENT_COLORS, ELEMENT_NAMES } from '../config';
import { SCENES, EVENTS } from '../utils/constants';

export default class UIScene extends Phaser.Scene {
  // UI elements
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Graphics;
  private energyBar!: Phaser.GameObjects.Graphics;
  private elementIcons!: Map<ElementType, Phaser.GameObjects.Sprite>;
  private currentElementIndicator!: Phaser.GameObjects.Graphics;
  private pauseButton!: Phaser.GameObjects.Text;
  
  // Game state
  private score: number = 0;
  private level: number = 1;
  private health: number = 100;
  private maxHealth: number = 100;
  private energy: number = 100;
  private maxEnergy: number = 100;
  private currentElement: ElementType = ElementType.SPIRIT;
  
  constructor() {
    super({ key: SCENES.UI });
  }
  
  init(): void {
    // Get initial state from registry
    this.score = this.registry.get('score') || 0;
    this.level = this.registry.get('level') || 1;
    this.health = this.registry.get('health') || 100;
    this.maxHealth = this.registry.get('maxHealth') || 100;
    this.energy = this.registry.get('energy') || 100;
    this.maxEnergy = this.registry.get('maxEnergy') || 100;
    this.currentElement = this.registry.get('currentElement') || ElementType.SPIRIT;
  }
  
  create(): void {
    // Set this scene to be above the game scene
    this.scene.bringToTop();
    
    // Create UI elements
    this.createScoreAndLevel();
    this.createHealthAndEnergyBars();
    this.createElementSelector();
    this.createPauseButton();
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  private createScoreAndLevel(): void {
    // Create score text
    this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    // Create level text
    this.levelText = this.add.text(GAME_WIDTH - 20, 20, `Level: ${this.level}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.levelText.setOrigin(1, 0);
  }
  
  private createHealthAndEnergyBars(): void {
    // Create container
    const barsContainer = this.add.container(20, GAME_HEIGHT - 80);
    
    // Health bar label
    const healthLabel = this.add.text(0, 0, 'Health', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    });
    barsContainer.add(healthLabel);
    
    // Health bar background
    const healthBarBg = this.add.rectangle(0, 25, 200, 20, 0x000000, 0.8);
    healthBarBg.setOrigin(0, 0);
    barsContainer.add(healthBarBg);
    
    // Health bar
    this.healthBar = this.add.graphics();
    this.updateHealthBar();
    barsContainer.add(this.healthBar);
    
    // Energy bar label
    const energyLabel = this.add.text(0, 55, 'Energy', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    });
    barsContainer.add(energyLabel);
    
    // Energy bar background
    const energyBarBg = this.add.rectangle(0, 80, 200, 20, 0x000000, 0.8);
    energyBarBg.setOrigin(0, 0);
    barsContainer.add(energyBarBg);
    
    // Energy bar
    this.energyBar = this.add.graphics();
    this.updateEnergyBar();
    barsContainer.add(this.energyBar);
  }
  
  private createElementSelector(): void {
    // Create element selector at bottom center
    const selectorContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 70);
    
    // Element icons with their respective colors
    this.elementIcons = new Map<ElementType, Phaser.GameObjects.Sprite>();
    
    // Create each element icon
    const elements = [
      ElementType.SPIRIT,
      ElementType.FIRE,
      ElementType.WATER,
      ElementType.EARTH,
      ElementType.AIR
    ];
    
    const iconSpacing = 70;
    const totalWidth = iconSpacing * (elements.length - 1);
    const startX = -totalWidth / 2;
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const x = startX + i * iconSpacing;
      
      // Icon background (circle)
      const iconBg = this.add.circle(x, 0, 25, 0x000000, 0.6);
      selectorContainer.add(iconBg);
      
      // Element icon
      const icon = this.add.sprite(x, 0, `element-icon-${element}`);
      icon.setScale(0.8);
      selectorContainer.add(icon);
      
      // Store icon reference
      this.elementIcons.set(element, icon);
      
      // Make icon interactive
      icon.setInteractive({ useHandCursor: true });
      
      // Add hover effect
      icon.on('pointerover', () => {
        this.tweens.add({
          targets: icon,
          scale: 1,
          duration: 100
        });
      });
      
      icon.on('pointerout', () => {
        if (this.currentElement !== element) {
          this.tweens.add({
            targets: icon,
            scale: 0.8,
            duration: 100
          });
        }
      });
      
      // Add click handler
      icon.on('pointerdown', () => {
        // Emit element change event to the game scene
        this.game.events.emit(EVENTS.PLAYER_ELEMENT_CHANGE, element);
      });
      
      // Add element name below icon
      const elementName = this.add.text(x, 35, ELEMENT_NAMES[element], {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      });
      elementName.setOrigin(0.5, 0.5);
      selectorContainer.add(elementName);
      
      // Add keyboard shortcut hint
      const keyHint = this.add.text(x, 50, `[${i + 1}]`, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#cccccc'
      });
      keyHint.setOrigin(0.5, 0.5);
      selectorContainer.add(keyHint);
    }
    
    // Create current element indicator
    this.currentElementIndicator = this.add.graphics();
    selectorContainer.add(this.currentElementIndicator);
    
    // Update indicator to show current element
    this.updateElementIndicator();
  }
  
  private createPauseButton(): void {
    // Create pause button at top right
    this.pauseButton = this.add.text(GAME_WIDTH - 20, 60, 'PAUSE', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: {
        x: 10,
        y: 5
      }
    });
    
    this.pauseButton.setOrigin(1, 0);
    this.pauseButton.setInteractive({ useHandCursor: true });
    
    // Add hover effect
    this.pauseButton.on('pointerover', () => {
      this.pauseButton.setStyle({ color: '#ffff00' });
    });
    
    this.pauseButton.on('pointerout', () => {
      this.pauseButton.setStyle({ color: '#ffffff' });
    });
    
    // Add click handler
    this.pauseButton.on('pointerup', () => {
      // Emit pause event to the game scene
      this.game.events.emit(EVENTS.PAUSE_GAME);
    });
  }
  
  private setupEventListeners(): void {
    // Listen for score changes
    this.game.events.on(EVENTS.SCORE_CHANGE, this.updateScore, this);
    
    // Listen for player damage
    this.game.events.on(EVENTS.PLAYER_DAMAGE, this.updateHealth, this);
    
    // Listen for player heal
    this.game.events.on(EVENTS.PLAYER_HEAL, this.updateHealth, this);
    
    // Listen for energy changes
    this.game.events.on(EVENTS.PLAYER_ENERGY_CHANGE, this.updateEnergy, this);
    
    // Listen for element changes
    this.game.events.on(EVENTS.PLAYER_ELEMENT_CHANGE, this.updateElement, this);
    
    // Listen for level complete
    this.game.events.on(EVENTS.LEVEL_COMPLETE, this.updateLevel, this);
    
    // Clean up when scene shuts down
    this.events.once('shutdown', () => {
      this.game.events.off(EVENTS.SCORE_CHANGE, this.updateScore, this);
      this.game.events.off(EVENTS.PLAYER_DAMAGE, this.updateHealth, this);
      this.game.events.off(EVENTS.PLAYER_HEAL, this.updateHealth, this);
      this.game.events.off(EVENTS.PLAYER_ENERGY_CHANGE, this.updateEnergy, this);
      this.game.events.off(EVENTS.PLAYER_ELEMENT_CHANGE, this.updateElement, this);
      this.game.events.off(EVENTS.LEVEL_COMPLETE, this.updateLevel, this);
    });
  }
  
  private updateScore(score: number): void {
    this.score = score;
    this.scoreText.setText(`Score: ${this.score}`);
    
    // Update registry
    this.registry.set('score', this.score);
  }
  
  private updateLevel(level: number, score: number): void {
    this.level = level;
    this.levelText.setText(`Level: ${this.level}`);
    
    // Update registry
    this.registry.set('level', this.level);
    
    // Also update score
    this.updateScore(score);
  }
  
  private updateHealth(health: number, maxHealth: number): void {
    this.health = health;
    this.maxHealth = maxHealth;
    
    // Update health bar
    this.updateHealthBar();
    
    // Update registry
    this.registry.set('health', this.health);
    this.registry.set('maxHealth', this.maxHealth);
  }
  
  private updateHealthBar(): void {
    // Clear previous graphics
    this.healthBar.clear();
    
    // Calculate health percentage
    const healthPercent = this.health / this.maxHealth;
    
    // Choose color based on health percentage
    let color = 0x00ff00; // Green for high health
    if (healthPercent < 0.3) {
      color = 0xff0000; // Red for low health
    } else if (healthPercent < 0.6) {
      color = 0xffff00; // Yellow for medium health
    }
    
    // Draw health bar
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(2, 27, 196 * healthPercent, 16);
  }
  
  private updateEnergy(energy: number, maxEnergy: number): void {
    this.energy = energy;
    this.maxEnergy = maxEnergy;
    
    // Update energy bar
    this.updateEnergyBar();
    
    // Update registry
    this.registry.set('energy', this.energy);
    this.registry.set('maxEnergy', this.maxEnergy);
  }
  
  private updateEnergyBar(): void {
    // Clear previous graphics
    this.energyBar.clear();
    
    // Calculate energy percentage
    const energyPercent = this.energy / this.maxEnergy;
    
    // Get color based on current element
    const color = ELEMENT_COLORS[this.currentElement];
    
    // Draw energy bar
    this.energyBar.fillStyle(color, 1);
    this.energyBar.fillRect(2, 82, 196 * energyPercent, 16);
  }
  
  private updateElement(element: ElementType): void {
    this.currentElement = element;
    
    // Update element indicator
    this.updateElementIndicator();
    
    // Update energy bar color
    this.updateEnergyBar();
    
    // Update registry
    this.registry.set('currentElement', this.currentElement);
  }
  
  private updateElementIndicator(): void {
    // Clear previous indicator
    this.currentElementIndicator.clear();
    
    // Get current element icon
    const currentIcon = this.elementIcons.get(this.currentElement);
    
    if (currentIcon) {
      // Make current element icon larger
      currentIcon.setScale(1);
      
      // Reset scale of other icons
      this.elementIcons.forEach((icon, element) => {
        if (element !== this.currentElement) {
          icon.setScale(0.8);
        }
      });
      
      // Draw glowing ring around current element
      const color = ELEMENT_COLORS[this.currentElement];
      
      this.currentElementIndicator.lineStyle(3, color, 1);
      this.currentElementIndicator.strokeCircle(currentIcon.x, currentIcon.y, 30);
    }
  }
}