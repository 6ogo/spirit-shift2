import Phaser from 'phaser';
import { GameConfig } from './config';

window.addEventListener('load', () => {
    const game = new Phaser.Game(GameConfig);
    (window as any).game = game;
});