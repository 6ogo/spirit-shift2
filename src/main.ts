// src/main.ts
import Phaser from 'phaser';
import { GameConfig } from './config';

// Initialize the game with the config
window.addEventListener('load', () => {
  const game = new Phaser.Game(GameConfig);
  
  // Make game accessible from the console for debugging
  (window as any).game = game;
});