import Phaser from 'phaser';
import BootScene from './scenes/BootScene.ts';
import MainMenuScene from './scenes/MainMenuScene.ts';
import TutorialScene from './scenes/TutorialScene.ts';
import GameScene from './scenes/GameScene.ts';
import UIScene from './scenes/UIScene.ts';
import PauseScene from './scenes/PauseScene.ts';
import GameOverScene from './scenes/GameOverScene.ts';

export const GAME_WIDTH = 1600;
export const GAME_HEIGHT = 900;

export const GRAVITY = 1000;

export enum ElementType {
    SPIRIT = 'spirit',
    FIRE = 'fire',
    WATER = 'water',
    EARTH = 'earth',
    AIR = 'air'
}

export const ELEMENT_STRENGTHS = {
    [ElementType.FIRE]: ElementType.AIR,
    [ElementType.WATER]: ElementType.FIRE,
    [ElementType.EARTH]: ElementType.WATER,
    [ElementType.AIR]: ElementType.EARTH,
    [ElementType.SPIRIT]: null
};

export const ELEMENT_WEAKNESSES = {
    [ElementType.FIRE]: ElementType.WATER,
    [ElementType.WATER]: ElementType.EARTH,
    [ElementType.EARTH]: ElementType.AIR,
    [ElementType.AIR]: ElementType.FIRE,
    [ElementType.SPIRIT]: null
};

export const ELEMENT_COLORS = {
    [ElementType.SPIRIT]: 0x2A2A2A,
    [ElementType.FIRE]: 0xF24236,
    [ElementType.WATER]: 0x28C2FF,
    [ElementType.EARTH]: 0x4A934A,
    [ElementType.AIR]: 0xBBD0FF
};

export const ELEMENT_NAMES = {
    [ElementType.SPIRIT]: 'Spirit',
    [ElementType.FIRE]: 'Fire',
    [ElementType.WATER]: 'Water',
    [ElementType.EARTH]: 'Earth',
    [ElementType.AIR]: 'Air'
};

export const PLAYER_CONFIG = {
    SPEED: 300,
    JUMP_VELOCITY: -600,
    WIDTH: 40,
    HEIGHT: 50,
    MAX_HEALTH: 100,
    MAX_ENERGY: 100,
    ENERGY_REGEN: {
        [ElementType.SPIRIT]: 0.1,
        [ElementType.FIRE]: 0.3,
        [ElementType.WATER]: 0.15,
        [ElementType.EARTH]: 0.15,
        [ElementType.AIR]: 0.15
    },
    SHOOT_COOLDOWN: 500,
    SHOOT_ENERGY_COST: 10,
    DUCK_HEIGHT_REDUCTION: 0.4
};

export const ENEMY_CONFIG = {
    BASE_HEALTH: 30,
    BASE_DAMAGE: 10,
    SIGHT_RANGE: 400,
    BASE_SPEED: 100
};

export const PROJECTILE_CONFIG = {
    BASE_SPEED: 600,
    BASE_DAMAGE: {
        [ElementType.SPIRIT]: 10,
        [ElementType.FIRE]: 15,
        [ElementType.WATER]: 8,
        [ElementType.EARTH]: 20,
        [ElementType.AIR]: 5
    },
    SIZE: {
        [ElementType.SPIRIT]: 10,
        [ElementType.FIRE]: 12,
        [ElementType.WATER]: 8,
        [ElementType.EARTH]: 15,
        [ElementType.AIR]: 6
    }
};

export const PLATFORM_CONFIG = {
    DEFAULT_HEIGHT: 20
};

export const GameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: GRAVITY,
                x: 0
            },
            debug: false
        }
    },
    scene: [
        BootScene,
        MainMenuScene,
        TutorialScene,
        GameScene,
        UIScene,
        PauseScene,
        GameOverScene
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        pixelArt: false,
        antialias: true
    },
    backgroundColor: '#000000'
};