import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ElementType, ELEMENT_COLORS } from '../config';
import { SCENES, EVENTS, BiomeType } from '../utils/constants';
import LoreSystem, { LoreEntry, LoreType } from '../systems/LoreSystems.ts';
import { createParticles } from '../utils/helpers';

export default class LoreScene extends Phaser.Scene {
    private background!: Phaser.GameObjects.Rectangle;
    private titleText!: Phaser.GameObjects.Text;
    private backButton!: Phaser.GameObjects.Text;
    private categoriesContainer!: Phaser.GameObjects.Container;
    private entriesContainer!: Phaser.GameObjects.Container;
    private detailContainer!: Phaser.GameObjects.Container;
    private selectedCategory: LoreType | 'all' = 'all';
    private selectedEntry: LoreEntry | null = null;
    private unlockedElementTypes: ElementType[] = [ElementType.SPIRIT];
    
    constructor() {
        super({ key: SCENES.LORE });
    }
    
    init(data: any): void {
        this.unlockedElementTypes = data.unlockedElements || [ElementType.SPIRIT];
        
        // Initialize the lore system
        LoreSystem.initialize();
    }
    
    create(): void {
        // Create a starry background
        this.createBackground();
        
        // Create title
        this.titleText = this.add.text(GAME_WIDTH / 2, 50, 'THE CHRONICLES OF ELYSIUM', {
            fontFamily: 'Arial',
            fontSize: '36px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.titleText.setOrigin(0.5, 0.5);
        
        // Create back button
        this.backButton = this.add.text(50, GAME_HEIGHT - 50, 'Back to Menu', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#222244',
            padding: { x: 20, y: 10 }
        });
        this.backButton.setInteractive({ useHandCursor: true });
        this.backButton.on('pointerover', () => this.backButton.setStyle({ color: '#aaddff' }));
        this.backButton.on('pointerout', () => this.backButton.setStyle({ color: '#ffffff' }));
        this.backButton.on('pointerup', () => {
            this.sound.play('collect', { volume: 0.3 });
            this.scene.start(SCENES.MAIN_MENU);
        });
        
        // Create category selection panel
        this.createCategoriesPanel();
        
        // Create entries list panel
        this.createEntriesPanel();
        
        // Create detail view panel
        this.createDetailPanel();
        
        // Load initial entries (all unlocked)
        this.refreshEntriesList('all');
        
        // Add ambient particle effects
        this.createAmbientParticles();
    }
    
    private createBackground(): void {
        // Dark background
        this.background = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000022);
        this.background.setOrigin(0, 0);
        
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
            const colors = [0x6677ff, 0xff6666, 0x66ccff, 0x66aa66, 0xccccff];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const nebula = this.add.circle(x, y, size, color, 0.05);
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
    
    private createCategoriesPanel(): void {
        this.categoriesContainer = this.add.container(50, 120);
        
        const categories = [
            { id: 'all', name: 'All Entries' },
            { id: LoreType.WORLD, name: 'World' },
            { id: LoreType.CHARACTER, name: 'Characters' },
            { id: LoreType.ELEMENT, name: 'Elements' },
            { id: LoreType.GUARDIAN, name: 'Guardians' },
            { id: LoreType.HISTORY, name: 'History' },
            { id: LoreType.DISSONANCE, name: 'The Dissonance' }
        ];
        
        let y = 0;
        categories.forEach(category => {
            const button = this.add.text(0, y, category.name, {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: this.selectedCategory === category.id ? '#ffffff' : '#aaaaaa',
                backgroundColor: this.selectedCategory === category.id ? '#444488' : '#222244',
                padding: { x: 20, y: 10 }
            });
            
            button.setInteractive({ useHandCursor: true });
            
            button.on('pointerover', () => {
                if (this.selectedCategory !== category.id) {
                    button.setStyle({ color: '#dddddd' });
                }
            });
            
            button.on('pointerout', () => {
                if (this.selectedCategory !== category.id) {
                    button.setStyle({ color: '#aaaaaa' });
                }
            });
            
            button.on('pointerup', () => {
                this.sound.play('collect', { volume: 0.3 });
                
                // Update selected category
                this.selectedCategory = category.id as LoreType | 'all';
                
                // Update button styles
                this.categoriesContainer.each(child => {
                    if (child instanceof Phaser.GameObjects.Text) {
                        child.setStyle({
                            color: '#aaaaaa',
                            backgroundColor: '#222244'
                        });
                    }
                });
                
                button.setStyle({
                    color: '#ffffff',
                    backgroundColor: '#444488'
                });
                
                // Refresh entries list
                this.refreshEntriesList(this.selectedCategory);
                
                // Hide detail view
                this.hideDetailView();
            });
            
            this.categoriesContainer.add(button);
            y += 50;
        });
    }
    
    private createEntriesPanel(): void {
        this.entriesContainer = this.add.container(300, 120);
        
        // Add mask to create scrollable area
        const maskGraphics = this.add.graphics();
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillRect(250, 120, 300, GAME_HEIGHT - 170);
        
        const mask = new Phaser.Display.Masks.GeometryMask(this, maskGraphics);
        this.entriesContainer.setMask(mask);
        
        // Setup scrolling with mouse wheel
        this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[], deltaX: number, deltaY: number) => {
            // Only scroll when mouse is over entries area
            if (pointer.x > 250 && pointer.x < 550 && pointer.y > 120 && pointer.y < GAME_HEIGHT - 50) {
                this.entriesContainer.y -= deltaY * 0.5;
                
                // Clamp scrolling
                const maxY = 120;
                const minY = Math.min(120, GAME_HEIGHT - this.entriesContainer.height - 50);
                this.entriesContainer.y = Phaser.Math.Clamp(this.entriesContainer.y, minY, maxY);
            }
        });
    }
    
    private createDetailPanel(): void {
        this.detailContainer = this.add.container(GAME_WIDTH - 300, 200);
        
        // Create background panel
        const panel = this.add.rectangle(0, 0, 500, GAME_HEIGHT - 250, 0x222244, 0.8);
        panel.setStrokeStyle(2, 0x6677ff, 1);
        this.detailContainer.add(panel);
        
        // Initially hidden
        this.detailContainer.setVisible(false);
    }
    
    private refreshEntriesList(category: LoreType | 'all'): void {
        // Clear existing entries
        this.entriesContainer.removeAll(true);
        this.entriesContainer.y = 120; // Reset scroll position
        
        // Get entries based on category
        let entries: LoreEntry[];
        
        if (category === 'all') {
            entries = LoreSystem.getUnlockedEntries();
        } else {
            entries = LoreSystem.getEntriesByType(category as LoreType);
        }
        
        // Create entry items
        let y = 0;
        entries.forEach(entry => {
            const entryItem = this.createEntryItem(entry, 0, y);
            this.entriesContainer.add(entryItem);
            y += 60;
        });
    }
    
    private createEntryItem(entry: LoreEntry, x: number, y: number): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        // Background rectangle
        let bgColor = 0x333355;
        
        // Use elemental color if applicable
        if (entry.relatedElement) {
            switch (entry.relatedElement) {
                case ElementType.FIRE: bgColor = 0x553333; break;
                case ElementType.WATER: bgColor = 0x335566; break;
                case ElementType.EARTH: bgColor = 0x335533; break;
                case ElementType.AIR: bgColor = 0x444466; break;
                case ElementType.SPIRIT: bgColor = 0x553366; break;
            }
        }
        
        const bg = this.add.rectangle(0, 0, 280, 50, bgColor, 0.8);
        bg.setStrokeStyle(1, 0x6677ff, 0.5);
        container.add(bg);
        
        // Entry title
        const title = this.add.text(-130, 0, entry.title, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            wordWrap: { width: 260 }
        });
        title.setOrigin(0, 0.5);
        container.add(title);
        
        // Add icon based on type
        let icon: Phaser.GameObjects.GameObject;
        
        switch (entry.type) {
            case LoreType.WORLD:
                icon = this.add.circle(-140, 0, 5, 0x66ccff);
                break;
                
            case LoreType.CHARACTER:
                icon = this.add.star(-140, 0, 5, 5, 7, 0xffdd44);
                break;
                
            case LoreType.ELEMENT:
                const elementColor = entry.relatedElement ? 
                    ELEMENT_COLORS[entry.relatedElement] : 0xffffff;
                icon = this.add.circle(-140, 0, 5, elementColor);
                break;
                
            case LoreType.GUARDIAN:
                icon = this.add.triangle(-140, 0, 0, -6, 5, 3, -5, 3, 0xffaa44);
                break;
                
            case LoreType.HISTORY:
                icon = this.add.rectangle(-140, 0, 8, 8, 0xaaaaaa);
                break;
                
            case LoreType.DISSONANCE:
                icon = this.add.circle(-140, 0, 5, 0xff44aa);
                const pulse = this.add.circle(-140, 0, 7, 0xff44aa, 0.3);
                container.add(pulse);
                this.tweens.add({
                    targets: pulse,
                    alpha: 0,
                    scale: 2,
                    duration: 2000,
                    repeat: -1
                });
                break;
                
            default:
                icon = this.add.circle(-140, 0, 5, 0xffffff);
        }
        
        container.add(icon);
        
        // Make item interactive
        bg.setInteractive({ useHandCursor: true });
        
        bg.on('pointerover', () => {
            bg.setStrokeStyle(2, 0x88aaff, 1);
            title.setStyle({ color: '#aaddff' });
        });
        
        bg.on('pointerout', () => {
            bg.setStrokeStyle(1, 0x6677ff, 0.5);
            title.setStyle({ color: '#ffffff' });
        });
        
        bg.on('pointerup', () => {
            this.sound.play('collect', { volume: 0.3 });
            this.selectEntry(entry);
        });
        
        return container;
    }
    
    private selectEntry(entry: LoreEntry): void {
        this.selectedEntry = entry;
        this.showDetailView(entry);
    }
    
    private showDetailView(entry: LoreEntry): void {
        // Clear existing content
        this.detailContainer.removeAll(true);
        
        // Create background panel
        const panel = this.add.rectangle(0, 0, 500, GAME_HEIGHT - 250, 0x222244, 0.8);
        panel.setStrokeStyle(2, 0x6677ff, 1);
        this.detailContainer.add(panel);
        
        // Entry title
        const title = this.add.text(0, -GAME_HEIGHT/2 + 200, entry.title, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2
        });
        title.setOrigin(0.5, 0.5);
        this.detailContainer.add(title);
        
        // Entry type
        let typeText: string;
        let typeColor: number;
        
        switch (entry.type) {
            case LoreType.WORLD:
                typeText = 'World Knowledge';
                typeColor = 0x66ccff;
                break;
                
            case LoreType.CHARACTER:
                typeText = 'Character Profile';
                typeColor = 0xffdd44;
                break;
                
            case LoreType.ELEMENT:
                typeText = 'Elemental Lore';
                typeColor = entry.relatedElement ? 
                    ELEMENT_COLORS[entry.relatedElement] : 0xffffff;
                break;
                
            case LoreType.GUARDIAN:
                typeText = 'Guardian Details';
                typeColor = 0xffaa44;
                break;
                
            case LoreType.HISTORY:
                typeText = 'Historical Record';
                typeColor = 0xaaaaaa;
                break;
                
            case LoreType.DISSONANCE:
                typeText = 'Dissonance Research';
                typeColor = 0xff44aa;
                break;
                
            default:
                typeText = 'Knowledge';
                typeColor = 0xffffff;
        }
        
        const type = this.add.text(0, -GAME_HEIGHT/2 + 230, typeText, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: this.rgbToHex(typeColor)
        });
        type.setOrigin(0.5, 0.5);
        this.detailContainer.add(type);
        
        // Create scroll container for content
        const contentContainer = this.add.container(0, -GAME_HEIGHT/2 + 280);
        this.detailContainer.add(contentContainer);
        
        // Entry content (with word wrapping)
        const content = this.add.text(0, 0, entry.content, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#cccccc',
            align: 'left',
            wordWrap: { width: 450 },
            lineSpacing: 8
        });
        content.setOrigin(0.5, 0);
        contentContainer.add(content);
        
        // Add scroll mask
        const maskGraphics = this.add.graphics();
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillRect(GAME_WIDTH - 550, 280, 500, GAME_HEIGHT - 380);
        
        const mask = new Phaser.Display.Masks.GeometryMask(this, maskGraphics);
        contentContainer.setMask(mask);
        
        // Add scroll indicators if content is taller than view
        if (content.height > GAME_HEIGHT - 380) {
            const scrollUp = this.add.triangle(0, -GAME_HEIGHT/2 + 275, 0, 0, 10, 10, -10, 10, 0x88aaff);
            scrollUp.setAlpha(0.7);
            this.detailContainer.add(scrollUp);
            
            const scrollDown = this.add.triangle(0, GAME_HEIGHT/2 - 145, 0, 10, 10, 0, -10, 0, 0x88aaff);
            scrollDown.setAlpha(0.7);
            this.detailContainer.add(scrollDown);
            
            // Setup scrolling with mouse wheel
            this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
                // Only scroll when mouse is over detail area
                if (pointer.x > GAME_WIDTH - 550 && pointer.y > 280 && pointer.y < GAME_HEIGHT - 100) {
                    contentContainer.y -= deltaY * 0.5;
                    
                    // Clamp scrolling
                    const maxY = -GAME_HEIGHT/2 + 280;
                    const minY = Math.min(-GAME_HEIGHT/2 + 280, -GAME_HEIGHT/2 + 280 - (content.height - (GAME_HEIGHT - 380)));
                    contentContainer.y = Phaser.Math.Clamp(contentContainer.y, minY, maxY);
                }
            });
        }
        
        // Add elemental decoration if relevant
        if (entry.relatedElement) {
            this.addElementalDecoration(entry.relatedElement);
        }
        
        // Show the panel
        this.detailContainer.setVisible(true);
    }
    
    private hideDetailView(): void {
        this.selectedEntry = null;
        this.detailContainer.setVisible(false);
    }
    
    private addElementalDecoration(element: ElementType): void {
        // Add element-themed decorations to the detail panel
        const color = ELEMENT_COLORS[element];
        
        // Add corner decorations
        const cornerSize = 20;
        
        // Top-left corner
        const topLeft = this.add.rectangle(-230, -GAME_HEIGHT/2 + 150, cornerSize, cornerSize, color, 0.3);
        topLeft.setOrigin(0, 0);
        this.detailContainer.add(topLeft);
        
        // Top-right corner
        const topRight = this.add.rectangle(230, -GAME_HEIGHT/2 + 150, cornerSize, cornerSize, color, 0.3);
        topRight.setOrigin(1, 0);
        this.detailContainer.add(topRight);
        
        // Bottom-left corner
        const bottomLeft = this.add.rectangle(-230, GAME_HEIGHT/2 - 130, cornerSize, cornerSize, color, 0.3);
        bottomLeft.setOrigin(0, 1);
        this.detailContainer.add(bottomLeft);
        
        // Bottom-right corner
        const bottomRight = this.add.rectangle(230, GAME_HEIGHT/2 - 130, cornerSize, cornerSize, color, 0.3);
        bottomRight.setOrigin(1, 1);
        this.detailContainer.add(bottomRight);
        
        // Add animated element effect based on element type
        switch (element) {
            case ElementType.FIRE:
                this.createFireEffect();
                break;
                
            case ElementType.WATER:
                this.createWaterEffect();
                break;
                
            case ElementType.EARTH:
                this.createEarthEffect();
                break;
                
            case ElementType.AIR:
                this.createAirEffect();
                break;
                
            case ElementType.SPIRIT:
                this.createSpiritEffect();
                break;
        }
    }
    
    private createFireEffect(): void {
        // Create periodic flame particles at the bottom of the panel
        this.time.addEvent({
            delay: 300,
            callback: () => {
                if (!this.detailContainer.visible) return;
                
                const x = Phaser.Math.Between(-200, 200);
                const flame = this.add.circle(x, GAME_HEIGHT/2 - 130, 5, 0xff6600, 0.7);
                flame.setBlendMode(Phaser.BlendModes.ADD);
                this.detailContainer.add(flame);
                
                this.tweens.add({
                    targets: flame,
                    y: GAME_HEIGHT/2 - 180,
                    alpha: 0,
                    scale: { from: 1, to: 0 },
                    duration: 1000 + Math.random() * 500,
                    onComplete: () => flame.destroy()
                });
            },
            loop: true
        });
    }
    
    private createWaterEffect(): void {
        // Create water ripple effects
        this.time.addEvent({
            delay: 500,
            callback: () => {
                if (!this.detailContainer.visible) return;
                
                const x = Phaser.Math.Between(-200, 200);
                const y = Phaser.Math.Between(-GAME_HEIGHT/2 + 200, GAME_HEIGHT/2 - 130);
                
                const ripple = this.add.circle(x, y, 3, 0x66ccff, 0.5);
                this.detailContainer.add(ripple);
                
                this.tweens.add({
                    targets: ripple,
                    scale: 5,
                    alpha: 0,
                    duration: 2000,
                    onComplete: () => ripple.destroy()
                });
            },
            loop: true
        });
    }
    
    private createEarthEffect(): void {
        // Create floating stone/crystal particles
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(-220, 220);
            const y = Phaser.Math.Between(-GAME_HEIGHT/2 + 200, GAME_HEIGHT/2 - 130);
            
            const crystal = this.add.rectangle(x, y, 5, 8, 0x66aa66, 0.4);
            crystal.setRotation(Math.random() * Math.PI);
            this.detailContainer.add(crystal);
            
            this.tweens.add({
                targets: crystal,
                angle: crystal.angle + 180,
                y: crystal.y - 20,
                duration: 8000 + Math.random() * 10000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }
    }
    
    private createAirEffect(): void {
        // Create floating wind particles
        this.time.addEvent({
            delay: 200,
            callback: () => {
                if (!this.detailContainer.visible) return;
                
                const side = Math.random() > 0.5 ? 1 : -1;
                const x = -250 * side;
                const y = Phaser.Math.Between(-GAME_HEIGHT/2 + 200, GAME_HEIGHT/2 - 130);
                
                const wind = this.add.rectangle(x, y, 15, 2, 0xccccff, 0.3);
                wind.setBlendMode(Phaser.BlendModes.ADD);
                this.detailContainer.add(wind);
                
                this.tweens.add({
                    targets: wind,
                    x: 250 * side,
                    alpha: 0,
                    duration: 3000 + Math.random() * 2000,
                    onComplete: () => wind.destroy()
                });
            },
            loop: true
        });
    }
    
    private createSpiritEffect(): void {
        // Create ethereal particles that fade in and out
        for (let i = 0; i < 8; i++) {
            const x = Phaser.Math.Between(-220, 220);
            const y = Phaser.Math.Between(-GAME_HEIGHT/2 + 200, GAME_HEIGHT/2 - 130);
            
            const spirit = this.add.circle(x, y, 4, 0xaaaaaa, 0.1);
            this.detailContainer.add(spirit);
            
            this.tweens.add({
                targets: spirit,
                alpha: { from: 0.1, to: 0.5 },
                scale: { from: 0.5, to: 1.5 },
                duration: 3000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // Random slow movement
            this.tweens.add({
                targets: spirit,
                x: spirit.x + Phaser.Math.Between(-50, 50),
                y: spirit.y + Phaser.Math.Between(-50, 50),
                duration: 8000 + Math.random() * 7000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
    
    private createAmbientParticles(): void {
        // Create occasional ambient particles
        this.time.addEvent({
            delay: 500,
            callback: () => {
                const x = Phaser.Math.Between(0, GAME_WIDTH);
                const y = Phaser.Math.Between(0, GAME_HEIGHT);
                
                // Choose a color based on unlocked elements
                const possibleColors = [0xaaaaaa]; // Spirit always available
                
                if (this.unlockedElementTypes.includes(ElementType.FIRE)) {
                    possibleColors.push(0xff6600);
                }
                if (this.unlockedElementTypes.includes(ElementType.WATER)) {
                    possibleColors.push(0x66ccff);
                }
                if (this.unlockedElementTypes.includes(ElementType.EARTH)) {
                    possibleColors.push(0x66aa66);
                }
                if (this.unlockedElementTypes.includes(ElementType.AIR)) {
                    possibleColors.push(0xccccff);
                }
                
                const color = possibleColors[Math.floor(Math.random() * possibleColors.length)];
                
                createParticles(this, x, y, color, 1, 20, 0.3, 2000);
            },
            loop: true
        });
    }
    
    // Helper method to convert RGB int to hex string
    private rgbToHex(color: number): string {
        return '#' + color.toString(16).padStart(6, '0');
    }
}