import { AbsensiRecord } from '../types';

export const INDONESIAN_MONTHS = [
  { value: '01', name: 'Januari' },
  { value: '02', name: 'Februari' },
  { value: '03', name: 'Maret' },
  { value: '04', name: 'April' },
  { value: '05', name: 'Mei' },
  { value: '06', name: 'Juni' },
  { value: '07', name: 'Juli' },
  { value: '08', name: 'Agustus' },
  { value: '09', name: 'September' },
  { value: '10', name: 'Oktober' },
  { value: '11', name: 'November' },
  { value: '12', name: 'Desember' },
];

/**
 * Returns month name in Indonesian (e.g. '2026-11' -> 'November 2026')
 */
export function formatMonthYear(yearMonth: string): string {
  if (!yearMonth || yearMonth === 'ALL') return 'Sepanjang Waktu (Semua Bulan)';
  const parts = yearMonth.split('-');
  if (parts.length < 2) return yearMonth;
  const year = parts[0];
  const monthVal = parts[1];
  const found = INDONESIAN_MONTHS.find((m) => m.value === monthVal);
  return found ? `${found.name} ${year}` : yearMonth;
}

/**
 * Returns formatted date in Indonesian (e.g. '2026-11-03' -> '3 November 2026')
 */
export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const year = parts[0];
  const monthVal = parts[1];
  const day = parseInt(parts[2], 10);
  const found = INDONESIAN_MONTHS.find((m) => m.value === monthVal);
  return found ? `${day} ${found.name} ${year}` : dateStr;
}

/**
 * Get sorted unique YYYY-MM list from attendance records and ensure current month is present
 */
export function getAvailableMonths(absensis: AbsensiRecord[]): string[] {
  const currentYM = new Date().toISOString().slice(0, 7); // e.g. '2026-11'
  const set = new Set<string>();
  set.add(currentYM);

  absensis.forEach((a) => {
    if (a.tanggal && a.tanggal.length >= 7) {
      set.add(a.tanggal.slice(0, 7));
    }
  });

  return Array.from(set).sort().reverse();
}
