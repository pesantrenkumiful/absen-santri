import React from 'react';
import { ActiveUser, LandingCMS } from '../types';

interface HeaderProps {
  cms: LandingCMS;
  currentUser: ActiveUser | null;
  isFirebaseConnected?: boolean;
  onOpenApiKey?: () => void;
  onLogout: () => void;
  onSwitchRole: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cms,
  currentUser,
  isFirebaseConnected = false,
  onLogout,
  onSwitchRole,
}) => {
  return (
    <header className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white shadow-md sticky top-0 z-30 no-print border-b border-emerald-800/30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none group"
            onClick={onSwitchRole}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md font-bold text-xl border border-emerald-300/30 shrink-0 group-hover:scale-105 transition-transform">
              <i className="fa-solid fa-kaaba"></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-wider text-white">
                  SIPONDOK
                </span>
                <span className="text-emerald-500/50 hidden sm:inline">|</span>
                <span className="text-xs sm:text-sm font-semibold text-emerald-100 truncate max-w-[200px] sm:max-w-xs">
                  {cms.namaPesantren}
                </span>
                {isFirebaseConnected && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-300/90 font-medium ml-1"
                    title="Database Cloud Firestore Aktif & Tersinkronkan"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="hidden lg:inline text-[10px] uppercase tracking-wider text-emerald-300/70 font-semibold">
                      Live
                    </span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-200/70 truncate max-w-xs sm:max-w-md font-normal">
                {cms.tagline}
              </p>
            </div>
          </div>

          {/* Controls & Active User Status */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {currentUser ? (
              <>
                <div className="hidden sm:flex items-center space-x-2 bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-700/40 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-medium text-emerald-100 max-w-[150px] truncate">
                    {currentUser.role === 'admin'
                      ? 'Admin: ' + currentUser.name
                      : currentUser.role === 'guru'
                      ? 'Ustadz: ' + currentUser.name
                      : 'Wali: ' + currentUser.name}
                  </span>
                </div>

                <button
                  onClick={onSwitchRole}
                  className="bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition flex items-center space-x-1.5 cursor-pointer border border-emerald-700/40"
                  type="button"
                  title="Ganti ke portal login lain"
                >
                  <i className="fa-solid fa-arrows-rotate text-[11px]"></i>
                  <span className="hidden md:inline">Ganti Portal</span>
                </button>

                <button
                  onClick={onLogout}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  type="button"
                  title="Keluar dari akun saat ini"
                >
                  <i className="fa-solid fa-right-from-bracket text-[11px]"></i>
                  <span className="hidden md:inline">Keluar</span>
                </button>
              </>
            ) : (
              <div className="hidden sm:flex items-center space-x-2 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
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
