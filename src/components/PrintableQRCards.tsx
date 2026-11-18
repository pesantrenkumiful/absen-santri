import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { LandingCMS, Santri } from '../types';
import {
  FORMAL_SMP_SANTRIWAN,
  FORMAL_MA_SANTRIWAN,
  NON_FORMAL_SANTRIWAN,
  FORMAL_SMP_SANTRIWATI,
  FORMAL_MA_SANTRIWATI,
  NON_FORMAL_SANTRIWATI,
} from '../data/initialData';

interface PrintableQRCardsProps {
  cms: LandingCMS;
  santris: Santri[];
  initialSelectedSantriId?: number | null;
  onClose: () => void;
}

export const PrintableQRCards: React.FC<PrintableQRCardsProps> = ({
  cms,
  santris,
  initialSelectedSantriId = null,
  onClose,
}) => {
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOnlyId, setSelectedOnlyId] = useState<number | null>(initialSelectedSantriId);
  const [qrCodeMap, setQrCodeMap] = useState<Record<number, string>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(true);

  // Filter students based on selection
  const filteredSantris = santris.filter((s) => {
    if (selectedOnlyId !== null && s.id !== selectedOnlyId) return false;
    if (filterGender !== 'ALL' && s.jk !== filterGender) return false;
    if (filterClass !== 'ALL' && s.kelas !== filterClass && s.kelasKedua !== filterClass) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q);
    }
    return true;
  });

  // Generate QR codes for all filtered students
  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    async function generateAllQrs() {
      const map: Record<number, string> = {};
      for (const s of santris) {
        try {
          // Standardized payload format recognized by scanner
          const payload = JSON.stringify({
            type: 'SIPONDOK_SANTRI',
            id: s.id,
            nis: s.nis,
            nama: s.nama,
            kelas: s.kelas,
          });
          const url = await QRCode.toDataURL(payload, {
            width: 280,
            margin: 1,
            color: {
              dark: '#0f172a', // slate-900 for crisp scan
              light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
          });
          map[s.id] = url;
        } catch (err) {
          console.error('Failed to generate QR for santri', s.id, err);
        }
      }
      if (isMounted) {
        setQrCodeMap(map);
        setIsGenerating(false);
      }
    }

    generateAllQrs();

    return () => {
      isMounted = false;
    };
  }, [santris]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Top Controls Toolbar (Hidden during print) */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-200 mb-6 no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shadow-xs">
              <i className="fa-solid fa-qrcode"></i>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Pencetakan Kartu Presensi QR Santri
              </h2>
              <p className="text-xs text-slate-500">
                Cetak kartu tanda santri ber-QR Code untuk dipindai oleh dewan guru saat presensi harian.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              type="button"
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition flex items-center space-x-2 cursor-pointer"
            >
              <i className="fa-solid fa-print"></i>
              <span>Cetak Kartu ({filteredSantris.length} Santri)</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              <i className="fa-solid fa-xmark mr-1"></i>
              <span>Tutup</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Cari Santri / NIS:</label>
            <input
              type="text"
              placeholder="Ketik nama atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Filter Gender:</label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium cursor-pointer"
            >
              <option value="ALL">Semua Santri (Putra & Putri)</option>
              <option value="Santriwan">Santriwan (Putra)</option>
              <option value="Santriwati">Santriwati (Putri)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Filter Kelas:</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium cursor-pointer"
            >
              <option value="ALL">Semua Kelas (Formal & Non Formal)</option>
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

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Target Santri:</label>
            <select
              value={selectedOnlyId === null ? 'ALL' : String(selectedOnlyId)}
              onChange={(e) => setSelectedOnlyId(e.target.value === 'ALL' ? null : Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium cursor-pointer"
            >
              <option value="ALL">Cetak Massal / Seluruhnya</option>
              {santris.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} ({s.nis})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tip Box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-circle-info text-emerald-600 text-sm"></i>
            <span>
              <strong>Petunjuk Cetak:</strong> Gunakan kertas A4 atau kertas foto/kartu ID. Potong kartu sesuai garis batas dan berikan kepada santri untuk dipindai saat jam halaqah/madrasah.
            </span>
          </div>
          <span className="font-bold text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
            Total {filteredSantris.length} Kartu Siap Cetak
          </span>
        </div>
      </div>

      {/* Cards Grid Preview & Print Container */}
      <div className="max-w-6xl mx-auto print:max-w-none print:w-full">
        {isGenerating ? (
          <div className="bg-white p-12 rounded-2xl text-center space-y-3 no-print">
            <i className="fa-solid fa-spinner animate-spin text-3xl text-emerald-700"></i>
            <p className="text-sm font-semibold text-slate-700">Sedang mengenerate Barcode & QR Code Santri...</p>
          </div>
        ) : filteredSantris.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center text-slate-500 no-print">
            <i className="fa-solid fa-user-slash text-4xl mb-2 text-slate-300"></i>
            <p className="font-semibold">Tidak ada santri yang sesuai kriteria pencarian.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 print:grid-cols-2 print:gap-4 print:m-0">
            {filteredSantris.map((s) => {
              const qrUrl = qrCodeMap[s.id];
              const isPutra = s.jk === 'Santriwan';

              return (
                <div
                  key={s.id}
                  className="bg-white rounded-3xl border-2 border-slate-300 shadow-md p-4 flex flex-col justify-between overflow-hidden relative print:border-slate-400 print:shadow-none print:rounded-2xl print:break-inside-avoid print:mb-4 transition hover:shadow-lg"
                  style={{ minHeight: '380px' }}
                >
                  {/* Decorative Corner Watermark */}
                  <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
                    <i className="fa-solid fa-kaaba text-[140px] text-emerald-950"></i>
                  </div>

                  {/* Header Pesantren */}
                  <div className="border-b-2 border-emerald-800 pb-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                        <i className="fa-solid fa-kaaba text-xs"></i>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-tight leading-none line-clamp-1">
                          {cms.namaPesantren}
                        </h4>
                        <span className="text-[9px] font-semibold text-emerald-700 uppercase tracking-widest block mt-0.5">
                          KARTU PRESENSI RESMI SANTRI
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 shrink-0">
                      {isPutra ? 'PUTRA' : 'PUTRI'}
                    </span>
                  </div>

                  {/* Body Content: Profile + QR */}
                  <div className="py-3 flex flex-col items-center text-center space-y-2">
                    {/* QR Code Container */}
                    <div className="p-2 bg-slate-50 border-2 border-slate-200 rounded-2xl shadow-inner inline-block relative group">
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt={`QR Santri ${s.nama}`}
                          className="w-36 h-36 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-36 h-36 flex items-center justify-center bg-slate-100 rounded-lg">
                          <i className="fa-solid fa-qrcode text-3xl text-slate-400"></i>
                        </div>
                      )}
                      <div className="absolute bottom-1 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] font-mono font-bold text-slate-700 shadow-xs border border-slate-200">
                        NIS: {s.nis}
                      </div>
                    </div>

                    {/* Student Identity */}
                    <div className="w-full px-1">
                      <h3 className="font-black text-sm text-slate-900 leading-tight uppercase line-clamp-1">
                        {s.nama}
                      </h3>
                      <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                        <span className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {s.kelas}
                        </span>
                        {s.kelasKedua && (
                          <span className="inline-block bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            {s.kelasKedua}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details Table in Card */}
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-left text-[10px] text-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Status Kartu:</span>
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <i className="fa-solid fa-circle-check text-[9px]"></i>
                          Aktif Terverifikasi
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="border-t border-dashed border-slate-300 pt-2 text-center">
                    <p className="text-[9px] text-slate-500 font-medium">
                      Pindai QR ini pada sistem Guru untuk mencatat presensi halaqah harian.
                    </p>
                    <div className="mt-1 flex items-center justify-center space-x-1.5 text-[8px] font-mono text-slate-400 tracking-wider">
                      <span>VERIFIED • SIPONDOK • QR-{s.id}-{s.nis}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
