import React from 'react';
import { LandingCMS } from '../types';

interface FooterProps {
  cms: LandingCMS;
}

export const Footer: React.FC<FooterProps> = ({ cms }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-8 border-t border-slate-900 text-center text-xs no-print mt-auto">
      <div className="max-w-7xl mx-auto px-4 space-y-3">
        <div className="flex justify-center items-center space-x-2 text-emerald-400 font-bold text-sm">
          <i className="fa-solid fa-kaaba"></i>
          <span>{cms.namaPesantren.toUpperCase()}</span>
        </div>
        <p className="text-slate-400">
          &copy; {new Date().getFullYear()} {cms.namaPesantren}. Hak Cipta Dilindungi Undang-Undang.
        </p>
        <p className="text-[11px] text-slate-500 max-w-3xl mx-auto leading-relaxed">
          {cms.alamat} &bull; Telp/WA: {cms.telpWA} &bull; Email: {cms.email}
        </p>
        <div className="pt-2 text-[10px] text-slate-600 flex items-center justify-center gap-2">
          <span>Sistem Manajemen Pesantren Terpadu</span>
          <span>&bull;</span>
          <span>Ditenagai Google Gemini 3.8 Flash</span>
        </div>
      </div>
    </footer>
  );
};
