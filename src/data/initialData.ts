import { LandingCMS, Santri, Guru, AbsensiRecord, PelanggaranRecord, ChatMessage, TingkatKelas } from '../types';

export const FORMAL_SMP_SANTRIWAN: TingkatKelas[] = [
  '1 SMP (Santriwan)',
  '2 SMP (Santriwan)',
  '3 SMP (Santriwan)',
];

export const FORMAL_MA_SANTRIWAN: TingkatKelas[] = [
  '1 MA (Santriwan)',
  '2 MA (Santriwan)',
  '3 MA (Santriwan)',
];

export const NON_FORMAL_SANTRIWAN: TingkatKelas[] = [
  '1 Awaliyah (Santriwan)',
  '2 Awaliyah (Santriwan)',
  '3 Awaliyah (Santriwan)',
  '1 Wustho (Santriwan)',
  '2 Wustho (Santriwan)',
  '3 Wustho (Santriwan)',
  'Non Formal (Santriwan)',
];

export const FORMAL_SMP_SANTRIWATI: TingkatKelas[] = [
  '1 SMP (Santriwati)',
  '2 SMP (Santriwati)',
  '3 SMP (Santriwati)',
];

export const FORMAL_MA_SANTRIWATI: TingkatKelas[] = [
  '1 MA (Santriwati)',
  '2 MA (Santriwati)',
  '3 MA (Santriwati)',
];

export const NON_FORMAL_SANTRIWATI: TingkatKelas[] = [
  '1 Awaliyah (Santriwati)',
  '2 Awaliyah (Santriwati)',
  '3 Awaliyah (Santriwati)',
  '1 Wustho (Santriwati)',
  '2 Wustho (Santriwati)',
  '3 Wustho (Santriwati)',
  'Non Formal (Santriwati)',
];

export const SANTRIWAN_CLASSES: TingkatKelas[] = [
  ...FORMAL_SMP_SANTRIWAN,
  ...FORMAL_MA_SANTRIWAN,
  ...NON_FORMAL_SANTRIWAN,
];

export const SANTRIWATI_CLASSES: TingkatKelas[] = [
  ...FORMAL_SMP_SANTRIWATI,
  ...FORMAL_MA_SANTRIWATI,
  ...NON_FORMAL_SANTRIWATI,
];

export const ALL_CLASSES: TingkatKelas[] = [
  ...SANTRIWAN_CLASSES,
  ...SANTRIWATI_CLASSES,
];

export const ALL_FORMAL_CLASSES: TingkatKelas[] = [
  ...FORMAL_SMP_SANTRIWAN,
  ...FORMAL_MA_SANTRIWAN,
  ...FORMAL_SMP_SANTRIWATI,
  ...FORMAL_MA_SANTRIWATI,
];

export const ALL_NON_FORMAL_CLASSES: TingkatKelas[] = [
  ...NON_FORMAL_SANTRIWAN,
  ...NON_FORMAL_SANTRIWATI,
];

export const isFormalClass = (cls?: string): boolean => {
  if (!cls) return false;
  return cls.includes(' SMP ') || cls.includes(' MA ');
};

export const defaultLandingCMS: LandingCMS = {
  namaPesantren: 'Pondok Pesantren Miftahul Ulum Kalisat',
  tagline: 'Sistem Manajemen & Pembinaan Santri Terpadu',
  runningBanner: '📢 PENGUMUMAN: Pendaftaran Santri Baru (Formal 1–3 SMP, 1–3 MA & Non Formal) Tahun Ajaran 2026/2027 PP Miftahul Ulum Kalisat Telah Dibuka! | Libur Akhir Semester Dimulai Tanggal 15 Desember.',
  heroTitle: 'Sistem Informasi Pesantren & Pembinaan Santri Terpadu',
  heroDesc: 'Platform resmi pengelolaan data santri (Kelas Formal 1–3 SMP, 1–3 MA & Non Formal Putra/Putri), absensi 3 sesi harian, kedisiplinan, laporan PDF resmi ber-KOP Surat, serta layanan obrolan Wali Santri & konseling Gemini AI.',
  heroIconClass: 'fa-solid fa-mosque',
  visi: 'Terwujudnya Generasi Santri Berakhlakul Karimah, Unggul Dalam Ilmu Agama, Tafaqquh Fiddin, dan Berwawasan Tekno-Sains.',
  misi: '1. Menyelenggarakan pendidikan Formal (SMP & MA) dan Non Formal (Madrasah Diniyah Awaliyah & Wustho).\n2. Membina hafalan Al-Qur\'an dan penguasaan Kitab Kuning secara terstruktur.\n3. Membangun komunikasi transparan antara Pengurus, Ustadz, dan Wali Santri.',
  alamat: 'Jl. Raya Kalisat, Kecamatan Kalisat, Kabupaten Jember, Jawa Timur (Kode Pos 68193)',
  telpWA: '(0331) 567890 / 0812-3456-7890',
  email: 'info@miftahululum-kalisat.sch.id',
};

export const initialSantri: Santri[] = [
  { id: 1, nis: '202401', nama: 'Ahmad Fulan', kelas: '1 SMP (Santriwan)', kelasKedua: '1 Awaliyah (Santriwan)', jk: 'Santriwan', wali: 'Bpk. Hendra', hp: '08123456789', passWali: 'wali123' },
  { id: 2, nis: '202402', nama: 'Muhammad Rizky', kelas: '2 SMP (Santriwan)', kelasKedua: '2 Awaliyah (Santriwan)', jk: 'Santriwan', wali: 'Bpk. Suparno', hp: '08139876543', passWali: 'wali123' },
  { id: 3, nis: '202403', nama: 'Zayd Ibn Tsabit', kelas: '3 SMP (Santriwan)', kelasKedua: '3 Awaliyah (Santriwan)', jk: 'Santriwan', wali: 'Bpk. Utsman', hp: '08967788990', passWali: 'wali123' },
  { id: 4, nis: '202404', nama: 'Umar Al-Faruq', kelas: '1 MA (Santriwan)', kelasKedua: '1 Wustho (Santriwan)', jk: 'Santriwan', wali: 'Bpk. Khattab', hp: '08129988776', passWali: 'wali123' },
  { id: 5, nis: '202405', nama: 'Ali bin Abi Thalib', kelas: '2 MA (Santriwan)', kelasKedua: '2 Wustho (Santriwan)', jk: 'Santriwan', wali: 'Bpk. Abu Thalib', hp: '08381122445', passWali: 'wali123' },
  { id: 6, nis: '202406', nama: 'Bilal bin Rabah', kelas: '3 MA (Santriwan)', kelasKedua: '3 Wustho (Santriwan)', jk: 'Santriwan', wali: 'Bpk. Rabah', hp: '08198877665', passWali: 'wali123' },
  { id: 7, nis: '202407', nama: 'Aisyah Nur', kelas: '1 SMP (Santriwati)', kelasKedua: '1 Awaliyah (Santriwati)', jk: 'Santriwati', wali: 'Bpk. Bambang', hp: '08215544332', passWali: 'wali123' },
  { id: 8, nis: '202408', nama: 'Fatimah Azzahra', kelas: '2 SMP (Santriwati)', kelasKedua: '2 Awaliyah (Santriwati)', jk: 'Santriwati', wali: 'Bpk. Mahmud', hp: '08571122334', passWali: 'wali123' },
  { id: 9, nis: '202409', nama: 'Khadijah Al-Kubra', kelas: '3 SMP (Santriwati)', kelasKedua: '3 Awaliyah (Santriwati)', jk: 'Santriwati', wali: 'Bpk. Khuwailid', hp: '08124455667', passWali: 'wali123' },
  { id: 10, nis: '202410', nama: 'Maryam Binti Imran', kelas: '1 MA (Santriwati)', kelasKedua: '1 Wustho (Santriwati)', jk: 'Santriwati', wali: 'Bpk. Imran', hp: '08961122334', passWali: 'wali123' },
  { id: 11, nis: '202411', nama: 'Ruqayyah Binti Rasulullah', kelas: '2 MA (Santriwati)', kelasKedua: '2 Wustho (Santriwati)', jk: 'Santriwati', wali: 'Bpk. Muhammad', hp: '08385566778', passWali: 'wali123' },
  { id: 12, nis: '202412', nama: 'Ummu Kultsum', kelas: '3 MA (Santriwati)', kelasKedua: 'Non Formal (Santriwati)', jk: 'Santriwati', wali: 'Bpk. Zakariya', hp: '08219900112', passWali: 'wali123' },
  { id: 13, nis: '202413', nama: 'Hasan Al-Basri', kelas: 'Non Formal (Santriwan)', jk: 'Santriwan', wali: 'Bpk. Yasar', hp: '08127788991', passWali: 'wali123' },
];

export const initialGuru: Guru[] = [
  {
    id: 1,
    username: 'guru1',
    pass: 'guru123',
    nama: 'Ustadz Ahmad Busro, S.Pd.I',
    mapel: 'Formal SMP & Nahwu Shorof Awaliyah',
    telp: '081211112222',
    assignedClasses: [
      '1 SMP (Santriwan)',
      '2 SMP (Santriwan)',
      '3 SMP (Santriwan)',
      '1 Awaliyah (Santriwan)',
      '2 Awaliyah (Santriwan)',
      '3 Awaliyah (Santriwan)',
      'Non Formal (Santriwan)',
    ],
  },
  {
    id: 2,
    username: 'guru2',
    pass: 'guru123',
    nama: 'Ustadz Mansur Hidayat, M.Pd',
    mapel: 'Formal MA & Tahfidz Al-Qur\'an (Wustho)',
    telp: '081333334444',
    assignedClasses: [
      '1 MA (Santriwan)',
      '2 MA (Santriwan)',
      '3 MA (Santriwan)',
      '1 Wustho (Santriwan)',
      '2 Wustho (Santriwan)',
      '3 Wustho (Santriwan)',
    ],
  },
  {
    id: 3,
    username: 'guru3',
    pass: 'guru123',
    nama: 'Ustadzah Fatimah Zahra, S.Ag',
    mapel: 'Formal SMP/MA & Diniyah (Santriwati)',
    telp: '085755556666',
    assignedClasses: [
      '1 SMP (Santriwati)',
      '2 SMP (Santriwati)',
      '3 SMP (Santriwati)',
      '1 MA (Santriwati)',
      '2 MA (Santriwati)',
      '3 MA (Santriwati)',
      '1 Awaliyah (Santriwati)',
      '2 Awaliyah (Santriwati)',
      '3 Awaliyah (Santriwati)',
      '1 Wustho (Santriwati)',
      '2 Wustho (Santriwati)',
      '3 Wustho (Santriwati)',
      'Non Formal (Santriwati)',
    ],
  },
];

export const initialAbsensi: AbsensiRecord[] = [
  { id: 1, santriId: 1, tanggal: '2026-11-01', sesi: 'subuh', status: 'H', metode: 'QR_SCAN', waktuScan: '04:45' },
  { id: 2, santriId: 1, tanggal: '2026-11-01', sesi: 'madrasah', status: 'H', metode: 'MANUAL' },
  { id: 3, santriId: 1, tanggal: '2026-11-01', sesi: 'sorogan', status: 'H', metode: 'MANUAL' },
  { id: 4, santriId: 1, tanggal: '2026-11-02', sesi: 'subuh', status: 'H', metode: 'QR_SCAN', waktuScan: '04:50' },
  { id: 5, santriId: 1, tanggal: '2026-11-02', sesi: 'madrasah', status: 'H', metode: 'MANUAL' },
  { id: 6, santriId: 1, tanggal: '2026-11-02', sesi: 'sorogan', status: 'S', metode: 'MANUAL' },
  { id: 7, santriId: 2, tanggal: '2026-11-01', sesi: 'subuh', status: 'H', metode: 'QR_SCAN', waktuScan: '04:42' },
  { id: 8, santriId: 2, tanggal: '2026-11-01', sesi: 'madrasah', status: 'H', metode: 'MANUAL' },
  { id: 9, santriId: 2, tanggal: '2026-11-01', sesi: 'sorogan', status: 'H', metode: 'MANUAL' },
  { id: 10, santriId: 3, tanggal: '2026-11-01', sesi: 'subuh', status: 'I', metode: 'MANUAL' },
  { id: 11, santriId: 3, tanggal: '2026-11-01', sesi: 'madrasah', status: 'H', metode: 'MANUAL' },
  { id: 12, santriId: 3, tanggal: '2026-11-02', sesi: 'sorogan', status: 'H', metode: 'MANUAL' },
  { id: 13, santriId: 7, tanggal: '2026-11-01', sesi: 'subuh', status: 'H', metode: 'QR_SCAN', waktuScan: '04:40' },
  { id: 14, santriId: 7, tanggal: '2026-11-01', sesi: 'madrasah', status: 'H', metode: 'MANUAL' },
  { id: 15, santriId: 7, tanggal: '2026-11-01', sesi: 'sorogan', status: 'H', metode: 'MANUAL' },
  { id: 16, santriId: 8, tanggal: '2026-11-01', sesi: 'subuh', status: 'H', metode: 'MANUAL' },
  { id: 17, santriId: 8, tanggal: '2026-11-02', sesi: 'madrasah', status: 'I', metode: 'MANUAL' },
  { id: 18, santriId: 8, tanggal: '2026-11-03', sesi: 'sorogan', status: 'H', metode: 'MANUAL' },
  { id: 19, santriId: 10, tanggal: '2026-11-03', sesi: 'subuh', status: 'A', metode: 'MANUAL' },
  { id: 20, santriId: 10, tanggal: '2026-11-03', sesi: 'madrasah', status: 'H', metode: 'MANUAL' },
];

export const initialPelanggaran: PelanggaranRecord[] = [
  {
    id: 1,
    santriId: 1,
    tanggal: '2026-10-25',
    pelanggaran: 'Terlambat Shalat Subuh Berjamaah',
    kategori: 'Ringan',
    sanksi: 'Membaca Al-Qur\'an 1 Juz & Pembiasaan Bangun Pagi',
  },
  {
    id: 2,
    santriId: 7,
    tanggal: '2026-10-28',
    pelanggaran: 'Terlambat Masuk Jam Masrukiyah Kitab',
    kategori: 'Ringan',
    sanksi: 'Membaca Nadhom Imrithi 50 Bait dengan Hafalan',
  },
  {
    id: 3,
    santriId: 4,
    tanggal: '2026-10-30',
    pelanggaran: 'Membawa barang elektronik tanpa izin pengurus',
    kategori: 'Sedang',
    sanksi: 'Penyitaan sementara, ta\'zir menyalin Surah Yasin 3x, dan pemanggilan orang tua',
  },
];

export const initialMessages: ChatMessage[] = [
  {
    id: 1,
    santriId: 1,
    senderRole: 'wali',
    recipientRole: 'guru',
    recipientId: 1,
    text: "Assalamu'alaikum Ustadz Ahmad, izin bertanya bagaimana perkembangan hafalan Al-Qur'an dan kitab ananda Ahmad Fulan minggu ini?",
    time: '2026-11-02 09:15',
    readByGuru: false,
    readByAdmin: true,
    readByWali: true,
  },
  {
    id: 2,
    santriId: 1,
    senderRole: 'guru',
    recipientRole: 'wali',
    recipientId: 1,
    text: "Wa'alaikumussalam Bpk. Hendra. Alhamdulillah ananda Ahmad Fulan sangat rajin, saat ini telah menyelesaikan hafalan Juz 30 dengan tartil yang baik serta aktif dalam kajian Nahwu.",
    time: '2026-11-02 09:30',
    readByGuru: true,
    readByAdmin: true,
    readByWali: true,
  },
  {
    id: 3,
    santriId: 7,
    senderRole: 'wali',
    recipientRole: 'admin',
    recipientId: 0,
    text: "Assalamu'alaikum Pengurus Admin Pondok, mohon informasi mengenai jadwal kepulangan santri liburan akhir semester tanggal berapa ya?",
    time: '2026-11-03 08:10',
    readByGuru: true,
    readByAdmin: false,
    readByWali: true,
  },
];
