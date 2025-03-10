import Phaser from 'phaser';
import { SCENES } from '../utils/constants';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENES.BOOT });
    }

    preload(): void {
        this.load.image('background', 'assets/background.png');
        this.load.image('platform', 'assets/platform.png');
        this.load.image('projectile', 'assets/projectile.png');

        this.load.spritesheet('player', 'assets/player.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('enemy', 'assets/enemy.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('spirit-spirit', 'assets/spirit-spirit.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('spirit-fire', 'assets/spirit-fire.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('spirit-water', 'assets/spirit-water.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('spirit-earth', 'assets/spirit-earth.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('spirit-air', 'assets/spirit-air.png', { frameWidth: 16, frameHeight: 16 });

        this.load.image('element-icon-spirit', 'assets/element-spirit.png');
        this.load.image('element-icon-fire', 'assets/element-fire.png');
        this.load.image('element-icon-water', 'assets/element-water.png');
        this.load.image('element-icon-earth', 'assets/element-earth.png');
        this.load.image('element-icon-air', 'assets/element-air.png');

        this.load.image('particle', 'assets/particle.png');

        this.load.audio('jump', 'assets/sounds/jump.mp3');
        this.load.audio('shoot', 'assets/sounds/shoot.mp3');
        this.load.audio('hit', 'assets/sounds/hit.mp3');
        this.load.audio('switch-element', 'assets/sounds/switch-element.mp3');
        this.load.audio('music-menu', 'assets/sounds/music-menu.mp3');
        this.load.audio('music-game', 'assets/sounds/music-game.mp3');
        this.load.audio('collect', 'assets/sounds/collect.mp3');
        this.load.audio('level-complete', 'assets/sounds/level-complete.mp3');
        this.load.audio('death', 'assets/sounds/death.mp3');
    }

    create(): void {
        // Player animations
        this.anims.create({
            key: 'player-spirit-idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'player-spirit-run',
            frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'player-spirit-jump',
            frames: this.anims.generateFrameNumbers('player', { start: 8, end: 8 }),
            frameRate: 10
        });
        this.anims.create({
            key: 'player-spirit-duck',
            frames: this.anims.generateFrameNumbers('player', { start: 9, end: 9 }),
            frameRate: 10
        });
        // Repeat for other elements (fire, water, earth, air) with assumed frame offsets
        const elementFrames = { fire: 10, water: 20, earth: 30, air: 40 };
        for (const [element, offset] of Object.entries(elementFrames)) {
            this.anims.create({
                key: `player-${element}-idle`,
                frames: this.anims.generateFrameNumbers('player', { start: offset, end: offset + 3 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: `player-${element}-run`,
                frames: this.anims.generateFrameNumbers('player', { start: offset + 4, end: offset + 7 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: `player-${element}-jump`,
                frames: this.anims.generateFrameNumbers('player', { start: offset + 8, end: offset + 8 }),
                frameRate: 10
            });
            this.anims.create({
                key: `player-${element}-duck`,
                frames: this.anims.generateFrameNumbers('player', { start: offset + 9, end: offset + 9 }),
                frameRate: 10
            });
        }

        // Enemy animations
        this.anims.create({
            key: 'enemy-spirit-move',
            frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'enemy-death',
            frames: this.anims.generateFrameNumbers('enemy', { start: 4, end: 7 }),
            frameRate: 10
        });
        // Repeat for other elements
        for (const element of ['fire', 'water', 'earth', 'air']) {
            const offset = { fire: 8, water: 16, earth: 24, air: 32 }[element];
            this.anims.create({
                key: `enemy-${element}-move`,
                frames: this.anims.generateFrameNumbers('enemy', { start: offset, end: offset + 3 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Spirit animations
        for (const element of ['spirit', 'fire', 'water', 'earth', 'air']) {
            this.anims.create({
                key: `spirit-${element}-float`,
                frames: this.anims.generateFrameNumbers(`spirit-${element}`, { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Projectile animations
        for (const element of ['spirit', 'fire', 'water', 'earth', 'air']) {
            this.anims.create({
                key: `projectile-${element}`,
                frames: [{ key: 'projectile', frame: 0 }], // Assuming single frame per element
                frameRate: 10,
                repeat: -1
            });
        }
        this.anims.create({
            key: 'impact',
            frames: [{ key: 'projectile', frame: 1 }],
            frameRate: 10
        });

        this.scene.start(SCENES.MAIN_MENU);
    }
}