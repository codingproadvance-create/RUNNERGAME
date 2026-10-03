import { GameSettings } from '../game/types';

const STATS_KEY = 'runner_rush_stats_v1';
const SETTINGS_KEY = 'runner_rush_settings_v1';
const SKIN_KEY = 'runner_rush_skin_v1';
const UNLOCKED_SKINS_KEY = 'runner_rush_unlocked_skins_v1';
const TUTORIAL_KEY = 'runner_rush_tutorial_seen_v1';

export interface SavedStats {
  highScore: number;
  bestDistance: number;
  totalCoins: number;
  gamesPlayed: number;
}

const DEFAULT_STATS: SavedStats = {
  highScore: 0,
  bestDistance: 0,
  totalCoins: 0,
  gamesPlayed: 0,
};

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  soundVolume: 0.8,
  musicVolume: 0.5,
  hapticsEnabled: true,
  showOnScreenControls: true,
  quality: 'high',
};

export function loadSavedStats(): SavedStats {
  try {
    const data = localStorage.getItem(STATS_KEY);
    if (data) {
      return { ...DEFAULT_STATS, ...JSON.parse(data) };
    }
  } catch (e) {
    console.warn('Failed to load stats from localStorage:', e);
  }
  return DEFAULT_STATS;
}

export function saveGameRunStats(score: number, distance: number, coins: number): SavedStats {
  const current = loadSavedStats();
  const updated: SavedStats = {
    highScore: Math.max(current.highScore, Math.floor(score)),
    bestDistance: Math.max(current.bestDistance, Math.floor(distance)),
    totalCoins: current.totalCoins + coins,
    gamesPlayed: current.gamesPlayed + 1,
  };

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save stats to localStorage:', e);
  }

  return updated;
}

export function resetAllStats(): SavedStats {
  try {
    localStorage.removeItem(STATS_KEY);
  } catch (e) {
    console.warn('Failed to reset stats:', e);
  }
  return DEFAULT_STATS;
}

export function loadSettings(): GameSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (e) {
    console.warn('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

export function getSelectedSkinId(): string {
  try {
    return localStorage.getItem(SKIN_KEY) || 'cyber_dash';
  } catch {
    return 'cyber_dash';
  }
}

export function setSelectedSkinId(skinId: string): void {
  try {
    localStorage.setItem(SKIN_KEY, skinId);
  } catch (e) {
    console.warn('Failed to set skin:', e);
  }
}

export function getUnlockedSkinIds(): string[] {
  try {
    const data = localStorage.getItem(UNLOCKED_SKINS_KEY);
    if (data) {
      const list = JSON.parse(data);
      if (Array.isArray(list) && list.includes('cyber_dash')) return list;
    }
  } catch {
    // fallback
  }
  return ['cyber_dash'];
}

export function unlockSkin(skinId: string): void {
  try {
    const list = getUnlockedSkinIds();
    if (!list.includes(skinId)) {
      list.push(skinId);
      localStorage.setItem(UNLOCKED_SKINS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed to unlock skin:', e);
  }
}

export function spendCoins(amount: number): boolean {
  const stats = loadSavedStats();
  if (stats.totalCoins >= amount) {
    stats.totalCoins -= amount;
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
      // fallback
    }
    return true;
  }
  return false;
}

export function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markTutorialSeen(): void {
  try {
    localStorage.setItem(TUTORIAL_KEY, 'true');
  } catch (e) {
    console.warn('Failed to mark tutorial seen:', e);
  }
}
