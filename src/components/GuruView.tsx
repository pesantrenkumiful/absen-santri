import React, { useState, useEffect } from 'react';
import { Guru, Santri, AbsensiRecord, PelanggaranRecord, ChatMessage, TingkatKelas, PelanggaranKategori } from '../types';
import { callGeminiService } from '../services/geminiService';
import { QrAttendanceScanner } from './QrAttendanceScanner';
import { formatMonthYear, getAvailableMonths } from '../utils/dateHelper';

interface GuruViewProps {
  currentGuru: Guru;
  santris: Santri[];
  absensis: AbsensiRecord[];
  onSaveBatchAbsensi: (records: { santriId: number; tanggal: string; status: 'H' | 'S' | 'I' | 'A' }[]) => void;
  pelanggarans: PelanggaranRecord[];
  onAddPelanggaran: (p: Omit<PelanggaranRecord, 'id'>) => void;
  messages: ChatMessage[];
  onSendMessage: (santriId: number, text: string) => void;
  onMarkMessagesRead: (santriId: number) => void;
  onUpdateGuruPassword: (newPass: string) => void;
  onShowToast: (msg: string, type: 'info' | 'success' | 'error' | 'warning') => void;
}

export const GuruView: React.FC<GuruViewProps> = ({
  currentGuru,
  santris,
  absensis,
  onSaveBatchAbsensi,
  pelanggarans,
  onAddPelanggaran,
  messages,
  onSendMessage,
  onMarkMessagesRead,
  onUpdateGuruPassword,
  onShowToast,
}) => {
  type GuruTab = 'absen' | 'qr_scan' | 'pelanggaran' | 'chat';
  const [activeTab, setActiveTab] = useState<GuruTab>('absen');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleRecordSingleAttendance = (santriId: number, tanggal: string, status: 'H' | 'S' | 'I' | 'A') => {
    onSaveBatchAbsensi([{ santriId, tanggal, status }]);
  };

  // Attendance state
  const assigned = currentGuru.assignedClasses || [];
  const [selectedClass, setSelectedClass] = useState<string>(assigned[0] || '');
  const [absenTanggal, setAbsenTanggal] = useState<string>(todayStr);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, 'H' | 'S' | 'I' | 'A'>>({});

  // View mode for Guru attendance: input harian vs rekap bulanan
  const [absenViewMode, setAbsenViewMode] = useState<'harian' | 'rekap_bulan'>('harian');
  const [guruRekapMonth, setGuruRekapMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const availableMonths = getAvailableMonths(absensis);

  // Pelanggaran form state
  const [pelanggaranSantriId, setPelanggaranSantriId] = useState<number>(santris[0]?.id || 1);
  const [pelanggaranKategori, setPelanggaranKategori] = useState<PelanggaranKategori>('Ringan');
  const [pelanggaranTanggal, setPelanggaranTanggal] = useState<string>(todayStr);
  const [pelanggaranNama, setPelanggaranNama] = useState<string>('');
  const [pelanggaranSanksi, setPelanggaranSanksi] = useState<string>('');
  const [isGettingAiSanction, setIsGettingAiSanction] = useState<boolean>(false);

  // Chat state
  const [selectedChatSantriId, setSelectedChatSantriId] = useState<number | null>(null);
  const [chatInputText, setChatInputText] = useState<string>('');
  const [isDraftingAi, setIsDraftingAi] = useState<boolean>(false);

  // Password Modal
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Unread badge for this guru
  const unreadCount = messages.filter(
    (m) => m.recipientRole === 'guru' && m.recipientId === currentGuru.id && !m.readByGuru
  ).length;

  // Initialize selected class when assigned changes
  useEffect(() => {
    if (assigned.length > 0 && !assigned.includes(selectedClass as any)) {
      setSelectedClass(assigned[0]);
    }
  }, [assigned, selectedClass]);

  // Sync attendance radio buttons when class or date changes
  const classSantris = santris.filter((s) => s.kelas === selectedClass);

  useEffect(() => {
    const map: Record<number, 'H' | 'S' | 'I' | 'A'> = {};
    classSantris.forEach((s) => {
      const existing = absensis.find((a) => a.santriId === s.id && a.tanggal === absenTanggal);
      map[s.id] = existing ? existing.status : 'H';
    });
    setAttendanceMap(map);
  }, [selectedClass, absenTanggal, santris, absensis]);

  const handleStatusChange = (santriId: number, status: 'H' | 'S' | 'I' | 'A') => {
    setAttendanceMap((prev) => ({ ...prev, [santriId]: status }));
  };

  const handleSetAllAttendance = (status: 'H' | 'S' | 'I' | 'A') => {
    const map: Record<number, 'H' | 'S' | 'I' | 'A'> = {};
    classSantris.forEach((s) => {
      map[s.id] = status;
    });
    setAttendanceMap(map);
    onShowToast(`Seluruh santri di kelas ${selectedClass} di-set ${status}`, 'info');
  };

  const handleSaveAbsensi = () => {
    if (!selectedClass) {
      onShowToast('Pilih kelas mengajar terlebih dahulu!', 'error');
      return;
    }
    if (!absenTanggal) {
      onShowToast('Pilih tanggal presensi terlebih dahulu!', 'error');
      return;
    }

    const records = classSantris.map((s) => ({
      santriId: s.id,
      tanggal: absenTanggal,
      status: attendanceMap[s.id] || 'H',
    }));

    onSaveBatchAbsensi(records);
    onShowToast(`Presensi kelas ${selectedClass} tanggal ${absenTanggal} berhasil disimpan & disinkronkan!`, 'success');
  };

  // Pelanggaran AI recommendation
  const handleFetchAiSanction = async () => {
    if (!pelanggaranNama.trim()) {
      onShowToast('Ketikkan nama pelanggaran terlebih dahulu!', 'warning');
      return;
    }

    const st = santris.find((s) => s.id === pelanggaranSantriId);
    setIsGettingAiSanction(true);
    try {
      const prompt = `Santri (${st?.nama || 'Santri'} kelas ${st?.kelas || ''}) melakukan pelanggaran disiplin pesantren: "${pelanggaranNama.trim()}" tingkat "${pelanggaranKategori}".
Berikan 1 bentuk ta'zir/sanksi yang mendidik dan Islami (misal: tilawah Al-Qur'an, setor hafalan surah/nadhom, kebersihan asrama/masjid) beserta 1 kalimat nasihat bijak. Maksimal 2 kalimat.`;

      const recommendation = await callGeminiService({
        prompt,
        systemInstruction: 'Sajikan langsung saran sanksi mendidik dan nasihat santun tanpa formatting berlebih.',
      });

      setPelanggaranSanksi(recommendation);
      onShowToast('Rekomendasi sanksi mendidik Gemini AI berhasil didapatkan!', 'success');
    } catch {
      onShowToast('Kendala mendapatkan saran AI.', 'error');
    } finally {
      setIsGettingAiSanction(false);
    }
  };

  const handleSubmitPelanggaran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pelanggaranNama.trim() || !pelanggaranSanksi.trim()) {
      onShowToast('Lengkapi nama pelanggaran dan sanksi!', 'warning');
      return;
    }

    onAddPelanggaran({
      santriId: pelanggaranSantriId,
      tanggal: pelanggaranTanggal,
      pelanggaran: pelanggaranNama.trim(),
      kategori: pelanggaranKategori,
      sanksi: pelanggaranSanksi.trim(),
    });

    onShowToast('Catatan pelanggaran santri berhasil disimpan!', 'success');
    setPelanggaranNama('');
    setPelanggaranSanksi('');
  };

  // Chat handlers
  const handleSelectChat = (santriId: number) => {
    setSelectedChatSantriId(santriId);
    onMarkMessagesRead(santriId);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatSantriId) {
      onShowToast('Pilih kontak wali santri terlebih dahulu!', 'warning');
      return;
    }
    if (!chatInputText.trim()) return;

    onSendMessage(selectedChatSantriId, chatInputText.trim());
    setChatInputText('');
    onShowToast('Balasan terkirim ke Wali Santri!', 'success');
  };

  const handleDraftAiReply = async () => {
    if (!selectedChatSantriId) {
      onShowToast('Pilih kontak percakapan wali santri terlebih dahulu!', 'warning');
      return;
    }

    const st = santris.find((s) => s.id === selectedChatSantriId);
    if (!st) return;

    const thread = messages.filter((m) => m.santriId === selectedChatSantriId);
    const lastMsg = thread.length > 0 ? thread[thread.length - 1].text : 'Pertanyaan seputar kabar dan hafalan santri.';

    setIsDraftingAi(true);
    try {
      const prompt = `Pesan terakhir Wali Santri (${st.wali}, orang tua dari ${st.nama}): "${lastMsg}".
Buatkan draf balasan ramah, santun, Islami, dan informatif dari pihak Ustadz Pengajar (${currentGuru.nama}, pengampu ${currentGuru.mapel}). Maksimal 2-3 kalimat.`;

      const draft = await callGeminiService({
        prompt,
        systemInstruction: 'Sajikan langsung draf teks balasan yang siap dikirim.',
      });

      setChatInputText(draft);
      onShowToast('Draf balasan AI dimasukkan ke kolom pesan!', 'success');
    } catch {
      onShowToast('Gagal menyusun draf balasan AI.', 'error');
    } finally {
      setIsDraftingAi(false);
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    onUpdateGuruPassword(newPassword.trim());
    setIsPassModalOpen(false);
    setNewPassword('');
    onShowToast('Password Guru berhasil diperbarui!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Status Guru Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-800/40">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/30 border border-blue-400/30 flex items-center justify-center text-2xl font-bold shadow-inner shrink-0">
            <i className="fa-solid fa-chalkboard-user"></i>
          </div>
          <div>
            <span className="bg-blue-500/30 text-blue-200 text-[11px] px-3 py-0.5 rounded-full border border-blue-400/30 font-semibold uppercase tracking-wider">
              Portal Guru & Pengasuh
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">{currentGuru.nama}</h2>
            <p className="text-xs text-blue-200/90 flex items-center gap-2 mt-0.5">
              <span>{currentGuru.mapel}</span>
              <span>&bull;</span>
              <span>Username: <strong className="font-mono text-white">{currentGuru.username}</strong></span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsPassModalOpen(true)}
          type="button"
          className="self-start md:self-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
        >
          <i className="fa-solid fa-key"></i>
          <span>Ubah Password Guru</span>
        </button>
      </div>

      {/* Guru Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap gap-2 text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('absen')}
          type="button"
          className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'absen'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <i className="fa-solid fa-clipboard-user"></i>
          <span>Presensi Harian Santri</span>
        </button>

        <button
          onClick={() => setActiveTab('qr_scan')}
          type="button"
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'qr_scan'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'hover:bg-emerald-50 text-emerald-800 bg-emerald-50/60 border border-emerald-200'
          }`}
        >
          <i className="fa-solid fa-qrcode text-base"></i>
          <span>Scan Presensi QR (1x Scan)</span>
        </button>

        <button
          onClick={() => setActiveTab('pelanggaran')}
          type="button"
          className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'pelanggaran'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <i className="fa-solid fa-pen-to-square"></i>
          <span>Catat Pelanggaran & AI Sanksi</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          type="button"
          className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition flex items-center justify-center space-x-2 cursor-pointer relative ${
            activeTab === 'chat'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <i className="fa-solid fa-comments"></i>
          <span>Pesan Wali Santri</span>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PRESENSI HARIAN SANTRI */}
      {activeTab === 'absen' && (
        <div className="space-y-4">
          {assigned.length === 0 ? (
            <div className="bg-amber-50 border border-amber-300 p-8 rounded-2xl text-amber-900 text-xs text-center space-y-2">
              <i className="fa-solid fa-triangle-exclamation text-amber-600 text-3xl"></i>
              <h4 className="font-bold text-sm">Belum Ada Kelas Yang Dialokasikan</h4>
              <p className="max-w-md mx-auto leading-relaxed">
                Anda belum dialokasikan untuk mengajar di kelas manapun oleh Admin Pondok. Silakan hubungi Sekretariat Admin Pondok untuk mendaftarkan alokasi kelas mengajar Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sub-mode navigation for Guru */}
              <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setAbsenViewMode('harian')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      absenViewMode === 'harian'
                        ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <i className="fa-solid fa-calendar-day text-blue-600"></i>
                    <span>Input Presensi Harian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbsenViewMode('rekap_bulan')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      absenViewMode === 'rekap_bulan'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <i className="fa-solid fa-calendar-week"></i>
                    <span>Rekap Bulanan Kelas</span>
                  </button>
                </div>

                <div className="text-[11px] font-semibold text-slate-500 px-2">
                  Kelas: <strong className="text-slate-800">{selectedClass}</strong>
                </div>
              </div>

              {absenViewMode === 'harian' ? (
                <>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
                      <div className="w-full sm:w-auto">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Pilih Kelas Mengajar:
                        </label>
                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          className="bg-slate-50 border border-slate-300 rounded-xl text-xs py-2 px-3 w-full sm:w-auto focus:outline-none font-bold text-blue-900 cursor-pointer"
                        >
                          {assigned.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-auto">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Tanggal Presensi:
                        </label>
                        <input
                          type="date"
                          value={absenTanggal}
                          onChange={(e) => setAbsenTanggal(e.target.value)}
                          className="bg-slate-50 border border-slate-300 rounded-xl text-xs py-2 px-3 focus:outline-none cursor-pointer w-full sm:w-auto"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center space-x-2 w-full sm:w-auto justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('qr_scan')}
                        className="bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                      >
                        <i className="fa-solid fa-qrcode"></i>
                        <span>Buka Scan QR (1x Scan)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetAllAttendance('H')}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        <i className="fa-solid fa-check-double text-emerald-600 mr-1.5"></i> Semua Hadir
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveAbsensi}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow transition flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <i className="fa-solid fa-floppy-disk"></i>
                        <span>Simpan Presensi Kelas</span>
                      </button>
                    </div>
                  </div>

                  {/* Attendance Table */}
                  <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">NIS</th>
                          <th className="p-3.5">Nama Santri</th>
                          <th className="p-3.5 text-center text-emerald-700 font-bold">Hadir (H)</th>
                          <th className="p-3.5 text-center text-amber-700 font-bold">Sakit (S)</th>
                          <th className="p-3.5 text-center text-blue-700 font-bold">Izin (I)</th>
                          <th className="p-3.5 text-center text-rose-700 font-bold">Alpha (A)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classSantris.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-400">
                              Belum ada santri yang terdaftar di kelas {selectedClass}.
                            </td>
                          </tr>
                        ) : (
                          classSantris.map((s) => {
                            const cur = attendanceMap[s.id] || 'H';
                            return (
                              <tr key={s.id} className="hover:bg-slate-50 transition">
                                <td className="p-3.5 font-mono text-slate-700 font-semibold">{s.nis}</td>
                                <td className="p-3.5 font-bold text-slate-800">{s.nama}</td>
                                <td className="p-3.5 text-center">
                                  <label className="cursor-pointer inline-flex items-center justify-center p-1">
                                    <input
                                      type="radio"
                                      name={`absen_${s.id}`}
                                      value="H"
                                      checked={cur === 'H'}
                                      onChange={() => handleStatusChange(s.id, 'H')}
                                      className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer"
                                    />
                                  </label>
                                </td>
                                <td className="p-3.5 text-center">
                                  <label className="cursor-pointer inline-flex items-center justify-center p-1">
                                    <input
                                      type="radio"
                                      name={`absen_${s.id}`}
                                      value="S"
                                      checked={cur === 'S'}
                                      onChange={() => handleStatusChange(s.id, 'S')}
                                      className="w-4 h-4 text-amber-600 accent-amber-600 cursor-pointer"
                                    />
                                  </label>
                                </td>
                                <td className="p-3.5 text-center">
                                  <label className="cursor-pointer inline-flex items-center justify-center p-1">
                                    <input
                                      type="radio"
                                      name={`absen_${s.id}`}
                                      value="I"
                                      checked={cur === 'I'}
                                      onChange={() => handleStatusChange(s.id, 'I')}
                                      className="w-4 h-4 text-blue-600 accent-blue-600 cursor-pointer"
                                    />
                                  </label>
                                </td>
                                <td className="p-3.5 text-center">
                                  <label className="cursor-pointer inline-flex items-center justify-center p-1">
                                    <input
                                      type="radio"
                                      name={`absen_${s.id}`}
                                      value="A"
                                      checked={cur === 'A'}
                                      onChange={() => handleStatusChange(s.id, 'A')}
                                      className="w-4 h-4 text-rose-600 accent-rose-600 cursor-pointer"
                                    />
                                  </label>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                /* REKAP BULANAN KELAS UNTUK GURU */
                <div className="space-y-4">
                  {/* Filter Toolbar Rekap Bulan */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Pilih Bulan Rekap:
                        </label>
                        <select
                          value={guruRekapMonth}
                          onChange={(e) => setGuruRekapMonth(e.target.value)}
                          className="bg-blue-50/70 border border-blue-300 font-bold text-blue-900 rounded-xl text-xs py-2 px-3 focus:outline-none cursor-pointer"
                        >
                          {availableMonths.map((m) => (
                            <option key={m} value={m}>
                              {formatMonthYear(m)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Kelas:
                        </label>
                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          className="bg-slate-50 border border-slate-300 font-bold text-slate-800 rounded-xl text-xs py-2 px-3 focus:outline-none cursor-pointer"
                        >
                          {assigned.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="text-right w-full sm:w-auto">
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        Periode: {formatMonthYear(guruRekapMonth)}
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Cards for Class */}
                  {(() => {
                    const monthClassAbsen = absensis.filter(
                      (a) => a.tanggal.startsWith(guruRekapMonth) && classSantris.some((s) => s.id === a.santriId)
                    );
                    const totalH = monthClassAbsen.filter((a) => a.status === 'H').length;
                    const totalS = monthClassAbsen.filter((a) => a.status === 'S').length;
                    const totalI = monthClassAbsen.filter((a) => a.status === 'I').length;
                    const totalA = monthClassAbsen.filter((a) => a.status === 'A').length;
                    const totalEntries = monthClassAbsen.length;
                    const classRate = totalEntries > 0 ? Math.round((totalH / totalEntries) * 100) : 0;

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs text-center">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Total Santri</p>
                          <p className="text-xl font-black text-slate-800 mt-1">{classSantris.length}</p>
                          <p className="text-[10px] text-slate-400">Kelas {selectedClass}</p>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 shadow-xs text-center">
                          <p className="text-[10px] uppercase font-bold text-emerald-700">Hadir (H)</p>
                          <p className="text-xl font-black text-emerald-800 mt-1">{totalH}</p>
                          <p className="text-[10px] text-emerald-600 font-semibold">{classRate}% Tingkat Hadir</p>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 shadow-xs text-center">
                          <p className="text-[10px] uppercase font-bold text-amber-700">Sakit (S)</p>
                          <p className="text-xl font-black text-amber-800 mt-1">{totalS}</p>
                          <p className="text-[10px] text-amber-600">Santri Izin Sakit</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 shadow-xs text-center">
                          <p className="text-[10px] uppercase font-bold text-blue-700">Izin (I)</p>
                          <p className="text-xl font-black text-blue-800 mt-1">{totalI}</p>
                          <p className="text-[10px] text-blue-600">Izin Berhalangan</p>
                        </div>
                        <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 shadow-xs text-center col-span-2 sm:col-span-1">
                          <p className="text-[10px] uppercase font-bold text-rose-700">Alpha (A)</p>
                          <p className="text-xl font-black text-rose-800 mt-1">{totalA}</p>
                          <p className="text-[10px] text-rose-600">Tanpa Keterangan</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Monthly Recap Table for this Class */}
                  <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">No</th>
                          <th className="p-3">NIS</th>
                          <th className="p-3">Nama Santri</th>
                          <th className="p-3 text-center text-emerald-700 font-bold">Hadir (H)</th>
                          <th className="p-3 text-center text-amber-700 font-bold">Sakit (S)</th>
                          <th className="p-3 text-center text-blue-700 font-bold">Izin (I)</th>
                          <th className="p-3 text-center text-rose-700 font-bold">Alpha (A)</th>
                          <th className="p-3 text-center text-slate-700 font-bold">Total Pertemuan</th>
                          <th className="p-3 text-center text-indigo-700 font-bold">% Kehadiran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classSantris.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-6 text-center text-slate-400">
                              Tidak ada santri di kelas {selectedClass}.
                            </td>
                          </tr>
                        ) : (
                          classSantris.map((s, idx) => {
                            const santriMonthAbsen = absensis.filter(
                              (a) => a.santriId === s.id && a.tanggal.startsWith(guruRekapMonth)
                            );
                            const hCount = santriMonthAbsen.filter((a) => a.status === 'H').length;
                            const sCount = santriMonthAbsen.filter((a) => a.status === 'S').length;
                            const iCount = santriMonthAbsen.filter((a) => a.status === 'I').length;
                            const aCount = santriMonthAbsen.filter((a) => a.status === 'A').length;
                            const totalDays = santriMonthAbsen.length;
                            const percentage = totalDays > 0 ? Math.round((hCount / totalDays) * 100) : 0;

                            return (
                              <tr key={s.id} className="hover:bg-slate-50 transition">
                                <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                                <td className="p-3 font-mono font-semibold text-slate-700">{s.nis}</td>
                                <td className="p-3 font-bold text-slate-800">{s.nama}</td>
                                <td className="p-3 text-center">
                                  <span className="inline-block px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 text-[11px]">
                                    {hCount}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                    sCount > 0 ? 'bg-amber-100 text-amber-800' : 'text-slate-400'
                                  }`}>
                                    {sCount}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                    iCount > 0 ? 'bg-blue-100 text-blue-800' : 'text-slate-400'
                                  }`}>
                                    {iCount}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                    aCount > 0 ? 'bg-rose-100 text-rose-800' : 'text-slate-400'
                                  }`}>
                                    {aCount}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-bold text-slate-700">
                                  {totalDays} Hari
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                    percentage >= 85
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : percentage >= 70
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {percentage}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB QR SCANNER: SCAN HANYA 1 KALI */}
      {activeTab === 'qr_scan' && (
        <QrAttendanceScanner
          currentGuru={currentGuru}
          santris={santris}
          absensis={absensis}
          onRecordAttendance={handleRecordSingleAttendance}
          onShowToast={onShowToast}
          onClose={() => setActiveTab('absen')}
        />
      )}

      {/* TAB 2: CATAT PELANGGARAN & AI SANKSI */}
      {activeTab === 'pelanggaran' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form Column */}
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <i className="fa-solid fa-pen-to-square text-blue-600"></i>
                <span>Form Input Pelanggaran</span>
              </h3>
              <p className="text-[11px] text-slate-400">Pilih santri dan gunakan Gemini AI untuk saran sanksi</p>
            </div>

            <form onSubmit={handleSubmitPelanggaran} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Santri:</label>
                <select
                  value={pelanggaranSantriId}
                  onChange={(e) => setPelanggaranSantriId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium cursor-pointer"
                >
                  {santris.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas}) - NIS: {s.nis}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tingkat:</label>
                  <select
                    value={pelanggaranKategori}
                    onChange={(e) => setPelanggaranKategori(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 cursor-pointer font-semibold"
                  >
                    <option value="Ringan">Ringan</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Berat">Berat</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal:</label>
                  <input
                    type="date"
                    required
                    value={pelanggaranTanggal}
                    onChange={(e) => setPelanggaranTanggal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bentuk Pelanggaran:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Terlambat halaqah subuh, tidak memakai kopyah..."
                  value={pelanggaranNama}
                  onChange={(e) => setPelanggaranNama(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800"
                />
              </div>

              <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 text-[11px] flex items-center gap-1">
                    <i className="fa-solid fa-brain text-blue-700"></i>
                    <span>Saran Sanksi Mendidik AI</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleFetchAiSanction}
                    disabled={isGettingAiSanction}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                  >
                    {isGettingAiSanction ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin"></i>
                        <span>Menganalisis...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                        <span>Dapatkan Saran AI</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  placeholder="Klik 'Dapatkan Saran AI' atau ketikkan bentuk sanksi ta'zir mendidik..."
                  value={pelanggaranSanksi}
                  onChange={(e) => setPelanggaranSanksi(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg p-2 text-slate-800 text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <i className="fa-solid fa-floppy-disk"></i>
                <span>Simpan Catatan Pelanggaran</span>
              </button>
            </form>
          </div>

          {/* Violations Table Column */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <i className="fa-solid fa-shield-cat text-amber-500"></i>
                <span>Daftar Catatan Kedisiplinan Terkini</span>
              </h3>
              <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {pelanggarans.length} Catatan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Santri</th>
                    <th className="p-3">Pelanggaran</th>
                    <th className="p-3">Tingkat</th>
                    <th className="p-3">Sanksi Mendidik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pelanggarans.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        Belum ada catatan pelanggaran santri.
                      </td>
                    </tr>
                  ) : (
                    pelanggarans.map((p) => {
                      const st = santris.find((s) => s.id === p.santriId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono text-slate-500 whitespace-nowrap">{p.tanggal}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{st?.nama || 'Santri'}</div>
                            <div className="text-[11px] text-slate-400">{st?.kelas || '-'}</div>
                          </td>
                          <td className="p-3 font-medium text-slate-800">{p.pelanggaran}</td>
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PESAN WALI SANTRI */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 min-h-[500px] overflow-hidden">
          {/* Sidebar Contacts */}
          <div className="border-b md:border-b-0 md:border-r border-slate-200 p-4 space-y-3 bg-slate-50/80">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <i className="fa-solid fa-comments text-blue-600"></i>
              <span>Chat Wali Santri</span>
            </h4>

            <div className="space-y-2 overflow-y-auto max-h-[440px]">
              {santris.map((s) => {
                const unread = messages.filter(
                  (m) => m.santriId === s.id && m.recipientRole === 'guru' && m.recipientId === currentGuru.id && !m.readByGuru
                ).length;
                const isSelected = selectedChatSantriId === s.id;

                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectChat(s.id)}
                    className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between border ${
                      isSelected
                        ? 'bg-blue-100/80 border-blue-400 font-bold'
                        : 'bg-white hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">{s.wali}</h5>
                      <p className="text-[11px] text-slate-500">Santri: {s.nama} ({s.kelas})</p>
                    </div>
                    {unread > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        {unread} Baru
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Chat Conversation */}
          <div className="md:col-span-2 flex flex-col justify-between p-4 bg-white">
            {selectedChatSantriId ? (
              (() => {
                const st = santris.find((s) => s.id === selectedChatSantriId);
                const thread = messages.filter(
                  (m) =>
                    m.santriId === selectedChatSantriId &&
                    (m.recipientRole === 'guru' || m.senderRole === 'guru' || m.recipientId === currentGuru.id)
                );

                return (
                  <>
                    <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                          <i className="fa-solid fa-user"></i>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800">Obrolan dengan {st?.wali}</h4>
                          <p className="text-[11px] text-slate-400">
                            Wali Santri dari: {st?.nama} ({st?.kelas})
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-grow overflow-y-auto space-y-3 p-2 text-xs max-h-[350px]">
                      {thread.length === 0 ? (
                        <div className="text-center text-slate-400 py-12">
                          Belum ada obrolan langsung dengan {st?.wali}. Ketik pesan di bawah untuk memulai.
                        </div>
                      ) : (
                        thread.map((m) => {
                          const isGuru = m.senderRole === 'guru';
                          return (
                            <div key={m.id} className={`flex ${isGuru ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`max-w-[80%] p-3.5 rounded-2xl shadow-xs text-xs ${
                                  isGuru
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none'
                                }`}
                              >
                                <div className="font-bold text-[10px] mb-1 opacity-80">
                                  {isGuru ? currentGuru.nama : st?.wali} &bull; {m.time}
                                </div>
                                <div className="leading-relaxed">{m.text}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-2 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <button
                          type="button"
                          onClick={handleDraftAiReply}
                          disabled={isDraftingAi}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 px-3 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          {isDraftingAi ? (
                            <>
                              <i className="fa-solid fa-spinner animate-spin"></i>
                              <span>Menyusun Draf AI...</span>
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-wand-magic-sparkles"></i>
                              <span>Bantu Draf Balasan AI</span>
                            </>
                          )}
                        </button>
                      </div>

                      <form onSubmit={handleSendChat} className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={chatInputText}
                          onChange={(e) => setChatInputText(e.target.value)}
                          placeholder="Ketik balasan untuk Wali Santri..."
                          className="flex-grow bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition flex items-center space-x-1 cursor-pointer"
                        >
                          <i className="fa-solid fa-paper-plane"></i>
                          <span>Kirim</span>
                        </button>
                      </form>
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="text-center text-slate-400 py-24">
                <i className="fa-solid fa-comments text-5xl mb-3 text-slate-300"></i>
                <p className="font-medium text-slate-600">Pusat Pesan Guru</p>
                <p className="text-xs text-slate-400 mt-1">Pilih salah satu kontak Wali Santri di samping untuk melihat atau membalas pesan.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL UBAH PASSWORD GURU */}
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

            <h3 className="text-base font-bold text-slate-800 mb-4">Ubah Password Akun Guru</h3>

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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 pr-10 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow transition cursor-pointer"
              >
                Perbarui Password Guru
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
