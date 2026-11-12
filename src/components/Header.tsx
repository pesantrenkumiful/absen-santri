import React from 'react';
import { ActiveUser, LandingCMS } from '../types';

interface HeaderProps {
  cms: LandingCMS;
  currentUser: ActiveUser | null;
  isFirebaseConnected?: boolean;
  onOpenApiKey: () => void;
  onLogout: () => void;
  onSwitchRole: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cms,
  currentUser,
  isFirebaseConnected = false,
  onOpenApiKey,
  onLogout,
  onSwitchRole,
}) => {
  return (
    <header className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-950 text-white shadow-lg sticky top-0 z-30 no-print border-b border-emerald-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Dynamic Header Title */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={onSwitchRole}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg font-bold text-xl border border-emerald-300/40 shrink-0">
              <i className="fa-solid fa-kaaba"></i>
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg leading-tight tracking-wide flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold tracking-wider text-white">SIPONDOK</span>
                <span className="bg-emerald-600/60 text-emerald-200 text-xs px-2.5 py-0.5 rounded-md font-bold border border-emerald-400/30">
                  {cms.namaPesantren}
                </span>
                {isFirebaseConnected && (
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-400/30 font-semibold flex items-center gap-1" title="Tersambung ke Cloud Firestore Database">
                    <i className="fa-solid fa-fire text-amber-400 text-[10px]"></i>
                    <span>Firebase Live</span>
                  </span>
                )}
                <span className="bg-emerald-500/30 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-400/30 font-semibold flex items-center gap-1">
                  <i className="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
                  <span>Gemini 3.8</span>
                </span>
              </h1>
              <p className="text-[11px] text-emerald-200/80 truncate max-w-xs sm:max-w-md">{cms.tagline}</p>
            </div>
          </div>

          {/* Controls & Active User Status */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Google AI Studio Status Indicator */}
            <button
              onClick={onOpenApiKey}
              className="bg-slate-900/80 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
              title="Pengaturan API Key Google AI Studio"
              type="button"
            >
              <i className="fa-solid fa-microchip text-emerald-400"></i>
              <span className="hidden sm:inline">Google AI Studio</span>
            </button>

            {currentUser ? (
              <>
                <div className="hidden sm:flex items-center space-x-2 bg-emerald-800/60 px-3 py-1.5 rounded-full border border-emerald-600/50 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-medium text-emerald-100 max-w-[140px] truncate">
                    {currentUser.role === 'admin'
                      ? 'Admin: ' + currentUser.name
                      : currentUser.role === 'guru'
                      ? 'Ustadz: ' + currentUser.name
                      : 'Wali: ' + currentUser.name}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition flex items-center space-x-1 cursor-pointer"
                  type="button"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                  <span className="hidden md:inline">Keluar</span>
                </button>

                <button
                  onClick={onSwitchRole}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition flex items-center space-x-1 cursor-pointer"
                  type="button"
                >
                  <i className="fa-solid fa-arrows-rotate"></i>
                  <span className="hidden md:inline">Ganti Portal</span>
                </button>
              </>
            ) : (
              <div className="hidden sm:flex items-center space-x-2 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Belum Login</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
