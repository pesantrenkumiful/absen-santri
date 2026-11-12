import React, { useState, useEffect } from 'react';
import { RoleType, Guru, Santri } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  role: RoleType;
  onClose: () => void;
  onLogin: (u: string, p: string) => void;
  gurus: Guru[];
  santris: Santri[];
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  role,
  onClose,
  onLogin,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Reset inputs whenever modal is opened or role changes to ensure strict privacy
  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen, role]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username.trim(), password.trim());
  };

  const getRoleMeta = () => {
    if (role === 'admin') {
      return {
        title: 'Login Admin Pondok',
        badge: 'Pengelola Utama & Sistem Terpadu',
        iconBg: 'bg-emerald-100 text-emerald-800',
        icon: 'fa-user-shield',
        userLabel: 'Username Akun Admin:',
        userPlaceholder: 'Masukkan username admin...',
        btnBg: 'bg-emerald-800 hover:bg-emerald-900',
        accentRing: 'focus:ring-emerald-500',
        borderColor: 'border-emerald-200',
      };
    }
    if (role === 'guru') {
      return {
        title: 'Login Portal Guru & Ustadz',
        badge: 'Pengajar & Pembina Kedisiplinan',
        iconBg: 'bg-blue-100 text-blue-700',
        icon: 'fa-chalkboard-user',
        userLabel: 'Username Guru / Ustadz:',
        userPlaceholder: 'Masukkan username akun guru...',
        btnBg: 'bg-blue-600 hover:bg-blue-700',
        accentRing: 'focus:ring-blue-500',
        borderColor: 'border-blue-200',
      };
    }
    return {
      title: 'Login Portal Wali Santri',
      badge: 'Orang Tua / Wali Murid',
      iconBg: 'bg-purple-100 text-purple-700',
      icon: 'fa-users-between-lines',
      userLabel: 'Nomor Induk Santri (NIS):',
      userPlaceholder: 'Masukkan NIS santri Anda...',
      btnBg: 'bg-purple-600 hover:bg-purple-700',
      accentRing: 'focus:ring-purple-500',
      borderColor: 'border-purple-200',
    };
  };

  const meta = getRoleMeta();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl relative border border-slate-100 transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Tutup dialog login"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition cursor-pointer"
        >
          <i className="fa-solid fa-xmark text-base"></i>
        </button>

        {/* Header Icon */}
        <div className={`w-14 h-14 rounded-2xl ${meta.iconBg} mx-auto flex items-center justify-center text-2xl mb-3 shadow-inner`}>
          <i className={`fa-solid ${meta.icon}`}></i>
        </div>

        <h3 className="text-lg font-bold text-slate-800 text-center">{meta.title}</h3>
        <p className="text-[11px] text-slate-500 text-center mb-4">{meta.badge}</p>

        {/* Privacy & Confidentiality Notice (No credentials exposed) */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 mb-4 text-[11px] text-slate-600 space-y-1">
          <div className="flex items-center space-x-1.5 font-bold text-slate-800">
            <i className="fa-solid fa-shield-halved text-emerald-700"></i>
            <span>Akses Masuk Bersifat Privat & Rahasia</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Harap masukkan kredensial resmi Anda. Jangan pernah membagikan nama pengguna atau kata sandi kepada pihak lain.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs" autoComplete="off">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>{meta.userLabel}</span>
              <span className="text-[10px] text-slate-400 font-normal">Wajib diisi</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <i className="fa-solid fa-user text-xs"></i>
              </span>
              <input
                type="text"
                required
                autoComplete="off"
                placeholder={meta.userPlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 ${meta.accentRing} transition`}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Kata Sandi:</span>
              <span className="text-[10px] text-slate-400 font-normal">Wajib diisi</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <i className="fa-solid fa-lock text-xs"></i>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-9 pr-10 text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${meta.accentRing} transition`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                aria-label={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className={`w-full ${meta.btnBg} text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center space-x-2`}
            >
              <span>Masuk Portal</span>
              <i className="fa-solid fa-arrow-right text-xs"></i>
            </button>
          </div>

          <div className="text-center pt-1">
            <p className="text-[10px] text-slate-400">
              <i className="fa-solid fa-lock mr-1 text-[9px]"></i>
              Koneksi terenkripsi & data santri terlindungi
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
