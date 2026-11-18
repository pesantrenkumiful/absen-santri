import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Santri, AbsensiRecord, Guru, SesiAbsen, SESI_ABSEN_CONFIG, ALL_SESI_ABSEN } from '../types';
import { playScanSound } from '../utils/sound';
import { getDefaultSesiNow } from '../utils/dateHelper';

interface QrAttendanceScannerProps {
  currentGuru: Guru;
  santris: Santri[];
  absensis: AbsensiRecord[];
  onRecordAttendance: (
    santriId: number,
    tanggal: string,
    status: 'H' | 'S' | 'I' | 'A',
    sesi?: SesiAbsen
  ) => void;
  onShowToast: (msg: string, type: 'info' | 'success' | 'error' | 'warning') => void;
  onClose?: () => void;
}

interface ScanHistoryItem {
  id: string;
  santriId: number;
  nama: string;
  nis: string;
  kelas: string;
  sesi: SesiAbsen;
  time: string;
  status: 'SUCCESS' | 'DUPLICATE' | 'ERROR';
  message: string;
}

export const QrAttendanceScanner: React.FC<QrAttendanceScannerProps> = ({
  currentGuru,
  santris,
  absensis,
  onRecordAttendance,
  onShowToast,
  onClose,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [scanDate, setScanDate] = useState<string>(todayStr);
  const [selectedSesi, setSelectedSesi] = useState<SesiAbsen>(() => getDefaultSesiNow());
  const [filterClass, setFilterClass] = useState<string>(
    currentGuru.assignedClasses && currentGuru.assignedClasses.length > 0
      ? currentGuru.assignedClasses[0]
      : 'ALL'
  );

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [lastScannedResult, setLastScannedResult] = useState<{
    santri?: Santri;
    status: 'SUCCESS' | 'DUPLICATE' | 'ERROR';
    message: string;
    existingRecord?: AbsensiRecord;
    timestamp: string;
  } | null>(null);

  // Manual input simulation fallback for testing or blocked camera
  const [manualInput, setManualInput] = useState<string>('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isCooldownRef = useRef<boolean>(false);
  const scannerContainerId = 'qr-reader-viewport';

  // Available classes for filtering
  const availableClasses = currentGuru.assignedClasses && currentGuru.assignedClasses.length > 0
    ? currentGuru.assignedClasses
    : Array.from(new Set(santris.map((s) => s.kelas)));

  // Load available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (cameras && cameras.length > 0) {
          setAvailableCameras(cameras);
          // Prefer back/environment camera if present
          const backCam = cameras.find((c) =>
            c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear') || c.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : cameras[0].id);
        } else {
          setCameraError('Tidak ditemukan perangkat kamera yang aktif pada perangkat ini.');
        }
      })
      .catch((err) => {
        console.warn('Camera permission check / enumeration error:', err);
        setCameraError('Izin akses kamera belum diberikan atau kamera tidak tersedia.');
      });

    return () => {
      stopCameraScanner();
    };
  }, []);

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        html5QrCodeRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const startCameraScanner = async (cameraId?: string) => {
    setCameraError(null);
    const targetCam = cameraId || selectedCameraId;

    try {
      await stopCameraScanner();

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      const cameraParam = targetCam ? { deviceId: { exact: targetCam } } : { facingMode: 'environment' };

      try {
        await html5QrCode.start(
          cameraParam,
          config,
          (decodedText) => {
            handleDecodedQr(decodedText);
          },
          () => {}
        );
      } catch (startErr: any) {
        // Fallback to front camera or default available camera if environment camera is not found
        console.warn('Initial camera start failed, attempting fallback camera:', startErr?.message);
        await html5QrCode.start(
          { facingMode: 'user' },
          config,
          (decodedText) => {
            handleDecodedQr(decodedText);
          },
          () => {}
        );
      }

      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera scanner initialization notice:', err?.message || err);
      setIsScanning(false);
      setCameraError(
        'Kamera tidak dapat diakses atau sedang digunakan aplikasi lain. Anda dapat menggunakan opsi Input NIS Manual di bawah.'
      );
    }
  };

  // Process decoded QR payload with strict "HANYA 1 KALI" rule
  const handleDecodedQr = (rawText: string) => {
    if (isCooldownRef.current) return;
    isCooldownRef.current = true;
    setTimeout(() => {
      isCooldownRef.current = false;
    }, 1800); // Cooldown to avoid rapid repeated triggers of the same QR

    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    let targetSantri: Santri | undefined;

    // 1. Try JSON parsing
    try {
      const parsed = JSON.parse(rawText);
      if (parsed && (parsed.id || parsed.nis)) {
        targetSantri = santris.find(
          (s) => s.id === parsed.id || (parsed.nis && s.nis.trim() === String(parsed.nis).trim())
        );
      }
    } catch {
      // 2. Try raw NIS string or formatted text SIPONDOK:QR:ID:NIS
      const clean = rawText.trim();
      if (clean.startsWith('SIPONDOK')) {
        const parts = clean.split(':');
        const nisPart = parts[parts.length - 1];
        const idPart = parts[parts.length - 2];
        targetSantri = santris.find(
          (s) => s.nis === nisPart || (idPart && s.id === Number(idPart))
        );
      } else {
        // Direct NIS match
        targetSantri = santris.find((s) => s.nis.trim() === clean || s.nama.toLowerCase() === clean.toLowerCase());
      }
    }

    if (!targetSantri) {
      // Audio error
      playScanSound('error');
      const errItem: ScanHistoryItem = {
        id: `${Date.now()}`,
        santriId: 0,
        nama: 'Tidak Dikenali',
        nis: rawText.slice(0, 20),
        kelas: '-',
        sesi: selectedSesi,
        time: nowTime,
        status: 'ERROR',
        message: 'QR Code tidak terdaftar di database santri pondok!',
      };
      setScanHistory((prev) => [errItem, ...prev.slice(0, 49)]);
      setLastScannedResult({
        status: 'ERROR',
        message: `QR Code tidak cocok dengan data santri: "${rawText.slice(0, 30)}"`,
        timestamp: nowTime,
      });
      onShowToast('QR Code tidak dikenali sebagai santri pondok!', 'error');
      return;
    }

    // ========================================================
    // CRITICAL REQUIREMENT: SCAN HANYA 1 KALI PER SESI
    // ========================================================
    const existing = absensis.find(
      (a) =>
        a.santriId === targetSantri!.id &&
        a.tanggal === scanDate &&
        (a.sesi || 'madrasah') === selectedSesi
    );

    const sesiInfo = SESI_ABSEN_CONFIG[selectedSesi];

    if (existing) {
      // REJECT DUPLICATE SCAN
      playScanSound('duplicate');

      const statusLabel =
        existing.status === 'H'
          ? 'Hadir'
          : existing.status === 'S'
          ? 'Sakit'
          : existing.status === 'I'
          ? 'Izin'
          : 'Alpha';

      const dupMessage = `Presensi DITOLAK! Santri sudah melakukan presensi [${sesiInfo.nama}] hari ini (${scanDate}) dengan status: ${statusLabel}. Presensi QR dibatasi hanya 1 kali untuk sesi ini.`;

      const dupItem: ScanHistoryItem = {
        id: `${Date.now()}`,
        santriId: targetSantri.id,
        nama: targetSantri.nama,
        nis: targetSantri.nis,
        kelas: targetSantri.kelas,
        sesi: selectedSesi,
        time: nowTime,
        status: 'DUPLICATE',
        message: `Sudah Absen [${sesiInfo.nama}] - Ditolak (1x Scan)`,
      };

      setScanHistory((prev) => [dupItem, ...prev.slice(0, 49)]);
      setLastScannedResult({
        santri: targetSantri,
        status: 'DUPLICATE',
        message: dupMessage,
        existingRecord: existing,
        timestamp: nowTime,
      });

      onShowToast(
        `⚠️ Scan Ditolak: ${targetSantri.nama} SUDAH absen untuk [${sesiInfo.nama}]! (Hanya 1 kali)`,
        'warning'
      );
      return;
    }

    // ========================================================
    // FIRST SCAN OF THIS SESSION: SUCCESS RECORD
    // ========================================================
    playScanSound('success');

    // Record attendance as HADIR for selectedSesi
    onRecordAttendance(targetSantri.id, scanDate, 'H', selectedSesi);

    const successItem: ScanHistoryItem = {
      id: `${Date.now()}`,
      santriId: targetSantri.id,
      nama: targetSantri.nama,
      nis: targetSantri.nis,
      kelas: targetSantri.kelas,
      sesi: selectedSesi,
      time: nowTime,
      status: 'SUCCESS',
      message: `Presensi [${sesiInfo.nama}] Hadir Berhasil Tercatat`,
    };

    setScanHistory((prev) => [successItem, ...prev.slice(0, 49)]);
    setLastScannedResult({
      santri: targetSantri,
      status: 'SUCCESS',
      message: `Presensi Berhasil! Santri ${targetSantri.nama} (${targetSantri.kelas}${targetSantri.kelasKedua ? ` • ${targetSantri.kelasKedua}` : ''}) resmi tercatat Hadir pada ${sesiInfo.labelLengkap}.`,
      timestamp: nowTime,
    });

    onShowToast(`✅ Presensi Sukses: ${targetSantri.nama} Tercatat Hadir [${sesiInfo.nama}]!`, 'success');
  };

  // Image file scan fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const scanner = html5QrCodeRef.current || new Html5Qrcode('qr-reader-temp');
      const result = await scanner.scanFile(file, true);
      handleDecodedQr(result);
    } catch (err: any) {
      playScanSound('error');
      onShowToast('Gagal membaca QR Code dari file gambar. Pastikan gambar jelas.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  // Manual NIS input submission fallback
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecodedQr(manualInput.trim());
    setManualInput('');
  };

  // Calculate statistics for the selected class/date/session
  const filteredSantrisForStats = filterClass === 'ALL'
    ? santris
    : santris.filter((s) => s.kelas === filterClass || s.kelasKedua === filterClass);

  const totalFiltered = filteredSantrisForStats.length;
  const hadirCount = filteredSantrisForStats.filter((s) => {
    const rec = absensis.find(
      (a) =>
        a.santriId === s.id &&
        a.tanggal === scanDate &&
        (a.sesi || 'madrasah') === selectedSesi
    );
    return rec && rec.status === 'H';
  }).length;
  const belumAbsenCount = Math.max(0, totalFiltered - hadirCount);

  return (
    <div className="space-y-4">
      {/* Hidden container for file scan fallback if needed */}
      <div id="qr-reader-temp" className="hidden"></div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-800/40">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-3xl font-bold shadow-inner shrink-0 text-emerald-300">
            <i className="fa-solid fa-qrcode"></i>
          </div>
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-200 text-[11px] px-3 py-0.5 rounded-full border border-emerald-400/30 font-semibold uppercase tracking-wider mb-1">
              <i className="fa-solid fa-camera"></i>
              <span>Live QR Scanner Presensi</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Pemindai Kartu Santri</h2>
            <p className="text-xs text-emerald-100/80 flex items-center gap-2 mt-0.5 flex-wrap">
              <span>Pengampu: <strong>{currentGuru.nama}</strong></span>
              <span>&bull;</span>
              <span className="font-semibold text-amber-300">
                <i className="fa-solid fa-shield-halved mr-1"></i>Scan Dibatasi 1 Kali per Sesi
              </span>
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="self-start md:self-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <i className="fa-solid fa-arrow-left mr-1.5"></i>
            Kembali ke Daftar Presensi
          </button>
        )}
      </div>

      {/* Pilihan 3 Sesi Presensi Harian (Wajib Pilih Sesi) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
              <i className="fa-solid fa-clock"></i>
            </span>
            <div>
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
                Pilih Sesi Presensi Aktif:
              </h3>
              <p className="text-[11px] text-slate-500">
                Tiap sesi memiliki kuota 1x scan terpisah per santri per hari
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-600">
            Sesi Terpilih:{' '}
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {SESI_ABSEN_CONFIG[selectedSesi].labelLengkap}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {ALL_SESI_ABSEN.map((sesiKey) => {
            const cfg = SESI_ABSEN_CONFIG[sesiKey];
            const isSelected = selectedSesi === sesiKey;
            return (
              <button
                key={sesiKey}
                type="button"
                onClick={() => setSelectedSesi(sesiKey)}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? `${cfg.activeBg} border-transparent shadow-md ring-2 ring-emerald-500/30`
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-700 shadow-xs'
                    }`}
                  >
                    <i className={cfg.icon}></i>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {cfg.labelLengkap}
                    </p>
                    <p className={`text-[10px] truncate ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {cfg.waktuPerkiraan}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <span className="bg-white/25 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ml-1">
                    Aktif
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Bar: Date & Class Selector & Camera Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Presensi:</label>
            <input
              type="date"
              value={scanDate}
              onChange={(e) => setScanDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-800 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Pantauan Kelas:</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-semibold text-slate-800 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">Semua Kelas Santri</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {availableCameras.length > 1 && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Kamera:</label>
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  if (isScanning) {
                    startCameraScanner(e.target.value);
                  }
                }}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-medium text-slate-800 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {availableCameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Kamera ${cam.id.slice(0, 5)}...`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Camera Start / Stop Toggle */}
        <div className="flex items-center space-x-2">
          {!isScanning ? (
            <button
              onClick={() => startCameraScanner()}
              type="button"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl transition flex items-center space-x-2 shadow-sm cursor-pointer"
            >
              <i className="fa-solid fa-video"></i>
              <span>Nyalakan Kamera</span>
            </button>
          ) : (
            <button
              onClick={stopCameraScanner}
              type="button"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl transition flex items-center space-x-2 shadow-sm cursor-pointer"
            >
              <i className="fa-solid fa-video-slash"></i>
              <span>Matikan Kamera</span>
            </button>
          )}

          {/* Upload QR Image File Fallback */}
          <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-slate-200">
            <i className="fa-solid fa-file-image text-emerald-700"></i>
            <span>Upload Foto QR</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {/* Main Grid: Scanner Left + Live Status & History Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Camera Viewport & Manual Input (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 rounded-3xl p-4 shadow-xl border border-slate-800 text-white flex flex-col items-center justify-center relative overflow-hidden min-h-[360px]">
            {/* Viewport for html5-qrcode */}
            <div
              id={scannerContainerId}
              className={`w-full max-w-[320px] rounded-2xl overflow-hidden bg-black aspect-square relative ${
                !isScanning ? 'hidden' : 'block'
              }`}
            />

            {!isScanning && (
              <div className="py-12 px-4 text-center space-y-3 z-10">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-4xl text-emerald-400 shadow-inner">
                  <i className="fa-solid fa-camera"></i>
                </div>
                <h4 className="font-bold text-base text-slate-100">Kamera Sedang Tidak Aktif</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Klik tombol di bawah untuk menyalakan kamera laptop/smartphone dan arahkan kartu QR santri ke dalam kotak.
                </p>
                <button
                  onClick={() => startCameraScanner()}
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow cursor-pointer inline-flex items-center space-x-2"
                >
                  <i className="fa-solid fa-play"></i>
                  <span>Aktifkan Pemindai Sekarang</span>
                </button>
              </div>
            )}

            {cameraError && (
              <div className="mt-3 bg-rose-950/80 border border-rose-500/50 p-3 rounded-xl text-rose-200 text-xs text-center w-full z-10">
                <i className="fa-solid fa-triangle-exclamation mr-1.5 text-rose-400"></i>
                {cameraError}
              </div>
            )}

            {isScanning && (
              <div className="mt-3 text-[11px] text-emerald-300 font-medium flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Kamera Aktif: Arahkan QR Code Kartu Santri ke Kotak</span>
              </div>
            )}
          </div>

          {/* Quick Manual NIS / Name Input Simulation */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <i className="fa-solid fa-keyboard text-emerald-700"></i>
                <span>Input Cepat / Simulasi Scan Barcode</span>
              </span>
              <span className="text-[10px] text-slate-400">Alternatif jika kamera terhalang</span>
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Ketik NIS Santri (misal: 202401) lalu Enter..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="flex-grow bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <i className="fa-solid fa-arrow-turn-down-left"></i>
                <span>Scan</span>
              </button>
            </form>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 block font-semibold">Total Siswa</span>
              <span className="text-lg font-black text-slate-800">{totalFiltered}</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[10px] text-emerald-700 block font-bold">Tercatat Hadir</span>
              <span className="text-lg font-black text-emerald-800">{hadirCount}</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[10px] text-amber-700 block font-bold">Belum Absen</span>
              <span className="text-lg font-black text-amber-800">{belumAbsenCount}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Scan Feedback Banner & History Log (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Result Banner (Prominent Alert for Success vs Duplicate) */}
          {lastScannedResult ? (
            <div
              className={`p-5 rounded-3xl border-2 shadow-md transition-all ${
                lastScannedResult.status === 'SUCCESS'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                  : lastScannedResult.status === 'DUPLICATE'
                  ? 'bg-amber-50 border-amber-500 text-amber-950'
                  : 'bg-rose-50 border-rose-400 text-rose-950'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xs ${
                      lastScannedResult.status === 'SUCCESS'
                        ? 'bg-emerald-600 text-white'
                        : lastScannedResult.status === 'DUPLICATE'
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    <i
                      className={`fa-solid ${
                        lastScannedResult.status === 'SUCCESS'
                          ? 'fa-circle-check'
                          : lastScannedResult.status === 'DUPLICATE'
                          ? 'fa-hand'
                          : 'fa-circle-xmark'
                      }`}
                    ></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          lastScannedResult.status === 'SUCCESS'
                            ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                            : lastScannedResult.status === 'DUPLICATE'
                            ? 'bg-amber-200 text-amber-950 border border-amber-400'
                            : 'bg-rose-200 text-rose-900 border border-rose-300'
                        }`}
                      >
                        {lastScannedResult.status === 'SUCCESS'
                          ? 'PRESENSI BERHASIL'
                          : lastScannedResult.status === 'DUPLICATE'
                          ? '⚠️ DITOLAK: SUDAH ABSEN (HANYA 1 KALI)'
                          : 'GAGAL / TIDAK COCOK'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        Pukul {lastScannedResult.timestamp}
                      </span>
                    </div>

                    {lastScannedResult.santri && (
                      <div className="mt-1.5">
                        <h3 className="text-base sm:text-lg font-black tracking-tight">
                          {lastScannedResult.santri.nama}
                        </h3>
                        <p className="text-xs font-semibold opacity-85">
                          NIS: <span className="font-mono">{lastScannedResult.santri.nis}</span> &bull; Kelas: {lastScannedResult.santri.kelas} &bull; Wali: {lastScannedResult.santri.wali}
                        </p>
                      </div>
                    )}

                    <p className="mt-2 text-xs font-medium leading-relaxed">
                      {lastScannedResult.message}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setLastScannedResult(null)}
                  type="button"
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-3xl border border-dashed border-slate-300 text-center text-slate-400 space-y-1">
              <i className="fa-solid fa-barcode text-2xl text-slate-300"></i>
              <p className="text-xs font-semibold text-slate-600">Menunggu Pemindaian QR Santri...</p>
              <p className="text-[11px] text-slate-400">
                Pindai kartu presensi santri melalui kamera atau masukkan NIS secara manual di kolom sebelah kiri.
              </p>
            </div>
          )}

          {/* Session Scan Feed / Activity History */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-clock-rotate-left text-emerald-700"></i>
                <h4 className="font-bold text-sm text-slate-800">Riwayat Scan Sesi Ini</h4>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500 font-medium">
                  {scanHistory.length} Kali Scan
                </span>
                {scanHistory.length > 0 && (
                  <button
                    onClick={() => setScanHistory([])}
                    type="button"
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    Bersihkan Riwayat
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto max-h-[380px] space-y-2 pr-1 text-xs">
              {scanHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <i className="fa-solid fa-inbox text-3xl mb-2 text-slate-300"></i>
                  <p>Belum ada riwayat pemindaian pada sesi ini.</p>
                </div>
              ) : (
                scanHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                      item.status === 'SUCCESS'
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : item.status === 'DUPLICATE'
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-rose-50/70 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                          item.status === 'SUCCESS'
                            ? 'bg-emerald-600 text-white'
                            : item.status === 'DUPLICATE'
                            ? 'bg-amber-500 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        <i
                          className={`fa-solid ${
                            item.status === 'SUCCESS'
                              ? 'fa-check'
                              : item.status === 'DUPLICATE'
                              ? 'fa-ban'
                              : 'fa-xmark'
                          }`}
                        ></i>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{item.nama}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          NIS: {item.nis} &bull; {item.kelas}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full block ${
                          item.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'DUPLICATE'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.message}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
