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
  /**
   * Save game data to local storage
   */
  public static saveGame(data: SaveData): boolean {
    try {
      const saveData = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEYS.SAVE_DATA, saveData);
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }
  
  /**
   * Load game data from local storage
   */
  public static loadGame(): SaveData | null {
    try {
      const saveData = localStorage.getItem(STORAGE_KEYS.SAVE_DATA);
      if (!saveData) {
        return null;
      }
      
      const parsedData = JSON.parse(saveData);
      
      // Validate save data format
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
  
  /**
   * Save high score to local storage
   */
  public static saveHighScore(score: number): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
      return true;
    } catch (error) {
      console.error('Failed to save high score:', error);
      return false;
    }
  }
  
  /**
   * Load high score from local storage
   */
  public static loadHighScore(): number {
    try {
      const highScore = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
      if (!highScore) {
        return 0;
      }
      
      const score = parseInt(highScore, 10);
      if (isNaN(score)) {
        return 0;
      }
      
      return score;
    } catch (error) {
      console.error('Failed to load high score:', error);
      return 0;
    }
  }
  
  /**
   * Save game settings to local storage
   */
  public static saveSettings(settings: object): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }
  
  /**
   * Load game settings from local storage
   */
  public static loadSettings(): object | null {
    try {
      const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!settings) {
        return null;
      }
      
      return JSON.parse(settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      return null;
    }
  }
  
  /**
   * Save unlocked elements to local storage
   */
  public static saveUnlockedElements(elements: ElementType[]): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.UNLOCKED_ELEMENTS, JSON.stringify(elements));
      return true;
    } catch (error) {
      console.error('Failed to save unlocked elements:', error);
      return false;
    }
  }
  
  /**
   * Load unlocked elements from local storage
   */
  public static loadUnlockedElements(): ElementType[] {
    try {
      const elements = localStorage.getItem(STORAGE_KEYS.UNLOCKED_ELEMENTS);
      if (!elements) {
        // Return default unlocked elements
        return [ElementType.SPIRIT];
      }
      
      return JSON.parse(elements);
    } catch (error) {
      console.error('Failed to load unlocked elements:', error);
      return [ElementType.SPIRIT];
    }
  }
  
  /**
   * Delete all saved game data
   */
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
  
  /**
   * Check if save data exists
   */
  public static hasSaveData(): boolean {
    return localStorage.getItem(STORAGE_KEYS.SAVE_DATA) !== null;
  }
  
  /**
   * Create a new save data object
   */
  public static createSaveData(
    level: number,
    score: number,
    health: number,
    energy: number,
    currentElement: ElementType,
    unlockedElements: ElementType[] = [ElementType.SPIRIT]
  ): SaveData {
    return {
      level,
      score,
      health,
      energy,
      currentElement,
      unlockedElements,
      timestamp: Date.now()
    };
  }
  
  /**
   * Validate save data format
   */
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