import React from 'react';
import { Play, HelpCircle, Trophy, Settings as SettingsIcon, User, Volume2, VolumeX } from 'lucide-react';
import { audioManager } from '../game/audio';
import { CharacterSkin } from '../game/types';

interface MainMenuProps {
  onPlay: () => void;
  onHowToPlay: () => void;
  onSettings: () => void;
  onHighScores: () => void;
  onCharacters: () => void;
  highScore: number;
  totalCoins: number;
  selectedSkin: CharacterSkin;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlay,
  onHowToPlay,
  onSettings,
  onHighScores,
  onCharacters,
  highScore,
  totalCoins,
  selectedSkin,
  soundEnabled,
  onToggleSound,
}) => {
  const handleClick = (action: () => void) => {
    audioManager.playClick();
    action();
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-5 bg-gradient-to-b from-slate-950/90 via-slate-900/80 to-slate-950/95 backdrop-blur-sm select-none">
      {/* Top Header info */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          {/* Quick Sound Toggle */}
          <button
            onClick={() => handleClick(onToggleSound)}
            className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 active:scale-95"
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>
        </div>

        {/* Banked Coins */}
        <div className="flex items-center gap-2 bg-slate-800/80 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-md">
          <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">
            $
          </div>
          <span className="font-tabular font-bold text-amber-300 text-sm">
            {totalCoins.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Center Branding & Skin Preview */}
      <div className="flex flex-col items-center text-center my-auto">
        <div className="mb-2">
          <h1 className="font-display font-black text-4xl sm:text-6xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-400 drop-shadow-[0_2px_12px_rgba(6,182,212,0.4)]">
            RUNNER RUSH
          </h1>
        </div>

        {/* Current High Score Banner */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <span>BEST SCORE:</span>
          <span className="font-tabular text-sm font-extrabold text-amber-400">
            {highScore.toLocaleString()}
          </span>
        </div>

        {/* Character Skin Preview Mini-Card */}
        <button
          onClick={() => handleClick(onCharacters)}
          className="flex items-center gap-3 px-4 py-2.5 bg-slate-800/60 hover:bg-slate-800/90 active:scale-98 border border-slate-700/80 rounded-2xl transition-all shadow-md group"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-inner font-black text-sm"
            style={{ backgroundColor: selectedSkin.jacketColor }}
          >
            <User className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Runner
            </div>
            <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
              {selectedSkin.name}
            </div>
          </div>
        </button>
      </div>

      {/* Main Action Buttons */}
      <div className="flex flex-col gap-2.5 max-w-sm w-full mx-auto pb-4">
        {/* PLAY PRIMARY CTA */}
        <button
          onClick={() => handleClick(onPlay)}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400 text-slate-950 font-display font-black text-xl tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(6,182,212,0.4)] active:scale-98 transition-transform"
        >
          <Play className="w-6 h-6 fill-current" />
          PLAY
        </button>

        {/* SECONDARY ROW */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => handleClick(onHowToPlay)}
            className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-98 border border-slate-700 flex items-center justify-center gap-2 text-slate-200 text-sm font-bold transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            HOW TO PLAY
          </button>

          <button
            onClick={() => handleClick(onHighScores)}
            className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-98 border border-slate-700 flex items-center justify-center gap-2 text-slate-200 text-sm font-bold transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            HIGH SCORE
          </button>
        </div>

        {/* SETTINGS BUTTON */}
        <button
          onClick={() => handleClick(onSettings)}
          className="h-11 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 active:scale-98 border border-slate-800 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 text-xs font-semibold tracking-wide uppercase transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
          SETTINGS
        </button>
      </div>
    </div>
  );
};
