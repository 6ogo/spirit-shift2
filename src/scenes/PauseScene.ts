import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ElementType } from '../config';
import { SCENES, EVENTS, STORAGE_KEYS } from '../utils/constants';
import { createSaveData, saveGame } from '../utils/helpers';

export default class PauseScene extends Phaser.Scene {
    private resumeButton!: Phaser.GameObjects.Text;
    private restartButton!: Phaser.GameObjects.Text;
    private saveButton!: Phaser.GameObjects.Text;
    private quitButton!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: SCENES.PAUSE });
    }

    create(): void {
        const level = this.registry.get('level') || 1;
        const score = this.registry.get('score') || 0;
        const currentElement = this.registry.get('currentElement');

        const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
        overlay.setOrigin(0, 0);

        const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 400, 450, 0x111111, 0.9);
        panel.setStrokeStyle(2, 0xffffff, 0.8);

        const titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 180, 'PAUSED', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        });
        titleText.setOrigin(0.5, 0.5);

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

        this.resumeButton = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'RESUME', () => this.resumeGame());
        this.restartButton = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'RESTART LEVEL', () => this.restartLevel());
        this.saveButton = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 'SAVE GAME', () => this.saveGame());
        this.quitButton = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130, 'QUIT TO MENU', () => this.quitToMenu());

        this.input.keyboard.on('keydown-ESC', () => this.resumeGame());
    }

    private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Text {
        const button = this.add.text(x, y, text, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        });
        button.setOrigin(0.5, 0.5);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => button.setStyle({ color: '#ffff00' }));
        button.on('pointerout', () => button.setStyle({ color: '#ffffff' }));
        button.on('pointerdown', () => {
            button.setStyle({ color: '#ff8800' });
            this.tweens.add({ targets: button, scale: 0.95, duration: 100 });
        });
        button.on('pointerup', () => {
            button.setStyle({ color: '#ffff00' });
            this.sound.play('collect', { volume: 0.3 });
            this.tweens.add({ targets: button, scale: 1, duration: 100, onComplete: callback });
        });

        return button;
    }

    private resumeGame(): void {
        this.scene.resume(SCENES.GAME);
        this.game.events.emit(EVENTS.RESUME_GAME);
        this.scene.stop();
    }

    private restartLevel(): void {
        const level = this.registry.get('level') || 1;
        this.scene.stop(SCENES.GAME);
        this.scene.stop(SCENES.UI);
        this.scene.stop();
        this.scene.start(SCENES.GAME, { level: level, score: 0 });
    }

    private saveGame(): void {
        const level = this.registry.get('level') || 1;
        const score = this.registry.get('score') || 0;
        const health = this.registry.get('health') || 100;
        const energy = this.registry.get('energy') || 100;
        const currentElement = this.registry.get('currentElement') || ElementType.SPIRIT;
        const unlockedElements = this.registry.get('unlockedElements') || [ElementType.SPIRIT, ElementType.FIRE, ElementType.WATER, ElementType.EARTH, ElementType.AIR];

        const saveData = createSaveData(level, score, health, energy, currentElement, unlockedElements);
        saveGame(saveData, STORAGE_KEYS.SAVE_DATA);

        this.saveButton.setText('GAME SAVED ✓');
        this.saveButton.setStyle({ color: '#00ff00' });
        this.time.delayedCall(2000, () => {
            this.saveButton.setText('SAVE GAME');
            this.saveButton.setStyle({ color: '#ffffff' });
        });
    }

    private quitToMenu(): void {
        this.scene.stop(SCENES.GAME);
        this.scene.stop(SCENES.UI);
        this.scene.stop();
        this.scene.start(SCENES.MAIN_MENU);
    }
}