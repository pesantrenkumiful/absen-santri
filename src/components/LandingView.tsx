import React from 'react';
import { LandingCMS, RoleType } from '../types';

interface LandingViewProps {
  cms: LandingCMS;
  onSelectRole: (role: RoleType) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ cms, onSelectRole }) => {
  return (
    <div className="space-y-6">
      {/* Hero Banner Intro (Editable via CMS) */}
      <div className="bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-emerald-800/40">
        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border border-emerald-400/30">
            <i className="fa-solid fa-building-columns"></i>
            <span>{cms.namaPesantren}</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight text-white">
            {cms.heroTitle}
          </h2>
          <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
            {cms.heroDesc}
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <span className="bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs border border-white/10 font-medium">
              <i className="fa-solid fa-users text-emerald-400 mr-1.5"></i>12 Kelas Awaliyah & Wustho
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs border border-white/10 font-medium">
              <i className="fa-solid fa-file-pdf text-rose-400 mr-1.5"></i>Laporan Resmi KOP Surat
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs border border-white/10 font-medium">
              <i className="fa-solid fa-wand-magic-sparkles text-amber-400 mr-1.5"></i>AI Parenting & Sanksi Mendidik
            </span>
          </div>
        </div>

        {/* Decorative Background Icon */}
        <div className="absolute -right-8 -bottom-10 opacity-10 text-white pointer-events-none select-none">
          <i className={`${cms.heroIconClass || 'fa-solid fa-mosque'} text-[220px] sm:text-[280px]`}></i>
        </div>
      </div>

      {/* Dynamic Running Alert / Pengumuman Banner */}
      <div className="bg-amber-400 text-slate-950 px-4 py-2.5 rounded-2xl shadow-sm border border-amber-300 flex items-center space-x-3 text-xs font-bold overflow-hidden">
        <span className="bg-slate-950 text-amber-300 px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider shrink-0 flex items-center gap-1.5 shadow-xs">
          <i className="fa-solid fa-bullhorn text-amber-400"></i>
          <span>Pengumuman</span>
        </span>
        <div className="overflow-hidden whitespace-nowrap flex-grow">
          <div className="animate-marquee font-semibold tracking-wide">
            {cms.runningBanner}
          </div>
        </div>
      </div>

      {/* Dynamic Visi & Misi Section (Directly Below Banner) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-2">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-2 hover:shadow-md transition">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
              <i className="fa-solid fa-eye"></i>
            </span>
            <span>Visi Pesantren</span>
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed italic bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 font-medium">
            "{cms.visi}"
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-2 hover:shadow-md transition">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
              <i className="fa-solid fa-bullseye"></i>
            </span>
            <span>Misi Pesantren</span>
          </h3>
          <div className="text-xs text-slate-700 leading-relaxed bg-blue-50/60 p-4 rounded-xl border border-blue-100 whitespace-pre-line font-medium">
            {cms.misi}
          </div>
        </div>
      </div>

      {/* Role Selection Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Card 1: Admin Pondok */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/90 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl mb-5 group-hover:scale-105 transition-transform shadow-xs">
              <i className="fa-solid fa-user-shield"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800">1. Admin Pondok</h3>
            <p className="text-slate-500 text-xs mt-1 mb-5">Pengelola Utama, CMS Tampilan & PDF AI</p>
            <ul className="text-xs text-slate-600 space-y-2.5 mb-8">
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-emerald-600 mr-2 mt-0.5 shrink-0"></i>
                <span>Edit Tampilan Depan / CMS Landing Page</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-emerald-600 mr-2 mt-0.5 shrink-0"></i>
                <span>Kelola Data Santri (12 Kelas Awaliyah & Wustho)</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-emerald-600 mr-2 mt-0.5 shrink-0"></i>
                <span>Kelola Akun Guru & Password Wali Santri</span>
              </li>
              <li className="flex items-start font-semibold text-slate-800">
                <i className="fa-solid fa-circle-check text-emerald-600 mr-2 mt-0.5 shrink-0"></i>
                <span>Pusat Pesan & Chat Seluruh Wali Santri</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-emerald-600 mr-2 mt-0.5 shrink-0"></i>
                <span>Cetak PDF Resmi + Narasi Evaluasi Gemini AI</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => onSelectRole('admin')}
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 px-4 rounded-2xl text-xs transition shadow-md flex items-center justify-center space-x-2 cursor-pointer group-hover:shadow-lg"
            type="button"
          >
            <span>Login Admin</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        {/* Card 2: Guru / Ustadz */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/90 hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl mb-5 group-hover:scale-105 transition-transform shadow-xs">
              <i className="fa-solid fa-chalkboard-user"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800">2. Portal Guru</h3>
            <p className="text-slate-500 text-xs mt-1 mb-5">Pengajar & Pembina Kedisiplinan</p>
            <ul className="text-xs text-slate-600 space-y-2.5 mb-8">
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-blue-600 mr-2 mt-0.5 shrink-0"></i>
                <span>Presensi Harian 12 Kelas (H, S, I, A)</span>
              </li>
              <li className="flex items-start font-semibold text-slate-800">
                <i className="fa-solid fa-circle-check text-blue-600 mr-2 mt-0.5 shrink-0"></i>
                <span>Input Pelanggaran & AI Sanksi Mendidik</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-blue-600 mr-2 mt-0.5 shrink-0"></i>
                <span>Fitur Chat Direct dengan Wali Santri</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-blue-600 mr-2 mt-0.5 shrink-0"></i>
                <span>Draf Balasan Chat Otomatis via AI</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-blue-600 mr-2 mt-0.5 shrink-0"></i>
                <span>Ganti Password Mandiri Guru / Ustadz</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => onSelectRole('guru')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-2xl text-xs transition shadow-md flex items-center justify-center space-x-2 cursor-pointer group-hover:shadow-lg"
            type="button"
          >
            <span>Login Guru</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        {/* Card 3: Wali Santri */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/90 hover:shadow-xl hover:border-purple-300 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl mb-5 group-hover:scale-105 transition-transform shadow-xs">
              <i className="fa-solid fa-users-between-lines"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800">3. Wali Santri</h3>
            <p className="text-slate-500 text-xs mt-1 mb-5">Orang Tua / Wali Murid</p>
            <ul className="text-xs text-slate-600 space-y-2.5 mb-8">
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-purple-600 mr-2 mt-0.5 shrink-0"></i>
                <span>Pantau Presensi Harian Santri (H, S, I, A)</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-purple-600 mr-2 mt-0.5 shrink-0"></i>
                <span>Lihat Record Pelanggaran & Sanksi Ta'zir</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-purple-600 mr-2 mt-0.5 shrink-0"></i>
                <span>Chat Direct ke Admin / Ustadz Pengampu</span>
              </li>
              <li className="flex items-start font-semibold text-slate-800">
                <i className="fa-solid fa-circle-check text-purple-600 mr-2 mt-0.5 shrink-0"></i>
                <span>AI Konsultasi Parenting Islami 24/7</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-purple-600 mr-2 mt-0.5 shrink-0"></i>
                <span>Akses Biodata & Ubah Password Mandiri</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => onSelectRole('wali')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-4 rounded-2xl text-xs transition shadow-md flex items-center justify-center space-x-2 cursor-pointer group-hover:shadow-lg"
            type="button"
          >
            <span>Login Wali Santri</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
