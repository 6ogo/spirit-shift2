export const DEPTHS = {
    BACKGROUND: 0,
    PLATFORMS: 10,
    COLLECTIBLES: 20,
    PROJECTILES: 30,
    ENEMIES: 40,
    PLAYER: 50,
    PARTICLES: 60,
    UI: 100
};
export enum BiomeType {
    NEUTRAL,
    FIRE,
    WATER,
    EARTH,
    AIR,
    SPIRIT
}

export const BIOME_NAMES = {
    [BiomeType.NEUTRAL]: 'Neutral',
    [BiomeType.FIRE]: 'Fire',
    [BiomeType.WATER]: 'Water',
    [BiomeType.EARTH]: 'Earth',
    [BiomeType.AIR]: 'Air',
    [BiomeType.SPIRIT]: 'Spirit'
};

export const SCENES = {
    BOOT: 'BootScene',
    MAIN_MENU: 'MainMenuScene',
    TUTORIAL: 'TutorialScene',
    GAME: 'GameScene',
    UI: 'UIScene',
    PAUSE: 'PauseScene',
    GAME_OVER: 'GameOverScene',
    UPGRADE: 'UpgradeScene',
    KINGDOM_SELECT: 'KingdomSelectScene',
    LORE: 'Lore',
    BOSS_INTRO: 'BossIntroScene'
};

export enum ElementType {
    FIRE,
    WATER,
    EARTH,
    AIR,
    SPIRIT
}

export const bossNames = {
    [ElementType.FIRE]: 'Flame Guardian',
    [ElementType.WATER]: 'Aqua Guardian',
    [ElementType.EARTH]: 'Terra Guardian',
    [ElementType.AIR]: 'Aero Guardian',
    [ElementType.SPIRIT]: 'Spirit Guardian'
};

export const EVENTS = {
    PLAYER_DAMAGE: 'player-damage',
    PLAYER_HEAL: 'player-heal',
    PLAYER_ENERGY_CHANGE: 'player-energy-change',
    PLAYER_ELEMENT_CHANGE: 'player-element-change',
    PLAYER_DOUBLE_JUMP: 'player-double-jump',
    PLAYER_SPECIAL_ATTACK: 'player-special-attack',
    PLAYER_ABILITY_USE: 'player-ability-use',
    PLAYER_DASH: 'player-dash',
    PLAYER_DASH_END: 'player-dash-end',
    PLAYER_DEATH: 'player-death',
    ENEMY_DAMAGE: 'enemy-damage',
    ENEMY_DEFEATED: 'enemy-defeated',
    SCORE_CHANGE: 'score-change',
    LEVEL_COMPLETE: 'level-complete',
    GAME_OVER: 'game-over',
    PAUSE_GAME: 'pause-game',
    RESUME_GAME: 'resume-game',
    BOSS_SUMMON: 'boss-summon',
    BOSS_AOE_ATTACK: 'boss-aoe-attack',
    BOSS_DAMAGE: 'boss-damage',
    BOSS_DEFEATED: 'boss-defeated',
    SOUL_ESSENCE_COLLECTED: 'soul-essence-collected'
};

export const STORAGE_KEYS = {
    SAVE_DATA: 'spirit-shift-save',
    HIGH_SCORE: 'spirit-shift-high-score',
    SETTINGS: 'spirit-shift-settings',
    UNLOCKED_ELEMENTS: 'spirit-shift-unlocked-elements',
    UPGRADES: 'upgrades',
    BOSS_DEFEATS: 'bossDefeats',
    LORE_ENTRIES: 'loreEntries'
};