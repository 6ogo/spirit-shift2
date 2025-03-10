import Phaser from 'phaser';
import { SCENES } from '../utils/constants';

export default class GameOverScene extends Phaser.Scene {
    private score: number = 0;

    constructor() {
        super({ key: SCENES.GAME_OVER });
    }

    init(data: any): void {
        this.score = data.score || 0;
    }

    create(): void {
        const gameOverText = this.add.text(this.cameras.main.centerX, 200, 'GAME OVER', {
            fontFamily: 'Arial',
            fontSize: '64px',
            color: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        });
        gameOverText.setOrigin(0.5, 0.5);

        const scoreText = this.add.text(this.cameras.main.centerX, 300, `Score: ${this.score}`, {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff'
        });
        scoreText.setOrigin(0.5, 0.5);

        this.createButton(this.cameras.main.centerX, 400, 'Restart', () => this.scene.start(SCENES.GAME, { level: 1, score: 0 }));
        this.createButton(this.cameras.main.centerX, 450, 'Main Menu', () => this.scene.start(SCENES.MAIN_MENU));
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
}