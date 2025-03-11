import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ElementType, ELEMENT_COLORS, ELEMENT_NAMES } from '../config';
import { SCENES, EVENTS, STORAGE_KEYS, BIOME_NAMES } from '../utils/constants';

enum BiomeType {
    NEUTRAL,
    FIRE,
    WATER,
    EARTH,
    AIR,
    SPIRIT
}

interface Kingdom {
    biome: BiomeType;
    name: string;
    description: string;
    difficulty: number;
    bossElement: ElementType;
    isUnlocked: boolean;
    isCompleted: boolean;
    levelCount: number;
    lastLevelCompleted: number;
}

export default class KingdomSelectScene extends Phaser.Scene {
    private kingdoms: Kingdom[] = [];
    private selectedKingdom: Kingdom | null = null;
    private titleText!: Phaser.GameObjects.Text;
    private descriptionText!: Phaser.GameObjects.Text;
    private kingdomCards: Phaser.GameObjects.Container[] = [];
    private backButton!: Phaser.GameObjects.Text;
    private playButton!: Phaser.GameObjects.Text;
    private detailsPanel!: Phaser.GameObjects.Container;
    
    constructor() {
        super({ key: SCENES.KINGDOM_SELECT });
    }
    
    init(data: any): void {
        // Load unlocked kingdoms from storage
        this.loadKingdoms();
    }
    
    create(): void {
        // Create background
        this.createBackground();
        
        // Create title
        this.titleText = this.add.text(GAME_WIDTH / 2, 50, 'SELECT A KINGDOM', {
            fontFamily: 'Arial',
            fontSize: '36px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.titleText.setOrigin(0.5, 0.5);
        
        // Create kingdom cards
        this.createKingdomCards();
        
        // Create details panel
        this.createDetailsPanel();
        
        // Create back button
        this.backButton = this.add.text(50, GAME_HEIGHT - 50, 'Back to Menu', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#222244',
            padding: { x: 20, y: 10 }
        });
        
        this.backButton.setInteractive({ useHandCursor: true });
        
        this.backButton.on('pointerover', () => {
            this.backButton.setStyle({ color: '#aaddff' });
        });
        
        this.backButton.on('pointerout', () => {
            this.backButton.setStyle({ color: '#ffffff' });
        });
        
        this.backButton.on('pointerup', () => {
            this.sound.play('collect', { volume: 0.3 });
            this.scene.start(SCENES.MAIN_MENU);
        });
        
        // Create play button (initially hidden)
        this.playButton = this.add.text(GAME_WIDTH - 200, GAME_HEIGHT - 50, 'Enter Kingdom', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#445566',
            padding: { x: 20, y: 10 }
        });
        
        this.playButton.setInteractive({ useHandCursor: true });
        
        this.playButton.on('pointerover', () => {
            this.playButton.setStyle({ color: '#aaddff' });
        });
        
        this.playButton.on('pointerout', () => {
            this.playButton.setStyle({ color: '#ffffff' });
        });
        
        this.playButton.on('pointerup', () => {
            if (this.selectedKingdom) {
                this.sound.play('level-complete', { volume: 0.5 });
                
                // Start the game with the selected kingdom
                this.scene.start(SCENES.GAME, {
                    biome: this.selectedKingdom.biome,
                    level: this.selectedKingdom.lastLevelCompleted + 1,
                    score: 0,
                    bossElement: this.selectedKingdom.bossElement
                });
            }
        });
        
        this.playButton.setVisible(false);
        
        // Add ambient particle effects
        this.createAmbientParticles();
    }
    
    private loadKingdoms(): void {
        // Define the kingdoms
        const baseKingdoms: Kingdom[] = [
            {
                biome: BiomeType.NEUTRAL,
                name: BIOME_NAMES[BiomeType.NEUTRAL],
                description: "The entry point to Elysium - a balanced environment where the elements co-exist in harmony. Training ground for new spirits.",
                difficulty: 1,
                bossElement: ElementType.SPIRIT,
                isUnlocked: true,
                isCompleted: false,
                levelCount: 3,
                lastLevelCompleted: 0
            },
            {
                biome: BiomeType.FIRE,
                name: BIOME_NAMES[BiomeType.FIRE],
                description: "A blazing landscape of volcanoes and lava flows. Home to Ignix, the Fire Guardian who values speed and aggression.",
                difficulty: 2,
                bossElement: ElementType.FIRE,
                isUnlocked: false,
                isCompleted: false,
                levelCount: 5,
                lastLevelCompleted: 0
            },
            {
                biome: BiomeType.WATER,
                name: BIOME_NAMES[BiomeType.WATER],
                description: "Underwater caverns filled with crystals and coral. Aquilla, the Water Guardian, tests adaptability and flow.",
                difficulty: 2,
                bossElement: ElementType.WATER,
                isUnlocked: false,
                isCompleted: false,
                levelCount: 5,
                lastLevelCompleted: 0
            },
            {
                biome: BiomeType.EARTH,
                name: BIOME_NAMES[BiomeType.EARTH],
                description: "Vibrant forests and towering mountains teeming with life. Terron, the Earth Guardian, values strength and resilience.",
                difficulty: 3,
                bossElement: ElementType.EARTH,
                isUnlocked: false,
                isCompleted: false,
                levelCount: 5,
                lastLevelCompleted: 0
            },
            {
                biome: BiomeType.AIR,
                name: BIOME_NAMES[BiomeType.AIR],
                description: "Floating islands and wind-swept cliffs high above Elysium. Zephira, the Air Guardian, tests agility and grace.",
                difficulty: 3,
                bossElement: ElementType.AIR,
                isUnlocked: false,
                isCompleted: false,
                levelCount: 5,
                lastLevelCompleted: 0
            },
            {
                biome: BiomeType.SPIRIT,
                name: BIOME_NAMES[BiomeType.SPIRIT],
                description: "The mysterious center of The Dissonance, where the very fabric of reality is distorted. Face Etheria, the corrupted Spirit Guardian.",
                difficulty: 4,
                bossElement: ElementType.SPIRIT,
                isUnlocked: false,
                isCompleted: false,
                levelCount: 3,
                lastLevelCompleted: 0
            }
        ];
        
        // Try to load kingdom progress from storage
        try {
            const savedKingdoms = localStorage.getItem(STORAGE_KEYS.UNLOCKED_ELEMENTS);
            const savedBosses = localStorage.getItem(STORAGE_KEYS.BOSS_DEFEATS);
            
            if (savedKingdoms) {
                const unlockedKingdoms = JSON.parse(savedKingdoms);
                
                // Update kingdom unlock status
                baseKingdoms.forEach(kingdom => {
                    if (unlockedKingdoms[kingdom.biome]) {
                        kingdom.isUnlocked = true;
                        kingdom.lastLevelCompleted = unlockedKingdoms[kingdom.biome].lastLevel || 0;
                    }
                });
            }
            
            if (savedBosses) {
                const defeatedBosses = JSON.parse(savedBosses);
                
                // Update kingdom completion status
                baseKingdoms.forEach(kingdom => {
                    if (defeatedBosses[kingdom.bossElement]) {
                        kingdom.isCompleted = true;
                    }
                });
            }
            
            // Additional unlock logic - Neutral is always unlocked
            if (!baseKingdoms[0].isCompleted) {
                // If neutral kingdom isn't completed, prevent unlocking anything beyond initial elemental kingdoms
                baseKingdoms[5].isUnlocked = false;
            } else {
                // If we've completed neutral kingdom, unlock the first batch of elemental kingdoms
                baseKingdoms[1].isUnlocked = true; // Fire
                baseKingdoms[2].isUnlocked = true; // Water
            }
            
            // If we've completed the first batch, unlock the second batch
            if (baseKingdoms[1].isCompleted && baseKingdoms[2].isCompleted) {
                baseKingdoms[3].isUnlocked = true; // Earth
                baseKingdoms[4].isUnlocked = true; // Air
            }
            
            // If all elemental kingdoms are completed, unlock the void realm
            if (baseKingdoms[1].isCompleted && baseKingdoms[2].isCompleted && 
                baseKingdoms[3].isCompleted && baseKingdoms[4].isCompleted) {
                baseKingdoms[5].isUnlocked = true; // Spirit/Void
            }
            
        } catch (error) {
            console.error('Error loading kingdom data:', error);
        }
        
        this.kingdoms = baseKingdoms;
    }
    
    private createBackground(): void {
        // Create a starry background
        const bg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000022);
        bg.setOrigin(0, 0);
        
        // Add stars
        for (let i = 0; i < 200; i++) {
            const x = Phaser.Math.Between(0, GAME_WIDTH);
            const y = Phaser.Math.Between(0, GAME_HEIGHT);
            const size = Phaser.Math.FloatBetween(1, 3);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);
            
            const star = this.add.circle(x, y, size, 0xffffff, alpha);
            
            // Add twinkle effect to some stars
            if (Math.random() > 0.7) {
                this.tweens.add({
                    targets: star,
                    alpha: 0.3,
                    duration: 1500 + Math.random() * 2000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        }
        
        // Add nebula effects
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(0, GAME_WIDTH);
            const y = Phaser.Math.Between(0, GAME_HEIGHT);
            const size = Phaser.Math.Between(150, 300);
            
            // Random color from elemental colors
            const colors = [0x6677ff, 0xff6666, 0x66ccff, 0x66aa66, 0xccccff];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const nebula = this.add.circle(x, y, size, color, 0.05);
            
            // Slow pulse
            this.tweens.add({
                targets: nebula,
                scale: 1.2,
                alpha: 0.03,
                duration: 5000 + Math.random() * 5000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
    
    private createKingdomCards(): void {
        const cardWidth = 200;
        const cardHeight = 250;
        const cardSpacing = 30;
        const totalWidth = (cardWidth * this.kingdoms.length) + (cardSpacing * (this.kingdoms.length - 1));
        let startX = (GAME_WIDTH - totalWidth) / 2;
        
        this.kingdoms.forEach((kingdom, index) => {
            const x = startX + (index * (cardWidth + cardSpacing)) + cardWidth / 2;
            const y = GAME_HEIGHT / 2 - 50;
            
            const card = this.createKingdomCard(kingdom, x, y, cardWidth, cardHeight);
            this.kingdomCards.push(card);
            this.add.existing(card);
        });
    }
    
    private createKingdomCard(kingdom: Kingdom, x: number, y: number, width: number, height: number): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        // Get color based on biome
        let color: number;
        switch (kingdom.biome) {
            case BiomeType.FIRE: color = 0xaa3333; break;
            case BiomeType.WATER: color = 0x3366aa; break;
            case BiomeType.EARTH: color = 0x33aa33; break;
            case BiomeType.AIR: color = 0x6666aa; break;
            case BiomeType.SPIRIT: color = 0x663399; break;
            default: color = 0x555555;
        }
        
        // Background 
        const bg = this.add.rectangle(0, 0, width, height, color, kingdom.isUnlocked ? 0.7 : 0.3);
        bg.setStrokeStyle(2, 0xffffff, kingdom.isUnlocked ? 0.8 : 0.3);
        container.add(bg);
        
        // Kingdom name
        const nameText = this.add.text(0, -height/2 + 25, kingdom.name, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: kingdom.isUnlocked ? '#ffffff' : '#888888',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2
        });
        nameText.setOrigin(0.5, 0.5);
        container.add(nameText);
        
        // Difficulty stars
        const starsContainer = this.add.container(0, -height/2 + 55);
        for (let i = 0; i < kingdom.difficulty; i++) {
            const star = this.add.star(
                (i - (kingdom.difficulty - 1) / 2) * 20, 
                0, 
                5, 
                8, 
                12, 
                kingdom.isUnlocked ? 0xffdd44 : 0x888888,
                kingdom.isUnlocked ? 1 : 0.5
            );
            starsContainer.add(star);
        }
        container.add(starsContainer);
        
        // Progress indicator
        if (kingdom.isUnlocked) {
            // Progress background
            const progressBg = this.add.rectangle(0, height/2 - 35, width - 20, 15, 0x000000, 0.5);
            container.add(progressBg);
            
            // Progress fill
            const progress = Math.min(1, (kingdom.lastLevelCompleted / kingdom.levelCount));
            const progressFill = this.add.rectangle(
                -width/2 + 10 + ((width - 20) * progress / 2), 
                height/2 - 35, 
                (width - 20) * progress, 
                11, 
                0x44ff44
            );
            progressFill.setOrigin(0, 0.5);
            container.add(progressFill);
            
            // Progress text
            const progressText = this.add.text(0, height/2 - 35, 
                `${kingdom.lastLevelCompleted}/${kingdom.levelCount}`, {
                fontFamily: 'Arial',
                fontSize: '12px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 1
            });
            progressText.setOrigin(0.5, 0.5);
            container.add(progressText);
        }
        
        // Completion badge
        if (kingdom.isCompleted) {
            const completionBadge = this.add.circle(width/2 - 20, -height/2 + 20, 15, 0x44ff44);
            const checkmark = this.add.text(width/2 - 20, -height/2 + 20, '✓', {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#ffffff'
            });
            checkmark.setOrigin(0.5, 0.5);
            container.add(completionBadge);
            container.add(checkmark);
        }
        
        // Lock icon for locked kingdoms
        if (!kingdom.isUnlocked) {
            const lockIcon = this.add.circle(0, 0, 30, 0x000000, 0.7);
            const lockText = this.add.text(0, 0, '🔒', {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#888888'
            });
            lockText.setOrigin(0.5, 0.5);
            container.add(lockIcon);
            container.add(lockText);
        }
        
        // Make card interactive if unlocked
        if (kingdom.isUnlocked) {
            bg.setInteractive({ useHandCursor: true });
            
            bg.on('pointerover', () => {
                bg.setStrokeStyle(3, 0xffffff, 1);
                this.tweens.add({
                    targets: container,
                    scale: 1.05,
                    duration: 100
                });
                this.showKingdomDetails(kingdom);
            });
            
            bg.on('pointerout', () => {
                bg.setStrokeStyle(2, 0xffffff, 0.8);
                this.tweens.add({
                    targets: container,
                    scale: 1,
                    duration: 100
                });
            });
            
            bg.on('pointerup', () => {
                this.sound.play('collect', { volume: 0.3 });
                this.selectKingdom(kingdom);
            });
        }
        
        return container;
    }
    
    private createDetailsPanel(): void {
        this.detailsPanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 170);
        
        // Background panel
        const panel = this.add.rectangle(0, 0, GAME_WIDTH - 100, 200, 0x222244, 0.8);
        panel.setStrokeStyle(2, 0x6677ff, 0.8);
        this.detailsPanel.add(panel);
        
        // Description text (placeholder)
        this.descriptionText = this.add.text(0, 0, 'Select a kingdom to view details...', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#cccccc',
            align: 'center',
            wordWrap: { width: GAME_WIDTH - 150 }
        });
        this.descriptionText.setOrigin(0.5, 0.5);
        this.detailsPanel.add(this.descriptionText);
    }
    
    private showKingdomDetails(kingdom: Kingdom): void {
        // Update description text
        this.descriptionText.setText(kingdom.description);
        
        // Show additional details like boss info, etc.
        this.detailsPanel.removeAll(true);
        
        // Re-add background panel
        const panel = this.add.rectangle(0, 0, GAME_WIDTH - 100, 200, 0x222244, 0.8);
        panel.setStrokeStyle(2, 0x6677ff, 0.8);
        this.detailsPanel.add(panel);
        
        // Add kingdom name as title
        const nameText = this.add.text(0, -70, kingdom.name.toUpperCase(), {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        nameText.setOrigin(0.5, 0.5);
        this.detailsPanel.add(nameText);
        
        // Add description
        this.descriptionText = this.add.text(0, -20, kingdom.description, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#cccccc',
            align: 'center',
            wordWrap: { width: GAME_WIDTH - 150 }
        });
        this.descriptionText.setOrigin(0.5, 0.5);
        this.detailsPanel.add(this.descriptionText);
        
        // Add boss information
        const bossText = this.add.text(0, 40, `Guardian: ${BOSS_NAMES[kingdom.bossElement]}`, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffaa44',
            stroke: '#000000',
            strokeThickness: 2
        });
        bossText.setOrigin(0.5, 0.5);
        this.detailsPanel.add(bossText);
        
        // Add level information
        let levelText;
        if (kingdom.lastLevelCompleted === 0) {
            levelText = `Levels: ${kingdom.levelCount} (Not Started)`;
        } else if (kingdom.lastLevelCompleted < kingdom.levelCount) {
            levelText = `Levels: ${kingdom.lastLevelCompleted}/${kingdom.levelCount} Completed`;
        } else {
            levelText = `Levels: All ${kingdom.levelCount} Completed!`;
        }
        
        const levelsInfo = this.add.text(0, 70, levelText, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#88ccff'
        });
        levelsInfo.setOrigin(0.5, 0.5);
        this.detailsPanel.add(levelsInfo);
    }
    
    private selectKingdom(kingdom: Kingdom): void {
        this.selectedKingdom = kingdom;
        
        // Update all cards to show selection state
        this.kingdomCards.forEach((card, index) => {
            const cardKingdom = this.kingdoms[index];
            const bgRect = card.getAt(0) as Phaser.GameObjects.Rectangle;
            
            if (cardKingdom === kingdom) {
                // Selected kingdom
                bgRect.setStrokeStyle(4, 0xffffff, 1);
                card.setScale(1.1);
            } else {
                // Unselected kingdom
                bgRect.setStrokeStyle(2, 0xffffff, 0.8);
                card.setScale(1);
            }
        });
        
        // Show kingdom details
        this.showKingdomDetails(kingdom);
        
        // Show play button
        this.playButton.setVisible(true);
        
        // Flash the play button to draw attention
        this.tweens.add({
            targets: this.playButton,
            alpha: 0.7,
            duration: 300,
            yoyo: true,
            repeat: 2
        });
    }
    
    private createAmbientParticles(): void {
        // Create periodic ambient particles based on the element types
        const colors = [0xff6666, 0x66ccff, 0x66aa66, 0xccccff, 0xaaaaaa];
        
        this.time.addEvent({
            delay: 500,
            callback: () => {
                const color = colors[Math.floor(Math.random() * colors.length)];
                const x = Phaser.Math.Between(0, GAME_WIDTH);
                const y = Phaser.Math.Between(0, GAME_HEIGHT);
                
                const particle = this.add.circle(x, y, 2, color, 0.7);
                
                this.tweens.add({
                    targets: particle,
                    alpha: 0,
                    scale: 0,
                    y: y - 50,
                    duration: 2000,
                    onComplete: () => particle.destroy()
                });
            },
            loop: true
        });
    }
}

// Import this at the top of the file - add in the right place
const BOSS_NAMES = {
    [ElementType.FIRE]: 'Ignix, The Flame Tyrant',
    [ElementType.WATER]: 'Aquilla, The Tide Sovereign',
    [ElementType.EARTH]: 'Terron, The Mountain King',
    [ElementType.AIR]: 'Zephira, The Storm Empress',
    [ElementType.SPIRIT]: 'Etheria, The Void Harbinger'
};