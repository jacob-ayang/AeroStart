import { UserSettings } from '../types';

const STORAGE_KEY = 'aerostart_settings';
const DEBOUNCE_DELAY = 100; // 100ms debounce delay

// Debounce timer
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Load user settings from Local Storage
 * @param defaultSettings Default settings
 * @returns Merged user settings
 */
export const loadSettings = (defaultSettings: UserSettings): UserSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultSettings;
    }

    const parsed = JSON.parse(stored);
    // Merge default settings with stored settings to ensure new config items have default values
    return {
      ...defaultSettings,
      ...parsed,
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return defaultSettings;
  }
};

/**
 * Calculate data size in bytes
 * @param data Data to calculate
 * @returns Data size in bytes
 */
const getDataSize = (data: string): number => {
  return new Blob([data]).size;
};

/**
 * Check localStorage available space
 * @param dataSize Data size to store (bytes)
 * @returns Whether there is enough space
 */
const checkStorageQuota = (dataSize: number): boolean => {
  // localStorage is typically limited to 5-10MB
  const QUOTA_LIMIT = 5 * 1024 * 1024; // 5MB safe limit

  try {
    // Calculate currently used space
    let currentSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        currentSize += getDataSize(localStorage[key] + key);
      }
    }

    return (currentSize + dataSize) < QUOTA_LIMIT;
  } catch {
    return false;
  }
};

/**
 * Immediately save user settings to Local Storage (without debounce)
 * @param settings User settings
 * @throws Error when storage space is insufficient
 */
const saveSettingsImmediate = (settings: UserSettings): void => {
  try {
    const settingsJson = JSON.stringify(settings);
    const dataSize = getDataSize(settingsJson);

    // Check storage quota
    if (!checkStorageQuota(dataSize)) {
      throw new Error('QUOTA_EXCEEDED');
    }

    localStorage.setItem(STORAGE_KEY, settingsJson);
  } catch (error) {
    if (error instanceof Error && error.message === 'QUOTA_EXCEEDED') {
      console.error('Insufficient storage space, cannot save settings');
      throw error;
    } else if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded, cannot save settings');
      throw new Error('QUOTA_EXCEEDED');
    } else {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }
};

/**
 * Save user settings to Local Storage (with debounce)
 * @param settings User settings
 */
export const saveSettings = (settings: UserSettings): void => {
  // Clear previous timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Set new timer
  debounceTimer = setTimeout(() => {
    saveSettingsImmediate(settings);
    debounceTimer = null;
  }, DEBOUNCE_DELAY);
};

/**
 * Clear all stored settings
 */
export const clearSettings = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear settings:', error);
  }
};
