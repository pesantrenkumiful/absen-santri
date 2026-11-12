import React from 'react';
import { LandingCMS, Santri, AbsensiRecord, PelanggaranRecord, TingkatKelas } from '../types';
import { formatMonthYear } from '../utils/dateHelper';

interface PrintableReportProps {
  cms: LandingCMS;
  reportType: 'santri' | 'absen' | 'pelanggaran';
  genderFilter: string;
  classFilter: string;
  aiNarrative: string;
  santris: Santri[];
  absensis: AbsensiRecord[];
  pelanggarans: PelanggaranRecord[];
  onClose: () => void;
  selectedMonth?: string;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({
  cms,
  reportType,
  genderFilter,
  classFilter,
  aiNarrative,
  santris,
  absensis,
  pelanggarans,
  onClose,
  selectedMonth,
}) => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Filter santri list based on report options
  let filteredSantri = santris;
  if (genderFilter !== 'ALL') {
    filteredSantri = filteredSantri.filter((s) => s.jk === genderFilter);
  }
  if (classFilter !== 'ALL') {
    filteredSantri = filteredSantri.filter((s) => s.kelas === classFilter);
  }

  // Monthly filtered absensi records
  const effectiveAbsensis =
    reportType === 'absen' && selectedMonth && selectedMonth !== 'ALL'
      ? absensis.filter((a) => a.tanggal.startsWith(selectedMonth))
      : absensis;

  // Total active attendance days recorded in the period
  const activeMeetingDates = Array.from(new Set(effectiveAbsensis.map((a) => a.tanggal)));

  const getReportTitle = () => {
    if (reportType === 'santri') return 'LAPORAN REKAPITULASI DATA SANTRI';
    if (reportType === 'absen') {
      if (selectedMonth && selectedMonth !== 'ALL') {
        return `LAPORAN REKAPITULASI PRESENSI SANTRI - BULAN ${formatMonthYear(selectedMonth).toUpperCase()}`;
      }
      return 'LAPORAN REKAPITULASI PRESENSI & KEHADIRAN SANTRI (SEMUA BULAN)';
    }
    return 'LAPORAN CATATAN KEDISIPLINAN & PELANGGARAN SANTRI';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top action bar (no-print) */}
      <div className="no-print bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-file-pdf text-rose-500 text-lg"></i>
          <div>
            <h4 className="font-bold text-xs sm:text-sm">Pratinjau Dokumen Resmi Pesantren</h4>
            <p className="text-[11px] text-slate-400">Siap dicetak ke kertas A4 atau disimpan sebagai file PDF</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            type="button"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <i className="fa-solid fa-arrow-left mr-1"></i> Kembali
          </button>
          <button
            onClick={handlePrint}
            type="button"
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-print"></i>
            <span>Cetak PDF Sekarang</span>
          </button>
        </div>
      </div>

      {/* Official Paper Layout with KOP Surat */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-200 text-slate-900 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
        {/* KOP SURAT RESMI */}
        <div className="border-b-4 border-double border-slate-900 pb-4 mb-6 relative text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
              <i className="fa-solid fa-kaaba"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900">
                {cms.namaPesantren}
              </h1>
              <p className="text-[11px] text-slate-700 font-semibold">{cms.alamat}</p>
              <p className="text-[10px] text-slate-600">
                Telp/WA: {cms.telpWA} &bull; Email: {cms.email}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-300">
            <h2 className="text-sm sm:text-base font-extrabold underline uppercase tracking-wide text-slate-900">
              {getReportTitle()}
            </h2>
            <p className="text-[11px] text-slate-600">
              Filter: {genderFilter === 'ALL' ? 'Semua Gender' : genderFilter} | Kelas:{' '}
              {classFilter === 'ALL' ? 'Semua 12 Kelas' : classFilter} | Tanggal Cetak: {currentDate}
            </p>
          </div>
        </div>

        {/* Dynamic Table Content */}
        <div className="text-xs mb-6 overflow-x-auto">
          {reportType === 'santri' && (
            <table className="w-full text-left border border-slate-300 border-collapse">
              <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] border-b border-slate-300">
                <tr>
                  <th className="p-2 border border-slate-300">No</th>
                  <th className="p-2 border border-slate-300">NIS</th>
                  <th className="p-2 border border-slate-300">Nama Santri</th>
                  <th className="p-2 border border-slate-300">Gender</th>
                  <th className="p-2 border border-slate-300">Tingkat Kelas</th>
                  <th className="p-2 border border-slate-300">Wali Santri</th>
                  <th className="p-2 border border-slate-300">Kontak No. HP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {filteredSantri.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-2 border border-slate-300 text-center font-medium">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 font-mono font-semibold">{s.nis}</td>
                    <td className="p-2 border border-slate-300 font-bold">{s.nama}</td>
                    <td className="p-2 border border-slate-300">{s.jk}</td>
                    <td className="p-2 border border-slate-300 font-medium">{s.kelas}</td>
                    <td className="p-2 border border-slate-300">{s.wali}</td>
                    <td className="p-2 border border-slate-300 font-mono">{s.hp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'absen' && (
            <table className="w-full text-left border border-slate-300 border-collapse">
              <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] border-b border-slate-300">
                <tr>
                  <th className="p-2 border border-slate-300">No</th>
                  <th className="p-2 border border-slate-300">NIS</th>
                  <th className="p-2 border border-slate-300">Nama Santri</th>
                  <th className="p-2 border border-slate-300">Kelas</th>
                  <th className="p-2 border border-slate-300 text-center font-bold text-emerald-700">Hadir (H)</th>
                  <th className="p-2 border border-slate-300 text-center font-bold text-amber-700">Sakit (S)</th>
                  <th className="p-2 border border-slate-300 text-center font-bold text-blue-700">Izin (I)</th>
                  <th className="p-2 border border-slate-300 text-center font-bold text-rose-700">Alpha (A)</th>
                  <th className="p-2 border border-slate-300 text-center font-bold text-slate-800">Total Hari</th>
                  <th className="p-2 border border-slate-300 text-center font-bold text-emerald-800">% Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {filteredSantri.map((s, idx) => {
                  const h = effectiveAbsensis.filter((a) => a.santriId === s.id && a.status === 'H').length;
                  const sc = effectiveAbsensis.filter((a) => a.santriId === s.id && a.status === 'S').length;
                  const i = effectiveAbsensis.filter((a) => a.santriId === s.id && a.status === 'I').length;
                  const a = effectiveAbsensis.filter((a) => a.santriId === s.id && a.status === 'A').length;
                  const totalDays = h + sc + i + a;
                  const percentage = totalDays > 0 ? Math.round((h / totalDays) * 100) : 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-2 border border-slate-300 text-center font-medium">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-mono">{s.nis}</td>
                      <td className="p-2 border border-slate-300 font-bold">{s.nama}</td>
                      <td className="p-2 border border-slate-300">{s.kelas}</td>
                      <td className="p-2 border border-slate-300 text-center font-bold text-emerald-700">{h}</td>
                      <td className="p-2 border border-slate-300 text-center font-bold text-amber-700">{sc}</td>
                      <td className="p-2 border border-slate-300 text-center font-bold text-blue-700">{i}</td>
                      <td className="p-2 border border-slate-300 text-center font-bold text-rose-700">{a}</td>
                      <td className="p-2 border border-slate-300 text-center font-medium text-slate-700">{totalDays} Hari</td>
                      <td className="p-2 border border-slate-300 text-center font-black text-emerald-700">{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'pelanggaran' && (
            <table className="w-full text-left border border-slate-300 border-collapse">
              <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] border-b border-slate-300">
                <tr>
                  <th className="p-2 border border-slate-300">No</th>
                  <th className="p-2 border border-slate-300">Tanggal</th>
                  <th className="p-2 border border-slate-300">Nama Santri</th>
                  <th className="p-2 border border-slate-300">Kelas</th>
                  <th className="p-2 border border-slate-300">Bentuk Pelanggaran</th>
                  <th className="p-2 border border-slate-300">Tingkat</th>
                  <th className="p-2 border border-slate-300">Sanksi Mendidik Yang Diberikan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {pelanggarans.map((p, idx) => {
                  const s = santris.find((item) => item.id === p.santriId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-2 border border-slate-300 text-center font-medium">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 whitespace-nowrap">{p.tanggal}</td>
                      <td className="p-2 border border-slate-300 font-bold">{s?.nama || 'Santri'}</td>
                      <td className="p-2 border border-slate-300">{s?.kelas || '-'}</td>
                      <td className="p-2 border border-slate-300 font-medium">{p.pelanggaran}</td>
                      <td className="p-2 border border-slate-300 font-semibold">{p.kategori}</td>
                      <td className="p-2 border border-slate-300">{p.sanksi}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* AI Narrative Section */}
        {aiNarrative && (
          <div className="bg-slate-50 border border-slate-300 p-4 rounded-xl mb-8 space-y-1.5">
            <h4 className="font-bold text-xs uppercase text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <i className="fa-solid fa-wand-magic-sparkles text-emerald-700"></i>
              <span>Evaluasi & Narasi Pembinaan Santri (Google Gemini AI)</span>
            </h4>
            <p className="text-xs leading-relaxed text-slate-800 whitespace-pre-line italic">
              "{aiNarrative}"
            </p>
          </div>
        )}

        {/* Official Signatures & Stamp */}
        <div className="mt-8 flex justify-between items-end text-xs pt-4">
          <div className="text-center space-y-16">
            <p>
              Mengetahui,<br />
              <span className="font-bold">Ketua Pengurus Pesantren</span>
            </p>
            <div>
              <p className="font-bold underline">( Ust. H. Ahmad Busro, S.Pd.I )</p>
              <p className="text-[10px] text-slate-500">NIP. 19820415 200501 1 002</p>
            </div>
          </div>

          {/* Official circular stamp placeholder */}
          <div className="text-center border-2 border-dashed border-slate-400 rounded-full w-28 h-28 flex items-center justify-center text-[10px] font-black text-slate-400 rotate-[-12deg] mx-auto opacity-70">
            [ STEMPEL RESMI<br />PESANTREN ]
          </div>

          <div className="text-center space-y-16">
            <p>
              Kalisat, Jember, {currentDate}<br />
              <span className="font-bold">Pimpinan / Pengasuh Pondok</span>
            </p>
            <div>
              <p className="font-bold underline">( KH. Mohammad Hasan Basri, M.Pd )</p>
              <p className="text-[10px] text-slate-500">Pengasuh Pondok Pesantren</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-300 pt-2 text-center text-[10px] text-slate-500">
          &copy; {new Date().getFullYear()} {cms.namaPesantren}. Dokumen Resmi Hasil Cetak Sistem Informasi Pesantren (SIPONDOK).
        </div>
      </div>
    </div>
  );
};
