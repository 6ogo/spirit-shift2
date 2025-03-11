import { ElementType } from '../config';
import { STORAGE_KEYS, BiomeType } from '../utils/constants';

// Interfaces
export interface LoreEntry {
    id: string;
    title: string;
    content: string;
    type: LoreType;
    isUnlocked: boolean;
    relatedElement?: ElementType;
    relatedBiome?: BiomeType;
    sortOrder: number;
}

export enum LoreType {
    WORLD = 'world',
    CHARACTER = 'character',
    ELEMENT = 'element',
    GUARDIAN = 'guardian',
    HISTORY = 'history',
    DISSONANCE = 'dissonance'
}

export default class LoreSystem {
    private static loreEntries: LoreEntry[] = [
        // World Lore
        {
            id: 'world-elysium',
            title: 'Elysium: The Elemental Realm',
            content: `Elysium exists as a plane where elemental forces manifest physically - a realm of pure elemental energy balanced delicately between five primal forces: Fire, Water, Earth, Air, and Spirit.

For thousands of years, the elemental kingdoms of Elysium thrived in harmony, each governed by a powerful Guardian who embodied their element's purest form. These Guardians maintained balance, ensuring no single element would dominate.

The landscape of Elysium reflects this elemental diversity: from the molten Scorched Peaks, to the crystalline depths of the underwater caverns, the vibrant Living Groves of earth, the floating islands of the Windswept Heights, and at the center, the mystical Void Realm where Spirit energy flows most strongly.

But harmony rarely lasts forever. When The Dissonance appeared - a corruption of unknown origin - it began to twist the elemental energies and turn the Guardians against each other. Now Elysium stands on the brink of elemental chaos.`,
            type: LoreType.WORLD,
            isUnlocked: true,
            sortOrder: 1
        },
        {
            id: 'world-dissonance',
            title: 'The Dissonance',
            content: `The Dissonance first manifested as subtle distortions in elemental energy flows - barely noticeable shifts that gradually intensified. Some scholars believe it emerged from an imbalance in the elemental forces, while others suspect outside interference.

What is known is that The Dissonance corrupts elemental energy, twisting it into chaotic forms. Creatures touched by it become aggressive and distorted versions of themselves. Even the mighty Guardians have fallen to its influence, their once-benevolent natures transformed into destructive rage.

The corruption spreads outward from the Void Realm at Elysium's center, slowly consuming each elemental kingdom. As it advances, reality itself warps - platforms shift, gravity fluctuates, and elemental energies become volatile and unpredictable.

Only beings with the ability to channel multiple elemental energies, like the Last Spirit, can resist The Dissonance's corrupting influence. This resistance comes from the balance of elements within - a harmony that The Dissonance cannot easily unravel.`,
            type: LoreType.DISSONANCE,
            isUnlocked: false,
            sortOrder: 10
        },
        
        // Character Lore
        {
            id: 'character-last-spirit',
            title: 'The Last Spirit: Etheria',
            content: `You are Etheria, the Last Spirit - a rare being born with the ability to channel and embody all five elemental forces. While most creatures in Elysium are bound to a single element, you exist in harmony with all.

Once, there were many like you - Spirit Shifters who maintained balance across Elysium. But as The Dissonance spread, they disappeared one by one, either corrupted or lost trying to fight the spreading chaos.

You remained hidden in the Void Realm, protected by the Spirit Guardian and training to master your shifting abilities. But when even the Spirit Guardian fell to corruption, you knew the time had come to act.

Your true form is ethereal and balanced - neither dominated by fire's passion, water's fluidity, earth's stability, nor air's freedom. This balance grants you immunity to The Dissonance, making you the last hope for Elysium.

With each Guardian you purify, your connection to their element strengthens. Perhaps with all five elements in perfect harmony within you, you might finally uncover the source of The Dissonance and restore balance to Elysium.`,
            type: LoreType.CHARACTER,
            isUnlocked: true,
            relatedElement: ElementType.SPIRIT,
            sortOrder: 2
        },
        
        // Elemental Lore
        {
            id: 'element-fire',
            title: 'The Element of Fire',
            content: `Fire in Elysium is more than mere flame - it is the embodiment of transformation, passion, and energy. Fire elementals exist in a constant state of change, their forms shifting and flickering with living flame.

The creatures of the Scorched Peaks have evolved alongside volcanic activity, developing bodies that thrive in extreme heat. Many have internal chambers where magma flows instead of blood, and their skin often resembles cooling lava - black and cracked with glowing red beneath.

Fire magic focuses on rapid movement, explosive force, and consuming what lies in its path to fuel further growth. Fire elementalists are known for their quick tempers but equally quick thinking - solving problems with bursts of inspiration and energy.

Those who master fire understand that true power comes not from uncontrolled burning, but from the careful application of heat and pressure - knowing when to rage like a wildfire and when to smolder patiently like an ember.`,
            type: LoreType.ELEMENT,
            isUnlocked: false,
            relatedElement: ElementType.FIRE,
            relatedBiome: BiomeType.FIRE,
            sortOrder: 20
        },
        {
            id: 'element-water',
            title: 'The Element of Water',
            content: `Water in Elysium represents adaptation, flow, and connectivity. Water elementals rarely maintain a single form, instead flowing between shapes as needed - from humanoid to amorphous and back again with fluid grace.

The denizens of the Crystalline Depths communicate through ripples and currents rather than sound, creating a language of motion that carries for miles through the water. Their bodies often incorporate the crystalline structures that define their realm - transparent tissues that refract light in mesmerizing patterns.

Water magic excels in healing, transformation, and overcoming obstacles through persistence rather than force. Water elementalists are known for their calm demeanor that hides tremendous depth - they rarely act rashly, preferring to observe and understand before responding.

Those who master water learn that true strength lies not in standing firm against opposition, but in yielding momentarily only to reform stronger than before. Like water itself, they cannot be truly defeated - only temporarily displaced.`,
            type: LoreType.ELEMENT,
            isUnlocked: false,
            relatedElement: ElementType.WATER,
            relatedBiome: BiomeType.WATER,
            sortOrder: 21
        },
        {
            id: 'element-earth',
            title: 'The Element of Earth',
            content: `Earth in Elysium embodies stability, strength, and growth. Earth elementals move with deliberate purpose, their stone-like bodies reflecting the enduring nature of their element.

The inhabitants of the Living Groves share profound connections with the land they inhabit. Many are partially plant-like, with bark-textured skin and hair like vines or leaves. They grow roots when they remain in one place for long, literally becoming one with their environment.

Earth magic specializes in defense, construction, and nurturing growth over time. Earth elementalists are known for their patience and reliability - they make plans not for days or years, but for centuries, thinking in geological timescales.

Those who master earth understand that true power comes from foundation and connection - drawing strength from the ground beneath them and the natural world around them. They know that even mountains can be moved, not through sudden force, but through consistent pressure applied over time.`,
            type: LoreType.ELEMENT,
            isUnlocked: false,
            relatedElement: ElementType.EARTH,
            relatedBiome: BiomeType.EARTH,
            sortOrder: 22
        },
        {
            id: 'element-air',
            title: 'The Element of Air',
            content: `Air in Elysium represents freedom, intellect, and connectivity. Air elementals rarely touch the ground, their semi-transparent forms drifting on currents invisible to others, their voices like whispered breezes.

The creatures of the Windswept Heights have evolved to be incredibly lightweight - their hollow bones and gas-filled chambers allowing them to float between the floating islands with minimal effort. Many communicate through musical tones carried on self-generated air currents.

Air magic excels in speed, distance attacks, and gathering information from afar. Air elementalists are known for their quick minds and quicker movements - they solve problems by approaching from unexpected angles, seeing connections others miss.

Those who master air learn that true influence comes not from direct confrontation, but from subtle pressure applied across a system. Like wind shaping stone over centuries, they understand that persistence and ubiquity often triumph over raw force.`,
            type: LoreType.ELEMENT,
            isUnlocked: false,
            relatedElement: ElementType.AIR,
            relatedBiome: BiomeType.AIR,
            sortOrder: 23
        },
        {
            id: 'element-spirit',
            title: 'The Element of Spirit',
            content: `Spirit in Elysium is the binding force - the element that connects and harmonizes all others. Spirit elementals are rare, with forms that shift subtly between aspects of all elements, never fully committing to any one.

The Void Realm at Elysium's center is less a physical location and more a nexus of pure possibility. Here, thought becomes form more readily than elsewhere, and the boundaries between elements blur into a harmonious whole. Few creatures can survive here permanently, as the raw potential of unformed elemental energy proves too potent.

Spirit magic specializes in balance, purification, and transformation between states. Spirit elementalists can briefly embody aspects of other elements, though rarely with the same potency as true practitioners of that element.

Those who master spirit understand that true harmony comes not from eliminating differences, but from finding the complementary relationships between opposing forces. They serve as mediators, healers, and guides - helping others find balance within themselves and with the world around them.`,
            type: LoreType.ELEMENT,
            isUnlocked: false,
            relatedElement: ElementType.SPIRIT,
            relatedBiome: BiomeType.SPIRIT,
            sortOrder: 24
        },
        
        // Guardian Lore
        {
            id: 'guardian-fire',
            title: 'Ignix, The Flame Tyrant',
            content: `Once known as the Flame Shepherd, Ignix guided the controlled burn cycles that kept the Scorched Peaks ecosystem thriving. Under The Dissonance's influence, his nurturing flames have become instruments of uncontrolled destruction.

Before corruption, Ignix was passionate but disciplined - understanding that fire must be contained to be useful. Now, his once-brilliant mind knows only consumption and expansion, seeking to burn all of Elysium in a misguided attempt to purify it through flame.

Ignix appears as a towering humanoid figure composed of magma and flame, his core burning white-hot. Where he once wore ceremonial armor that helped him direct his flames with precision, The Dissonance has twisted these implements into weapons that amplify his destructive capabilities.

Creatures throughout the Scorched Peaks that once respected and worked alongside Ignix now flee from his unpredictable rage. The volcanic activity has increased tenfold under his corrupted influence, threatening to overflow into neighboring realms.`,
            type: LoreType.GUARDIAN,
            isUnlocked: false,
            relatedElement: ElementType.FIRE,
            relatedBiome: BiomeType.FIRE,
            sortOrder: 30
        },
        {
            id: 'guardian-water',
            title: 'Aquilla, The Tide Sovereign',
            content: `Before The Dissonance, Aquilla was the Tide Harmonizer, maintaining the complex currents that circulated vital nutrients throughout the Crystalline Depths. Now corrupted, her gentle guidance has transformed into tyrannical control.

Aquilla once moved with graceful fluidity, her form adapting to challenges rather than overwhelming them. The Dissonance has frozen her adaptability into rigid patterns - her once-nurturing nature now manifests as a need to force all things into her vision of perfection.

She appears as a regal figure composed of living water and crystal, constantly flowing between humanoid and aquatic forms. The resonant crystals she once used to communicate with distant regions now amplify The Dissonance, sending corrupting frequencies throughout her realm.

The normally peaceful creatures of the Crystalline Depths have become territorial and aggressive under these corrupted vibrations. Many have developed painful crystalline growths that distort their natural forms.`,
            type: LoreType.GUARDIAN,
            isUnlocked: false,
            relatedElement: ElementType.WATER,
            relatedBiome: BiomeType.WATER,
            sortOrder: 31
        },
        {
            id: 'guardian-earth',
            title: 'Terron, The Mountain King',
            content: `Terron was once the Grove Cultivator, nurturing the delicate balance between stone and soil, plant and animal throughout the Living Groves. Corrupted, his patient guidance has become domineering control.

Before The Dissonance, Terron understood the value of change despite his element's stability - that new growth requires the breaking down of the old. Now, he enforces stagnation, believing that perfect order requires the cessation of all change.

He manifests as a massive figure of living stone and wood, with crystals growing from his shoulders and vines circling his limbs. The staff he once used to accelerate growth in young plants now calcifies living things into stone, freezing them in what he perceives as perfect, unchanging forms.

Under his corrupted influence, the Living Groves have begun to petrify - vibrant ecosystems turning to stone gardens where nothing evolves or grows. The creatures that haven't fled have become like living statues, moving only when absolutely necessary to conserve their fading vitality.`,
            type: LoreType.GUARDIAN,
            isUnlocked: false,
            relatedElement: ElementType.EARTH,
            relatedBiome: BiomeType.EARTH,
            sortOrder: 32
        },
        {
            id: 'guardian-air',
            title: 'Zephira, The Storm Empress',
            content: `Zephira served as the Breeze Conductor, orchestrating the wind currents that kept the floating islands of the Windswept Heights aloft and connected. The Dissonance has transformed her subtle guidance into chaotic domination.

She once understood that air's strength comes from influencing rather than controlling - guiding through gentle pressure rather than force. Corrupted, she now believes that only through overwhelming power can true harmony be achieved.

Zephira appears as a swirling vortex occasionally taking humanoid form, with storm clouds forming her core and lightning arcing between her outstretched hands. The delicate wind instruments she once played to adjust air currents now generate devastating storms that threaten to tear the floating islands apart.

The once-peaceful aerial creatures of the Windswept Heights now ride violent storm fronts, attacking anything they perceive as threatening their corrupted Guardian. Many have developed painful lightning-like energy discharges that they cannot control.`,
            type: LoreType.GUARDIAN,
            isUnlocked: false,
            relatedElement: ElementType.AIR,
            relatedBiome: BiomeType.AIR,
            sortOrder: 33
        },
        {
            id: 'guardian-spirit',
            title: 'Etheria, The Void Harbinger',
            content: `Etheria was the Balance Keeper, your mentor and the most powerful of all Guardians, maintaining the harmony between elements from the Void Realm at Elysium's center. Her corruption by The Dissonance was both the most surprising and the most devastating.

Before falling to corruption, she taught you the ways of Spirit Shifting - how to embody each element while maintaining your core identity. She was wise and measured, seeing value in all elemental approaches and finding the right balance for each situation.

In her corrupted form, she appears as a being of shifting elemental energies, never settling on a single form as The Dissonance within her constantly battles with her true nature. The meditation sphere she once used to monitor elemental balance now serves as a conduit for The Dissonance, amplifying its corrupting frequency.

Her fall revealed a terrible truth - that even the most balanced mind could be corrupted. But this also revealed hope - for if she could be restored, perhaps she would know how to cleanse The Dissonance from Elysium completely.`,
            type: LoreType.GUARDIAN,
            isUnlocked: false,
            relatedElement: ElementType.SPIRIT,
            relatedBiome: BiomeType.SPIRIT,
            sortOrder: 34
        },
        
        // History Lore
        {
            id: 'history-spirit-shifters',
            title: 'The Spirit Shifters',
            content: `For millennia, Spirit Shifters served as mediators between Elysium's elemental kingdoms. Born with the rare ability to channel multiple elements, they were revered as living embodiments of balance.

Unlike most of Elysium's inhabitants who were bound to a single element from birth, Spirit Shifters could temporarily take on the aspects of any element. This made them ideal diplomats, able to literally embody the perspective of each kingdom during negotiations.

Spirit Shifters were few in number, perhaps only a dozen existing at any time. They trained in the Void Realm under the guidance of the Spirit Guardian, learning to maintain their core identity while channeling powerful elemental energies.

When The Dissonance first appeared, the Spirit Shifters were the first to recognize the threat. They worked tirelessly to contain the corruption, but one by one they fell - either corrupted themselves or exhausted beyond recovery by the constant battle.

You, Etheria, are the last of your kind - the final Spirit Shifter. Your training was incomplete when the Spirit Guardian fell to corruption, forcing you into hiding to complete your preparation alone. Now, you emerge as Elysium's last hope for restoration.`,
            type: LoreType.HISTORY,
            isUnlocked: false,
            sortOrder: 40
        },
        {
            id: 'history-balance-keepers',
            title: 'The Ancient Balance Keepers',
            content: `Before the Guardians, before even the Spirit Shifters, Elysium was maintained by entities known only as the Balance Keepers. Little is known about these mysterious beings except that they existed outside the elemental cycle entirely.

Ancient murals in the deepest reaches of each elemental kingdom depict the Balance Keepers as geometric forms of pure light. These images show them creating the first elemental wellsprings from which all of Elysium's energy would eventually flow.

Some scholars believe the Balance Keepers foresaw the threat of The Dissonance millennia before it appeared. Evidence suggests they created the Spirit Shifters specifically as a countermeasure, instilling in them the perfect elemental balance needed to resist corruption.

The Balance Keepers vanished from Elysium long ago, but they left behind artifacts of tremendous power - including five elemental focuses hidden in the heart of each Guardian's domain. Legends say that collecting all five would grant a Spirit Shifter unprecedented power to restore balance.

As Etheria, you occasionally experience flashes of intuition that feel external to your own thoughts - subtle guidance pushing you toward certain paths. Could the Balance Keepers still exist in some form, guiding you from beyond Elysium's boundaries?`,
            type: LoreType.HISTORY,
            isUnlocked: false,
            sortOrder: 41
        }
    ];
    
    /**
     * Initialize the lore system
     */
    public static initialize(): void {
        this.loadLoreState();
    }
    
    /**
     * Get all lore entries
     */
    public static getAllEntries(): LoreEntry[] {
        return [...this.loreEntries].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    
    /**
     * Get unlocked lore entries
     */
    public static getUnlockedEntries(): LoreEntry[] {
        return this.loreEntries
            .filter(entry => entry.isUnlocked)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }
    
    /**
     * Get entries by type
     */
    public static getEntriesByType(type: LoreType, unlockedOnly: boolean = true): LoreEntry[] {
        return this.loreEntries
            .filter(entry => entry.type === type && (!unlockedOnly || entry.isUnlocked))
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }
    
    /**
     * Get entries related to element
     */
    public static getEntriesByElement(element: ElementType, unlockedOnly: boolean = true): LoreEntry[] {
        return this.loreEntries
            .filter(entry => entry.relatedElement === element && (!unlockedOnly || entry.isUnlocked))
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }
    
    /**
     * Get entries related to biome
     */
    public static getEntriesByBiome(biome: BiomeType, unlockedOnly: boolean = true): LoreEntry[] {
        return this.loreEntries
            .filter(entry => entry.relatedBiome === biome && (!unlockedOnly || entry.isUnlocked))
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }
    
    /**
     * Get a specific lore entry by ID
     */
    public static getEntryById(id: string): LoreEntry | undefined {
        return this.loreEntries.find(entry => entry.id === id);
    }
    
    /**
     * Check if a lore entry is unlocked
     */
    public static isEntryUnlocked(id: string): boolean {
        const entry = this.getEntryById(id);
        return entry ? entry.isUnlocked : false;
    }
    
    /**
     * Unlock a lore entry by ID
     */
    public static unlockEntry(id: string): boolean {
        const entry = this.getEntryById(id);
        if (entry && !entry.isUnlocked) {
            entry.isUnlocked = true;
            this.saveLoreState();
            return true;
        }
        return false;
    }
    
    /**
     * Unlock entries related to an element
     */
    public static unlockElementEntries(element: ElementType): void {
        const entries = this.loreEntries.filter(entry => entry.relatedElement === element);
        let unlocked = false;
        
        entries.forEach(entry => {
            if (!entry.isUnlocked) {
                entry.isUnlocked = true;
                unlocked = true;
            }
        });
        
        if (unlocked) {
            this.saveLoreState();
        }
    }
    
    /**
     * Unlock entries related to a biome
     */
    public static unlockBiomeEntries(biome: BiomeType): void {
        const entries = this.loreEntries.filter(entry => entry.relatedBiome === biome);
        let unlocked = false;
        
        entries.forEach(entry => {
            if (!entry.isUnlocked) {
                entry.isUnlocked = true;
                unlocked = true;
            }
        });
        
        if (unlocked) {
            this.saveLoreState();
        }
    }
    
    /**
     * Save lore state to local storage
     */
    private static saveLoreState(): void {
        try {
            const unlockedIds = this.loreEntries
                .filter(entry => entry.isUnlocked)
                .map(entry => entry.id);
            
            localStorage.setItem(STORAGE_KEYS.LORE_ENTRIES, JSON.stringify(unlockedIds));
        } catch (error) {
            console.error('Failed to save lore state:', error);
        }
    }
    
    /**
     * Load lore state from local storage
     */
    private static loadLoreState(): void {
        try {
            const savedData = localStorage.getItem(STORAGE_KEYS.LORE_ENTRIES);
            if (savedData) {
                const unlockedIds = JSON.parse(savedData) as string[];
                
                // Reset all entries to default unlock state
                this.loreEntries.forEach(entry => {
                    entry.isUnlocked = unlockedIds.includes(entry.id);
                });
            }
        } catch (error) {
            console.error('Failed to load lore state:', error);
        }
    }
    
    /**
     * Reset all lore entries to their default unlock state
     */
    public static resetLoreState(): void {
        this.loreEntries.forEach(entry => {
            // Only world-elysium and character-last-spirit entries are unlocked by default
            entry.isUnlocked = entry.id === 'world-elysium' || entry.id === 'character-last-spirit';
        });
        
        this.saveLoreState();
    }
}