import Phaser from 'phaser';
import { SCENES, STORAGE_KEYS } from '../utils/constants';
import SaveSystem from '../systems/SaveSystem';

export default class MainMenuScene extends Phaser.Scene {
    private bgMusic: Phaser.Sound.BaseSound | null = null;

    constructor() {
        super({ key: SCENES.MAIN_MENU });
    }

    create(): void {
        this.bgMusic = this.sound.add('music-menu', { volume: 0.5, loop: true });
        this.bgMusic.play();

        const titleText = this.add.text(this.cameras.main.centerX, 100, 'Spirit Shift', {
            fontFamily: 'Arial',
            fontSize: '64px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        });
        titleText.setOrigin(0.5, 0.5);

        this.createButton(this.cameras.main.centerX, 250, 'Start Tutorial', () => this.startTutorial());
        this.createButton(this.cameras.main.centerX, 300, 'Start Game', () => this.startGame());
        if (SaveSystem.hasSaveData()) {
            this.createButton(this.cameras.main.centerX, 350, 'Load Game', () => this.loadGame());
        }
        this.createButton(this.cameras.main.centerX, 400, 'Settings', () => {}); // Placeholder
        this.createButton(this.cameras.main.centerX, 450, 'Quit', () => window.close()); // Placeholder
    }

    private createButton(x: number, y: number, text: string, callback: () => void): void {
        const button = this.add.text(x, y, text, {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        });
        button.setOrigin(0.5, 0.5);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => button.setStyle({ color: '#ffff00' }));
        button.on('pointerout', () => button.setStyle({ color: '#ffffff' }));
        button.on('pointerup', () => {
            this.sound.play('collect', { volume: 0.3 });
            callback();
        });
    }

    private startTutorial(): void {
        if (this.bgMusic) this.bgMusic.stop();
        this.scene.start(SCENES.TUTORIAL);
    }

    private startGame(): void {
        if (this.bgMusic) this.bgMusic.stop();
        this.scene.start(SCENES.GAME, { level: 1, score: 0 });
    }

    private loadGame(): void {
        const saveData = SaveSystem.loadGame();
        if (saveData) {
            if (this.bgMusic) this.bgMusic.stop();
            this.scene.start(SCENES.GAME, saveData);
        }
    }
}