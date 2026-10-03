import React from 'react';
import { RotateCcw, Home, Trophy, Award, Coins, MapPin } from 'lucide-react';
import { audioManager } from '../game/audio';

interface GameOverScreenProps {
  score: number;
  distance: number;
  coins: number;
  highScore: number;
  bestDistance: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  distance,
  coins,
  highScore,
  bestDistance,
  onPlayAgain,
  onMainMenu,
}) => {
  const isNewHighScore = Math.floor(score) >= highScore && score > 0;
  const isNewBestDistance = Math.floor(distance) >= bestDistance && distance > 0;

  const handleClick = (cb: () => void) => {
    audioManager.playClick();
    cb();
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Header */}
        <div className="mb-4">
          <span className="text-[11px] font-bold tracking-widest uppercase text-rose-500">
            RUN TERMINATED
          </span>
          <h2 className="font-display font-black text-4xl sm:text-5xl tracking-tight text-white mt-0.5">
            GAME OVER
          </h2>
        </div>

        {/* New Record Banner if applicable */}
        {isNewHighScore && (
          <div className="mb-4 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-400/50 flex items-center gap-1.5 text-amber-300 text-xs font-black tracking-wider uppercase animate-pulse">
            <Trophy className="w-4 h-4 text-amber-400 fill-amber-400" />
            NEW BEST SCORE RECORD!
          </div>
        )}

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-2.5 mb-6">
          {/* Final Score */}
          <div className="col-span-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider">FINAL SCORE</span>
            <span className="font-tabular font-black text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-300">
              {Math.floor(score).toLocaleString()}
            </span>
            <div className="text-[11px] font-medium text-slate-400 mt-0.5 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>BEST:</span>
              <span className="font-tabular font-bold text-slate-200">
                {highScore.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Distance */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>DISTANCE</span>
            </div>
            <span className="font-tabular font-extrabold text-lg text-cyan-300 mt-0.5">
              {Math.floor(distance).toLocaleString()} m
            </span>
            {isNewBestDistance && (
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-tight">
                New Record!
              </span>
            )}
          </div>

          {/* Coins Collected */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>COINS</span>
            </div>
            <span className="font-tabular font-extrabold text-lg text-amber-300 mt-0.5">
              +{coins.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          {/* PLAY AGAIN */}
          <button
            onClick={() => handleClick(onPlayAgain)}
            className="w-full h-13 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400 hover:opacity-95 active:scale-98 text-slate-950 font-display font-black text-lg tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(6,182,212,0.4)] transition-transform"
          >
            <RotateCcw className="w-5 h-5" />
            PLAY AGAIN
          </button>

          {/* MAIN MENU */}
          <button
            onClick={() => handleClick(onMainMenu)}
            className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-300 border border-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4 text-slate-400" />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
