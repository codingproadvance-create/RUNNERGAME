import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { SplashScreen } from './components/SplashScreen';
import { MainMenu } from './components/MainMenu';
import { PauseMenu } from './components/PauseMenu';
import { GameOverScreen } from './components/GameOverScreen';
import { TutorialModal } from './components/TutorialModal';
import { SettingsModal } from './components/SettingsModal';
import { HighScoreModal } from './components/HighScoreModal';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { useTouchControls } from './hooks/useTouchControls';
import { audioManager } from './game/audio';
import {
  loadSavedStats,
  loadSettings,
  saveSettings,
  hasSeenTutorial,
  markTutorialSeen,
  getUnlockedSkinIds,
  getSelectedSkinId,
} from './utils/storage';
import { CharacterSkin, GameSettings, GameStatus } from './game/types';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function App() {
  const engineRef = useRef<GameEngine>(new GameEngine());
  const engine = engineRef.current;

  // React state reflecting the engine state for UI reactivity
  const [status, setStatus] = useState<GameStatus>(engine.status);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [coins, setCoins] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [activePowerUps, setActivePowerUps] = useState(new Map(engine.activePowerUps));

  // Modals & Overlays
  const [activeModal, setActiveModal] = useState<
    'NONE' | 'HOW_TO_PLAY' | 'SETTINGS' | 'HIGH_SCORES' | 'CHARACTERS'
  >('NONE');
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  // Settings & Persistent Stats
  const [settings, setSettings] = useState<GameSettings>(loadSettings());
  const [savedStats, setSavedStats] = useState(loadSavedStats());
  const [unlockedSkinIds, setUnlockedSkinIds] = useState<string[]>(getUnlockedSkinIds());
  const [selectedSkin, setSelectedSkin] = useState<CharacterSkin>(engine.selectedSkin);

  // Desktop Responsive Mode: Allow toggling between Phone Mockup and Fullscreen
  const [isFullscreenPhone, setIsFullscreenPhone] = useState(true);

  // Synchronize audio manager with settings
  useEffect(() => {
    audioManager.updateSettings(
      settings.soundEnabled,
      settings.musicEnabled,
      settings.soundVolume,
      settings.musicVolume
    );
  }, [settings]);

  // Check first launch tutorial
  useEffect(() => {
    if (!hasSeenTutorial()) {
      setIsFirstLaunch(true);
      setActiveModal('HOW_TO_PLAY');
      markTutorialSeen();
    }
  }, []);

  // Sync engine updates with React state
  useEffect(() => {
    engine.setOnUpdate((eng) => {
      setStatus(eng.status);
      setScore(eng.stats.score);
      setDistance(eng.stats.distance);
      setCoins(eng.stats.coins);
      setMultiplier(eng.stats.multiplier);
      setActivePowerUps(new Map(eng.activePowerUps));
    });

    return () => {
      engine.stopLoop();
    };
  }, [engine]);

  // Hook touch & keyboard controls
  useTouchControls({
    engine,
    enabled: status === 'PLAYING',
  });

  // Action Handlers
  const handleStartPlay = useCallback(() => {
    engine.startNewGame();
    setStatus('PLAYING');
  }, [engine]);

  const handlePause = useCallback(() => {
    engine.pauseGame();
    setStatus('PAUSED');
  }, [engine]);

  const handleResume = useCallback(() => {
    engine.resumeGame();
    setStatus('PLAYING');
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.startNewGame();
    setStatus('PLAYING');
  }, [engine]);

  const handleMainMenu = useCallback(() => {
    engine.stopLoop();
    audioManager.stopMusic();
    engine.status = 'MENU';
    engine.refreshStoredStats();
    setStatus('MENU');
    setSavedStats(loadSavedStats());
  }, [engine]);

  const handleToggleSound = useCallback(() => {
    const updated: GameSettings = {
      ...settings,
      soundEnabled: !settings.soundEnabled,
    };
    setSettings(updated);
    saveSettings(updated);
  }, [settings]);

  const handleToggleMusic = useCallback(() => {
    const updated: GameSettings = {
      ...settings,
      musicEnabled: !settings.musicEnabled,
    };
    setSettings(updated);
    saveSettings(updated);
    if (!updated.musicEnabled) {
      audioManager.stopMusic();
    } else if (status === 'PLAYING') {
      audioManager.startMusic();
    }
  }, [settings, status]);

  const handleUpdateSettings = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const handleSkinSelected = useCallback(
    (skin: CharacterSkin) => {
      setSelectedSkin(skin);
      engine.selectedSkin = skin;
    },
    [engine]
  );

  const handleRefreshStats = useCallback(() => {
    const updated = loadSavedStats();
    setSavedStats(updated);
    setUnlockedSkinIds(getUnlockedSkinIds());
    engine.refreshStoredStats();
  }, [engine]);

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden touch-none">
      {/* DESKTOP BACKGROUND DECORATION */}
      <div className="fixed inset-0 pointer-events-none opacity-20 hidden md:block bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* GAME VIEWPORT CONTAINER
          Mobile: 100% full screen
          Desktop: Mobile aspect-ratio frame or full frame
      */}
      <div
        className={`relative overflow-hidden shadow-2xl transition-all duration-300 ${
          isFullscreenPhone
            ? 'w-full h-full max-w-md md:max-h-[880px] md:h-[94vh] md:rounded-3xl md:border md:border-slate-800'
            : 'w-full h-full'
        }`}
      >
        {/* GAME CANVAS (ALWAYS MOUNTED FOR PERSPECTIVE ANIMATION) */}
        <GameCanvas engine={engine} />

        {/* 1. SPLASH SCREEN */}
        {status === 'SPLASH' && (
          <SplashScreen
            onStart={() => {
              engine.status = 'MENU';
              setStatus('MENU');
            }}
          />
        )}

        {/* 2. MAIN MENU */}
        {status === 'MENU' && (
          <MainMenu
            onPlay={handleStartPlay}
            onHowToPlay={() => setActiveModal('HOW_TO_PLAY')}
            onSettings={() => setActiveModal('SETTINGS')}
            onHighScores={() => setActiveModal('HIGH_SCORES')}
            onCharacters={() => setActiveModal('CHARACTERS')}
            highScore={savedStats.highScore}
            totalCoins={savedStats.totalCoins}
            selectedSkin={selectedSkin}
            soundEnabled={settings.soundEnabled}
            onToggleSound={handleToggleSound}
          />
        )}

        {/* 3. ACTIVE GAMEPLAY HUD */}
        {(status === 'PLAYING' || status === 'PAUSED') && (
          <HUD
            score={score}
            distance={distance}
            coins={coins}
            multiplier={multiplier}
            activePowerUps={activePowerUps}
            onPause={handlePause}
            engine={engine}
            showOnScreenControls={settings.showOnScreenControls}
          />
        )}

        {/* 4. PAUSE SCREEN */}
        {status === 'PAUSED' && (
          <PauseMenu
            onResume={handleResume}
            onRestart={handleRestart}
            onMainMenu={handleMainMenu}
            soundEnabled={settings.soundEnabled}
            musicEnabled={settings.musicEnabled}
            onToggleSound={handleToggleSound}
            onToggleMusic={handleToggleMusic}
          />
        )}

        {/* 5. GAME OVER SCREEN */}
        {status === 'GAME_OVER' && (
          <GameOverScreen
            score={score}
            distance={distance}
            coins={coins}
            highScore={savedStats.highScore}
            bestDistance={savedStats.bestDistance}
            onPlayAgain={handleRestart}
            onMainMenu={handleMainMenu}
          />
        )}

        {/* MODALS */}
        {activeModal === 'HOW_TO_PLAY' && (
          <TutorialModal
            isFirstLaunch={isFirstLaunch}
            onClose={() => {
              setActiveModal('NONE');
              setIsFirstLaunch(false);
            }}
          />
        )}

        {activeModal === 'SETTINGS' && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onClose={() => setActiveModal('NONE')}
          />
        )}

        {activeModal === 'HIGH_SCORES' && (
          <HighScoreModal
            stats={savedStats}
            onStatsReset={handleRefreshStats}
            onClose={() => setActiveModal('NONE')}
          />
        )}

        {activeModal === 'CHARACTERS' && (
          <CharacterSelectModal
            currentSkinId={selectedSkin.id}
            unlockedSkinIds={unlockedSkinIds}
            totalCoins={savedStats.totalCoins}
            onSkinSelected={handleSkinSelected}
            onRefreshStats={handleRefreshStats}
            onClose={() => setActiveModal('NONE')}
          />
        )}

        {/* DESKTOP FRAME CONTROLS (EXPAND/COLLAPSE VIEWPORT) */}
        <div className="absolute top-3 right-3 hidden md:flex items-center gap-1.5 z-50">
          <button
            onClick={() => setIsFullscreenPhone(!isFullscreenPhone)}
            className="w-8 h-8 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title={isFullscreenPhone ? 'Expand to Full Screen' : 'Phone Frame Mode'}
          >
            {isFullscreenPhone ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
