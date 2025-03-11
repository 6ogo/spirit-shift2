import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ElementType, ELEMENT_COLORS } from '../config';
import { SCENES, BiomeType, BIOME_NAMES, bossNames } from '../utils/constants';
import { createParticles } from '../utils/helpers';
import LoreSystem from '../systems/LoreSystems';

export default class BossIntroScene extends Phaser.Scene {
    private backgroundImage!: Phaser.GameObjects.Image;
    private bossSprite!: Phaser.GameObjects.Sprite;
    private titleText!: Phaser.GameObjects.Text;
    private descriptionText!: Phaser.GameObjects.Text;
    private skipText!: Phaser.GameObjects.Text;
    
    private bossElement: ElementType = ElementType.SPIRIT;
    private bossBiome: BiomeType = BiomeType.NEUTRAL;
    private introComplete: boolean = false;
    private introDuration: number = 5000; // 5 seconds
    private introTimer: number = 0;
    
    constructor() {
        super({ key: SCENES.BOSS_INTRO });
    }
    
    init(data: any): void {
        this.bossElement = data.bossElement || ElementType.SPIRIT;
        this.bossBiome = data.bossBiome || BiomeType.NEUTRAL;
        this.introComplete = false;
        this.introTimer = 0;
    }
    
    create(): void {
        // Play boss intro music/sound
        this.sound.play('boss-intro', { volume: 0.8 });
        
        // Create dark background
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.9).setOrigin(0);
        
        // Add biome-specific background
        this.createBackgroundEffect();
        
        // Add boss sprite
        this.createBossSprite();
        
        // Add name title with dramatic animation
        this.createTitleText();
        
        // Add lore description
        this.createDescriptionText();
        
        // Add skip prompt
        this.createSkipPrompt();
        
        // Setup automatic transition after duration
        this.time.delayedCall(this.introDuration, () => {
            this.completeIntro();
        });
        
        // Add click/tap to skip
        this.input.on('pointerdown', () => {
            this.completeIntro();
        });
        
        // Add space/enter to skip
        const skipKeys = [
            this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
        ];
        
        skipKeys.forEach(key => {
            key.on('down', () => {
                this.completeIntro();
            });
        });
        
        // Unlock relevant lore entry
        const loreEntryId = `guardian-${this.bossElement.toLowerCase()}`;
        LoreSystem.unlockEntry(loreEntryId);
        
        // Add ambient particles
        this.createElementalParticles();
    }
    
    update(time: number, delta: number): void {
        if (this.introComplete) return;
        
        // Update intro timer
        this.introTimer += delta;
        const progress = Math.min(this.introTimer / this.introDuration, 1);
        
        // Make the skip text blink faster as we approach the end
        if (progress > 0.8) {
            this.skipText.setAlpha(0.5 + 0.5 * Math.sin(time / 100));
        }
        
        // Update boss animation
        if (progress > 0.3 && this.bossSprite.anims.currentAnim!.key === `boss-${this.bossElement}-idle`) {
            // Change to more menacing animation
            this.bossSprite.play(`boss-${this.bossElement}-attack`);
            
            // Create threatening effect
            createParticles(
                this,
                this.bossSprite.x,
                this.bossSprite.y,
                ELEMENT_COLORS[this.bossElement],
                30,
                200,
                1.5,
                1500
            );
            
            // Shake camera
            this.cameras.main.shake(300, 0.01);
        }
    }
    
    private createBackgroundEffect(): void {
        // Add element-specific background effect
        let bgKey: string;
        
        switch (this.bossBiome) {
            case BiomeType.FIRE:
                bgKey = 'background-fire';
                break;
            case BiomeType.WATER:
                bgKey = 'background-water';
                break;
            case BiomeType.EARTH:
                bgKey = 'background-earth';
                break;
            case BiomeType.AIR:
                bgKey = 'background-air';
                break;
            case BiomeType.SPIRIT:
                bgKey = 'background-spirit';
                break;
            default:
                bgKey = 'background';
        }
        
        this.backgroundImage = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, bgKey);
        this.backgroundImage.setAlpha(0.3);
        
        // Add element-specific decoration
        let decorationKey: string;
        switch (this.bossBiome) {
            case BiomeType.FIRE:
                decorationKey = 'fire-mountain';
                break;
            case BiomeType.WATER:
                decorationKey = 'water-crystal';
                break;
            case BiomeType.EARTH:
                decorationKey = 'earth-tree';
                break;
            case BiomeType.AIR:
                decorationKey = 'air-cloud';
                break;
            case BiomeType.SPIRIT:
                decorationKey = 'spirit-vortex';
                break;
            default:
                return; // No decoration for neutral
        }
        
        const decoration = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 150, decorationKey);
        decoration.setAlpha(0.6);
        
        // Add vignette effect (dark edges)
        const vignette = this.add.graphics();
        vignette.fillGradientStyle(
            0x000000, 0x000000, 0x000000, 0x000000,
            0.8, 0.8, 0, 0
        );
        vignette.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
    
    private createBossSprite(): void {
        // Create boss sprite in center
        this.bossSprite = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'boss');
        this.bossSprite.setScale(3);
        
        // Play idle animation
        this.bossSprite.play(`boss-${this.bossElement}-idle`);
        
        // Add entrance animation
        this.bossSprite.setAlpha(0);
        this.bossSprite.setScale(4);
        this.tweens.add({
            targets: this.bossSprite,
            alpha: 1,
            scale: 3,
            duration: 1000,
            ease: 'Power2'
        });
        
        // Add pulsating effect
        this.tweens.add({
            targets: this.bossSprite,
            scaleX: 3.1,
            scaleY: 3.1,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Add glow effect
        const glow = this.add.circle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            100,
            ELEMENT_COLORS[this.bossElement],
            0.3
        );
        
        this.tweens.add({
            targets: glow,
            alpha: 0.5,
            scale: 1.2,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    private createTitleText(): void {
        // Get boss name from constants
        const bossName = bossNames[this.bossElement] || 'Corrupted Guardian';
        const biomeName = BIOME_NAMES[this.bossBiome] || 'Elysium';
        
        // Create title text
        this.titleText = this.add.text(GAME_WIDTH / 2, 100, bossName, {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        });
        this.titleText.setOrigin(0.5, 0.5);
        
        // Add subtitle
        const subtitle = this.add.text(GAME_WIDTH / 2, 150, `Corrupted Guardian of ${biomeName}`, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#aaaaaa',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        });
        subtitle.setOrigin(0.5, 0.5);
        
        // Animate title appearance
        this.titleText.setAlpha(0);
        this.titleText.setScale(2);
        this.tweens.add({
            targets: this.titleText,
            alpha: 1,
            scale: 1,
            duration: 800,
            ease: 'Power2'
        });
        
        // Animate subtitle appearance
        subtitle.setAlpha(0);
        this.tweens.add({
            targets: subtitle,
            alpha: 1,
            duration: 800,
            delay: 400,
            ease: 'Power2'
        });
    }
    
    private createDescriptionText(): void {
        // Get lore content for this boss
        const loreEntry = LoreSystem.getEntryById(`guardian-${this.bossElement.toLowerCase()}`);
        
        let description = "A powerful guardian corrupted by The Dissonance. Purify it to restore balance to the elemental kingdom.";
        
        if (loreEntry) {
            // Extract first paragraph from lore
            const firstParagraph = loreEntry.content.split('\n\n')[0];
            description = firstParagraph;
        }
        
        // Create text at bottom of screen
        this.descriptionText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 250, description, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#cccccc',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: GAME_WIDTH - 200 }
        });
        this.descriptionText.setOrigin(0.5, 0.5);
        
        // Animate text appearance
        this.descriptionText.setAlpha(0);
        this.tweens.add({
            targets: this.descriptionText,
            alpha: 1,
            duration: 1000,
            delay: 800,
            ease: 'Power2'
        });
    }
    
    private createSkipPrompt(): void {
        // Create skip text
        this.skipText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'Press SPACE or Click to Skip', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#888888',
            align: 'center'
        });
        this.skipText.setOrigin(0.5, 0.5);
        
        // Add pulsating effect
        this.tweens.add({
            targets: this.skipText,
            alpha: 0.5,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    private createElementalParticles(): void {
        // Create element-specific particles
        const color = ELEMENT_COLORS[this.bossElement];
        
        // Background ambient particles
        this.time.addEvent({
            delay: 200,
            callback: () => {
                if (this.introComplete) return;
                
                const x = Phaser.Math.Between(0, GAME_WIDTH);
                const y = Phaser.Math.Between(0, GAME_HEIGHT);
                
                createParticles(
                    this,
                    x,
                    y,
                    color,
                    1,
                    30,
                    0.5,
                    1000
                );
            },
            loop: true
        });
        
        // Particles around boss
        this.time.addEvent({
            delay: 500,
            callback: () => {
                if (this.introComplete) return;
                
                const angle = Math.random() * Math.PI * 2;
                const distance = 120 + Math.random() * 50;
                const x = this.bossSprite.x + Math.cos(angle) * distance;
                const y = this.bossSprite.y + Math.sin(angle) * distance;
                
                createParticles(
                    this,
                    x,
                    y,
                    color,
                    3,
                    50,
                    0.8,
                    800
                );
            },
            loop: true
        });
    }
    
    private completeIntro(): void {
        if (this.introComplete) return;
        
        this.introComplete = true;
        
        // Fade out
        this.cameras.main.fade(500, 0, 0, 0, false, (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
            if (progress === 1) {
                // Start the game scene with boss encounter
                this.scene.start(SCENES.GAME, {
                    biome: this.bossBiome,
                    bossElement: this.bossElement,
                    bossEncounter: true
                });
            }
        });
    }
}