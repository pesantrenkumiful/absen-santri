import React, { useState } from 'react';
import {
  LandingCMS,
  Santri,
  Guru,
  AbsensiRecord,
  PelanggaranRecord,
  ChatMessage,
  TingkatKelas,
  Gender,
  AdminCredentials,
  SesiAbsen,
  SESI_ABSEN_CONFIG,
  ALL_SESI_ABSEN,
} from '../types';
import {
  FORMAL_SMP_SANTRIWAN,
  FORMAL_MA_SANTRIWAN,
  NON_FORMAL_SANTRIWAN,
  FORMAL_SMP_SANTRIWATI,
  FORMAL_MA_SANTRIWATI,
  NON_FORMAL_SANTRIWATI,
  ALL_FORMAL_CLASSES,
  ALL_NON_FORMAL_CLASSES,
  isFormalClass,
  defaultLandingCMS,
} from '../data/initialData';
import { callGeminiService } from '../services/geminiService';
import { PrintableReport } from './PrintableReport';
import { PrintableQRCards } from './PrintableQRCards';
import { MonthlyAttendanceChart } from './MonthlyAttendanceChart';
import { PhotoUploadModal } from './PhotoUploadModal';
import { formatMonthYear, formatIndonesianDate, getAvailableMonths, INDONESIAN_MONTHS } from '../utils/dateHelper';

interface AdminViewProps {
  cms: LandingCMS;
  onUpdateCMS: (cms: LandingCMS) => void;
  santris: Santri[];
  onAddSantri: (s: Omit<Santri, 'id'>) => void;
  onEditSantri: (s: Santri) => void;
  onDeleteSantri: (id: number) => void;
  gurus: Guru[];
  onAddGuru: (g: Omit<Guru, 'id'>) => void;
  onEditGuru: (g: Guru) => void;
  onDeleteGuru: (id: number) => void;
  onResetWaliPass: (santriId: number, newPass: string) => void;
  onUpdateWaliAccount?: (santriId: number, newNis: string, newPass: string) => boolean;
  adminCredentials: AdminCredentials;
  onUpdateAdminCredentials: (creds: AdminCredentials) => void;
  absensis: AbsensiRecord[];
  pelanggarans: PelanggaranRecord[];
  onDeletePelanggaran: (id: number) => void;
  messages: ChatMessage[];
  onSendMessage: (santriId: number, text: string) => void;
  onMarkMessagesRead: (santriId: number) => void;
  onShowToast: (msg: string, type: 'info' | 'success' | 'error' | 'warning') => void;
  onConfirm: (title: string, message: string, cb: () => void) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  cms,
  onUpdateCMS,
  santris,
  onAddSantri,
  onEditSantri,
  onDeleteSantri,
  gurus,
  onAddGuru,
  onEditGuru,
  onDeleteGuru,
  onResetWaliPass,
  onUpdateWaliAccount,
  adminCredentials,
  onUpdateAdminCredentials,
  absensis,
  pelanggarans,
  onDeletePelanggaran,
  messages,
  onSendMessage,
  onMarkMessagesRead,
  onShowToast,
  onConfirm,
}) => {
  type AdminTab = 'santri' | 'cms' | 'guru' | 'wali' | 'pelanggaran' | 'rekap' | 'chat' | 'laporan' | 'akun_admin';
  const [activeTab, setActiveTab] = useState<AdminTab>('santri');

  // Filter states
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterJalur, setFilterJalur] = useState<'ALL' | 'FORMAL' | 'NON_FORMAL'>('ALL');
  const [filterKelas, setFilterKelas] = useState<string>('ALL');
  const [rekapFilterKelas, setRekapFilterKelas] = useState<string>('ALL');
  const [rekapFilterGender, setRekapFilterGender] = useState<string>('ALL');
  const [rekapFilterSesi, setRekapFilterSesi] = useState<string>('ALL');
  const [rekapMonth, setRekapMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [rekapSearch, setRekapSearch] = useState<string>('');
  const [selectedSantriAbsenDetail, setSelectedSantriAbsenDetail] = useState<Santri | null>(null);
  const [detailModalSesi, setDetailModalSesi] = useState<string>('ALL');
  const [pdfMonthFilter, setPdfMonthFilter] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [pdfSesiFilter, setPdfSesiFilter] = useState<string>('ALL');

  // Santri Modal State
  const [isSantriModalOpen, setIsSantriModalOpen] = useState(false);
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [santriForm, setSantriForm] = useState({
    nis: '',
    nama: '',
    jk: 'Santriwan' as Gender,
    kelas: '1 SMP (Santriwan)' as TingkatKelas,
    kelasKedua: '' as TingkatKelas | '',
    wali: '',
    hp: '',
  });

  // Guru Modal State
  const [isGuruModalOpen, setIsGuruModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<Guru | null>(null);
  const [guruForm, setGuruForm] = useState({
    nama: '',
    username: '',
    pass: 'guru123',
    mapel: '',
    telp: '',
    assignedClasses: [] as TingkatKelas[],
  });

  // Reset Wali Password Modal State
  const [isResetWaliModalOpen, setIsResetWaliModalOpen] = useState(false);
  const [selectedWaliSantri, setSelectedWaliSantri] = useState<Santri | null>(null);
  const [editWaliNis, setEditWaliNis] = useState('');
  const [newWaliPassword, setNewWaliPassword] = useState('');

  // Password privacy states
  const [visibleWaliPasswords, setVisibleWaliPasswords] = useState<Record<number, boolean>>({});
  const [visibleGuruPasswords, setVisibleGuruPasswords] = useState<Record<number, boolean>>({});
  const [showGuruPass, setShowGuruPass] = useState(false);
  const [showResetWaliPass, setShowResetWaliPass] = useState(false);

  const toggleWaliPasswordVisibility = (santriId: number) => {
    setVisibleWaliPasswords((prev) => ({
      ...prev,
      [santriId]: !prev[santriId],
    }));
  };

  const toggleGuruPasswordVisibility = (guruId: number) => {
    setVisibleGuruPasswords((prev) => ({
      ...prev,
      [guruId]: !prev[guruId],
    }));
  };

  // Admin Account Credentials Form State
  const [adminForm, setAdminForm] = useState({
    name: adminCredentials.name,
    username: adminCredentials.username,
    currentPass: '',
    newPass: '',
    confirmPass: '',
  });
  const [showAdminCurrentPass, setShowAdminCurrentPass] = useState(false);
  const [showAdminNewPass, setShowAdminNewPass] = useState(false);
  const [showAdminConfirmPass, setShowAdminConfirmPass] = useState(false);

  // Sync admin form if external props change
  React.useEffect(() => {
    setAdminForm((prev) => ({
      ...prev,
      name: adminCredentials.name,
      username: adminCredentials.username,
    }));
  }, [adminCredentials]);

  // CMS Form State
  const [cmsForm, setCmsForm] = useState<LandingCMS>({ ...cms });
  const [isCmsPhotoModalOpen, setIsCmsPhotoModalOpen] = useState(false);

  React.useEffect(() => {
    setCmsForm({ ...cms });
  }, [cms]);

  // Chat State
  const [selectedChatSantriId, setSelectedChatSantriId] = useState<number | null>(null);
  const [chatInputText, setChatInputText] = useState('');
  const [isDraftingAi, setIsDraftingAi] = useState(false);

  // PDF Report State
  const [pdfReportType, setPdfReportType] = useState<'santri' | 'absen' | 'pelanggaran'>('santri');
  const [pdfGenderFilter, setPdfGenderFilter] = useState('ALL');
  const [pdfClassFilter, setPdfClassFilter] = useState('ALL');
  const [pdfAiNarrative, setPdfAiNarrative] = useState('');
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [isPreviewingReport, setIsPreviewingReport] = useState(false);

  // QR Code Printable Cards State
  const [isPrintingQr, setIsPrintingQr] = useState(false);
  const [selectedQrSantriId, setSelectedQrSantriId] = useState<number | null>(null);

  // Unread badge for admin
  const unreadCount = messages.filter((m) => m.recipientRole === 'admin' && !m.readByAdmin).length;

  // Handler for CMS Save
  const handleSaveCMS = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCMS(cmsForm);
    onShowToast('Tampilan Depan (CMS) Berhasil Disimpan & Sinkron Real-Time!', 'success');
  };

  const handleResetCMS = () => {
    onConfirm('Reset Tampilan Depan', 'Kembalikan seluruh teks tampilan depan ke setelan bawaan pesantren?', () => {
      onUpdateCMS({ ...defaultLandingCMS });
      setCmsForm({ ...defaultLandingCMS });
      onShowToast('Tampilan CMS telah dikembalikan ke bawaan.', 'info');
    });
  };

  // Open add santri
  const handleOpenAddSantri = () => {
    setEditingSantri(null);
    setSantriForm({
      nis: `2024${String(santris.length + 1).padStart(2, '0')}`,
      nama: '',
      jk: 'Santriwan',
      kelas: '1 SMP (Santriwan)',
      kelasKedua: '',
      wali: '',
      hp: '',
    });
    setIsSantriModalOpen(true);
  };

  const handleOpenEditSantri = (s: Santri) => {
    setEditingSantri(s);
    setSantriForm({
      nis: s.nis,
      nama: s.nama,
      jk: s.jk,
      kelas: s.kelas,
      kelasKedua: s.kelasKedua || '',
      wali: s.wali,
      hp: s.hp,
    });
    setIsSantriModalOpen(true);
  };

  const handleSubmitSantri = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedKelasKedua =
      santriForm.kelasKedua && santriForm.kelasKedua !== santriForm.kelas
        ? (santriForm.kelasKedua as TingkatKelas)
        : undefined;

    if (editingSantri) {
      onEditSantri({
        ...editingSantri,
        nis: santriForm.nis,
        nama: santriForm.nama,
        jk: santriForm.jk,
        kelas: santriForm.kelas,
        kelasKedua: cleanedKelasKedua,
        wali: santriForm.wali,
        hp: santriForm.hp,
      });
      onShowToast(`Data santri ${santriForm.nama} berhasil diperbarui!`, 'success');
    } else {
      onAddSantri({
        nis: santriForm.nis,
        nama: santriForm.nama,
        jk: santriForm.jk,
        kelas: santriForm.kelas,
        kelasKedua: cleanedKelasKedua,
        wali: santriForm.wali,
        hp: santriForm.hp,
        passWali: 'wali123',
      });
      onShowToast(`Santri ${santriForm.nama} berhasil ditambahkan!`, 'success');
    }
    setIsSantriModalOpen(false);
  };

  // Open add / edit Guru
  const handleOpenAddGuru = () => {
    setEditingGuru(null);
    setGuruForm({
      nama: '',
      username: `guru${gurus.length + 1}`,
      pass: '',
      mapel: '',
      telp: '',
      assignedClasses: [],
    });
    setShowGuruPass(false);
    setIsGuruModalOpen(true);
  };

  const handleOpenEditGuru = (g: Guru) => {
    setEditingGuru(g);
    setGuruForm({
      nama: g.nama,
      username: g.username,
      pass: g.pass,
      mapel: g.mapel,
      telp: g.telp,
      assignedClasses: [...g.assignedClasses],
    });
    setShowGuruPass(false);
    setIsGuruModalOpen(true);
  };

  const handleToggleGuruClass = (cls: TingkatKelas) => {
    setGuruForm((prev) => {
      const exists = prev.assignedClasses.includes(cls);
      if (exists) {
        return { ...prev, assignedClasses: prev.assignedClasses.filter((c) => c !== cls) };
      }
      return { ...prev, assignedClasses: [...prev.assignedClasses, cls] };
    });
  };

  const handleSubmitGuru = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGuru) {
      onEditGuru({
        ...editingGuru,
        ...guruForm,
      });
      onShowToast(`Data akun ${guruForm.nama} berhasil diperbarui!`, 'success');
    } else {
      onAddGuru({
        ...guruForm,
      });
      onShowToast(`Akun ustadz/guru ${guruForm.nama} berhasil dibuat!`, 'success');
    }
    setIsGuruModalOpen(false);
  };

  // Open Reset Wali modal
  const handleOpenResetWali = (s: Santri) => {
    setSelectedWaliSantri(s);
    setEditWaliNis(s.nis);
    setNewWaliPassword(s.passWali);
    setShowResetWaliPass(false);
    setIsResetWaliModalOpen(true);
  };

  const handleSubmitResetWali = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWaliSantri) return;
    if (onUpdateWaliAccount) {
      const ok = onUpdateWaliAccount(selectedWaliSantri.id, editWaliNis, newWaliPassword);
      if (ok) setIsResetWaliModalOpen(false);
    } else {
      onResetWaliPass(selectedWaliSantri.id, newWaliPassword.trim());
      onShowToast(`Password Wali Santri ${selectedWaliSantri.nama} berhasil direset!`, 'success');
      setIsResetWaliModalOpen(false);
    }
  };

  // Handler for Admin Credentials Update
  const handleSaveAdminCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.username.trim()) {
      onShowToast('Username Admin tidak boleh kosong!', 'warning');
      return;
    }
    // Verify current password
    if (adminForm.currentPass !== adminCredentials.pass) {
      onShowToast('Kata sandi saat ini salah! Verifikasi keamanan gagal.', 'error');
      return;
    }
    if (adminForm.newPass) {
      if (adminForm.newPass.length < 6) {
        onShowToast('Kata sandi baru minimal 6 karakter demi keamanan!', 'warning');
        return;
      }
      if (adminForm.newPass !== adminForm.confirmPass) {
        onShowToast('Konfirmasi kata sandi baru tidak cocok!', 'error');
        return;
      }
    }

    onConfirm(
      'Konfirmasi Perubahan Akun Admin',
      `Yakin menyimpan perubahan akun admin (Username: "${adminForm.username.trim()}"${
        adminForm.newPass ? ' dan kata sandi baru' : ''
      })?`,
      () => {
        onUpdateAdminCredentials({
          name: adminForm.name.trim() || 'Administrator Utama',
          username: adminForm.username.trim(),
          pass: adminForm.newPass ? adminForm.newPass.trim() : adminCredentials.pass,
        });
        setAdminForm((prev) => ({
          ...prev,
          currentPass: '',
          newPass: '',
          confirmPass: '',
        }));
      }
    );
  };

  // Chat handlers
  const handleSelectChatSantri = (santriId: number) => {
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
    onShowToast('Pesan terkirim ke Wali Santri!', 'success');
  };

  const handleDraftAiReply = async () => {
    if (!selectedChatSantriId) {
      onShowToast('Pilih percakapan wali terlebih dahulu!', 'warning');
      return;
    }

    const st = santris.find((s) => s.id === selectedChatSantriId);
    if (!st) return;

    const thread = messages.filter((m) => m.santriId === selectedChatSantriId);
    const lastMsg = thread.length > 0 ? thread[thread.length - 1].text : 'Pertanyaan mengenai kabar ananda di pesantren.';

    setIsDraftingAi(true);
    try {
      const prompt = `Pesan terakhir dari Wali Santri (${st.wali}, orang tua dari santri ${st.nama} di kelas ${st.kelas}): "${lastMsg}".
Buatkan draf balasan resmi, santun, ramah, dan Islami dari pihak Sekretariat Admin Pengurus Pondok Pesantren Miftahul Ulum Kalisat. Maksimal 2-3 kalimat.`;

      const draft = await callGeminiService({
        prompt,
        systemInstruction: 'Sajikan langsung teks balasan tanpa pembuka atau kutipan markdown.',
      });

      setChatInputText(draft);
      onShowToast('Draf balasan AI berhasil dibuat!', 'success');
    } catch {
      onShowToast('Kendala menghasilkan draf AI.', 'error');
    } finally {
      setIsDraftingAi(false);
    }
  };

  // Generate AI narrative for PDF
  const handleGeneratePdfNarrative = async () => {
    setIsGeneratingNarrative(true);
    try {
      const sesiInfoLabel =
        pdfReportType === 'absen'
          ? pdfSesiFilter === 'ALL'
            ? 'Semua 3 Sesi (Subuh, Madrasah, Sorogan)'
            : SESI_ABSEN_CONFIG[pdfSesiFilter as SesiAbsen]?.labelLengkap || pdfSesiFilter
          : '';
      const prompt = `Anda adalah Sekretaris Pengurus Pondok Pesantren Miftahul Ulum Kalisat Jember.
Buatkan 1 paragraf ringkasan narasi evaluasi perkembangan santri dan rekomendasi pembinaan yang santun, profesional, dan Islami untuk dilampirkan dalam Laporan Cetak PDF Resmi Pesantren.
Parameter: Jenis Laporan: ${pdfReportType}, Periode Bulan: ${pdfReportType === 'absen' ? formatMonthYear(pdfMonthFilter) : 'Semua Periode'}${sesiInfoLabel ? `, Sesi Absen: ${sesiInfoLabel}` : ''}, Filter Gender: ${pdfGenderFilter}, Filter Kelas: ${pdfClassFilter}.
Maksimal 3-4 kalimat.`;

      const result = await callGeminiService({
        prompt,
        systemInstruction: 'Sajikan narasi resmi, singkat, padat, dan menyejukkan.',
      });

      setPdfAiNarrative(result);
      onShowToast('Narasi Evaluasi AI berhasil dibuat!', 'success');
    } catch {
      onShowToast('Gagal menyusun narasi AI.', 'error');
    } finally {
      setIsGeneratingNarrative(false);
    }
  };

  // Filtered santri list
  let displaySantri = santris;
  if (filterGender !== 'ALL') displaySantri = displaySantri.filter((s) => s.jk === filterGender);
  if (filterJalur === 'FORMAL') {
    displaySantri = displaySantri.filter((s) => isFormalClass(s.kelas) || isFormalClass(s.kelasKedua));
  } else if (filterJalur === 'NON_FORMAL') {
    displaySantri = displaySantri.filter(
      (s) => !isFormalClass(s.kelas) || (s.kelasKedua ? !isFormalClass(s.kelasKedua) : false)
    );
  }
  if (filterKelas !== 'ALL') {
    displaySantri = displaySantri.filter((s) => s.kelas === filterKelas || s.kelasKedua === filterKelas);
  }

  // If previewing PDF report, show printable view
  if (isPreviewingReport) {
    return (
      <PrintableReport
        cms={cms}
        reportType={pdfReportType}
        genderFilter={pdfGenderFilter}
        classFilter={pdfClassFilter}
        aiNarrative={pdfAiNarrative}
        santris={santris}
        absensis={absensis}
        pelanggarans={pelanggarans}
        onClose={() => setIsPreviewingReport(false)}
        selectedMonth={pdfMonthFilter}
        selectedSesi={pdfSesiFilter}
      />
    );
  }

  // If previewing or printing Santri QR Cards
  if (isPrintingQr) {
    return (
      <PrintableQRCards
        cms={cms}
        santris={santris}
        initialSelectedSantriId={selectedQrSantriId}
        onClose={() => {
          setIsPrintingQr(false);
          setSelectedQrSantriId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs Admin */}
      <div className="bg-white p-1.5 rounded-2xl shadow-xs border border-slate-200/90 flex flex-wrap gap-1 text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('santri')}
          type="button"
          className={`flex-1 min-w-[105px] py-2 px-3 rounded-xl font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'santri'
              ? 'bg-emerald-800 text-white shadow-xs font-semibold'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <i className="fa-solid fa-graduation-cap text-[11px]"></i>
          <span>Data Santri</span>
        </button>

        <button
          onClick={() => setActiveTab('cms')}
          type="button"
          className={`flex-1 min-w-[125px] py-2 px-3 rounded-xl font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'cms'
              ? 'bg-emerald-800 text-white shadow-xs font-semibold'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <i className="fa-solid fa-sliders text-[11px] text-amber-500"></i>
          <span>Tampilan Depan</span>
        </button>

        <button
          onClick={() => setActiveTab('guru')}
          type="button"
          className={`flex-1 min-w-[105px] py-2 px-3 rounded-xl font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'guru'
              ? 'bg-emerald-800 text-white shadow-xs font-semibold'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <i className="fa-solid fa-chalkboard-user text-[11px]"></i>
          <span>Akun Guru</span>
        </button>

        <button
          onClick={() => setActiveTab('wali')}
          type="button"
          className={`flex-1 min-w-[105px] py-2 px-3 rounded-xl font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'wali'
              ? 'bg-emerald-800 text-white shadow-xs font-semibold'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <i className="fa-solid fa-users text-[11px]"></i>
          <span>Akun Wali</span>
        </button>

        <button
          onClick={() => setActiveTab('pelanggaran')}
          type="button"
          className={`flex-1 min-w-[105px] py-2 px-3 rounded-xl font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'pelanggaran'
              ? 'bg-emerald-800 text-white shadow-xs font-semibold'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <i className="fa-solid fa-triangle-exclamation text-[11px]"></i>
          <span>Pelanggaran</span>
        </button>

        <button
          onClick={() => setActiveTab('rekap')}
          type="button"
          className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'rekap'
              ? 'bg-emerald-800 text-white shadow-xs font-semibold'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <i className="fa-solid fa-clipboard-check text-[11px]"></i>
          <span>Rekap Absen</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          type="button"
          className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer relative ${
            activeTab === 'chat'
              ? 'bg-emerald-800 text-white shadow-xs font-semibold'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <i className="fa-solid fa-comments text-[11px]"></i>
          <span>Pesan Wali</span>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 leading-none">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('laporan')}
          type="button"
          className={`flex-1 min-w-[115px] py-2 px-3 rounded-xl font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'laporan'
              ? 'bg-emerald-800 text-white shadow-xs font-semibold'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <i className="fa-solid fa-file-pdf text-[11px]"></i>
          <span>Cetak PDF + AI</span>
        </button>

        <button
          onClick={() => setActiveTab('akun_admin')}
          type="button"
          className={`flex-1 min-w-[115px] py-2 px-3 rounded-xl font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'akun_admin'
              ? 'bg-slate-900 text-white shadow-xs font-semibold'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <i className="fa-solid fa-user-gear text-[11px] text-amber-400"></i>
          <span>Akun Admin</span>
        </button>
      </div>

      {/* TAB 1: DATA SANTRI */}
      {activeTab === 'santri' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Kelola Data Santri</h3>
              <p className="text-xs text-slate-500">
                Daftar santri program Formal (1–3 SMP, 1–3 MA) &amp; Non Formal Putra/Putri
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl text-xs py-2 px-3 focus:outline-none font-semibold cursor-pointer"
              >
                <option value="ALL">Semua Gender</option>
                <option value="Santriwan">Santriwan (Putra)</option>
                <option value="Santriwati">Santriwati (Putri)</option>
              </select>

              <select
                value={filterJalur}
                onChange={(e) => setFilterJalur(e.target.value as 'ALL' | 'FORMAL' | 'NON_FORMAL')}
                className="bg-slate-50 border border-slate-300 rounded-xl text-xs py-2 px-3 focus:outline-none font-semibold cursor-pointer"
              >
                <option value="ALL">Semua Jalur (Formal &amp; Non Formal)</option>
                <option value="FORMAL">Program Formal (1–3 SMP &amp; 1–3 MA)</option>
                <option value="NON_FORMAL">Program Non Formal / Diniyah</option>
              </select>

              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl text-xs py-2 px-3 focus:outline-none font-semibold cursor-pointer"
              >
                <option value="ALL">Semua Kelas (Formal &amp; Non Formal)</option>
                <optgroup label="Formal - SMP (Putra)">
                  {FORMAL_SMP_SANTRIWAN.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
                <optgroup label="Formal - MA (Putra)">
                  {FORMAL_MA_SANTRIWAN.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
                <optgroup label="Non Formal / Diniyah (Putra)">
                  {NON_FORMAL_SANTRIWAN.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
                <optgroup label="Formal - SMP (Putri)">
                  {FORMAL_SMP_SANTRIWATI.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
                <optgroup label="Formal - MA (Putri)">
                  {FORMAL_MA_SANTRIWATI.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
                <optgroup label="Non Formal / Diniyah (Putri)">
                  {NON_FORMAL_SANTRIWATI.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
              </select>

              <button
                onClick={() => {
                  setSelectedQrSantriId(null);
                  setIsPrintingQr(true);
                }}
                type="button"
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow transition flex items-center space-x-1.5 cursor-pointer border border-slate-700"
              >
                <i className="fa-solid fa-qrcode text-emerald-400"></i>
                <span>Cetak Kartu QR Santri</span>
              </button>

              <button
                onClick={handleOpenAddSantri}
                type="button"
                className="bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow transition flex items-center space-x-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-plus"></i>
                <span>Tambah Santri</span>
              </button>
            </div>
          </div>

          {/* Quick Statistics Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Santriwan (Putra)</p>
                <h4 className="text-xl font-black text-blue-700">
                  {santris.filter((s) => s.jk === 'Santriwan').length}
                </h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-person"></i>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Santriwati (Putri)</p>
                <h4 className="text-xl font-black text-purple-700">
                  {santris.filter((s) => s.jk === 'Santriwati').length}
                </h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-person-dress"></i>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Total Guru / Ustadz</p>
                <h4 className="text-xl font-black text-emerald-700">{gurus.length}</h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-chalkboard-user"></i>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Catatan Pelanggaran</p>
                <h4 className="text-xl font-black text-rose-700">{pelanggarans.length}</h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
            </div>
          </div>

          {/* Table Santri */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">NIS</th>
                  <th className="p-3.5">Nama Santri</th>
                  <th className="p-3.5">Gender</th>
                  <th className="p-3.5">Kelas</th>
                  <th className="p-3.5">Wali Santri</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displaySantri.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      Tidak ada santri yang cocok dengan filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  displaySantri.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono font-semibold text-slate-700">{s.nis}</td>
                      <td className="p-3.5 font-bold text-slate-800">{s.nama}</td>
                      <td className="p-3.5">
                        {s.jk === 'Santriwan' ? (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            <i className="fa-solid fa-mars text-[10px]"></i>Santriwan
                          </span>
                        ) : (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            <i className="fa-solid fa-venus text-[10px]"></i>Santriwati
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              isFormalClass(s.kelas)
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {s.kelas}
                          </span>
                          {s.kelasKedua && (
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                isFormalClass(s.kelasKedua)
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              + {s.kelasKedua}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-slate-800">{s.wali}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{s.hp}</div>
                      </td>
                      <td className="p-3.5 text-center space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedQrSantriId(s.id);
                            setIsPrintingQr(true);
                          }}
                          type="button"
                          className="text-emerald-700 hover:text-emerald-900 font-semibold text-xs cursor-pointer inline-flex items-center gap-1"
                          title="Cetak Kartu QR Santri Ini"
                        >
                          <i className="fa-solid fa-qrcode text-emerald-600"></i>
                          <span>Kartu QR</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditSantri(s)}
                          type="button"
                          className="text-blue-600 hover:text-blue-800 font-semibold text-xs cursor-pointer"
                        >
                          <i className="fa-solid fa-pen mr-1"></i>Edit
                        </button>
                        <button
                          onClick={() => {
                            onConfirm('Hapus Santri', `Hapus santri ${s.nama} (${s.nis})?`, () => {
                              onDeleteSantri(s.id);
                              onShowToast('Data santri berhasil dihapus.', 'info');
                            });
                          }}
                          type="button"
                          className="text-rose-600 hover:text-rose-800 font-semibold text-xs cursor-pointer"
                        >
                          <i className="fa-solid fa-trash mr-1"></i>Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EDIT TAMPILAN AWAL (CMS) */}
      {activeTab === 'cms' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <i className="fa-solid fa-sliders text-amber-500"></i>
                <span>Pengaturan CMS Tampilan Halaman Depan</span>
              </h3>
              <p className="text-xs text-slate-500">
                Ubah seluruh nama pesantren, pengumuman running banner, sambutan, visi-misi, dan kontak yang tampil di portal publik & kop surat.
              </p>
            </div>
            <button
              onClick={handleResetCMS}
              type="button"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center space-x-1 cursor-pointer self-start sm:self-auto"
            >
              <i className="fa-solid fa-rotate-left"></i>
              <span>Reset Bawaan Pesantren</span>
            </button>
          </div>

          <form onSubmit={handleSaveCMS} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pesantren:</label>
                <input
                  type="text"
                  required
                  value={cmsForm.namaPesantren}
                  onChange={(e) => setCmsForm({ ...cmsForm, namaPesantren: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tagline / Subtitle Header:</label>
                <input
                  type="text"
                  required
                  value={cmsForm.tagline}
                  onChange={(e) => setCmsForm({ ...cmsForm, tagline: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Teks Running Alert Banner (Pengumuman Berjalan):
              </label>
              <input
                type="text"
                required
                value={cmsForm.runningBanner}
                onChange={(e) => setCmsForm({ ...cmsForm, runningBanner: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Hero Banner Depan:</label>
                <input
                  type="text"
                  required
                  value={cmsForm.heroTitle}
                  onChange={(e) => setCmsForm({ ...cmsForm, heroTitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class Ikon FontAwesome Hero:</label>
                <input
                  type="text"
                  required
                  value={cmsForm.heroIconClass}
                  onChange={(e) => setCmsForm({ ...cmsForm, heroIconClass: e.target.value })}
                  placeholder="fa-solid fa-mosque"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Deskripsi Sambutan Utama:</label>
              <textarea
                rows={3}
                required
                value={cmsForm.heroDesc}
                onChange={(e) => setCmsForm({ ...cmsForm, heroDesc: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Foto Utama Banner Pesantren (Galeri & Kamera) */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block font-bold text-slate-800 text-xs">
                    Foto Utama Banner Pesantren:
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Bisa diunggah dari galeri file atau langsung dijepret menggunakan kamera perangkat Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCmsPhotoModalOpen(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <i className="fa-solid fa-camera"></i>
                  <span>Unggah dari Galeri / Kamera</span>
                </button>
              </div>

              {cmsForm.heroImageUrl ? (
                <div className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-slate-200">
                  <div className="w-20 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    <img
                      src={cmsForm.heroImageUrl}
                      alt="Banner Foto"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">Foto Kustom Aktif</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">Tersimpan di Cloud & Tampil di Halaman Depan</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCmsForm({ ...cmsForm, heroImageUrl: '' })}
                    className="text-rose-600 hover:text-rose-700 text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                  >
                    <i className="fa-solid fa-trash mr-1"></i>Hapus
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic bg-white p-3 rounded-xl border border-dashed border-slate-200">
                  Belum ada foto kustom yang diunggah (saat ini menggunakan gambar default).
                </div>
              )}
            </div>

            <PhotoUploadModal
              isOpen={isCmsPhotoModalOpen}
              onClose={() => setIsCmsPhotoModalOpen(false)}
              currentPhotoUrl={cmsForm.heroImageUrl || ''}
              onSavePhoto={(photoUrl) => {
                setCmsForm((prev) => ({ ...prev, heroImageUrl: photoUrl }));
                onUpdateCMS({ ...cmsForm, heroImageUrl: photoUrl });
                onShowToast('Foto banner berhasil diperbarui & disimpan!', 'success');
              }}
              title="Ubah Foto Utama Banner Pesantren"
              description="Pilih foto dari galeri atau potret langsung dengan kamera perangkat."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Visi Pesantren:</label>
                <textarea
                  rows={3}
                  required
                  value={cmsForm.visi}
                  onChange={(e) => setCmsForm({ ...cmsForm, visi: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Misi Pesantren:</label>
                <textarea
                  rows={3}
                  required
                  value={cmsForm.misi}
                  onChange={(e) => setCmsForm({ ...cmsForm, misi: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap:</label>
                <input
                  type="text"
                  required
                  value={cmsForm.alamat}
                  onChange={(e) => setCmsForm({ ...cmsForm, alamat: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WA:</label>
                <input
                  type="text"
                  required
                  value={cmsForm.telpWA}
                  onChange={(e) => setCmsForm({ ...cmsForm, telpWA: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Resmi:</label>
                <input
                  type="email"
                  required
                  value={cmsForm.email}
                  onChange={(e) => setCmsForm({ ...cmsForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <i className="fa-solid fa-floppy-disk"></i>
              <span>Simpan Perubahan Tampilan Depan</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: AKUN GURU */}
      {activeTab === 'guru' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Kelola Akun Guru & Ustadz</h3>
              <p className="text-xs text-slate-500">Membuat akses login pengajar dan alokasi kelas mengajar</p>
            </div>
            <button
              onClick={handleOpenAddGuru}
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow transition flex items-center space-x-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-user-plus"></i>
              <span>Tambah Guru Baru</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Nama Guru</th>
                  <th className="p-3.5">Username Login</th>
                  <th className="p-3.5">Kata Sandi</th>
                  <th className="p-3.5">Mata Pelajaran / Tugas</th>
                  <th className="p-3.5">Alokasi Kelas Mengajar</th>
                  <th className="p-3.5">No. Telp</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gurus.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-800">{g.nama}</td>
                    <td className="p-3.5 font-mono text-blue-700 font-bold">{g.username}</td>
                    <td className="p-3.5 font-mono text-xs">
                      <div className="inline-flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                        <span className="font-bold text-slate-700 tracking-wider">
                          {visibleGuruPasswords[g.id] ? g.pass : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleGuruPasswordVisibility(g.id)}
                          title={visibleGuruPasswords[g.id] ? 'Sembunyikan' : 'Lihat'}
                          className="text-slate-400 hover:text-blue-700 p-0.5 rounded transition cursor-pointer"
                        >
                          <i className={`fa-solid ${visibleGuruPasswords[g.id] ? 'fa-eye-slash' : 'fa-eye'} text-[11px]`}></i>
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5">{g.mapel}</td>
                    <td className="p-3.5 max-w-xs">
                      {g.assignedClasses.length === 0 ? (
                        <span className="text-slate-400 italic text-[11px]">Belum dialokasikan</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {g.assignedClasses.map((c) => (
                            <span
                              key={c}
                              className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-2 py-0.5 rounded font-semibold"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 font-mono">{g.telp}</td>
                    <td className="p-3.5 text-center space-x-2">
                      <button
                        onClick={() => handleOpenEditGuru(g)}
                        type="button"
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs cursor-pointer"
                      >
                        <i className="fa-solid fa-pen mr-1"></i>Edit
                      </button>
                      <button
                        onClick={() => {
                          onConfirm('Hapus Guru', `Yakin menghapus akun guru ${g.nama}?`, () => {
                            onDeleteGuru(g.id);
                            onShowToast('Akun guru telah dihapus.', 'info');
                          });
                        }}
                        type="button"
                        className="text-rose-600 hover:text-rose-800 font-semibold text-xs cursor-pointer"
                      >
                        <i className="fa-solid fa-trash mr-1"></i>Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AKUN WALI SANTRI */}
      {activeTab === 'wali' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-lg font-bold text-slate-800">Kelola Akun & Reset Password Wali Santri</h3>
            <p className="text-xs text-slate-500">
              Username Wali Santri menggunakan NIS Santri secara otomatis. Admin dapat mereset kata sandi jika wali lupa.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">NIS (Username)</th>
                  <th className="p-3.5">Nama Santri</th>
                  <th className="p-3.5">Nama Wali</th>
                  <th className="p-3.5">Kontak Wali</th>
                  <th className="p-3.5">Kata Sandi (Privat)</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {santris.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-purple-700">{s.nis}</td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {s.nama}{' '}
                      <span className="text-[11px] font-normal text-slate-400">
                        ({s.kelas}{s.kelasKedua ? ` + ${s.kelasKedua}` : ''})
                      </span>
                    </td>
                    <td className="p-3.5 font-medium">{s.wali}</td>
                    <td className="p-3.5 font-mono">{s.hp}</td>
                    <td className="p-3.5 font-mono text-xs">
                      <div className="inline-flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                        <span className="font-bold text-slate-700 select-all tracking-wider">
                          {visibleWaliPasswords[s.id] ? s.passWali : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleWaliPasswordVisibility(s.id)}
                          title={visibleWaliPasswords[s.id] ? 'Sembunyikan Kata Sandi' : 'Lihat Kata Sandi'}
                          aria-label={visibleWaliPasswords[s.id] ? 'Sembunyikan Kata Sandi' : 'Lihat Kata Sandi'}
                          className="text-slate-400 hover:text-purple-700 p-0.5 rounded transition cursor-pointer"
                        >
                          <i className={`fa-solid ${visibleWaliPasswords[s.id] ? 'fa-eye-slash' : 'fa-eye'} text-[11px]`}></i>
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleOpenResetWali(s)}
                        type="button"
                        className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-xl font-semibold text-xs border border-purple-200 transition cursor-pointer"
                      >
                        <i className="fa-solid fa-user-pen mr-1"></i>Ubah Akun / Sandi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PELANGGARAN */}
      {activeTab === 'pelanggaran' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-lg font-bold text-slate-800">Catatan Kedisiplinan & Pelanggaran Santri</h3>
            <p className="text-xs text-slate-500">Rekapitulasi sanksi ta'zir mendidik dari dewan asatidz</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Nama Santri</th>
                  <th className="p-3.5">Kelas</th>
                  <th className="p-3.5">Bentuk Pelanggaran</th>
                  <th className="p-3.5">Tingkat</th>
                  <th className="p-3.5">Sanksi Mendidik</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pelanggarans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      Alhamdulillah, belum ada catatan pelanggaran santri.
                    </td>
                  </tr>
                ) : (
                  pelanggarans.map((p) => {
                    const st = santris.find((s) => s.id === p.santriId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-mono text-slate-500">{p.tanggal}</td>
                        <td className="p-3.5 font-bold text-slate-800">{st?.nama || 'Santri'}</td>
                        <td className="p-3.5">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                            {st ? `${st.kelas}${st.kelasKedua ? ` + ${st.kelasKedua}` : ''}` : '-'}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-800">{p.pelanggaran}</td>
                        <td className="p-3.5">
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
                        <td className="p-3.5 text-slate-700">{p.sanksi}</td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              onConfirm('Hapus Catatan', 'Hapus catatan pelanggaran ini?', () => {
                                onDeletePelanggaran(p.id);
                                onShowToast('Catatan pelanggaran dihapus.', 'info');
                              });
                            }}
                            type="button"
                            className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                          >
                            <i className="fa-solid fa-trash mr-1"></i>Hapus
                          </button>
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

      {/* TAB 6: REKAP PRESENSI BULANAN */}
      {activeTab === 'rekap' && (() => {
        const availableMonths = getAvailableMonths(absensis);
        const monthAbsensisAllSesi =
          rekapMonth === 'ALL'
            ? absensis
            : absensis.filter((a) => a.tanggal.startsWith(rekapMonth));

        const effectiveAbsensis =
          rekapFilterSesi === 'ALL'
            ? monthAbsensisAllSesi
            : monthAbsensisAllSesi.filter((a) => (a.sesi || 'madrasah') === rekapFilterSesi);

        // Filter santri based on class, gender, and search query
        let filteredRekapSantri = santris;
        if (rekapFilterKelas !== 'ALL') {
          filteredRekapSantri = filteredRekapSantri.filter(
            (s) => s.kelas === rekapFilterKelas || s.kelasKedua === rekapFilterKelas
          );
        }
        if (rekapFilterGender !== 'ALL') {
          filteredRekapSantri = filteredRekapSantri.filter((s) => s.jk === rekapFilterGender);
        }
        if (rekapSearch.trim()) {
          const q = rekapSearch.toLowerCase();
          filteredRekapSantri = filteredRekapSantri.filter(
            (s) => s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q)
          );
        }

        const filteredSantriIdSet = new Set(filteredRekapSantri.map((s) => s.id));

        // Active meeting dates in the chosen month
        const activeDatesInPeriod = Array.from(new Set(effectiveAbsensis.map((a) => a.tanggal))).sort();

        // Aggregate statistics for the filtered dataset in this month & session
        let sumH = 0;
        let sumS = 0;
        let sumI = 0;
        let sumA = 0;

        filteredRekapSantri.forEach((s) => {
          sumH += effectiveAbsensis.filter((a) => a.santriId === s.id && a.status === 'H').length;
          sumS += effectiveAbsensis.filter((a) => a.santriId === s.id && a.status === 'S').length;
          sumI += effectiveAbsensis.filter((a) => a.santriId === s.id && a.status === 'I').length;
          sumA += effectiveAbsensis.filter((a) => a.santriId === s.id && a.status === 'A').length;
        });

        const totalRecorded = sumH + sumS + sumI + sumA;
        const avgAttendanceRate = totalRecorded > 0 ? Math.round((sumH / totalRecorded) * 100) : 0;

        return (
          <div className="space-y-4">
            {/* Header Toolbar & Month Selector */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shadow-xs shrink-0">
                    <i className="fa-solid fa-calendar-check"></i>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-800">
                        Rekapitulasi Presensi Santri Per Bulan
                      </h3>
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {formatMonthYear(rekapMonth)}
                      </span>
                      {rekapFilterSesi !== 'ALL' && SESI_ABSEN_CONFIG[rekapFilterSesi as SesiAbsen] && (
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            SESI_ABSEN_CONFIG[rekapFilterSesi as SesiAbsen].colorBadge
                          }`}
                        >
                          {SESI_ABSEN_CONFIG[rekapFilterSesi as SesiAbsen].nomor}: {SESI_ABSEN_CONFIG[rekapFilterSesi as SesiAbsen].nama}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pantau 3 sesi absen harian (Subuh, Madrasah, Sorogan), rincian Hadir (H), Sakit (S), Izin (I), Alpha (A), dan grafik kedisiplinan bulanan.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start lg:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setPdfReportType('absen');
                      setPdfMonthFilter(rekapMonth);
                      setPdfSesiFilter(rekapFilterSesi);
                      setPdfClassFilter(rekapFilterKelas);
                      setPdfGenderFilter(rekapFilterGender);
                      setIsPreviewingReport(true);
                    }}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition flex items-center space-x-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-print"></i>
                    <span>Cetak Rekap Bulan Ini (PDF)</span>
                  </button>
                </div>
              </div>

              {/* Filter Controls Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {/* Month Selector */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-calendar-days text-emerald-700"></i>
                    <span>Pilih Periode Bulan:</span>
                  </label>
                  <select
                    value={rekapMonth}
                    onChange={(e) => setRekapMonth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
                  >
                    <optgroup label="Pilihan Bulan Rekap">
                      {availableMonths.map((ym) => (
                        <option key={ym} value={ym}>
                          {formatMonthYear(ym)}
                        </option>
                      ))}
                    </optgroup>
                    <option value="ALL">Semua Bulan (Sepanjang Waktu)</option>
                  </select>
                </div>

                {/* Sesi Filter */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-clock text-emerald-700"></i>
                    <span>Filter Sesi Absen:</span>
                  </label>
                  <select
                    value={rekapFilterSesi}
                    onChange={(e) => setRekapFilterSesi(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="ALL">Semua 3 Sesi (Gabungan)</option>
                    {ALL_SESI_ABSEN.map((sKey) => (
                      <option key={sKey} value={sKey}>
                        {SESI_ABSEN_CONFIG[sKey].labelLengkap}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class Filter */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-school text-slate-500"></i>
                    <span>Filter Kelas:</span>
                  </label>
                  <select
                    value={rekapFilterKelas}
                    onChange={(e) => setRekapFilterKelas(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">Semua Kelas (Formal &amp; Non Formal)</option>
                    <optgroup label="Formal - SMP (Putra)">
                      {FORMAL_SMP_SANTRIWAN.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Formal - MA (Putra)">
                      {FORMAL_MA_SANTRIWAN.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Non Formal / Diniyah (Putra)">
                      {NON_FORMAL_SANTRIWAN.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Formal - SMP (Putri)">
                      {FORMAL_SMP_SANTRIWATI.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Formal - MA (Putri)">
                      {FORMAL_MA_SANTRIWATI.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Non Formal / Diniyah (Putri)">
                      {NON_FORMAL_SANTRIWATI.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Gender Filter */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-venus-mars text-slate-500"></i>
                    <span>Filter Gender:</span>
                  </label>
                  <select
                    value={rekapFilterGender}
                    onChange={(e) => setRekapFilterGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">Semua Santri (Putra & Putri)</option>
                    <option value="Santriwan">Santriwan (Putra)</option>
                    <option value="Santriwati">Santriwati (Putri)</option>
                  </select>
                </div>

                {/* Search Input */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-magnifying-glass text-slate-500"></i>
                    <span>Cari Santri / NIS:</span>
                  </label>
                  <input
                    type="text"
                    value={rekapSearch}
                    onChange={(e) => setRekapSearch(e.target.value)}
                    placeholder="Ketik nama atau NIS..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 3-Session Quick Summary Cards (Click to toggle filter) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ALL_SESI_ABSEN.map((sKey) => {
                const info = SESI_ABSEN_CONFIG[sKey];
                const sesiRecords = monthAbsensisAllSesi.filter(
                  (a) => filteredSantriIdSet.has(a.santriId) && (a.sesi || 'madrasah') === sKey
                );
                const sesiH = sesiRecords.filter((a) => a.status === 'H').length;
                const sesiTotal = sesiRecords.length;
                const sesiRate = sesiTotal > 0 ? Math.round((sesiH / sesiTotal) * 100) : 0;
                const isSelected = rekapFilterSesi === sKey;

                return (
                  <button
                    key={sKey}
                    type="button"
                    onClick={() => setRekapFilterSesi(isSelected ? 'ALL' : sKey)}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${info.activeBg}`}
                        >
                          {info.nomor}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-slate-800 truncate">{info.nama}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">{info.keterangan}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-base font-black text-emerald-700 block">{sesiRate}%</span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {sesiH} Hadir / {sesiTotal} Sesi
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Monthly KPI Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Santri</span>
                <span className="text-xl font-black text-slate-800">{filteredRekapSantri.length}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Siswa Terdata</span>
              </div>

              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
                <span className="text-[10px] text-emerald-700 font-bold block uppercase">Hadir (H)</span>
                <span className="text-xl font-black text-emerald-800">{sumH}</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Sesi Kehadiran</span>
              </div>

              <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 shadow-xs">
                <span className="text-[10px] text-amber-700 font-bold block uppercase">Sakit (S)</span>
                <span className="text-xl font-black text-amber-800">{sumS}</span>
                <span className="text-[10px] text-amber-600 block mt-0.5">Sesi Izin Sakit</span>
              </div>

              <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200 shadow-xs">
                <span className="text-[10px] text-blue-700 font-bold block uppercase">Izin (I)</span>
                <span className="text-xl font-black text-blue-800">{sumI}</span>
                <span className="text-[10px] text-blue-600 block mt-0.5">Sesi Izin Pulang/Lain</span>
              </div>

              <div className="bg-rose-50/80 p-3.5 rounded-2xl border border-rose-200 shadow-xs">
                <span className="text-[10px] text-rose-700 font-bold block uppercase">Alpha (A)</span>
                <span className="text-xl font-black text-rose-800">{sumA}</span>
                <span className="text-[10px] text-rose-600 block mt-0.5">Sesi Tanpa Keterangan</span>
              </div>

              <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-3.5 rounded-2xl shadow-xs">
                <span className="text-[10px] text-emerald-200 font-semibold block uppercase">Rata-rata Hadir</span>
                <span className="text-xl font-black text-white">{avgAttendanceRate}%</span>
                <span className="text-[10px] text-emerald-200/80 block mt-0.5">
                  {activeDatesInPeriod.length} Hari Aktif
                </span>
              </div>
            </div>

            {/* Visualisasi Grafik Batang Recharts Bulanan */}
            <MonthlyAttendanceChart
              absensis={absensis}
              santris={santris}
              selectedMonth={rekapMonth}
              selectedClassFilter={rekapFilterKelas}
              selectedGenderFilter={rekapFilterGender}
              selectedSesiFilter={rekapFilterSesi}
            />

            {/* Monthly Recap Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">NIS</th>
                    <th className="p-3.5">Nama Santri</th>
                    <th className="p-3.5">Gender</th>
                    <th className="p-3.5">Kelas</th>
                    <th className="p-3.5 text-center text-emerald-700">Hadir (H)</th>
                    <th className="p-3.5 text-center text-amber-700">Sakit (S)</th>
                    <th className="p-3.5 text-center text-blue-700">Izin (I)</th>
                    <th className="p-3.5 text-center text-rose-700">Alpha (A)</th>
                    <th className="p-3.5 text-center text-slate-800">Total Sesi</th>
                    <th className="p-3.5 text-center text-emerald-800">% Kehadiran</th>
                    <th className="p-3.5 text-center">Rincian 3 Sesi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRekapSantri.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        Tidak ada data santri yang sesuai kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRekapSantri.map((s) => {
                      const h = effectiveAbsensis.filter((a) => a.santriId === s.id && a.status === 'H').length;
                      const sc = effectiveAbsensis.filter((a) => a.santriId === s.id && a.status === 'S').length;
                      const i = effectiveAbsensis.filter((a) => a.santriId === s.id && a.status === 'I').length;
                      const a = effectiveAbsensis.filter((a) => a.santriId === s.id && a.status === 'A').length;
                      const totalDays = h + sc + i + a;
                      const rate = totalDays > 0 ? Math.round((h / totalDays) * 100) : 0;

                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 font-mono font-semibold text-slate-700">{s.nis}</td>
                          <td className="p-3.5 font-bold text-slate-800">{s.nama}</td>
                          <td className="p-3.5">
                            {s.jk === 'Santriwan' ? (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                Putra
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                                Putri
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                                {s.kelas}
                              </span>
                              {s.kelasKedua && (
                                <span className="bg-amber-50 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                                  + {s.kelasKedua}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-center font-bold text-emerald-700 bg-emerald-50/30">
                            {h}x
                          </td>
                          <td className="p-3.5 text-center font-bold text-amber-700 bg-amber-50/30">
                            {sc}x
                          </td>
                          <td className="p-3.5 text-center font-bold text-blue-700 bg-blue-50/30">
                            {i}x
                          </td>
                          <td className="p-3.5 text-center font-bold text-rose-700 bg-rose-50/30">
                            {a}x
                          </td>
                          <td className="p-3.5 text-center font-medium text-slate-700">
                            {totalDays} Sesi
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                                rate >= 80
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : rate >= 60
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {rate}%
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setDetailModalSesi(rekapFilterSesi);
                                setSelectedSantriAbsenDetail(s);
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <i className="fa-solid fa-list-check text-emerald-700"></i>
                              <span>Rincian</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* TAB 7: PESAN & CHAT WALI */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 min-h-[500px] overflow-hidden">
          {/* Sidebar Contact List */}
          <div className="border-b md:border-b-0 md:border-r border-slate-200 p-4 space-y-3 bg-slate-50/80">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <i className="fa-solid fa-comments text-emerald-700"></i>
              <span>Chat Wali Santri</span>
            </h4>

            <div className="space-y-2 overflow-y-auto max-h-[440px]">
              {santris.map((s) => {
                const unread = messages.filter(
                  (m) => m.santriId === s.id && m.recipientRole === 'admin' && !m.readByAdmin
                ).length;
                const isSelected = selectedChatSantriId === s.id;

                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectChatSantri(s.id)}
                    className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between border ${
                      isSelected
                        ? 'bg-emerald-100/80 border-emerald-400 font-bold'
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

          {/* Active Chat Area */}
          <div className="md:col-span-2 flex flex-col justify-between p-4 bg-white">
            {selectedChatSantriId ? (
              (() => {
                const st = santris.find((s) => s.id === selectedChatSantriId);
                const thread = messages.filter((m) => m.santriId === selectedChatSantriId);

                return (
                  <>
                    <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                          <i className="fa-solid fa-user"></i>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800">Obrolan dengan {st?.wali}</h4>
                          <p className="text-[11px] text-slate-400">
                            Wali Santri dari: {st?.nama} ({st?.kelas}) &bull; Telp: {st?.hp}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-grow overflow-y-auto space-y-3 p-2 text-xs max-h-[350px]">
                      {thread.length === 0 ? (
                        <div className="text-center text-slate-400 py-12">
                          Belum ada obrolan dengan {st?.wali}. Ketik pesan di bawah untuk memulai.
                        </div>
                      ) : (
                        thread.map((m) => {
                          const isAdmin = m.senderRole === 'admin';
                          return (
                            <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`max-w-[80%] p-3.5 rounded-2xl shadow-xs text-xs ${
                                  isAdmin
                                    ? 'bg-emerald-800 text-white rounded-br-none'
                                    : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none'
                                }`}
                              >
                                <div className="font-bold text-[10px] mb-1 opacity-80">
                                  {isAdmin ? 'Admin Pondok' : st?.wali} &bull; {m.time}
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
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 px-3 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 transition cursor-pointer"
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
                          className="flex-grow bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="submit"
                          className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-2 rounded-xl text-xs transition flex items-center space-x-1 cursor-pointer"
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
                <p className="font-medium text-slate-600">Pusat Pesan Wali Santri</p>
                <p className="text-xs text-slate-400 mt-1">Silakan pilih kontak Wali Santri di panel samping untuk membuka percakapan.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: CETAK PDF + AI NARRATIVE */}
      {activeTab === 'laporan' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <i className="fa-solid fa-file-pdf text-rose-600"></i>
              <span>Generator Laporan PDF + Ringkasan AI</span>
            </h3>
            <p className="text-xs text-slate-500">
              Pilih kriteria dokumen dan gunakan Gemini AI untuk menyusun narasi evaluasi santri otomatis ber-KOP Surat resmi pesantren.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jenis Dokumen Laporan:</label>
              <select
                value={pdfReportType}
                onChange={(e) => setPdfReportType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 focus:outline-none font-semibold cursor-pointer"
              >
                <option value="santri">Laporan Data Santri Keseluruhan</option>
                <option value="absen">Laporan Rekapitulasi Presensi Santri (Per Bulan)</option>
                <option value="pelanggaran">Laporan Catatan Kedisiplinan & Pelanggaran</option>
              </select>
            </div>

            {pdfReportType === 'absen' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-calendar-days text-emerald-700"></i>
                    <span>Pilih Periode Bulan Rekap Presensi:</span>
                  </label>
                  <select
                    value={pdfMonthFilter}
                    onChange={(e) => setPdfMonthFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 focus:outline-none font-bold text-emerald-900 cursor-pointer"
                  >
                    <optgroup label="Pilihan Bulan Rekap">
                      {getAvailableMonths(absensis).map((ym) => (
                        <option key={ym} value={ym}>
                          {formatMonthYear(ym)}
                        </option>
                      ))}
                    </optgroup>
                    <option value="ALL">Semua Bulan (Sepanjang Waktu)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-clock text-emerald-700"></i>
                    <span>Pilih Sesi Absen:</span>
                  </label>
                  <select
                    value={pdfSesiFilter}
                    onChange={(e) => setPdfSesiFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 focus:outline-none font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="ALL">Semua 3 Sesi (Subuh, Madrasah, Sorogan)</option>
                    {ALL_SESI_ABSEN.map((sKey) => (
                      <option key={sKey} value={sKey}>
                        {SESI_ABSEN_CONFIG[sKey].labelLengkap}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Filter Gender Santri:</label>
                <select
                  value={pdfGenderFilter}
                  onChange={(e) => setPdfGenderFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Gender</option>
                  <option value="Santriwan">Santriwan (Putra)</option>
                  <option value="Santriwati">Santriwati (Putri)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Filter Tingkat Kelas:</label>
                <select
                  value={pdfClassFilter}
                  onChange={(e) => setPdfClassFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Kelas (Formal &amp; Non Formal)</option>
                  <optgroup label="Formal - SMP (Putra)">
                    {FORMAL_SMP_SANTRIWAN.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Formal - MA (Putra)">
                    {FORMAL_MA_SANTRIWAN.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Non Formal / Diniyah (Putra)">
                    {NON_FORMAL_SANTRIWAN.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Formal - SMP (Putri)">
                    {FORMAL_SMP_SANTRIWATI.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Formal - MA (Putri)">
                    {FORMAL_MA_SANTRIWATI.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Non Formal / Diniyah (Putri)">
                    {NON_FORMAL_SANTRIWATI.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Gemini AI Executive Summary Box */}
            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                  <i className="fa-solid fa-wand-magic-sparkles text-emerald-700"></i>
                  <span>Narasi Evaluasi Pembinaan (Google Gemini AI)</span>
                </span>
                <button
                  type="button"
                  onClick={handleGeneratePdfNarrative}
                  disabled={isGeneratingNarrative}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
                >
                  {isGeneratingNarrative ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>Menyusun AI...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-robot"></i>
                      <span>Buat Narasi AI</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                rows={3}
                value={pdfAiNarrative}
                onChange={(e) => setPdfAiNarrative(e.target.value)}
                placeholder="Klik 'Buat Narasi AI' untuk menyusun ringkasan evaluasi perkembangan & rekomendasi secara otomatis via Gemini AI..."
                className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-slate-700 focus:outline-none text-xs"
              />
            </div>

            <button
              onClick={() => setIsPreviewingReport(true)}
              type="button"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <i className="fa-solid fa-print"></i>
              <span>Pratinjau & Cetak Dokumen PDF Resmi</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 9: KELOLA AKUN & KATA SANDI ADMIN */}
      {activeTab === 'akun_admin' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Card Header & Current Status */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-slate-700/60 relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                <i className="fa-solid fa-shield-halved"></i>
                <span>Keamanan & Hak Akses Tertinggi</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold">Kelola Username & Kata Sandi Administrator</h3>
              <p className="text-xs sm:text-sm text-slate-350 max-w-xl leading-relaxed">
                Anda dapat mengubah nama penanggung jawab, username login, serta memperbarui kata sandi admin secara aman dan mandiri.
              </p>
            </div>
            <div className="absolute -right-6 -bottom-8 opacity-10 text-white pointer-events-none select-none">
              <i className="fa-solid fa-user-shield text-[180px]"></i>
            </div>
          </div>

          {/* Current Credential Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Nama Administrator:</span>
              <div className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                <i className="fa-solid fa-user text-emerald-700"></i>
                <span>{adminCredentials.name}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Username Login Aktif:</span>
              <div className="font-mono font-bold text-emerald-800 text-sm flex items-center space-x-1.5">
                <i className="fa-solid fa-at text-emerald-600"></i>
                <span>{adminCredentials.username}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Status Keamanan:</span>
              <div className="font-bold text-emerald-600 text-sm flex items-center space-x-1.5">
                <i className="fa-solid fa-circle-check"></i>
                <span>Privat & Terenkripsi</span>
              </div>
            </div>
          </div>

          {/* Form Ubah Username & Password Admin */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                  <i className="fa-solid fa-key text-emerald-700"></i>
                  <span>Formulir Perubahan Kredensial Administrator</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Perubahan akan langsung aktif untuk sesi login berikutnya.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAdminCredentials} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Nama Lengkap Penanggung Jawab:</label>
                  <input
                    type="text"
                    required
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    placeholder="Contoh: Administrator Utama / Ustadz Ahmad"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Username Admin Baru:
                    <span className="text-rose-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <i className="fa-solid fa-user text-xs"></i>
                    </span>
                    <input
                      type="text"
                      required
                      value={adminForm.username}
                      onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                      placeholder="Username untuk login admin..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 pl-9 pr-3 text-slate-800 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Kata Sandi Admin Baru (Kosongkan jika tidak ingin diubah):
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <i className="fa-solid fa-lock text-xs"></i>
                    </span>
                    <input
                      type={showAdminNewPass ? 'text' : 'password'}
                      value={adminForm.newPass}
                      onChange={(e) => setAdminForm({ ...adminForm, newPass: e.target.value })}
                      placeholder="Minimal 6 karakter..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 pl-9 pr-10 text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminNewPass(!showAdminNewPass)}
                      tabIndex={-1}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <i className={`fa-solid ${showAdminNewPass ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Konfirmasi Kata Sandi Baru:
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <i className="fa-solid fa-lock-open text-xs"></i>
                    </span>
                    <input
                      type={showAdminConfirmPass ? 'text' : 'password'}
                      value={adminForm.confirmPass}
                      onChange={(e) => setAdminForm({ ...adminForm, confirmPass: e.target.value })}
                      placeholder="Ulangi kata sandi baru..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 pl-9 pr-10 text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminConfirmPass(!showAdminConfirmPass)}
                      tabIndex={-1}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <i className={`fa-solid ${showAdminConfirmPass ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Password saat ini untuk verifikasi */}
              <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 space-y-2 mt-2">
                <label className="block font-bold text-amber-900 text-xs">
                  <i className="fa-solid fa-shield-halved mr-1.5 text-amber-600"></i>
                  Verifikasi Keamanan: Masukkan Kata Sandi Saat Ini
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showAdminCurrentPass ? 'text' : 'password'}
                    required
                    value={adminForm.currentPass}
                    onChange={(e) => setAdminForm({ ...adminForm, currentPass: e.target.value })}
                    placeholder="Masukkan kata sandi administrator saat ini..."
                    className="w-full bg-white border border-amber-300 rounded-xl py-2.5 px-3 pr-10 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminCurrentPass(!showAdminCurrentPass)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i className={`fa-solid ${showAdminCurrentPass ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                  </button>
                </div>
                <p className="text-[11px] text-amber-800/80">
                  Diperlukan untuk memvalidasi bahwa Anda adalah pemegang hak akses sah sebelum perubahan diterapkan.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Simpan Perubahan Akun & Kata Sandi Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onConfirm(
                      'Reset Akun Admin ke Pengaturan Awal',
                      'Yakin mengembalikan username admin ke "admin" dan kata sandi ke "admin123"?',
                      () => {
                        onUpdateAdminCredentials({
                          name: 'Administrator Utama',
                          username: 'admin',
                          pass: 'admin123',
                        });
                        setAdminForm({
                          name: 'Administrator Utama',
                          username: 'admin',
                          currentPass: '',
                          newPass: '',
                          confirmPass: '',
                        });
                      }
                    );
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3.5 px-4 rounded-xl text-xs transition cursor-pointer"
                >
                  <i className="fa-solid fa-rotate-left mr-1"></i>
                  Reset Default
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH & EDIT SANTRI */}
      {isSantriModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSantriModalOpen(false)}
              type="button"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-4">
              {editingSantri ? 'Edit Data Santri' : 'Tambah Santri Baru'}
            </h3>

            <form onSubmit={handleSubmitSantri} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Induk Santri (NIS):</label>
                <input
                  type="text"
                  required
                  value={santriForm.nis}
                  onChange={(e) => setSantriForm({ ...santriForm, nis: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Santri:</label>
                <input
                  type="text"
                  required
                  value={santriForm.nama}
                  onChange={(e) => setSantriForm({ ...santriForm, nama: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin:</label>
                  <select
                    value={santriForm.jk}
                    onChange={(e) => {
                      const newJk = e.target.value as Gender;
                      const defaultClass: TingkatKelas =
                        newJk === 'Santriwan' ? '1 SMP (Santriwan)' : '1 SMP (Santriwati)';
                      setSantriForm({ ...santriForm, jk: newJk, kelas: defaultClass, kelasKedua: '' });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 cursor-pointer"
                  >
                    <option value="Santriwan">Santriwan (Putra)</option>
                    <option value="Santriwati">Santriwati (Putri)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kelas Utama (Formal / Non Formal):
                  </label>
                  <select
                    value={santriForm.kelas}
                    onChange={(e) => {
                      const newKelas = e.target.value as TingkatKelas;
                      setSantriForm((prev) => ({
                        ...prev,
                        kelas: newKelas,
                        kelasKedua: prev.kelasKedua === newKelas ? '' : prev.kelasKedua,
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 cursor-pointer font-medium"
                  >
                    {santriForm.jk === 'Santriwan' ? (
                      <>
                        <optgroup label="Formal - SMP (1, 2, 3)">
                          {FORMAL_SMP_SANTRIWAN.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Formal - MA (1, 2, 3)">
                          {FORMAL_MA_SANTRIWAN.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Non Formal / Diniyah">
                          {NON_FORMAL_SANTRIWAN.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </optgroup>
                      </>
                    ) : (
                      <>
                        <optgroup label="Formal - SMP (1, 2, 3)">
                          {FORMAL_SMP_SANTRIWATI.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Formal - MA (1, 2, 3)">
                          {FORMAL_MA_SANTRIWATI.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Non Formal / Diniyah">
                          {NON_FORMAL_SANTRIWATI.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </optgroup>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kelas Pendamping / Jalur Kedua (Opsional — Formal / Non Formal):
                </label>
                <select
                  value={santriForm.kelasKedua}
                  onChange={(e) => setSantriForm({ ...santriForm, kelasKedua: e.target.value as TingkatKelas | '' })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 cursor-pointer font-medium"
                >
                  <option value="">-- Tidak Ada (Hanya Mengikuti 1 Kelas) --</option>
                  {santriForm.jk === 'Santriwan' ? (
                    <>
                      <optgroup label="Non Formal / Diniyah">
                        {NON_FORMAL_SANTRIWAN.filter((c) => c !== santriForm.kelas).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Formal - SMP (1, 2, 3)">
                        {FORMAL_SMP_SANTRIWAN.filter((c) => c !== santriForm.kelas).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Formal - MA (1, 2, 3)">
                        {FORMAL_MA_SANTRIWAN.filter((c) => c !== santriForm.kelas).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                    </>
                  ) : (
                    <>
                      <optgroup label="Non Formal / Diniyah">
                        {NON_FORMAL_SANTRIWATI.filter((c) => c !== santriForm.kelas).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Formal - SMP (1, 2, 3)">
                        {FORMAL_SMP_SANTRIWATI.filter((c) => c !== santriForm.kelas).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Formal - MA (1, 2, 3)">
                        {FORMAL_MA_SANTRIWATI.filter((c) => c !== santriForm.kelas).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                    </>
                  )}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pilih kelas pendamping jika santri mengikuti program Formal (SMP/MA) sekaligus Non Formal.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Orang Tua / Wali:</label>
                <input
                  type="text"
                  required
                  value={santriForm.wali}
                  onChange={(e) => setSantriForm({ ...santriForm, wali: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor HP / WhatsApp Wali:</label>
                <input
                  type="text"
                  required
                  value={santriForm.hp}
                  onChange={(e) => setSantriForm({ ...santriForm, hp: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-xl shadow transition cursor-pointer"
                >
                  {editingSantri ? 'Simpan Perubahan Data' : 'Simpan Santri Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH & EDIT GURU */}
      {isGuruModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsGuruModalOpen(false)}
              type="button"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-4">
              {editingGuru ? 'Edit Akun Guru & Alokasi Kelas' : 'Buat Akun Guru & Alokasi Kelas'}
            </h3>

            <form onSubmit={handleSubmitGuru} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar:</label>
                <input
                  type="text"
                  required
                  value={guruForm.nama}
                  onChange={(e) => setGuruForm({ ...guruForm, nama: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username Login:</label>
                  <input
                    type="text"
                    required
                    value={guruForm.username}
                    onChange={(e) => setGuruForm({ ...guruForm, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password Login:</label>
                  <div className="relative">
                    <input
                      type={showGuruPass ? 'text' : 'password'}
                      required
                      placeholder="Masukkan kata sandi..."
                      value={guruForm.pass}
                      onChange={(e) => setGuruForm({ ...guruForm, pass: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 pr-10 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGuruPass(!showGuruPass)}
                      tabIndex={-1}
                      title={showGuruPass ? 'Sembunyikan' : 'Tampilkan'}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <i className={`fa-solid ${showGuruPass ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran / Tugas Utama:</label>
                <input
                  type="text"
                  required
                  value={guruForm.mapel}
                  onChange={(e) => setGuruForm({ ...guruForm, mapel: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. Telp / WhatsApp:</label>
                <input
                  type="text"
                  required
                  value={guruForm.telp}
                  onChange={(e) => setGuruForm({ ...guruForm, telp: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              {/* Interactive Class Allocation Checkboxes */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                  <label className="font-semibold text-slate-700">
                    Alokasi Kelas Mengajar (Formal &amp; Non Formal):
                  </label>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setGuruForm((prev) => ({
                          ...prev,
                          assignedClasses: Array.from(new Set([...prev.assignedClasses, ...ALL_FORMAL_CLASSES])),
                        }))
                      }
                      className="text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg cursor-pointer"
                    >
                      + Semua Formal
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setGuruForm((prev) => ({
                          ...prev,
                          assignedClasses: Array.from(new Set([...prev.assignedClasses, ...ALL_NON_FORMAL_CLASSES])),
                        }))
                      }
                      className="text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg cursor-pointer"
                    >
                      + Semua Non Formal
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuruForm((prev) => ({ ...prev, assignedClasses: [] }))}
                      className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-lg cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 space-y-3">
                  <div>
                    <span className="font-bold text-[11px] text-blue-800 block border-b border-blue-200 pb-1 mb-2 flex items-center gap-1">
                      <i className="fa-solid fa-mars"></i> Santriwan (Putra):
                    </span>
                    <p className="text-[10px] font-bold text-emerald-800 uppercase mb-1">
                      Formal (1–3 SMP &amp; 1–3 MA)
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-2">
                      {[...FORMAL_SMP_SANTRIWAN, ...FORMAL_MA_SANTRIWAN].map((cls) => (
                        <label key={cls} className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={guruForm.assignedClasses.includes(cls)}
                            onChange={() => handleToggleGuruClass(cls)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>{cls}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-amber-800 uppercase mb-1">
                      Non Formal (Awaliyah, Wustho &amp; Non Formal)
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {NON_FORMAL_SANTRIWAN.map((cls) => (
                        <label key={cls} className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={guruForm.assignedClasses.includes(cls)}
                            onChange={() => handleToggleGuruClass(cls)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>{cls}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-[11px] text-purple-800 block border-b border-purple-200 pb-1 mb-2 flex items-center gap-1">
                      <i className="fa-solid fa-venus"></i> Santriwati (Putri):
                    </span>
                    <p className="text-[10px] font-bold text-emerald-800 uppercase mb-1">
                      Formal (1–3 SMP &amp; 1–3 MA)
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-2">
                      {[...FORMAL_SMP_SANTRIWATI, ...FORMAL_MA_SANTRIWATI].map((cls) => (
                        <label key={cls} className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={guruForm.assignedClasses.includes(cls)}
                            onChange={() => handleToggleGuruClass(cls)}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span>{cls}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-amber-800 uppercase mb-1">
                      Non Formal (Awaliyah, Wustho &amp; Non Formal)
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {NON_FORMAL_SANTRIWATI.map((cls) => (
                        <label key={cls} className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={guruForm.assignedClasses.includes(cls)}
                            onChange={() => handleToggleGuruClass(cls)}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span>{cls}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow transition cursor-pointer"
                >
                  Simpan Akun Guru & Alokasi Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KELOLA AKUN & PASSWORD WALI */}
      {isResetWaliModalOpen && selectedWaliSantri && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setIsResetWaliModalOpen(false)}
              type="button"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <h3 className="text-base font-bold text-slate-800 mb-1">Ubah Akun & Kata Sandi Wali</h3>
            <p className="text-xs text-slate-500 mb-4">
              Santri: <span className="font-bold text-slate-700">{selectedWaliSantri.nama}</span> ({selectedWaliSantri.kelas}) &bull; Wali: {selectedWaliSantri.wali}
            </p>

            <form onSubmit={handleSubmitResetWali} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username Login Wali (NIS Santri):</label>
                <input
                  type="text"
                  required
                  value={editWaliNis}
                  onChange={(e) => setEditWaliNis(e.target.value)}
                  placeholder="Contoh: 202401"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  NIS santri digunakan sebagai nama pengguna login bagi wali murid.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Wali:</label>
                <div className="relative">
                  <input
                    type={showResetWaliPass ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi baru..."
                    value={newWaliPassword}
                    onChange={(e) => setNewWaliPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 pr-10 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetWaliPass(!showResetWaliPass)}
                    tabIndex={-1}
                    title={showResetWaliPass ? 'Sembunyikan' : 'Tampilkan'}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i className={`fa-solid ${showResetWaliPass ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl shadow transition cursor-pointer mt-2"
              >
                Simpan Akun Wali (Username & Sandi)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RINCIAN TANGGAL PRESENSI SANTRI BULAN INI */}
      {selectedSantriAbsenDetail && (() => {
        const s = selectedSantriAbsenDetail;
        const allPeriodAbsens = absensis.filter(
          (a) => a.santriId === s.id && (rekapMonth === 'ALL' || a.tanggal.startsWith(rekapMonth))
        );
        const studentAbsens = allPeriodAbsens
          .filter((a) => detailModalSesi === 'ALL' || (a.sesi || 'madrasah') === detailModalSesi)
          .sort((a, b) => {
            const dateCmp = a.tanggal.localeCompare(b.tanggal);
            if (dateCmp !== 0) return dateCmp;
            const order: Record<SesiAbsen, number> = { subuh: 1, madrasah: 2, sorogan: 3 };
            return (order[a.sesi || 'madrasah'] || 2) - (order[b.sesi || 'madrasah'] || 2);
          });

        const hCount = studentAbsens.filter((a) => a.status === 'H').length;
        const sCount = studentAbsens.filter((a) => a.status === 'S').length;
        const iCount = studentAbsens.filter((a) => a.status === 'I').length;
        const aCount = studentAbsens.filter((a) => a.status === 'A').length;
        const totalDays = studentAbsens.length;
        const percentage = totalDays > 0 ? Math.round((hCount / totalDays) * 100) : 0;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative border border-slate-200 max-h-[90vh] flex flex-col">
              <button
                onClick={() => setSelectedSantriAbsenDetail(null)}
                type="button"
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>

              <div className="border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-bold">
                    <i className="fa-solid fa-calendar-check"></i>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Rincian Presensi 3 Sesi Santri
                    </h3>
                    <p className="text-xs text-slate-500">
                      Periode: <strong className="text-emerald-800">{formatMonthYear(rekapMonth)}</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">{s.nama}</span>
                    <span className="text-[11px] text-slate-500 font-mono">NIS: {s.nis} &bull; Kelas: {s.kelas}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">Tingkat Kehadiran:</span>
                    <span className="text-sm font-black text-emerald-700">{percentage}%</span>
                  </div>
                </div>

                {/* Session Filter Pills inside Modal */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <button
                    type="button"
                    onClick={() => setDetailModalSesi('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      detailModalSesi === 'ALL'
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Semua ({allPeriodAbsens.length})
                  </button>
                  {ALL_SESI_ABSEN.map((sKey) => {
                    const info = SESI_ABSEN_CONFIG[sKey];
                    const count = allPeriodAbsens.filter((a) => (a.sesi || 'madrasah') === sKey).length;
                    const active = detailModalSesi === sKey;
                    return (
                      <button
                        key={sKey}
                        type="button"
                        onClick={() => setDetailModalSesi(sKey)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          active
                            ? `${info.activeBg} border-transparent`
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {info.nomor}: {info.nama.replace('Absen ', '')} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Counter Badges */}
                <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
                  <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
                    <span className="text-[10px] text-emerald-700 font-bold block">Hadir</span>
                    <span className="text-base font-black text-emerald-800">{hCount} Sesi</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl">
                    <span className="text-[10px] text-amber-700 font-bold block">Sakit</span>
                    <span className="text-base font-black text-amber-800">{sCount} Sesi</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-2 rounded-xl">
                    <span className="text-[10px] text-blue-700 font-bold block">Izin</span>
                    <span className="text-base font-black text-blue-800">{iCount} Sesi</span>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl">
                    <span className="text-[10px] text-rose-700 font-bold block">Alpha</span>
                    <span className="text-base font-black text-rose-800">{aCount} Sesi</span>
                  </div>
                </div>
              </div>

              {/* Scrollable Date Breakdown List */}
              <div className="flex-grow overflow-y-auto space-y-2 pr-1 text-xs">
                {studentAbsens.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 space-y-1">
                    <i className="fa-solid fa-calendar-xmark text-3xl text-slate-300 block mb-1"></i>
                    <p className="font-semibold text-slate-600">Belum Ada Catatan Presensi</p>
                    <p className="text-[11px] text-slate-400">Tidak ada riwayat presensi yang tercatat untuk santri ini pada filter yang dipilih.</p>
                  </div>
                ) : (
                  studentAbsens.map((rec, idx) => {
                    const sesiInfo = SESI_ABSEN_CONFIG[(rec.sesi || 'madrasah') as SesiAbsen];
                    return (
                      <div
                        key={rec.id || idx}
                        className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between gap-2 transition"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-600 shrink-0">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-slate-800 text-xs">
                                {formatIndonesianDate(rec.tanggal)}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${sesiInfo.colorBadge}`}
                              >
                                <i className={`${sesiInfo.icon} text-[8px]`}></i>
                                <span>{sesiInfo.nomor}: {sesiInfo.nama}</span>
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              {rec.metode === 'QR_SCAN' ? (
                                <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                                  <i className="fa-solid fa-qrcode text-[9px]"></i>Scan QR Presensi {rec.waktuScan ? `(${rec.waktuScan})` : ''}
                                </span>
                              ) : (
                                'Input Manual Dewan Guru'
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {rec.status === 'H' && (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <i className="fa-solid fa-check text-[9px]"></i>Hadir
                            </span>
                          )}
                          {rec.status === 'S' && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <i className="fa-solid fa-bed text-[9px]"></i>Sakit
                            </span>
                          )}
                          {rec.status === 'I' && (
                            <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <i className="fa-solid fa-envelope-open-text text-[9px]"></i>Izin
                            </span>
                          )}
                          {rec.status === 'A' && (
                            <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <i className="fa-solid fa-xmark text-[9px]"></i>Alpha
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 mt-3">
                <button
                  type="button"
                  onClick={() => setSelectedSantriAbsenDetail(null)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Tutup Rincian Presensi
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
