import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ElementType, ELEMENT_COLORS, ELEMENT_NAMES } from '../config';
import { SCENES, EVENTS } from '../utils/constants';
import UpgradeSystem, { UpgradeOption } from '../systems/UpgradeSystems.ts';
import { createParticles } from '../utils/helpers';

export default class UpgradeScene extends Phaser.Scene {
    private background!: Phaser.GameObjects.Rectangle;
    private titleText!: Phaser.GameObjects.Text;
    private essenceText!: Phaser.GameObjects.Text;
    private categoriesContainer!: Phaser.GameObjects.Container;
    private upgradesContainer!: Phaser.GameObjects.Container;
    private detailsContainer!: Phaser.GameObjects.Container;
    private backButton!: Phaser.GameObjects.Text;
    
    private currentCategory: string = 'all';
    private selectedUpgrade: UpgradeOption | null = null;
    private upgradeCards: Phaser.GameObjects.Container[] = [];
    private unlockedElements: ElementType[] = [ElementType.SPIRIT];
    private playerLevel: number = 1;
    
    constructor() {
        super({ key: SCENES.UPGRADE });
    }
    
    init(data: any): void {
        this.unlockedElements = data.unlockedElements || [ElementType.SPIRIT];
        this.playerLevel = data.level || 1;
    }
    
    create(): void {
        // Initialize the upgrade system if not already
        UpgradeSystem.initialize();
        
        // Create UI components
        this.createBackground();
        this.createTitleBar();
        this.createCategoriesMenu();
        this.createUpgradesContainer();
        this.createDetailsPanel();
        this.createBackButton();
        
        // Load upgrades
        this.refreshUpgradesList();
        
        // Add ambient particle effects
        this.createAmbientParticles();
    }
    
    private createBackground(): void {
        // Dark semi-transparent background
        this.background = this.add.rectangle(
            0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8
        );
        this.background.setOrigin(0, 0);
        
        // Add ethereal glow effect
        const glow = this.add.circle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2, 
            Math.max(GAME_WIDTH, GAME_HEIGHT) / 2, 
            0x3333aa, 0.1
        );
        
        // Slowly pulsate the glow
        this.tweens.add({
            targets: glow,
            scale: 1.1,
            alpha: 0.05,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    private createTitleBar(): void {
        // Title
        this.titleText = this.add.text(GAME_WIDTH / 2, 50, 'SPIRIT SHIFT - UPGRADES', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.titleText.setOrigin(0.5, 0.5);
        
        // Soul Essence counter
        const essence = UpgradeSystem.getSoulEssence();
        this.essenceText = this.add.text(GAME_WIDTH - 50, 50, `Soul Essence: ${essence}`, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#aa88ff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.essenceText.setOrigin(1, 0.5);
        
        // Add glow effect to essence counter
        this.tweens.add({
            targets: this.essenceText,
            y: 55,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Periodically create a subtle particle effect around the essence counter
        this.time.addEvent({
            delay: 500,
            callback: () => {
                createParticles(
                    this,
                    this.essenceText.x - 100,
                    this.essenceText.y,
                    0x6677ff,
                    1,
                    20,
                    0.5,
                    1000
                );
            },
            loop: true
        });
    }
    
    private createCategoriesMenu(): void {
        this.categoriesContainer = this.add.container(50, 120);
        
        const categories = [
            { id: 'all', name: 'All Upgrades' },
            { id: 'stats', name: 'Base Stats' },
            { id: 'abilities', name: 'Abilities' },
            { id: 'fire', name: 'Fire Spirit' },
            { id: 'water', name: 'Water Spirit' },
            { id: 'earth', name: 'Earth Spirit' },
            { id: 'air', name: 'Air Spirit' },
            { id: 'spirit', name: 'Base Spirit' }
        ];
        
        let y = 0;
        categories.forEach(category => {
            // Only show element categories for unlocked elements
            if (['fire', 'water', 'earth', 'air', 'spirit'].includes(category.id)) {
                const elementType = ElementType[category.id.toUpperCase() as keyof typeof ElementType];
                if (!this.unlockedElements.includes(elementType) && category.id !== 'spirit') {
                    return;
                }
            }
            
            // Create category button
            const button = this.add.text(0, y, category.name, {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: this.currentCategory === category.id ? '#ffffff' : '#aaaaaa',
                backgroundColor: this.currentCategory === category.id ? '#444488' : '#222244',
                padding: { x: 20, y: 10 }
            });
            
            button.setInteractive({ useHandCursor: true });
            
            // Add hover and click effects
            button.on('pointerover', () => {
                if (this.currentCategory !== category.id) {
                    button.setStyle({ color: '#dddddd' });
                }
            });
            
            button.on('pointerout', () => {
                if (this.currentCategory !== category.id) {
                    button.setStyle({ color: '#aaaaaa' });
                }
            });
            
            button.on('pointerup', () => {
                // Change category
                this.sound.play('collect', { volume: 0.3 });
                this.currentCategory = category.id;
                this.refreshUpgradesList();
                
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
            });
            
            this.categoriesContainer.add(button);
            y += 50;
        });
    }
    
    private createUpgradesContainer(): void {
        // Create scrollable container for upgrades
        this.upgradesContainer = this.add.container(300, 120);
    }
    
    private createDetailsPanel(): void {
        // Create container for upgrade details
        this.detailsContainer = this.add.container(GAME_WIDTH - 300, 200);
        
        // Background panel
        const panel = this.add.rectangle(0, 0, 500, 500, 0x222244, 0.8);
        panel.setStrokeStyle(2, 0x6677ff, 1);
        this.detailsContainer.add(panel);
        
        // Hide initially (will be shown when an upgrade is selected)
        this.detailsContainer.setVisible(false);
    }
    
    private createBackButton(): void {
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
    }
    
    private refreshUpgradesList(): void {
        // Clear existing upgrade cards
        this.upgradesContainer.removeAll(true);
        this.upgradeCards = [];
        
        // Get available upgrades
        const allAvailableUpgrades = UpgradeSystem.getAvailableUpgrades(
            this.playerLevel,
            this.unlockedElements
        );
        
        // Filter based on current category
        let upgrades: UpgradeOption[] = [];
        
        switch (this.currentCategory) {
            case 'all':
                upgrades = allAvailableUpgrades;
                break;
            case 'stats':
                upgrades = allAvailableUpgrades.filter(u => 
                    ['maxHealth', 'maxEnergy', 'damage', 'speed', 'jumpPower', 'energyRegen'].includes(u.id));
                break;
            case 'abilities':
                upgrades = allAvailableUpgrades.filter(u => 
                    u.isAbility && !u.requiredElement);
                break;
            case 'fire':
                upgrades = allAvailableUpgrades.filter(u => 
                    u.requiredElement === ElementType.FIRE);
                break;
            case 'water':
                upgrades = allAvailableUpgrades.filter(u => 
                    u.requiredElement === ElementType.WATER);
                break;
            case 'earth':
                upgrades = allAvailableUpgrades.filter(u => 
                    u.requiredElement === ElementType.EARTH);
                break;
            case 'air':
                upgrades = allAvailableUpgrades.filter(u => 
                    u.requiredElement === ElementType.AIR);
                break;
            case 'spirit':
                upgrades = allAvailableUpgrades.filter(u => 
                    u.requiredElement === ElementType.SPIRIT);
                break;
        }
        
        // Create upgrade cards
        const cardsPerRow = 2;
        const cardWidth = 350;
        const cardHeight = 180;
        const cardSpacing = 20;
        
        upgrades.forEach((upgrade, index) => {
            const row = Math.floor(index / cardsPerRow);
            const col = index % cardsPerRow;
            const x = col * (cardWidth + cardSpacing);
            const y = row * (cardHeight + cardSpacing);
            
            const card = this.createUpgradeCard(upgrade, x, y);
            this.upgradesContainer.add(card);
            this.upgradeCards.push(card);
        });
        
        // Reset selected upgrade
        this.selectedUpgrade = null;
        this.detailsContainer.setVisible(false);
    }
    
    private createUpgradeCard(upgrade: UpgradeOption, x: number, y: number): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        // Background
        const bg = this.add.rectangle(0, 0, 350, 180, 0x333355, 0.8);
        bg.setStrokeStyle(2, 0x6677ff, 1);
        container.add(bg);
        
        // Title
        const titleText = this.add.text(-155, -70, upgrade.name, {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        container.add(titleText);
        
        // Description (truncated)
        const descText = this.add.text(-155, -30, this.truncateText(upgrade.description, 45), {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#cccccc',
            wordWrap: { width: 330 }
        });
        container.add(descText);
        
        // Level indicator
        const levelText = this.add.text(-155, 20, 
            `Level: ${upgrade.currentLevel}/${upgrade.maxLevel}`, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#88aaff'
        });
        container.add(levelText);
        
        // Cost
        const costText = this.add.text(-155, 50, `Cost: ${upgrade.cost} Soul Essence`, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: UpgradeSystem.getSoulEssence() >= upgrade.cost ? '#88ff88' : '#ff8888'
        });
        container.add(costText);
        
        // Element requirement indicator (if any)
        if (upgrade.requiredElement) {
            const elementName = ELEMENT_NAMES[upgrade.requiredElement];
            const elementColor = ELEMENT_COLORS[upgrade.requiredElement];
            
            const elementText = this.add.text(130, -70, elementName, {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff'
            });
            elementText.setOrigin(1, 0);
            container.add(elementText);
            
            // Element icon
            const elementIcon = this.add.circle(150, -60, 10, elementColor);
            container.add(elementIcon);
        }
        
        // Make card interactive
        bg.setInteractive({ useHandCursor: true });
        
        // Hover effects
        bg.on('pointerover', () => {
            bg.setStrokeStyle(3, 0x88aaff, 1);
            this.showUpgradeDetails(upgrade);
            
            // Scale effect
            this.tweens.add({
                targets: container,
                scale: 1.05,
                duration: 100
            });
        });
        
        bg.on('pointerout', () => {
            bg.setStrokeStyle(2, 0x6677ff, 1);
            
            // Return to normal scale
            this.tweens.add({
                targets: container,
                scale: 1,
                duration: 100
            });
        });
        
        // Click to purchase
        bg.on('pointerup', () => {
            this.tryPurchaseUpgrade(upgrade);
        });
        
        return container;
    }
    
    private truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + '...';
    }
    
    private showUpgradeDetails(upgrade: UpgradeOption): void {
        this.selectedUpgrade = upgrade;
        this.detailsContainer.setVisible(true);
        
        // Clear previous details
        this.detailsContainer.removeAll(true);
        
        // Re-add background panel
        const panel = this.add.rectangle(0, 0, 500, 500, 0x222244, 0.8);
        panel.setStrokeStyle(2, 0x6677ff, 1);
        this.detailsContainer.add(panel);
        
        // Title
        const titleText = this.add.text(0, -220, upgrade.name, {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        titleText.setOrigin(0.5, 0.5);
        this.detailsContainer.add(titleText);
        
        // Description
        const descText = this.add.text(0, -160, upgrade.description, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#cccccc',
            align: 'center',
            wordWrap: { width: 450 }
        });
        descText.setOrigin(0.5, 0.5);
        this.detailsContainer.add(descText);
        
        // Level and Progress
        const levelText = this.add.text(0, -90, 
            `Level: ${upgrade.currentLevel}/${upgrade.maxLevel}`, {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#88aaff'
        });
        levelText.setOrigin(0.5, 0.5);
        this.detailsContainer.add(levelText);
        
        // Progress bar background
        const progressBg = this.add.rectangle(0, -50, 400, 20, 0x222222);
        this.detailsContainer.add(progressBg);
        
        // Progress bar fill
        const progressFill = this.add.rectangle(
            -200 + (400 * (upgrade.currentLevel / upgrade.maxLevel) / 2), 
            -50, 
            400 * (upgrade.currentLevel / upgrade.maxLevel), 
            16, 
            0x4477ff
        );
        progressFill.setOrigin(0, 0.5);
        this.detailsContainer.add(progressFill);
        
        // Cost
        const costText = this.add.text(0, 0, `Cost: ${upgrade.cost} Soul Essence`, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: UpgradeSystem.getSoulEssence() >= upgrade.cost ? '#88ff88' : '#ff8888'
        });
        costText.setOrigin(0.5, 0.5);
        this.detailsContainer.add(costText);
        
        // Requirements section
        let requirementsText = '';
        
        if (upgrade.requiredLevel) {
            requirementsText += `Required Level: ${upgrade.requiredLevel}\n`;
        }
        
        if (upgrade.requiredElement) {
            requirementsText += `Required Element: ${ELEMENT_NAMES[upgrade.requiredElement]}\n`;
        }
        
        if (upgrade.requiredUpgrade) {
            const prerequisite = UpgradeSystem.getUpgradeById(upgrade.requiredUpgrade);
            if (prerequisite) {
                requirementsText += `Required Upgrade: ${prerequisite.name}\n`;
            }
        }
        
        if (requirementsText) {
            const reqLabel = this.add.text(0, 50, 'Requirements:', {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffdd88',
                align: 'center'
            });
            reqLabel.setOrigin(0.5, 0.5);
            this.detailsContainer.add(reqLabel);
            
            const reqText = this.add.text(0, 90, requirementsText, {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#cccccc',
                align: 'center'
            });
            reqText.setOrigin(0.5, 0.5);
            this.detailsContainer.add(reqText);
        }
        
        // Purchase button
        const purchaseButton = this.add.text(0, 180, 'Purchase Upgrade', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: UpgradeSystem.getSoulEssence() >= upgrade.cost ? '#446688' : '#555555',
            padding: { x: 20, y: 10 }
        });
        purchaseButton.setOrigin(0.5, 0.5);
        
        if (UpgradeSystem.getSoulEssence() >= upgrade.cost) {
            purchaseButton.setInteractive({ useHandCursor: true });
            
            purchaseButton.on('pointerover', () => {
                purchaseButton.setStyle({ color: '#aaddff' });
            });
            
            purchaseButton.on('pointerout', () => {
                purchaseButton.setStyle({ color: '#ffffff' });
            });
            
            purchaseButton.on('pointerup', () => {
                this.tryPurchaseUpgrade(upgrade);
            });
        }
        
        this.detailsContainer.add(purchaseButton);
    }
    
    private tryPurchaseUpgrade(upgrade: UpgradeOption): void {
        if (UpgradeSystem.getSoulEssence() < upgrade.cost) {
            // Not enough essence
            this.sound.play('hit', { volume: 0.3 });
            
            // Flash the essence counter red
            this.essenceText.setColor('#ff5555');
            this.time.delayedCall(300, () => {
                this.essenceText.setColor('#aa88ff');
            });
            return;
        }
        
        // Purchase the upgrade
        const success = UpgradeSystem.applyUpgrade(upgrade.id);
        
        if (success) {
            // Play success sound
            this.sound.play('collect', { volume: 0.5 });
            
            // Update UI
            this.essenceText.setText(`Soul Essence: ${UpgradeSystem.getSoulEssence()}`);
            
            // Flash effect
            this.cameras.main.flash(300, 0, 100, 255, true);
            
            // Create particles at cursor
            const pointer = this.input.activePointer;
            createParticles(
                this,
                pointer.x,
                pointer.y,
                0x88aaff,
                20,
                100,
                1,
                1000
            );
            
            // Refresh the upgrades list
            this.refreshUpgradesList();
        } else {
            // Play failure sound
            this.sound.play('hit', { volume: 0.3 });
        }
    }
    
    private createAmbientParticles(): void {
        // Create periodic ambient particles in the background
        this.time.addEvent({
            delay: 200,
            callback: () => {
                const x = Phaser.Math.Between(0, GAME_WIDTH);
                const y = Phaser.Math.Between(0, GAME_HEIGHT);
                
                createParticles(
                    this,
                    x,
                    y,
                    0x6677ff,
                    1,
                    30,
                    0.3,
                    2000
                );
            },
            loop: true
        });
    }
}