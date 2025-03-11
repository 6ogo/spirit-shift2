import Phaser from 'phaser';
import { SCENES, STORAGE_KEYS } from '../utils/constants';
import UpgradeSystem from '../systems/UpgradeSystems.ts';
import LoreSystem from '../systems/LoreSystems.ts';
import SaveSystem from '../systems/SaveSystem.ts';
import { ElementType } from '@/config';

export default class BootScene extends Phaser.Scene {
    private loadingText!: Phaser.GameObjects.Text;
    private progressBar!: Phaser.GameObjects.Graphics;
    private progressBox!: Phaser.GameObjects.Graphics;

    constructor() {
        super({ key: SCENES.BOOT });
    }

    preload(): void {
        // Create loading screen
        this.createLoadingUI();
        
        // Initialize game systems
        this.initSystems();
        
        // Load images
        this.loadImages();
        
        // Load spritesheets
        this.loadSpritesheets();
        
        // Load audio
        this.loadAudio();
        
        // Load fonts
        this.loadFonts();
        
        // Setup error handling
        this.setupLoadingErrorHandling();
    }

    create(): void {
        // Initialize settings
        this.initSettings();
        
        // Create animations
        this.createPlayerAnimations();
        this.createEnemyAnimations();
        this.createBossAnimations();
        this.createSpiritAnimations();
        this.createProjectileAnimations();
        this.createEffectAnimations();
        
        // Hide loading screen and update progress
        this.updateLoadingComplete();
        
        // Start the menu scene
        this.startInitialScene();
    }
    
    private createLoadingUI(): void {
        const { width, height } = this.cameras.main;
        
        // Create background
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0, 0);
        
        // Add title text
        this.add.text(width / 2, height * 0.3, 'Spirit Shift', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // Add loading text
        this.loadingText = this.add.text(width / 2, height * 0.45, 'Loading...', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Create progress bar background
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x222222, 0.8);
        this.progressBox.fillRect(width / 2 - 160, height * 0.5 - 15, 320, 30);
        
        // Create progress bar
        this.progressBar = this.add.graphics();
        
        // Update progress as files load
        this.load.on('progress', (value: number) => {
            this.updateLoadingProgress(value);
        });
        
        // Update text as files load
        this.load.on('fileprogress', (file: any) => {
            this.loadingText.setText(`Loading asset: ${file.key}`);
        });
    }
    
    private updateLoadingProgress(value: number): void {
        // Clear the progress bar
        this.progressBar.clear();
        
        // Draw the progress
        this.progressBar.fillStyle(0x4a934a, 1);
        const { width, height } = this.cameras.main;
        this.progressBar.fillRect(width / 2 - 155, height * 0.5 - 10, 310 * value, 20);
        
        // Update the external loading bar if it exists
        if (typeof window.updateLoadingProgress === 'function') {
            window.updateLoadingProgress(Math.floor(value * 100));
        }
    }
    
    private updateLoadingComplete(): void {
        // Hide the loading elements
        this.loadingText.setText('Loading complete!');
        
        // Delay to show the completion message
        this.time.delayedCall(500, () => {
            this.loadingText.destroy();
            this.progressBar.destroy();
            this.progressBox.destroy();
            
            // Hide the external loading screen if it exists
            if (typeof window.hideLoadingScreen === 'function') {
                window.hideLoadingScreen();
            }
        });
    }
    
    private setupLoadingErrorHandling(): void {
        // Handle loading errors
        this.load.on('loaderror', (fileObj: any) => {
            console.error(`Error loading asset: ${fileObj.key}`);
            this.loadingText.setText(`Error loading: ${fileObj.key}`);
            this.loadingText.setColor('#ff0000');
        });
    }
    
    private initSystems(): void {
        // Initialize the upgrade system
        UpgradeSystem.initialize();
        
        // Initialize the lore system
        LoreSystem.initialize();
        
        // Initialize the save system
        SaveSystem.loadGame();
    }
    
    private initSettings(): void {
        // Load saved settings or set defaults
        let settings = this.loadSettings();
        if (!settings) {
            settings = {
                musicVolume: 0.5,
                soundVolume: 0.7,
                particlesEnabled: true,
                screenShakeEnabled: true
            };
            this.saveSettings(settings);
        }
        
        // Apply settings
        this.sound.volume = settings.soundVolume;
        
        // Register settings in registry for access by other scenes
        this.registry.set('settings', settings);
        
        // Set sound volume categories
        this.sound.setMute(false);
    }
    
    private loadSettings(): any {
        try {
            const settingsData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return settingsData ? JSON.parse(settingsData) : null;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return null;
        }
    }
    
    private saveSettings(settings: any): void {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }
    
    private startInitialScene(): void {
        // Check if there's a save game to determine where to start
        const hasSave = SaveSystem.hasSaveData();
        
        // Check for debug parameters in URL
        const urlParams = new URLSearchParams(window.location.search);
        const debugScene = urlParams.get('scene');
        
        if (debugScene) {
            // Start debug scene if specified
            switch (debugScene) {
                case 'game':
                    this.scene.start(SCENES.GAME, { level: 1, score: 0 });
                    break;
                case 'tutorial':
                    this.scene.start(SCENES.TUTORIAL);
                    break;
                case 'upgrade':
                    this.scene.start(SCENES.UPGRADE, { level: 1, unlockedElements: [ElementType.SPIRIT, ElementType.FIRE, ElementType.WATER] });
                    break;
                case 'kingdoms':
                    this.scene.start(SCENES.KINGDOM_SELECT);
                    break;
                case 'lore':
                    this.scene.start(SCENES.LORE, { unlockedElements: [ElementType.SPIRIT, ElementType.FIRE] });
                    break;
                default:
                    this.scene.start(SCENES.MAIN_MENU);
            }
        } else {
            // Normal game start
            this.scene.start(SCENES.MAIN_MENU, { hasSave });
        }
    }
    
    private loadImages(): void {
        // Load background images
        this.load.image('background', 'assets/backgrounds/background.png');
        this.load.image('background-fire', 'assets/backgrounds/background-fire.png');
        this.load.image('background-water', 'assets/backgrounds/background-water.png');
        this.load.image('background-earth', 'assets/backgrounds/background-earth.png');
        this.load.image('background-air', 'assets/backgrounds/background-air.png');
        this.load.image('background-spirit', 'assets/backgrounds/background-spirit.png');
        
        // Load gameplay sprites
        this.load.image('platform', 'assets/sprites/platform.png');
        this.load.image('projectile', 'assets/sprites/projectile.png');
        this.load.image('particle', 'assets/sprites/particle.png');
        this.load.image('soul-essence', 'assets/sprites/soul-essence.png');
        
        // Load UI elements
        this.load.image('logo', 'assets/sprites/logo.png');
        this.load.image('element-icon-spirit', 'assets/ui/element-spirit.png');
        this.load.image('element-icon-fire', 'assets/ui/element-fire.png');
        this.load.image('element-icon-water', 'assets/ui/element-water.png');
        this.load.image('element-icon-earth', 'assets/ui/element-earth.png');
        this.load.image('element-icon-air', 'assets/ui/element-air.png');
        this.load.image('health-bar', 'assets/ui/health-bar.png');
        this.load.image('energy-bar', 'assets/ui/energy-bar.png');
        this.load.image('button', 'assets/ui/button.png');
        this.load.image('button-hover', 'assets/ui/button-hover.png');
        
        // Load background elements for different biomes
        this.load.image('fire-mountain', 'assets/backgrounds/fire-mountain.png');
        this.load.image('water-crystal', 'assets/backgrounds/water-crystal.png');
        this.load.image('earth-tree', 'assets/backgrounds/earth-tree.png');
        this.load.image('air-cloud', 'assets/backgrounds/air-cloud.png');
        this.load.image('spirit-vortex', 'assets/backgrounds/spirit-vortex.png');
    }
    
    private loadSpritesheets(): void {
        // Load character spritesheets
        this.load.spritesheet('player', 'assets/sprites/player.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('enemy', 'assets/sprites/enemy.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('boss', 'assets/sprites/boss.png', { frameWidth: 96, frameHeight: 96 });
        
        // Load spirit spritesheets
        this.load.spritesheet('spirit', 'assets/sprites/spirit.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('spirit-spirit', 'assets/sprites/spirit-spirit.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('spirit-fire', 'assets/sprites/spirit-fire.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('spirit-water', 'assets/sprites/spirit-water.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('spirit-earth', 'assets/sprites/spirit-earth.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('spirit-air', 'assets/sprites/spirit-air.png', { frameWidth: 32, frameHeight: 32 });
        
        // Load effect spritesheets
        this.load.spritesheet('explosion', 'assets/sprites/explosion.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('splash', 'assets/sprites/splash.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('earthquake', 'assets/sprites/earthquake.png', { frameWidth: 96, frameHeight: 32 });
        this.load.spritesheet('tornado', 'assets/sprites/tornado.png', { frameWidth: 48, frameHeight: 96 });
        this.load.spritesheet('shield', 'assets/sprites/shield.png', { frameWidth: 64, frameHeight: 64 });
    }
    
    private loadAudio(): void {
        // Load sound effects
        this.load.audio('jump', 'assets/audio/jump.wav');
        this.load.audio('shoot', 'assets/audio/shoot.wav');
        this.load.audio('hit', 'assets/audio/hit.wav');
        this.load.audio('collect', 'assets/audio/collect.wav');
        this.load.audio('switch-element', 'assets/audio/switch-element.wav');
        this.load.audio('death', 'assets/audio/death.wav');
        this.load.audio('level-complete', 'assets/audio/level-complete.wav');
        this.load.audio('boss-intro', 'assets/audio/boss-intro.wav');
        this.load.audio('dash', 'assets/audio/dash.wav');
        this.load.audio('special', 'assets/audio/special.wav');
        this.load.audio('upgrade', 'assets/audio/upgrade.wav');
        this.load.audio('unlock', 'assets/audio/unlock.wav');
        this.load.audio('menu-select', 'assets/audio/menu-select.wav');
        this.load.audio('menu-click', 'assets/audio/menu-click.wav');
        
        // Load background music
        this.load.audio('music-menu', 'assets/audio/menu-music.mp3');
        this.load.audio('music-game', 'assets/audio/game-music.mp3');
        this.load.audio('music-boss', 'assets/audio/boss-music.mp3');
        this.load.audio('music-fire', 'assets/audio/fire-music.mp3');
        this.load.audio('music-water', 'assets/audio/water-music.mp3');
        this.load.audio('music-earth', 'assets/audio/earth-music.mp3');
        this.load.audio('music-air', 'assets/audio/air-music.mp3');
        this.load.audio('music-spirit', 'assets/audio/spirit-music.mp3');
    }
    
    private loadFonts(): void {
        // Load bitmap fonts if needed
        this.load.bitmapFont('pixel', 'assets/fonts/pixel.png', 'assets/fonts/pixel.xml');
    }

    private createPlayerAnimations(): void {
        // Basic player animations
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
        this.anims.create({
            key: 'player-spirit-charge',
            frames: this.anims.generateFrameNumbers('player', { start: 10, end: 11 }),
            frameRate: 10,
            repeat: -1
        });
        
        // Create animations for each element
        const elementFrames = { 
            fire: 12, 
            water: 24, 
            earth: 36, 
            air: 48 
        };
        
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
            this.anims.create({
                key: `player-${element}-charge`,
                frames: this.anims.generateFrameNumbers('player', { start: offset + 10, end: offset + 11 }),
                frameRate: 10,
                repeat: -1
            });
        }
    }

    private createEnemyAnimations(): void {
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
        
        // Create animations for each element
        const elementOffsets = { 
            fire: 8, 
            water: 16, 
            earth: 24, 
            air: 32 
        };
        
        for (const [element, offset] of Object.entries(elementOffsets)) {
            this.anims.create({
                key: `enemy-${element}-move`,
                frames: this.anims.generateFrameNumbers('enemy', { start: offset, end: offset + 3 }),
                frameRate: 10,
                repeat: -1
            });
        }
    }
    
    private createBossAnimations(): void {
        // Create boss animations for each element
        const elements = ['spirit', 'fire', 'water', 'earth', 'air'];
        const actionOffsets = {
            idle: 0,
            attack: 4,
            charge: 8,
            summon: 12,
            special: 16,
            transform: 20,
        };
        
        // For each element type
        elements.forEach((element, elementIndex) => {
            const elementOffset = elementIndex * 24;
            
            // For each action type
            for (const [action, offset] of Object.entries(actionOffsets)) {
                this.anims.create({
                    key: `boss-${element}-${action}`,
                    frames: this.anims.generateFrameNumbers('boss', { 
                        start: elementOffset + offset, 
                        end: elementOffset + offset + 3 
                    }),
                    frameRate: 10,
                    repeat: action === 'idle' ? -1 : 0
                });
            }
        });
        
        // Boss death animation (shared for all elements)
        this.anims.create({
            key: 'boss-death',
            frames: this.anims.generateFrameNumbers('boss', { start: 120, end: 127 }),
            frameRate: 10
        });
    }
    
    private createSpiritAnimations(): void {
        // Create spirit animations for each element
        const elements = ['spirit', 'fire', 'water', 'earth', 'air'];
        
        for (const element of elements) {
            this.anims.create({
                key: `${element}-idle`,
                frames: this.anims.generateFrameNumbers(`spirit-${element}`, { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
            
            this.anims.create({
                key: `${element}-collect`,
                frames: this.anims.generateFrameNumbers(`spirit-${element}`, { start: 4, end: 7 }),
                frameRate: 12
            });
        }
    }

    private createProjectileAnimations(): void {
        // Create projectile animations for each element
        for (const element of ['spirit', 'fire', 'water', 'earth', 'air']) {
            this.anims.create({
                key: `projectile-${element}`,
                frames: [{ key: 'projectile', frame: 0 }],
                frameRate: 10,
                repeat: -1
            });
        }
        
        this.anims.create({
            key: 'impact',
            frames: [{ key: 'projectile', frame: 1 }],
            frameRate: 10
        });
    }
    
    private createEffectAnimations(): void {
        // Create explosion animation
        this.anims.create({
            key: 'explosion',
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 7 }),
            frameRate: 15
        });
        
        // Create water splash animation
        this.anims.create({
            key: 'splash',
            frames: this.anims.generateFrameNumbers('splash', { start: 0, end: 5 }),
            frameRate: 12
        });
        
        // Create earthquake animation
        this.anims.create({
            key: 'earthquake',
            frames: this.anims.generateFrameNumbers('earthquake', { start: 0, end: 5 }),
            frameRate: 12
        });
        
        // Create tornado animation
        this.anims.create({
            key: 'tornado',
            frames: this.anims.generateFrameNumbers('tornado', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        
        // Create shield animation
        this.anims.create({
            key: 'shield',
            frames: this.anims.generateFrameNumbers('shield', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });
    }
}

// Add TypeScript declaration for window functions
declare global {
    interface Window {
        updateLoadingProgress: (progress: number) => void;
        hideLoadingScreen: () => void;
    }
}