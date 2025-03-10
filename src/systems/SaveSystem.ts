import { ElementType } from '../config';
import { STORAGE_KEYS } from '../utils/constants';

export interface SaveData {
    level: number;
    score: number;
    health: number;
    energy: number;
    currentElement: ElementType;
    unlockedElements: ElementType[];
    timestamp: number;
}

export default class SaveSystem {
    public static saveGame(data: SaveData): boolean {
        try {
            localStorage.setItem(STORAGE_KEYS.SAVE_DATA, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    public static loadGame(): SaveData | null {
        try {
            const saveData = localStorage.getItem(STORAGE_KEYS.SAVE_DATA);
            if (!saveData) return null;
            const parsedData = JSON.parse(saveData);
            if (!this.isValidSaveData(parsedData)) {
                console.warn('Invalid save data format');
                return null;
            }
            return parsedData;
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }

    public static saveHighScore(score: number): boolean {
        try {
            localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
            return true;
        } catch (error) {
            console.error('Failed to save high score:', error);
            return false;
        }
    }

    public static loadHighScore(): number {
        try {
            const highScore = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
            return highScore ? parseInt(highScore, 10) || 0 : 0;
        } catch (error) {
            console.error('Failed to load high score:', error);
            return 0;
        }
    }

    public static saveSettings(settings: object): boolean {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    public static loadSettings(): object | null {
        try {
            const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return null;
        }
    }

    public static saveUnlockedElements(elements: ElementType[]): boolean {
        try {
            localStorage.setItem(STORAGE_KEYS.UNLOCKED_ELEMENTS, JSON.stringify(elements));
            return true;
        } catch (error) {
            console.error('Failed to save unlocked elements:', error);
            return false;
        }
    }

    public static loadUnlockedElements(): ElementType[] {
        try {
            const elements = localStorage.getItem(STORAGE_KEYS.UNLOCKED_ELEMENTS);
            return elements ? JSON.parse(elements) : [ElementType.SPIRIT];
        } catch (error) {
            console.error('Failed to load unlocked elements:', error);
            return [ElementType.SPIRIT];
        }
    }

    public static clearAllData(): boolean {
        try {
            localStorage.removeItem(STORAGE_KEYS.SAVE_DATA);
            localStorage.removeItem(STORAGE_KEYS.HIGH_SCORE);
            localStorage.removeItem(STORAGE_KEYS.SETTINGS);
            localStorage.removeItem(STORAGE_KEYS.UNLOCKED_ELEMENTS);
            return true;
        } catch (error) {
            console.error('Failed to clear game data:', error);
            return false;
        }
    }

    public static hasSaveData(): boolean {
        return localStorage.getItem(STORAGE_KEYS.SAVE_DATA) !== null;
    }

    public static createSaveData(
        level: number,
        score: number,
        health: number,
        energy: number,
        currentElement: ElementType,
        unlockedElements: ElementType[] = [ElementType.SPIRIT]
    ): SaveData {
        return { level, score, health, energy, currentElement, unlockedElements, timestamp: Date.now() };
    }

    private static isValidSaveData(data: any): data is SaveData {
        return (
            typeof data === 'object' &&
            typeof data.level === 'number' &&
            typeof data.score === 'number' &&
            typeof data.health === 'number' &&
            typeof data.energy === 'number' &&
            typeof data.currentElement === 'string' &&
            Array.isArray(data.unlockedElements) &&
            typeof data.timestamp === 'number'
        );
    }
}