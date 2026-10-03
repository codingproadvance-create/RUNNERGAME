import React, { useState } from 'react';
import { Smartphone, Download, Check, Copy, ExternalLink, X, ShieldCheck, Terminal, Layers } from 'lucide-react';
import { audioManager } from '../game/audio';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidApkModalProps {
  onClose: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({ onClose }) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const pwaBuilderUrl = `https://www.pwabuilder.com/?url=${encodeURIComponent(currentUrl)}`;

  const copyToClipboard = (text: string, id: string) => {
    audioManager.playClick();
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleInstallClick = async () => {
    audioManager.playClick();
    if (isInstallable) {
      await install();
    } else {
      // Guide the user on how Chrome for Android installs it
      alert('To install on your Android device: open Chrome menu (⋮) and tap "Install app" or "Add to Home screen"!');
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/92 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col my-auto max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-xl sm:text-2xl tracking-tight text-white flex items-center gap-1.5">
                ANDROID APP / APK
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">Install or package Runner Rush</p>
            </div>
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

        {/* Scrollable Body */}
        <div className="flex flex-col gap-3 py-3 overflow-y-auto pr-1">
          {/* OPTION 1: INSTANT ANDROID APP INSTALLATION (DIRECT PWA/APK) */}
          <div className="bg-gradient-to-br from-emerald-500/15 via-slate-800/80 to-slate-900 border border-emerald-500/30 rounded-2xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Option 1: Instant Install (No Dev Tools Needed)
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-white">Direct Android App Installation</h3>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Installs directly to your Android launcher as a native, full-screen app with offline support, app icon, and sound.
              </p>
            </div>

            <button
              onClick={handleInstallClick}
              className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-display font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              {isInstalled ? 'App Already Installed!' : isInstallable ? 'Install Android App Now' : 'Install on Android Phone'}
            </button>

            {!isInstallable && (
              <p className="text-[10px] text-slate-400 italic text-center">
                On Android phone: Open Chrome menu (⋮) → tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.
              </p>
            )}
          </div>

          {/* OPTION 2: 1-CLICK WEB-BASED APK DOWNLOAD */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-400">
              Option 2: 1-Click Online APK Generator
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Use Microsoft & Google's free <strong>PWABuilder</strong> to compile a signed <code>.apk</code> or <code>.aab</code> package directly in your browser:
            </p>

            <a
              href={pwaBuilderUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => audioManager.playClick()}
              className="w-full h-10 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Generate .APK on PWABuilder
            </a>
          </div>

          {/* OPTION 3: CAPACITOR NATIVE ANDROID BUILD */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400">
                Option 3: Compile APK with Capacitor
              </span>
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              To build a standalone debug/release <code>app-debug.apk</code> locally using Android Studio:
            </p>

            <div className="relative bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto leading-relaxed">
              <div># 1. Install Capacitor Android tools</div>
              <div className="text-cyan-400">npm i @capacitor/core @capacitor/android</div>
              <div className="text-cyan-400">npm i -D @capacitor/cli</div>
              <div className="mt-1"># 2. Build web assets & add Android project</div>
              <div className="text-cyan-400">npm run build</div>
              <div className="text-cyan-400">npx cap add android</div>
              <div className="text-cyan-400">npx cap sync</div>
              <div className="mt-1"># 3. Open in Android Studio & build APK</div>
              <div className="text-cyan-400">npx cap open android</div>
              <div className="text-slate-500 mt-1">// In Android Studio: Build → Build APK(s)</div>
            </div>

            <button
              onClick={() =>
                copyToClipboard(
                  `npm i @capacitor/core @capacitor/android && npm i -D @capacitor/cli && npm run build && npx cap add android && npx cap sync && npx cap open android`,
                  'cap'
                )
              }
              className="self-end text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              {copiedTab === 'cap' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied command!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy commands</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            audioManager.playClick();
            onClose();
          }}
          className="mt-2 w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-bold text-sm transition-colors shrink-0"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
