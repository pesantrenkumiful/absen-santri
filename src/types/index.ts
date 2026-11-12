export type Gender = 'Santriwan' | 'Santriwati';

export type TingkatKelas =
  | '1 Awaliyah (Santriwan)'
  | '2 Awaliyah (Santriwan)'
  | '3 Awaliyah (Santriwan)'
  | '1 Wustho (Santriwan)'
  | '2 Wustho (Santriwan)'
  | '3 Wustho (Santriwan)'
  | '1 Awaliyah (Santriwati)'
  | '2 Awaliyah (Santriwati)'
  | '3 Awaliyah (Santriwati)'
  | '1 Wustho (Santriwati)'
  | '2 Wustho (Santriwati)'
  | '3 Wustho (Santriwati)';

export interface Santri {
  id: number;
  nis: string;
  nama: string;
  kelas: TingkatKelas;
  jk: Gender;
  wali: string;
  hp: string;
  passWali: string;
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

export interface AbsensiRecord {
  id: number;
  santriId: number;
  tanggal: string; // YYYY-MM-DD
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

