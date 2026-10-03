import React, { useState } from 'react';
import { Trophy, MapPin, Coins, Flame, X, Trash2, AlertTriangle } from 'lucide-react';
import { SavedStats, resetAllStats } from '../utils/storage';
import { audioManager } from '../game/audio';

interface HighScoreModalProps {
  stats: SavedStats;
  onStatsReset: () => void;
  onClose: () => void;
}

export const HighScoreModal: React.FC<HighScoreModalProps> = ({
  stats,
  onStatsReset,
  onClose,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = () => {
    audioManager.playClick();
    resetAllStats();
    onStatsReset();
    setShowConfirm(false);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="font-display font-black text-2xl tracking-tight text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400 fill-amber-400" />
              HIGH SCORES
            </h2>
            <p className="text-xs text-slate-400 font-medium">Your lifetime runner achievements</p>
          </div>
          <button
            onClick={() => {
              audioManager.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="flex flex-col gap-3 py-4">
          {/* Best Score (Hero card) */}
          <div className="bg-gradient-to-br from-amber-500/15 via-slate-800/80 to-slate-900 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                <Trophy className="w-6 h-6 fill-current" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 tracking-wider">ALL-TIME BEST</div>
                <div className="font-tabular font-black text-2xl text-amber-300">
                  {stats.highScore.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Longest Distance */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 tracking-wider">LONGEST RUN</div>
                <div className="font-tabular font-extrabold text-lg text-cyan-300">
                  {stats.bestDistance.toLocaleString()} meters
                </div>
              </div>
            </div>
          </div>

          {/* Total Coins Banked */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 tracking-wider">TOTAL COINS BANKED</div>
                <div className="font-tabular font-extrabold text-lg text-amber-300">
                  {stats.totalCoins.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Games Played */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 tracking-wider">GAMES PLAYED</div>
                <div className="font-tabular font-extrabold text-lg text-rose-300">
                  {stats.gamesPlayed.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Confirmation or Trigger */}
        {showConfirm ? (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-3 mb-2 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Are you sure? This cannot be undone!
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
              >
                Yes, Clear All
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              audioManager.playClick();
              setShowConfirm(true);
            }}
            className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center justify-center gap-1.5 py-1 mb-2 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset all saved records
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={() => {
            audioManager.playClick();
            onClose();
          }}
          className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-bold text-sm transition-colors"
        >
          BACK TO MENU
        </button>
      </div>
    </div>
  );
};
