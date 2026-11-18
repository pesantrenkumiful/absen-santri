export type Gender = 'Santriwan' | 'Santriwati';

export type TingkatKelas =
  // Formal - SMP (1, 2, 3)
  | '1 SMP (Santriwan)'
  | '2 SMP (Santriwan)'
  | '3 SMP (Santriwan)'
  | '1 SMP (Santriwati)'
  | '2 SMP (Santriwati)'
  | '3 SMP (Santriwati)'
  // Formal - MA (1, 2, 3)
  | '1 MA (Santriwan)'
  | '2 MA (Santriwan)'
  | '3 MA (Santriwan)'
  | '1 MA (Santriwati)'
  | '2 MA (Santriwati)'
  | '3 MA (Santriwati)'
  // Non Formal - Madrasah Diniyah (Awaliyah, Wustho) & Non Formal
  | '1 Awaliyah (Santriwan)'
  | '2 Awaliyah (Santriwan)'
  | '3 Awaliyah (Santriwan)'
  | '1 Wustho (Santriwan)'
  | '2 Wustho (Santriwan)'
  | '3 Wustho (Santriwan)'
  | 'Non Formal (Santriwan)'
  | '1 Awaliyah (Santriwati)'
  | '2 Awaliyah (Santriwati)'
  | '3 Awaliyah (Santriwati)'
  | '1 Wustho (Santriwati)'
  | '2 Wustho (Santriwati)'
  | '3 Wustho (Santriwati)'
  | 'Non Formal (Santriwati)';

export interface Santri {
  id: number;
  nis: string;
  nama: string;
  kelas: TingkatKelas;
  kelasKedua?: TingkatKelas; // Opsional: jika santri mengikuti program Formal & Non Formal sekaligus
  jk: Gender;
  wali: string;
  hp: string;
  passWali: string;
  foto?: string;
}

export interface Guru {
  id: number;
  username: string;
  pass: string;
  nama: string;
  mapel: string;
  telp: string;
  assignedClasses: TingkatKelas[];
}

export type AbsensiStatus = 'H' | 'S' | 'I' | 'A';

export type SesiAbsen = 'subuh' | 'madrasah' | 'sorogan';

export interface SesiAbsenInfo {
  id: SesiAbsen;
  nomor: 1 | 2 | 3;
  nama: string;
  labelLengkap: string;
  waktuPerkiraan: string;
  keterangan: string;
  icon: string;
  colorBadge: string;
  activeBg: string;
}

export const SESI_ABSEN_CONFIG: Record<SesiAbsen, SesiAbsenInfo> = {
  subuh: {
    id: 'subuh',
    nomor: 1,
    nama: 'Absen Subuh',
    labelLengkap: '1: Absen Subuh (Sholat & Wirid Pagi)',
    waktuPerkiraan: '04:30 - 06:00 WIB',
    keterangan: 'Sholat Subuh Berjamaah & Wirid Pagi',
    icon: 'fa-solid fa-cloud-sun',
    colorBadge: 'bg-amber-100 text-amber-800 border-amber-300',
    activeBg: 'bg-amber-600 text-white',
  },
  madrasah: {
    id: 'madrasah',
    nomor: 2,
    nama: 'Absen Madrasah',
    labelLengkap: '2: Absen Madrasah (Sekolah / Diniyah)',
    waktuPerkiraan: '07:30 - 12:30 WIB',
    keterangan: 'Sekolah Formal & Madrasah Diniyah',
    icon: 'fa-solid fa-school',
    colorBadge: 'bg-blue-100 text-blue-800 border-blue-300',
    activeBg: 'bg-blue-600 text-white',
  },
  sorogan: {
    id: 'sorogan',
    nomor: 3,
    nama: 'Absen Sorogan',
    labelLengkap: '3: Absen Sorogan (Pengajian Malam)',
    waktuPerkiraan: '18:30 - 20:30 WIB',
    keterangan: 'Sorogan Kitab Kuning & Pengajian Malam',
    icon: 'fa-solid fa-book-quran',
    colorBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    activeBg: 'bg-emerald-700 text-white',
  },
};

export const ALL_SESI_ABSEN: SesiAbsen[] = ['subuh', 'madrasah', 'sorogan'];

export interface AbsensiRecord {
  id: number;
  santriId: number;
  tanggal: string; // YYYY-MM-DD
  sesi?: SesiAbsen; // 'subuh' | 'madrasah' | 'sorogan' (defaults to 'madrasah' if undefined)
  status: AbsensiStatus;
  waktuScan?: string;
  metode?: 'QR_SCAN' | 'MANUAL';
}

export type PelanggaranKategori = 'Ringan' | 'Sedang' | 'Berat';

export interface PelanggaranRecord {
  id: number;
  santriId: number;
  tanggal: string; // YYYY-MM-DD
  pelanggaran: string;
  kategori: PelanggaranKategori;
  sanksi: string;
}

export type RoleType = 'admin' | 'guru' | 'wali';

export interface ChatMessage {
  id: number;
  santriId: number;
  senderRole: RoleType;
  recipientRole: RoleType;
  recipientId: number; // guruId or 0 for admin, or santriId for wali
  text: string;
  time: string;
  readByAdmin: boolean;
  readByGuru: boolean;
  readByWali: boolean;
}

export interface LandingCMS {
  namaPesantren: string;
  tagline: string;
  runningBanner: string;
  heroTitle: string;
  heroDesc: string;
  heroIconClass: string;
  heroImageUrl?: string;
  visi: string;
  misi: string;
  alamat: string;
  telpWA: string;
  email: string;
}

export interface ActiveUser {
  role: RoleType;
  id?: number;
  name: string;
  data?: any;
}

export interface AdminCredentials {
  username: string;
  pass: string;
  name: string;
}

