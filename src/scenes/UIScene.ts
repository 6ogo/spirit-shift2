import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ElementType, ELEMENT_COLORS, ELEMENT_NAMES } from '../config';
import { SCENES, EVENTS } from '../utils/constants';

export default class UIScene extends Phaser.Scene {
    private scoreText!: Phaser.GameObjects.Text;
    private levelText!: Phaser.GameObjects.Text;
    private healthBar!: Phaser.GameObjects.Graphics;
    private energyBar!: Phaser.GameObjects.Graphics;
    private elementIcons!: Map<ElementType, Phaser.GameObjects.Sprite>;
    private currentElementIndicator!: Phaser.GameObjects.Graphics;
    private pauseButton!: Phaser.GameObjects.Text;

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
        this.score = this.registry.get('score') || 0;
        this.level = this.registry.get('level') || 1;
        this.health = this.registry.get('health') || 100;
        this.maxHealth = this.registry.get('maxHealth') || 100;
        this.energy = this.registry.get('energy') || 100;
        this.maxEnergy = this.registry.get('maxEnergy') || 100;
        this.currentElement = this.registry.get('currentElement') || ElementType.SPIRIT;
    }

    create(): void {
        this.scene.bringToTop();
        this.createScoreAndLevel();
        this.createHealthAndEnergyBars();
        this.createElementSelector();
        this.createPauseButton();
        this.setupEventListeners();
    }

    private createScoreAndLevel(): void {
        this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
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
        const barsContainer = this.add.container(20, GAME_HEIGHT - 80);
        barsContainer.add(this.add.text(0, 0, 'Health', { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' }));
        const healthBarBg = this.add.rectangle(0, 25, 200, 20, 0x000000, 0.8);
        healthBarBg.setOrigin(0, 0);
        barsContainer.add(healthBarBg);
        this.healthBar = this.add.graphics();
        this.updateHealthBar();
        barsContainer.add(this.healthBar);

        barsContainer.add(this.add.text(0, 55, 'Energy', { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' }));
        const energyBarBg = this.add.rectangle(0, 80, 200, 20, 0x000000, 0.8);
        energyBarBg.setOrigin(0, 0);
        barsContainer.add(energyBarBg);
        this.energyBar = this.add.graphics();
        this.updateEnergyBar();
        barsContainer.add(this.energyBar);
    }

    private createElementSelector(): void {
        const selectorContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 70);
        this.elementIcons = new Map<ElementType, Phaser.GameObjects.Sprite>();
        const elements = [ElementType.SPIRIT, ElementType.FIRE, ElementType.WATER, ElementType.EARTH, ElementType.AIR];
        const iconSpacing = 70;
        const totalWidth = iconSpacing * (elements.length - 1);
        const startX = -totalWidth / 2;

        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const x = startX + i * iconSpacing;

            const iconBg = this.add.circle(x, 0, 25, 0x000000, 0.6);
            selectorContainer.add(iconBg);

            const icon = this.add.sprite(x, 0, `element-icon-${element}`);
            icon.setScale(0.8);
            selectorContainer.add(icon);
            this.elementIcons.set(element, icon);

            icon.setInteractive({ useHandCursor: true });
            icon.on('pointerover', () => this.tweens.add({ targets: icon, scale: 1, duration: 100 }));
            icon.on('pointerout', () => {
                if (this.currentElement !== element) this.tweens.add({ targets: icon, scale: 0.8, duration: 100 });
            });
            icon.on('pointerdown', () => this.game.events.emit(EVENTS.PLAYER_ELEMENT_CHANGE, element));

            const elementName = this.add.text(x, 35, ELEMENT_NAMES[element], {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 1
            });
            elementName.setOrigin(0.5, 0.5);
            selectorContainer.add(elementName);

            const keyHint = this.add.text(x, 50, `[${i + 1}]`, { fontFamily: 'Arial', fontSize: '12px', color: '#cccccc' });
            keyHint.setOrigin(0.5, 0.5);
            selectorContainer.add(keyHint);
        }

        this.currentElementIndicator = this.add.graphics();
        selectorContainer.add(this.currentElementIndicator);
        this.updateElementIndicator();
    }

    private createPauseButton(): void {
        this.pauseButton = this.add.text(GAME_WIDTH - 20, 60, 'PAUSE', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        this.pauseButton.setOrigin(1, 0);
        this.pauseButton.setInteractive({ useHandCursor: true });
        this.pauseButton.on('pointerover', () => this.pauseButton.setStyle({ color: '#ffff00' }));
        this.pauseButton.on('pointerout', () => this.pauseButton.setStyle({ color: '#ffffff' }));
        this.pauseButton.on('pointerup', () => this.game.events.emit(EVENTS.PAUSE_GAME));
    }

    private setupEventListeners(): void {
        this.game.events.on(EVENTS.SCORE_CHANGE, this.updateScore, this);
        this.game.events.on(EVENTS.PLAYER_DAMAGE, this.updateHealth, this);
        this.game.events.on(EVENTS.PLAYER_HEAL, this.updateHealth, this);
        this.game.events.on(EVENTS.PLAYER_ENERGY_CHANGE, this.updateEnergy, this);
        this.game.events.on(EVENTS.PLAYER_ELEMENT_CHANGE, this.updateElement, this);
        this.game.events.on(EVENTS.LEVEL_COMPLETE, this.updateLevel, this);
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
        this.registry.set('score', this.score);
    }

    private updateLevel(level: number, score: number): void {
        this.level = level;
        this.levelText.setText(`Level: ${this.level}`);
        this.registry.set('level', this.level);
        this.updateScore(score);
    }

    private updateHealth(health: number, maxHealth: number): void {
        this.health = health;
        this.maxHealth = maxHealth;
        this.updateHealthBar();
        this.registry.set('health', this.health);
        this.registry.set('maxHealth', this.maxHealth);
    }

    private updateHealthBar(): void {
        this.healthBar.clear();
        const healthPercent = this.health / this.maxHealth;
        const color = healthPercent < 0.3 ? 0xff0000 : healthPercent < 0.6 ? 0xffff00 : 0x00ff00;
        this.healthBar.fillStyle(color, 1);
        this.healthBar.fillRect(2, 27, 196 * healthPercent, 16);
    }

    private updateEnergy(energy: number, maxEnergy: number): void {
        this.energy = energy;
        this.maxEnergy = maxEnergy;
        this.updateEnergyBar();
        this.registry.set('energy', this.energy);
        this.registry.set('maxEnergy', this.maxEnergy);
    }

    private updateEnergyBar(): void {
        this.energyBar.clear();
        const energyPercent = this.energy / this.maxEnergy;
        this.energyBar.fillStyle(ELEMENT_COLORS[this.currentElement], 1);
        this.energyBar.fillRect(2, 82, 196 * energyPercent, 16);
    }

    private updateElement(element: ElementType): void {
        this.currentElement = element;
        this.updateElementIndicator();
        this.updateEnergyBar();
        this.registry.set('currentElement', this.currentElement);
    }

    private updateElementIndicator(): void {
        this.currentElementIndicator.clear();
        const currentIcon = this.elementIcons.get(this.currentElement);
        if (currentIcon) {
            currentIcon.setScale(1);
            this.elementIcons.forEach((icon, element) => {
                if (element !== this.currentElement) icon.setScale(0.8);
            });
            this.currentElementIndicator.lineStyle(3, ELEMENT_COLORS[this.currentElement], 1);
            this.currentElementIndicator.strokeCircle(currentIcon.x, currentIcon.y, 30);
        }
    }
}