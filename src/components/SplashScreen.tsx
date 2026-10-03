import React from 'react';
import { Play, Sparkles } from 'lucide-react';
import { audioManager } from '../game/audio';

interface SplashScreenProps {
  onStart: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
  const handleTap = () => {
    audioManager.playClick();
    onStart();
  };

  return (
    <div
      onClick={handleTap}
      className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-slate-950 via-[#0B0F19] to-slate-950 cursor-pointer select-none"
    >
      {/* Top subtle badge */}
      <div className="pt-8 flex items-center gap-2 text-cyan-400/80 text-xs font-bold tracking-widest uppercase">
        <Sparkles className="w-4 h-4" />
        <span>Endless 3D Arcade</span>
      </div>

      {/* Main Title Hero */}
      <div className="flex flex-col items-center text-center">
        {/* Glow backdrop */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-magenta-500/20 to-amber-500/20 rounded-full blur-2xl opacity-75" />
          
          <h1 className="relative font-display font-black text-5xl sm:text-7xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 drop-shadow-[0_4px_16px_rgba(6,182,212,0.4)]">
            RUNNER
          </h1>
          <h1 className="relative font-display font-black text-6xl sm:text-8xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400 -mt-2 sm:-mt-4 drop-shadow-[0_4px_24px_rgba(244,63,94,0.5)]">
            RUSH
          </h1>
        </div>

        <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-xs font-medium">
          Dodge obstacles, grab power-ups, and sprint through an endless cyber metropolis!
        </p>
      </div>

      {/* Tap to Start CTA */}
      <div className="pb-12 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center animate-pulse">
          <div className="w-11 h-11 rounded-full bg-cyan-400 flex items-center justify-center shadow-[0_0_16px_#22D3EE] text-slate-950">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        </div>

        <span className="font-display font-extrabold text-base tracking-widest text-cyan-300 uppercase animate-bounce">
          Tap to Start
        </span>
      </div>
    </div>
  );
};
