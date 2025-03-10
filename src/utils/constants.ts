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

export const SCENES = {
    BOOT: 'BootScene',
    MAIN_MENU: 'MainMenuScene',
    TUTORIAL: 'TutorialScene',
    GAME: 'GameScene',
    UI: 'UIScene',
    PAUSE: 'PauseScene',
    GAME_OVER: 'GameOverScene'
};

export const EVENTS = {
    PLAYER_DAMAGE: 'player-damage',
    PLAYER_HEAL: 'player-heal',
    PLAYER_ENERGY_CHANGE: 'player-energy-change',
    PLAYER_ELEMENT_CHANGE: 'player-element-change',
    ENEMY_DAMAGE: 'enemy-damage',
    ENEMY_DEFEATED: 'enemy-defeated',
    SCORE_CHANGE: 'score-change',
    LEVEL_COMPLETE: 'level-complete',
    GAME_OVER: 'game-over',
    PAUSE_GAME: 'pause-game',
    RESUME_GAME: 'resume-game'
};

export const STORAGE_KEYS = {
    SAVE_DATA: 'spirit-shift-save',
    HIGH_SCORE: 'spirit-shift-high-score',
    SETTINGS: 'spirit-shift-settings',
    UNLOCKED_ELEMENTS: 'spirit-shift-unlocked-elements'
};