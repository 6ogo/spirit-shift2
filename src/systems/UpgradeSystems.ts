import { ElementType } from '../config';
import { STORAGE_KEYS } from '../utils/constants';

export interface PlayerUpgrades {
    maxHealth: number;
    maxEnergy: number;
    damage: number;
    speed: number;
    jumpPower: number;
    energyRegen: number;
    
    // Element-specific upgrades
    fireSpeedBoost: number;
    fireEnergyRegenBoost: number;
    waterFloatTime: number;
    earthJumpBoost: number;
    earthDamageResist: number;
    airFloatiness: number;
    
    // Special abilities unlocked
    doubleJump: boolean;
    dashAbility: boolean;
    chargeAttack: boolean;
    elementalCombo: boolean;
    
    // Element-specific abilities
    fireTrail: boolean;
    fireExplosion: boolean;
    waterShield: boolean;
    waterSurfing: boolean;
    earthQuake: boolean;
    earthShield: boolean;
    airDash: boolean;
    airTornado: boolean;
    spiritDoppelganger: boolean;
    spiritPhasing: boolean;
}

export interface UpgradeOption {
    id: string;
    name: string;
    description: string;
    cost: number;
    maxLevel: number;
    currentLevel: number;
    valuePerLevel: number;
    requiredElement?: ElementType;
    requiredLevel?: number;
    requiredUpgrade?: string;
    isAbility: boolean;
}

export default class UpgradeSystem {
    private static readonly INITIAL_UPGRADES: PlayerUpgrades = {
        maxHealth: 100,
        maxEnergy: 100,
        damage: 1.0,
        speed: 1.0,
        jumpPower: 1.0,
        energyRegen: 1.0,
        
        fireSpeedBoost: 1.0,
        fireEnergyRegenBoost: 1.0,
        waterFloatTime: 1.0,
        earthJumpBoost: 1.0,
        earthDamageResist: 1.0,
        airFloatiness: 1.0,
        
        doubleJump: false,
        dashAbility: false,
        chargeAttack: false,
        elementalCombo: false,
        
        fireTrail: false,
        fireExplosion: false,
        waterShield: false,
        waterSurfing: false,
        earthQuake: false,
        earthShield: false,
        airDash: false,
        airTornado: false,
        spiritDoppelganger: false,
        spiritPhasing: false
    };
    
    private static readonly UPGRADE_OPTIONS: UpgradeOption[] = [
        // Base stats upgrades
        {
            id: 'maxHealth',
            name: 'Max Health',
            description: 'Increase your maximum health.',
            cost: 5,
            maxLevel: 10,
            currentLevel: 0,
            valuePerLevel: 10,
            isAbility: false
        },
        {
            id: 'maxEnergy',
            name: 'Max Energy',
            description: 'Increase your maximum energy.',
            cost: 5,
            maxLevel: 10,
            currentLevel: 0,
            valuePerLevel: 10,
            isAbility: false
        },
        {
            id: 'damage',
            name: 'Attack Power',
            description: 'Increase the damage of your attacks.',
            cost: 8,
            maxLevel: 10,
            currentLevel: 0,
            valuePerLevel: 0.1,
            isAbility: false
        },
        {
            id: 'speed',
            name: 'Movement Speed',
            description: 'Increase your movement speed.',
            cost: 7,
            maxLevel: 10,
            currentLevel: 0,
            valuePerLevel: 0.05,
            isAbility: false
        },
        {
            id: 'jumpPower',
            name: 'Jump Height',
            description: 'Increase your jump height.',
            cost: 6,
            maxLevel: 8,
            currentLevel: 0,
            valuePerLevel: 0.1,
            isAbility: false
        },
        {
            id: 'energyRegen',
            name: 'Energy Regeneration',
            description: 'Increase your energy regeneration rate.',
            cost: 7,
            maxLevel: 10,
            currentLevel: 0,
            valuePerLevel: 0.1,
            isAbility: false
        },
        
        // Element-specific stat upgrades
        {
            id: 'fireSpeedBoost',
            name: 'Fire Momentum',
            description: 'Further increase movement speed when in Fire form.',
            cost: 8,
            maxLevel: 5,
            currentLevel: 0,
            valuePerLevel: 0.1,
            requiredElement: ElementType.FIRE,
            requiredLevel: 2,
            isAbility: false
        },
        {
            id: 'fireEnergyRegenBoost',
            name: 'Inner Flame',
            description: 'Further increase energy regeneration in Fire form.',
            cost: 8,
            maxLevel: 5,
            currentLevel: 0,
            valuePerLevel: 0.1,
            requiredElement: ElementType.FIRE,
            requiredLevel: 3,
            isAbility: false
        },
        {
            id: 'waterFloatTime',
            name: 'Water Surface Tension',
            description: 'Extend float time during jumps in Water form.',
            cost: 8,
            maxLevel: 5,
            currentLevel: 0,
            valuePerLevel: 0.2,
            requiredElement: ElementType.WATER,
            requiredLevel: 2,
            isAbility: false
        },
        {
            id: 'earthJumpBoost',
            name: 'Earth Propulsion',
            description: 'Further increase jump height in Earth form.',
            cost: 8,
            maxLevel: 5,
            currentLevel: 0,
            valuePerLevel: 0.1,
            requiredElement: ElementType.EARTH,
            requiredLevel: 2,
            isAbility: false
        },
        {
            id: 'earthDamageResist',
            name: 'Stonehide',
            description: 'Further increase damage resistance in Earth form.',
            cost: 9,
            maxLevel: 5,
            currentLevel: 0,
            valuePerLevel: 0.05,
            requiredElement: ElementType.EARTH,
            requiredLevel: 3,
            isAbility: false
        },
        {
            id: 'airFloatiness',
            name: 'Zephyr\'s Grace',
            description: 'Increase floatiness and fall control in Air form.',
            cost: 8,
            maxLevel: 5,
            currentLevel: 0,
            valuePerLevel: 0.1,
            requiredElement: ElementType.AIR,
            requiredLevel: 2,
            isAbility: false
        },
        
        // General abilities
        {
            id: 'doubleJump',
            name: 'Double Jump',
            description: 'Unlock the ability to jump a second time in mid-air.',
            cost: 25,
            maxLevel: 1,
            currentLevel: 0,
            valuePerLevel: 1,
            requiredLevel: 3,
            isAbility: true
        },
        {
            id: 'dashAbility',
            name: 'Spirit Dash',
            description: 'Unlock a quick dash ability (press SHIFT).',
            cost: 30,
            maxLevel: 1,
            currentLevel: 0,
            valuePerLevel: 1,
            requiredLevel: 4,
            isAbility: true
        },
        {
            id: 'chargeAttack',
            name: 'Charge Attack',
            description: 'Hold attack button to charge a more powerful shot.',
            cost: 35,
            maxLevel: 1,
            currentLevel: 0,
            valuePerLevel: 1,
            requiredLevel: 5,
            isAbility: true
        },
        {
            id: 'elementalCombo',
            name: 'Elemental Resonance',
            description: 'Rapidly switching elements creates a combo effect.',
            cost: 50,
            maxLevel: 1,
            currentLevel: 0,
            valuePerLevel: 1,
            requiredLevel: 7,
            isAbility: true
        },
        
        // Element-specific abilities
        {
            id: 'fireTrail',
            name: 'Flame Trail',
            description: 'Leave a trail of fire when moving in Fire form.',
            cost: 15,
            maxLevel: 1,
            currentLevel: 0,
            valuePerLevel: 1,
            requiredElement: ElementType.FIRE,
            requiredLevel: 3,
            isAbility: true
        },
        {
            id: 'fireExplosion',
            name: 'Fire Blast',
            description: 'Fire projectiles explode on impact, dealing area damage.',
            cost: 25,
            maxLevel: 1,
            currentLevel: 0,
            valuePerLevel: 1,
            requiredElement: ElementType.FIRE,
            requiredLevel: 5,
            requiredUpgrade: 'fireTrail',
            isAbility: true
        },
        {
            id: 'waterShield',
            name: 'Aqua Shield',
            description: 'Periodically generate a water shield that blocks damage.',
            cost: 20,
            maxLevel: 1,
            currentLevel: 0,
            valuePerLevel: 1,
            requiredElement: ElementType.WATER,
            requiredLevel: 3,
            isAbility: true
        },
        {
            id: 'waterSurfing',
            name: 'Water Surfing',
            description: 'Move faster on ground and water surfaces in Water form.',
            cost: 25,
            maxLevel: 1,
            currentLevel: 0,
            valuePerLevel: 1,
            requiredElement: ElementType.WATER,
            requiredLevel: 5,
            requiredUpgrade: 'waterShield',
            isAbility: true
        },
        {
            id: 'earthQuake',
            name: 'Seismic Slam',
            description: 'Jump and press DOWN to create an earthquake on landing.',
            cost: 20,
            maxLevel: 1,
            currentLevel: 0,
            valuePerLevel: 1,
            requiredElement: ElementType.EARTH,
            requiredLevel: 3,
            isAbility: true
        },
        {
            id: 'earthShield',
            name: 'Stone Armor',
            description: 'Temporarily become invulnerable but slower in Earth form.',
            cost: 25,
            maxLevel: 1,
            currentLevel: 0,
            valuePerLevel: 1,
            requiredElement: ElementType.EARTH,
            requiredLevel: 5,
            requiredUpgrade: 'earthQuake',
            isAbility: true
        },
        {
            id: 'airDash',
            name: 'Air Dash',
            description: 'Perform multiple mid-air dashes in Air form.',
            cost: 20,
            maxLevel: 1,
            currentLevel: 0,
            valuePerLevel: 1,
            requiredElement: ElementType.AIR,
            requiredLevel: 3,
            isAbility: true
        },
        {
            id: 'airTornado',
            name: 'Cyclone',
            description: 'Create a damaging tornado that pulls in enemies.',
            cost: 25,
            maxLevel: 1,
            currentLevel: 0,
            valuePerLevel: 1,
            requiredElement: ElementType.AIR,
            requiredLevel: 5,
            requiredUpgrade: 'airDash',
            isAbility: true
        },
        {
            id: 'spiritDoppelganger',
            name: 'Spirit Echo',
            description: 'Create a spirit copy that mimics your actions.',
            cost: 30,
            maxLevel: 1,
            currentLevel: 0,
            valuePerLevel: 1,
            requiredElement: ElementType.SPIRIT,
            requiredLevel: 4,
            isAbility: true
        },
        {
            id: 'spiritPhasing',
            name: 'Phase Shift',
            description: 'Temporarily become intangible and pass through obstacles.',
            cost: 35,
            maxLevel: 1,
            currentLevel: 0,
            valuePerLevel: 1,
            requiredElement: ElementType.SPIRIT,
            requiredLevel: 6,
            requiredUpgrade: 'spiritDoppelganger',
            isAbility: true
        }
    ];
    
    private static totalSoulEssence: number = 0;
    private static upgrades: PlayerUpgrades = { ...UpgradeSystem.INITIAL_UPGRADES };
    private static upgradeOptions: UpgradeOption[] = JSON.parse(JSON.stringify(UpgradeSystem.UPGRADE_OPTIONS));
    private static unlocked: boolean = false;
    
    /**
     * Initialize the upgrade system
     */
    public static initialize(): void {
        this.loadState();
    }
    
    /**
     * Add soul essence to the player's total
     */
    public static addSoulEssence(amount: number): void {
        this.totalSoulEssence += amount;
        this.saveState();
    }
    
    /**
     * Get the total soul essence
     */
    public static getSoulEssence(): number {
        return this.totalSoulEssence;
    }
    
    /**
     * Get all upgrade options
     */
    public static getUpgradeOptions(): UpgradeOption[] {
        return this.upgradeOptions;
    }
    
    /**
     * Get available upgrade options based on player progress
     */
    public static getAvailableUpgrades(playerLevel: number, unlockedElements: ElementType[]): UpgradeOption[] {
        return this.upgradeOptions.filter(upgrade => {
            // Check if already at max level
            if (upgrade.currentLevel >= upgrade.maxLevel) {
                return false;
            }
            
            // Check level requirements
            if (upgrade.requiredLevel && playerLevel < upgrade.requiredLevel) {
                return false;
            }
            
            // Check element requirements
            if (upgrade.requiredElement && !unlockedElements.includes(upgrade.requiredElement)) {
                return false;
            }
            
            // Check prerequisite upgrades
            if (upgrade.requiredUpgrade) {
                const prerequisite = this.upgradeOptions.find(u => u.id === upgrade.requiredUpgrade);
                if (!prerequisite || prerequisite.currentLevel === 0) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    /**
     * Get a specific upgrade option by ID
     */
    public static getUpgradeById(id: string): UpgradeOption | undefined {
        return this.upgradeOptions.find(upgrade => upgrade.id === id);
    }
    
    /**
     * Get the current player upgrades
     */
    public static getPlayerUpgrades(): PlayerUpgrades {
        return { ...this.upgrades };
    }
    
    /**
     * Apply an upgrade
     */
    public static applyUpgrade(id: string): boolean {
        const upgrade = this.getUpgradeById(id);
        
        if (!upgrade) {
            console.error(`Upgrade with ID ${id} not found`);
            return false;
        }
        
        // Check if already at max level
        if (upgrade.currentLevel >= upgrade.maxLevel) {
            console.error(`Upgrade ${upgrade.name} already at max level`);
            return false;
        }
        
        // Check if player has enough soul essence
        if (this.totalSoulEssence < upgrade.cost) {
            console.error(`Not enough soul essence to purchase ${upgrade.name}`);
            return false;
        }
        
        // Apply the upgrade
        this.totalSoulEssence -= upgrade.cost;
        upgrade.currentLevel += 1;
        
        // Update the corresponding upgrade value
        if (upgrade.isAbility) {
            // For abilities (boolean values)
            (this.upgrades as any)[id] = true;
        } else {
            // For stat upgrades
            const currentValue = this.upgrades[id as keyof PlayerUpgrades] as number;
            const newValue = id === 'maxHealth' || id === 'maxEnergy' 
                ? currentValue + upgrade.valuePerLevel 
                : currentValue + upgrade.valuePerLevel;
            
            (this.upgrades as any)[id] = newValue;
        }
        
        // Increase cost for next level
        upgrade.cost = Math.floor(upgrade.cost * 1.5);
        
        // Save state
        this.saveState();
        
        return true;
    }
    
    /**
     * Reset all upgrades (for testing or new game+)
     */
    public static resetUpgrades(refundEssence: boolean = true): void {
        // Optionally refund spent essence
        if (refundEssence) {
            let refundAmount = 0;
            this.upgradeOptions.forEach(upgrade => {
                for (let i = 0; i < upgrade.currentLevel; i++) {
                    refundAmount += Math.floor(upgrade.cost / Math.pow(1.5, i));
                }
            });
            this.totalSoulEssence += refundAmount;
        }
        
        // Reset upgrades to initial values
        this.upgrades = { ...this.INITIAL_UPGRADES };
        
        // Reset upgrade options
        this.upgradeOptions = JSON.parse(JSON.stringify(this.UPGRADE_OPTIONS));
        
        // Save state
        this.saveState();
    }
    
    /**
     * Save upgrade state to local storage
     */
    public static saveState(): void {
        try {
            const saveData = {
                totalSoulEssence: this.totalSoulEssence,
                upgrades: this.upgrades,
                upgradeOptions: this.upgradeOptions,
                unlocked: this.unlocked
            };
            
            localStorage.setItem(STORAGE_KEYS.UPGRADES, JSON.stringify(saveData));
            
        } catch (error) {
            console.error('Failed to save upgrade state:', error);
        }
    }
    
    /**
     * Load upgrade state from local storage
     */
    public static loadState(): void {
        try {
            const saveData = localStorage.getItem(STORAGE_KEYS.UPGRADES);
            if (saveData) {
                const data = JSON.parse(saveData);
                this.totalSoulEssence = data.totalSoulEssence || 0;
                this.upgrades = data.upgrades || { ...this.INITIAL_UPGRADES };
                this.upgradeOptions = data.upgradeOptions || JSON.parse(JSON.stringify(this.UPGRADE_OPTIONS));
                this.unlocked = data.unlocked || false;
            } else {
                // Initialize with default values if no save data exists
                this.totalSoulEssence = 0;
                this.upgrades = { ...this.INITIAL_UPGRADES };
                this.upgradeOptions = JSON.parse(JSON.stringify(this.UPGRADE_OPTIONS));
                this.unlocked = false;
            }
        } catch (error) {
            console.error('Failed to load upgrade state:', error);
            
            // Fall back to defaults
            this.totalSoulEssence = 0;
            this.upgrades = { ...this.INITIAL_UPGRADES };
            this.upgradeOptions = JSON.parse(JSON.stringify(this.UPGRADE_OPTIONS));
            this.unlocked = false;
        }
    }
    
    /**
     * Check if the upgrade system has been unlocked
     */
    public static isUnlocked(): boolean {
        return this.unlocked;
    }
    
    /**
     * Unlock the upgrade system
     */
    public static unlock(): void {
        this.unlocked = true;
        this.saveState();
    }
}