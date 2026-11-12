import React from 'react';
import { LandingCMS, RoleType } from '../types';

interface LandingViewProps {
  cms: LandingCMS;
  onSelectRole: (role: RoleType) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ cms, onSelectRole }) => {
  // Default fallback image if no custom photo uploaded yet by Admin
  const defaultHeroImage =
    'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80';

  const heroPhoto = cms.heroImageUrl || defaultHeroImage;

  return (
    <div className="space-y-6">
      {/* Hero Banner Intro (Editable via Admin CMS) */}
      <div className="bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl relative overflow-hidden border border-emerald-800/40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Text Information */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/15 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border border-emerald-400/25">
              <i className="fa-solid fa-building-columns text-[11px]"></i>
              <span>{cms.namaPesantren}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight text-white">
              {cms.heroTitle}
            </h2>

            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed font-normal">
              {cms.heroDesc}
            </p>
          </div>

          {/* Right Column: Hero Photo Card (Managed exclusively by Admin) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-emerald-400/30 bg-slate-900/80 shadow-2xl">
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-950 relative">
                <img
                  src={heroPhoto}
                  alt={cms.namaPesantren}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2.5 left-2.5 bg-slate-950/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-emerald-200 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
                  <i className="fa-solid fa-shield-halved text-emerald-400 text-[10px]"></i>
                  <span className="font-medium tracking-wide">Portal Resmi Pesantren</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Background Icon */}
        <div className="absolute -right-8 -bottom-10 opacity-5 text-white pointer-events-none select-none">
          <i className={`${cms.heroIconClass || 'fa-solid fa-mosque'} text-[220px] sm:text-[280px]`}></i>
        </div>
      </div>

      {/* Dynamic Running Alert / Pengumuman Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 py-2.5 rounded-2xl shadow-xs border border-amber-300/80 flex items-center space-x-3 text-xs overflow-hidden">
        <span className="bg-slate-950 text-amber-300 px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider shrink-0 flex items-center gap-1.5 shadow-xs">
          <i className="fa-solid fa-bullhorn text-amber-400"></i>
          <span>Pengumuman</span>
        </span>
        <div className="overflow-hidden whitespace-nowrap flex-grow">
          <div className="animate-marquee font-semibold tracking-wide text-slate-900">
            {cms.runningBanner}
          </div>
        </div>
      </div>

      {/* Dynamic Visi & Misi Section (Directly Below Banner) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 hover:border-emerald-300 transition-colors">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs shadow-xs">
              <i className="fa-solid fa-eye"></i>
            </span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Visi Pesantren</h3>
              <p className="text-[11px] text-slate-400">Pedoman dasar tujuan pendidikan</p>
            </div>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed italic bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/80 font-medium">
            "{cms.visi}"
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xs shadow-xs">
              <i className="fa-solid fa-bullseye"></i>
            </span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Misi Pesantren</h3>
              <p className="text-[11px] text-slate-400">Langkah strategis pembinaan santri</p>
            </div>
          </div>
          <div className="text-xs text-slate-700 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100/80 whitespace-pre-line font-medium">
            {cms.misi}
          </div>
        </div>
      </div>

      {/* Role Selection Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
        {/* Card 1: Admin Pondok */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 hover:shadow-lg hover:border-emerald-400 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform shadow-xs">
              <i className="fa-solid fa-user-shield"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-900">1. Admin Pondok</h3>
            <p className="text-slate-500 text-xs mt-0.5 mb-5">Pengelola Pusat, CMS Tampilan & PDF AI</p>
            <ul className="text-xs text-slate-600 space-y-2.5 mb-7">
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-emerald-600 mr-2 mt-0.5 shrink-0 text-[11px]"></i>
                <span>Edit Tampilan Depan / CMS Landing Page</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-emerald-600 mr-2 mt-0.5 shrink-0 text-[11px]"></i>
                <span>Kelola Data Santri (12 Kelas Awaliyah & Wustho)</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-emerald-600 mr-2 mt-0.5 shrink-0 text-[11px]"></i>
                <span>Kelola Akun Guru & Password Wali Santri</span>
              </li>
              <li className="flex items-start font-semibold text-slate-800">
                <i className="fa-solid fa-circle-check text-emerald-600 mr-2 mt-0.5 shrink-0 text-[11px]"></i>
                <span>Pusat Pesan & Chat Seluruh Wali Santri</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-emerald-600 mr-2 mt-0.5 shrink-0 text-[11px]"></i>
                <span>Cetak PDF Resmi + Narasi Evaluasi Gemini AI</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => onSelectRole('admin')}
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer group-hover:shadow-md"
            type="button"
          >
            <span>Masuk Portal Admin</span>
            <i className="fa-solid fa-arrow-right text-[11px]"></i>
          </button>
        </div>

        {/* Card 2: Guru / Ustadz */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 hover:shadow-lg hover:border-blue-400 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform shadow-xs">
              <i className="fa-solid fa-chalkboard-user"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-900">2. Portal Guru</h3>
            <p className="text-slate-500 text-xs mt-0.5 mb-5">Pengajar & Pembina Kedisiplinan</p>
            <ul className="text-xs text-slate-600 space-y-2.5 mb-7">
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-blue-600 mr-2 mt-0.5 shrink-0 text-[11px]"></i>
                <span>Presensi Harian 12 Kelas & Scan QR (1x)</span>
              </li>
              <li className="flex items-start font-semibold text-slate-800">
                <i className="fa-solid fa-circle-check text-blue-600 mr-2 mt-0.5 shrink-0 text-[11px]"></i>
                <span>Input Pelanggaran & AI Sanksi Mendidik</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-blue-600 mr-2 mt-0.5 shrink-0 text-[11px]"></i>
                <span>Fitur Chat Direct dengan Wali Santri</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-blue-600 mr-2 mt-0.5 shrink-0 text-[11px]"></i>
                <span>Draf Balasan Chat Otomatis via AI</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-blue-600 mr-2 mt-0.5 shrink-0 text-[11px]"></i>
                <span>Ganti Password Mandiri Guru / Ustadz</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => onSelectRole('guru')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer group-hover:shadow-md"
            type="button"
          >
            <span>Masuk Portal Guru</span>
            <i className="fa-solid fa-arrow-right text-[11px]"></i>
          </button>
        </div>

        {/* Card 3: Wali Santri */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/90 hover:shadow-lg hover:border-purple-400 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform shadow-xs">
              <i className="fa-solid fa-users-between-lines"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-900">3. Wali Santri</h3>
            <p className="text-slate-500 text-xs mt-0.5 mb-5">Orang Tua / Wali Murid</p>
            <ul className="text-xs text-slate-600 space-y-2.5 mb-7">
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-purple-600 mr-2 mt-0.5 shrink-0 text-[11px]"></i>
                <span>Pantau Presensi Harian Santri (H, S, I, A)</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-purple-600 mr-2 mt-0.5 shrink-0 text-[11px]"></i>
                <span>Lihat Record Pelanggaran & Sanksi Ta'zir</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-purple-600 mr-2 mt-0.5 shrink-0 text-[11px]"></i>
                <span>Chat Direct ke Admin / Ustadz Pengampu</span>
              </li>
              <li className="flex items-start font-semibold text-slate-800">
                <i className="fa-solid fa-circle-check text-purple-600 mr-2 mt-0.5 shrink-0 text-[11px]"></i>
                <span>AI Konsultasi Parenting Islami 24/7</span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-circle-check text-purple-600 mr-2 mt-0.5 shrink-0 text-[11px]"></i>
                <span>Akses Biodata & Ubah Password Mandiri</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => onSelectRole('wali')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer group-hover:shadow-md"
            type="button"
          >
            <span>Masuk Portal Wali Santri</span>
            <i className="fa-solid fa-arrow-right text-[11px]"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
