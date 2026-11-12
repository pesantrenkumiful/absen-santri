import React, { useState } from 'react';
import { Santri, Guru, AbsensiRecord, PelanggaranRecord, ChatMessage } from '../types';
import { callGeminiService } from '../services/geminiService';
import { formatMonthYear, formatIndonesianDate, getAvailableMonths } from '../utils/dateHelper';

interface WaliViewProps {
  currentSantri: Santri;
  gurus: Guru[];
  absensis: AbsensiRecord[];
  pelanggarans: PelanggaranRecord[];
  messages: ChatMessage[];
  onSendMessage: (recipientRole: 'admin' | 'guru', recipientId: number, text: string) => void;
  onUpdateWaliPassword: (newPass: string) => void;
  onShowToast: (msg: string, type: 'info' | 'success' | 'error' | 'warning') => void;
}

export const WaliView: React.FC<WaliViewProps> = ({
  currentSantri,
  gurus,
  absensis,
  pelanggarans,
  messages,
  onSendMessage,
  onUpdateWaliPassword,
  onShowToast,
}) => {
  type WaliTab = 'dashboard' | 'chat' | 'ai';
  const [activeTab, setActiveTab] = useState<WaliTab>('dashboard');

  // Recipient selection state for chat
  const [recipient, setRecipient] = useState<{ role: 'admin' | 'guru'; id: number }>({
    role: 'admin',
    id: 0,
  });
  const [chatInputText, setChatInputText] = useState('');

  // AI Parenting Chatbot state
  const [aiChatHistory, setAiChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([
    {
      role: 'model',
      text: "Assalamu'alaikum Warahmatullahi Wabarakatuh. Saya adalah Konselor AI Parenting & Pembinaan Santri PP Miftahul Ulum Kalisat. Silakan konsultasikan seputar pola asuh Islami, memotivasi santri menghafal Al-Qur'an, atau mengatasi rindu rumah (*homesick*).",
    },
  ]);
  const [aiInputText, setAiInputText] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);

  // Password Modal
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Monthly Attendance state for Wali
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const availableMonths = getAvailableMonths(absensis);

  // Attendance aggregates for current santri filtered by month
  const studentAbsensis = absensis.filter((a) => a.santriId === currentSantri.id);
  const effectiveAbsensis =
    selectedMonth === 'ALL'
      ? studentAbsensis
      : studentAbsensis.filter((a) => a.tanggal.startsWith(selectedMonth));
  const sortedMonthAbsen = [...effectiveAbsensis].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const hadirCount = effectiveAbsensis.filter((a) => a.status === 'H').length;
  const sakitCount = effectiveAbsensis.filter((a) => a.status === 'S').length;
  const izinCount = effectiveAbsensis.filter((a) => a.status === 'I').length;
  const alphaCount = effectiveAbsensis.filter((a) => a.status === 'A').length;
  const totalRecordedDays = hadirCount + sakitCount + izinCount + alphaCount;
  const attendanceRate = totalRecordedDays > 0 ? Math.round((hadirCount / totalRecordedDays) * 100) : 0;

  // Student violations
  const myPelanggaran = pelanggarans.filter((p) => p.santriId === currentSantri.id);

  // Filter messages for current santri and chosen recipient
  const activeThread = messages.filter((m) => {
    if (m.santriId !== currentSantri.id) return false;
    if (recipient.role === 'admin') {
      return m.recipientRole === 'admin' || m.senderRole === 'admin';
    }
    return (
      (m.recipientRole === 'guru' && m.recipientId === recipient.id) ||
      (m.senderRole === 'guru' && m.recipientId === currentSantri.id)
    );
  });

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    onSendMessage(recipient.role, recipient.id, chatInputText.trim());
    setChatInputText('');
    onShowToast('Pesan Anda berhasil dikirim ke pengurus!', 'success');
  };

  const handleSendAiChat = async (queryText?: string) => {
    const q = (queryText || aiInputText).trim();
    if (!q || isAiResponding) return;

    setAiInputText('');
    setAiChatHistory((prev) => [...prev, { role: 'user', text: q }]);
    setIsAiResponding(true);

    try {
      const prompt = `Wali santri dari ${currentSantri.nama} (${currentSantri.kelas}) bertanya: "${q}".
Berikan konsultasi pengasuhan santri yang sangat menyejukkan hati, berbasis nilai-nilai Islam dan adab pesantren, praktis, serta memotivasi orang tua dan anak. Maksimal 3-4 kalimat.`;

      const response = await callGeminiService({
        prompt,
        systemInstruction:
          'Anda adalah Pakar Parenting Islami dan Pembina Santri di Pondok Pesantren Miftahul Ulum Kalisat. Jawab dengan penuh kehangatan, hikmah, dan santun.',
      });

      setAiChatHistory((prev) => [...prev, { role: 'model', text: response }]);
    } catch {
      setAiChatHistory((prev) => [
        ...prev,
        {
          role: 'model',
          text: "Mohon maaf, terjadi kendala jaringan saat menghubungkan ke asisten AI. Silakan coba kembali sesaat lagi.",
        },
      ]);
    } finally {
      setIsAiResponding(false);
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    onUpdateWaliPassword(newPassword.trim());
    setIsPassModalOpen(false);
    setNewPassword('');
    onShowToast('Password Wali Santri berhasil diperbarui!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Student Profile Card Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-purple-800/40">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/30 border border-purple-400/30 flex items-center justify-center text-3xl font-bold shadow-inner shrink-0">
            <i className="fa-solid fa-user-graduate"></i>
          </div>
          <div>
            <span className="bg-purple-400/30 text-purple-200 text-[11px] px-3 py-0.5 rounded-full border border-purple-300/20 font-semibold uppercase tracking-wider">
              Portal Wali Santri &bull; PP Miftahul Ulum
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">{currentSantri.nama}</h2>
            <p className="text-xs text-purple-200/90 flex flex-wrap items-center gap-2 mt-0.5">
              <span>NIS: <strong className="font-mono text-white">{currentSantri.nis}</strong></span>
              <span>&bull;</span>
              <span>Kelas: <strong className="text-white">{currentSantri.kelas}</strong></span>
              <span>&bull;</span>
              <span>Wali: {currentSantri.wali}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsPassModalOpen(true)}
          type="button"
          className="self-start md:self-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
        >
          <i className="fa-solid fa-key"></i>
          <span>Ubah Password Wali</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-2xl shadow-xs border border-slate-200/90 flex flex-wrap gap-1.5 text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('dashboard')}
          type="button"
          className={`flex-1 py-2 px-3.5 rounded-xl font-medium transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-purple-700 text-white shadow-xs font-semibold'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <i className="fa-solid fa-chart-pie text-xs"></i>
          <span>Ringkasan & Kedisiplinan</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          type="button"
          className={`flex-1 py-2 px-3.5 rounded-xl font-medium transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-purple-700 text-white shadow-xs font-semibold'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <i className="fa-solid fa-comments text-xs"></i>
          <span>Chat Ustadz / Admin</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          type="button"
          className={`flex-1 py-2 px-3.5 rounded-xl font-medium transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-purple-700 text-white shadow-xs font-semibold'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <i className="fa-solid fa-brain text-xs text-purple-200"></i>
          <span>AI Parenting Islami</span>
        </button>
      </div>

      {/* TAB 1: RINGKASAN & KEDISIPLINAN */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Header Toolbar & Month Selector for Wali */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center text-lg font-bold">
                <i className="fa-solid fa-calendar-check"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-800">Rekapitulasi Kehadiran Ananda</h4>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                    {formatMonthYear(selectedMonth)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Rincian akumulasi presensi santri per bulan berdasarkan catatan dewan asatidz
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Pilih Bulan:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-purple-900 cursor-pointer focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <optgroup label="Pilihan Bulan Rekap">
                  {availableMonths.map((ym) => (
                    <option key={ym} value={ym}>{formatMonthYear(ym)}</option>
                  ))}
                </optgroup>
                <option value="ALL">Semua Bulan (Sepanjang Waktu)</option>
              </select>
            </div>
          </div>

          {/* Attendance KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-semibold uppercase">Hadir (H)</p>
                <h4 className="text-2xl font-black text-emerald-600 mt-1">{hadirCount} Hari</h4>
                <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold">Tingkat: {attendanceRate}%</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-circle-check"></i>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-semibold uppercase">Sakit (S)</p>
                <h4 className="text-2xl font-black text-amber-600 mt-1">{sakitCount} Hari</h4>
                <span className="text-[10px] text-amber-600 block mt-0.5">Izin Medis</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-bed"></i>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-semibold uppercase">Izin (I)</p>
                <h4 className="text-2xl font-black text-blue-600 mt-1">{izinCount} Hari</h4>
                <span className="text-[10px] text-blue-600 block mt-0.5">Izin Terencana</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-envelope-open-text"></i>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-semibold uppercase">Alpha (A)</p>
                <h4 className="text-2xl font-black text-rose-600 mt-1">{alphaCount} Hari</h4>
                <span className="text-[10px] text-rose-600 block mt-0.5">Tanpa Keterangan</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-circle-xmark"></i>
              </div>
            </div>
          </div>

          {/* Details & Disciplinary History */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student Biodata Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 text-sm flex items-center space-x-2">
                <i className="fa-solid fa-address-card text-purple-600"></i>
                <span>Biodata Lengkap Santri</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nama Lengkap Santri:</span>
                  <span className="font-bold text-slate-800 text-sm">{currentSantri.nama}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Nomor Induk Santri (NIS):</span>
                  <span className="font-mono font-semibold text-slate-700">{currentSantri.nis}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tingkatan Kelas:</span>
                  <span className="font-semibold text-slate-700">{currentSantri.kelas}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Jenis Kelamin:</span>
                  <span className="font-semibold text-slate-700">{currentSantri.jk}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Nama Orang Tua / Wali:</span>
                  <span className="font-semibold text-slate-700">{currentSantri.wali}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">No. Telepon / WhatsApp:</span>
                  <span className="font-semibold font-mono text-slate-700">{currentSantri.hp}</span>
                </div>
              </div>
            </div>

            {/* Disciplinary & Ta'zir History */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                  <i className="fa-solid fa-shield-cat text-amber-500"></i>
                  <span>Riwayat Catatan Kedisiplinan & Sanksi Ta'zir</span>
                </h3>
                <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {myPelanggaran.length} Catatan
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Bentuk Pelanggaran</th>
                      <th className="p-3">Tingkat</th>
                      <th className="p-3">Sanksi Mendidik Yang Diberikan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myPelanggaran.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500 leading-relaxed">
                          <i className="fa-solid fa-circle-check text-emerald-500 text-3xl mb-2 block"></i>
                          Alhamdulillah, santri memiliki catatan kedisiplinan yang sangat baik dan bersih dari pelanggaran.
                        </td>
                      </tr>
                    ) : (
                      myPelanggaran.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono text-slate-500 whitespace-nowrap">{p.tanggal}</td>
                          <td className="p-3 font-bold text-slate-800">{p.pelanggaran}</td>
                          <td className="p-3">
                            {p.kategori === 'Ringan' && (
                              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Ringan
                              </span>
                            )}
                            {p.kategori === 'Sedang' && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Sedang
                              </span>
                            )}
                            {p.kategori === 'Berat' && (
                              <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Berat
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-700 leading-relaxed">{p.sanksi}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Riwayat Detail Tanggal Presensi Ananda Bulan Terpilih */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <i className="fa-solid fa-clipboard-user text-emerald-700"></i>
                <span>Riwayat Tanggal Kehadiran Periode {formatMonthYear(selectedMonth)}</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                Tingkat Kehadiran: <strong className="text-emerald-700">{attendanceRate}%</strong> ({hadirCount} Hadir dari {totalRecordedDays} Pertemuan)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">No</th>
                    <th className="p-3">Tanggal Pertemuan</th>
                    <th className="p-3">Status Kehadiran</th>
                    <th className="p-3">Metode Presensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedMonthAbsen.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">
                        Belum ada catatan presensi ananda pada periode {formatMonthYear(selectedMonth)}.
                      </td>
                    </tr>
                  ) : (
                    sortedMonthAbsen.map((rec, idx) => (
                      <tr key={rec.id || idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-medium text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-800">{formatIndonesianDate(rec.tanggal)}</td>
                        <td className="p-3">
                          {rec.status === 'H' && (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <i className="fa-solid fa-check text-[9px]"></i> Hadir
                            </span>
                          )}
                          {rec.status === 'S' && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <i className="fa-solid fa-bed text-[9px]"></i> Sakit
                            </span>
                          )}
                          {rec.status === 'I' && (
                            <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <i className="fa-solid fa-envelope-open-text text-[9px]"></i> Izin
                            </span>
                          )}
                          {rec.status === 'A' && (
                            <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <i className="fa-solid fa-xmark text-[9px]"></i> Alpha
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">
                          {rec.metode === 'QR_SCAN' ? (
                            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                              <i className="fa-solid fa-qrcode"></i> Scan QR Santri {rec.waktuScan ? `(${rec.waktuScan})` : ''}
                            </span>
                          ) : (
                            'Input Manual Dewan Guru'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHAT USTADZ / ADMIN */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 min-h-[500px] overflow-hidden">
          {/* Recipient Selection */}
          <div className="border-b md:border-b-0 md:border-r border-slate-200 p-4 space-y-3 bg-slate-50/80">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <i className="fa-solid fa-paper-plane text-purple-600"></i>
              <span>Kirim Pesan Ke:</span>
            </h4>

            <div className="space-y-2">
              {/* Option 1: Admin */}
              <div
                onClick={() => setRecipient({ role: 'admin', id: 0 })}
                className={`p-3 rounded-xl cursor-pointer transition border ${
                  recipient.role === 'admin'
                    ? 'bg-purple-100/80 border-purple-400 font-bold'
                    : 'bg-white hover:bg-slate-100 border-slate-200'
                }`}
              >
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <i className="fa-solid fa-user-shield text-emerald-700"></i>
                  <span>Admin Pondok</span>
                </h5>
                <p className="text-[11px] text-slate-500">Sekretariat & Pengurus Utama</p>
              </div>

              {/* Option 2+: Teachers */}
              {gurus.map((g) => {
                const isSelected = recipient.role === 'guru' && recipient.id === g.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => setRecipient({ role: 'guru', id: g.id })}
                    className={`p-3 rounded-xl cursor-pointer transition border ${
                      isSelected
                        ? 'bg-purple-100/80 border-purple-400 font-bold'
                        : 'bg-white hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <i className="fa-solid fa-user-tie text-blue-600"></i>
                      <span>{g.nama}</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 truncate">{g.mapel}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Chat Thread */}
          <div className="md:col-span-2 flex flex-col justify-between p-4 bg-white">
            <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                  <i className="fa-solid fa-user-tie"></i>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    {recipient.role === 'admin'
                      ? 'Pesan Kepada Admin Pondok'
                      : `Pesan Kepada ${gurus.find((g) => g.id === recipient.id)?.nama || 'Ustadz'}`}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {recipient.role === 'admin'
                      ? 'Layanan Informasi Sekretariat Pesantren'
                      : gurus.find((g) => g.id === recipient.id)?.mapel}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto space-y-3 p-2 text-xs max-h-[350px]">
              {activeThread.length === 0 ? (
                <div className="text-center text-slate-400 py-16">
                  <i className="fa-solid fa-comments text-4xl mb-2 text-slate-300"></i>
                  <p>Belum ada percakapan. Tuliskan pertanyaan Anda untuk pengurus atau ustadz.</p>
                </div>
              ) : (
                activeThread.map((m) => {
                  const isMe = m.senderRole === 'wali';
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] p-3.5 rounded-2xl shadow-xs text-xs ${
                          isMe
                            ? 'bg-purple-600 text-white rounded-br-none'
                            : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        <div className="font-bold text-[10px] mb-1 opacity-80">
                          {isMe
                            ? 'Anda (Wali Santri)'
                            : m.senderRole === 'admin'
                            ? 'Admin Pondok'
                            : 'Ustadz'}{' '}
                          &bull; {m.time}
                        </div>
                        <div className="leading-relaxed">{m.text}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 mt-2">
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Tuliskan pesan / pertanyaan Anda untuk pengurus..."
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  className="flex-grow bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>Kirim</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI PARENTING ISLAMI */}
      {activeTab === 'ai' && (
        <div className="bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 max-w-3xl mx-auto border border-purple-800/40">
          <div className="flex items-center space-x-3 border-b border-purple-800/50 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/30 text-purple-300 flex items-center justify-center text-xl border border-purple-400/30 shadow-inner">
              <i className="fa-solid fa-robot"></i>
            </div>
            <div>
              <h4 className="font-bold text-base text-purple-100">AI Konsultasi Perkembangan & Pola Asuh Santri</h4>
              <p className="text-xs text-purple-300/80">
                Konsultasikan pola asuh Islami, memotivasi hafalan Al-Qur'an, dan pembiasaan adab anak
              </p>
            </div>
          </div>

          {/* Chat History Box */}
          <div className="bg-slate-950/60 rounded-2xl p-4 h-72 overflow-y-auto space-y-3 border border-purple-800/40 text-xs">
            {aiChatHistory.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-purple-600 text-white rounded-br-none'
                        : 'bg-purple-900/40 border border-purple-700/50 text-purple-100 rounded-bl-none'
                    }`}
                  >
                    {!isUser && (
                      <div className="font-bold text-[10px] text-purple-300 mb-1 flex items-center gap-1">
                        <i className="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
                        <span>Asisten Gemini AI Pesantren</span>
                      </div>
                    )}
                    <div className="whitespace-pre-line">{msg.text}</div>
                  </div>
                </div>
              );
            })}

            {isAiResponding && (
              <div className="flex justify-start">
                <div className="bg-purple-900/40 border border-purple-700/50 text-purple-200 p-3 rounded-2xl max-w-[85%] text-xs animate-pulse flex items-center space-x-2">
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  <span>Gemini AI sedang merangkai nasehat bijak...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestion Chips */}
          <div className="space-y-1">
            <span className="text-[11px] text-purple-300 font-semibold block">Pertanyaan Cepat:</span>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <button
                type="button"
                onClick={() =>
                  handleSendAiChat(
                    'Bagaimana saran terbaik mengatasi anak yang merasa rindu rumah (homesick) di awal masuk pondok?'
                  )
                }
                className="bg-purple-900/50 hover:bg-purple-800/60 text-purple-200 px-3 py-1.5 rounded-xl border border-purple-600/40 transition cursor-pointer text-left"
              >
                💡 Solusi Anak Homesick
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendAiChat(
                    'Bagaimana cara orang tua mendukung kedisiplinan shalat subuh santri saat liburan pesantren di rumah?'
                  )
                }
                className="bg-purple-900/50 hover:bg-purple-800/60 text-purple-200 px-3 py-1.5 rounded-xl border border-purple-600/40 transition cursor-pointer text-left"
              >
                💡 Motivasi Shalat Subuh
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendAiChat(
                    'Apa amalan dan doa orang tua agar anak betah dan mudah menghafal Al-Qur\'an di pondok?'
                  )
                }
                className="bg-purple-900/50 hover:bg-purple-800/60 text-purple-200 px-3 py-1.5 rounded-xl border border-purple-600/40 transition cursor-pointer text-left"
              >
                💡 Doa Mudah Hafalan Al-Qur'an
              </button>
            </div>
          </div>

          {/* Chat Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendAiChat();
            }}
            className="flex gap-2 pt-2"
          >
            <input
              type="text"
              required
              placeholder="Tuliskan pertanyaan konsultasi pola asuh santri..."
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
              className="flex-grow bg-slate-900/90 border border-purple-700/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-purple-400 focus:outline-none focus:border-purple-400"
            />
            <button
              type="submit"
              disabled={isAiResponding}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition flex items-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <i className="fa-solid fa-paper-plane"></i>
              <span>Kirim</span>
            </button>
          </form>
        </div>
      )}

      {/* MODAL UBAH PASSWORD WALI */}
      {isPassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setIsPassModalOpen(false)}
              type="button"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-4">Ubah Password Akun Wali</h3>

            <form onSubmit={handleSavePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password Baru:</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password baru..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 pr-10 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    title={showNewPassword ? 'Sembunyikan' : 'Tampilkan'}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl shadow transition cursor-pointer"
              >
                Perbarui Password Wali
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
