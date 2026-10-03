import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { audioManager } from '../game/audio';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onMainMenu,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic,
}) => {
  const handleClick = (cb: () => void) => {
    audioManager.playClick();
    cb();
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none">
      <div className="w-full max-w-xs bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Title */}
        <h2 className="font-display font-black text-3xl tracking-tight text-white mb-1">
          GAME PAUSED
        </h2>
        <p className="text-xs text-slate-400 mb-6 font-medium">Take a breath, runner!</p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full mb-6">
          {/* RESUME */}
          <button
            onClick={() => handleClick(onResume)}
            className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-98 text-slate-950 font-extrabold text-base flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            RESUME
          </button>

          {/* RESTART */}
          <button
            onClick={() => handleClick(onRestart)}
            className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            RESTART
          </button>

          {/* MAIN MENU */}
          <button
            onClick={() => handleClick(onMainMenu)}
            className="w-full h-12 rounded-xl bg-slate-800/60 hover:bg-slate-800 active:scale-98 text-slate-300 border border-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4 text-slate-400" />
            MAIN MENU
          </button>
        </div>

        {/* Audio Quick Toggles */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-800 w-full justify-center text-xs text-slate-400">
          <button
            onClick={() => handleClick(onToggleSound)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            SFX
          </button>

          <button
            onClick={() => handleClick(onToggleMusic)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300"
          >
            {musicEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            Music
          </button>
        </div>
      </div>
    </div>
  );
};
