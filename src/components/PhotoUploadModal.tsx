import React, { useState, useRef, useEffect, useCallback } from 'react';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl?: string;
  onSavePhoto: (photoUrl: string) => void;
  title?: string;
  description?: string;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  currentPhotoUrl,
  onSavePhoto,
  title = 'Unggah / Ambil Foto Pesantren',
  description = 'Pilih foto dari galeri perangkat atau gunakan kamera langsung.',
}) => {
  type TabMode = 'gallery' | 'camera';
  const [activeTab, setActiveTab] = useState<TabMode>('gallery');

  // Preview & compressed output state
  const [previewUrl, setPreviewUrl] = useState<string>(currentPhotoUrl || '');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [cameraNotice, setCameraNotice] = useState<string>('');

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isSnapshotCaptured, setIsSnapshotCaptured] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch {
        // ignore
      }
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage('');
    setCameraNotice('');
    setIsSnapshotCaptured(false);
    setIsStartingCamera(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsStartingCamera(false);
      setCameraNotice('Browser Anda tidak mendukung streaming kamera langsung.');
      return;
    }

    let stream: MediaStream | null = null;

    // Attempt 1: with preferred ideal facingMode
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: cameraFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch {
      // Attempt 2: with alternate facingMode
      try {
        const altFacing = cameraFacing === 'environment' ? 'user' : 'environment';
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: altFacing },
          },
          audio: false,
        });
      } catch {
        // Attempt 3: unconstrained generic video
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch {
          stream = null;
        }
      }
    }

    if (!stream) {
      setIsStartingCamera(false);
      setIsCameraActive(false);
      setCameraNotice(
        'Kamera langsung tidak ditemukan atau tidak dapat diakses pada browser ini. Silakan gunakan tombol "Buka Kamera HP / Jepret Foto" di bawah atau pilih foto dari Galeri.'
      );
      return;
    }

    try {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
      setIsStartingCamera(false);
    } catch {
      setIsStartingCamera(false);
      setIsCameraActive(false);
    }
  }, [cameraFacing, stopCamera]);

  // Sync preview when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentPhotoUrl || '');
      setErrorMessage('');
      setCameraNotice('');
      setIsSnapshotCaptured(false);
    } else {
      stopCamera();
    }
  }, [isOpen, currentPhotoUrl, stopCamera]);

  // Handle camera tab activation
  useEffect(() => {
    if (activeTab === 'camera' && isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, isOpen, startCamera, stopCamera]);

  // Flip camera front / back
  const handleToggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture image from video stream
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal if front camera
    if (cameraFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Compress to efficient JPEG data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreviewUrl(dataUrl);
    setIsSnapshotCaptured(true);
    stopCamera();
  };

  const handleRetakeCamera = () => {
    setIsSnapshotCaptured(false);
    startCamera();
  };

  // Compress image helper using HTML5 Canvas
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressed);
        };
        img.onerror = () => reject(new Error('Gagal membaca gambar'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  };

  // Handle file chosen from gallery or native camera capture
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Pilih file berformat gambar (JPG, PNG, WebP).');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    try {
      const compressed = await compressImage(file);
      setPreviewUrl(compressed);
      setIsSnapshotCaptured(true);
      stopCamera();
    } catch {
      setErrorMessage('Terjadi kesalahan saat memproses gambar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Pilih file gambar valid.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    try {
      const compressed = await compressImage(file);
      setPreviewUrl(compressed);
    } catch {
      setErrorMessage('Gagal memproses file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (!previewUrl) {
      setErrorMessage('Pilih atau ambil foto terlebih dahulu sebelum menyimpan.');
      return;
    }
    stopCamera();
    onSavePhoto(previewUrl);
    onClose();
  };

  const handleRemovePhoto = () => {
    setPreviewUrl('');
    stopCamera();
    onSavePhoto('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Hidden native camera capture input for 100% reliable mobile/desktop camera capture */}
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Hidden gallery file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition cursor-pointer"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>

        {/* Modal Header */}
        <div className="mb-4 pr-8">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-bold shadow-xs">
              <i className="fa-solid fa-camera-retro"></i>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-800">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
        </div>

        {/* Source Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('gallery');
              stopCamera();
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-images text-sm text-emerald-600"></i>
            <span>Pilih dari Galeri</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-camera text-sm"></i>
            <span>Kamera & Foto Langsung</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs mb-4 flex items-start space-x-2">
            <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0 text-rose-600"></i>
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: GALLERY UPLOAD */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform flex items-center justify-center text-2xl shadow-xs">
                <i className="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  Klik untuk pilih foto dari galeri
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Atau seret dan lepas file gambar ke sini (JPG, PNG, WebP)
                </p>
              </div>
              <span className="bg-white border border-slate-200 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs group-hover:bg-emerald-700 group-hover:text-white transition">
                Jelajahi Galeri
              </span>
            </div>

            {isProcessing && (
              <div className="text-center text-xs text-emerald-700 font-bold py-2 flex items-center justify-center space-x-2">
                <i className="fa-solid fa-spinner animate-spin"></i>
                <span>Mengompres & memproses foto...</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIVE CAMERA CAPTURE WITH RESILIENT FALLBACK */}
        {activeTab === 'camera' && (
          <div className="space-y-3">
            {isStartingCamera && (
              <div className="bg-slate-900 rounded-2xl aspect-video flex flex-col items-center justify-center text-slate-300 space-y-2 p-6 text-center">
                <i className="fa-solid fa-spinner animate-spin text-2xl text-emerald-400"></i>
                <p className="text-xs font-semibold">Menghubungkan ke kamera perangkat...</p>
              </div>
            )}

            {!isStartingCamera && isCameraActive && !isSnapshotCaptured && (
              <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-slate-800 shadow-inner">
                {/* Live video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
                />

                {/* Camera Top Controls */}
                <div className="absolute top-3 right-3 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleToggleCameraFacing}
                    title="Putar Kamera (Depan / Belakang)"
                    className="bg-slate-950/70 hover:bg-slate-950 text-white w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xs border border-white/20 transition cursor-pointer shadow-md"
                  >
                    <i className="fa-solid fa-camera-rotate text-sm"></i>
                  </button>
                </div>

                {/* Shutter Button Overlay */}
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-2.5 rounded-full shadow-xl transition flex items-center space-x-2 cursor-pointer border-2 border-white/40 hover:scale-105 active:scale-95"
                  >
                    <i className="fa-solid fa-circle-dot text-base animate-pulse"></i>
                    <span>Jepret Foto Sekarang</span>
                  </button>
                </div>

                {/* Viewfinder crosshairs */}
                <div className="absolute inset-8 border border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-400 absolute top-0 left-0 rounded-tl-lg"></div>
                  <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-400 absolute top-0 right-0 rounded-tr-lg"></div>
                  <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-400 absolute bottom-0 left-0 rounded-bl-lg"></div>
                  <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-400 absolute bottom-0 right-0 rounded-br-lg"></div>
                </div>
              </div>
            )}

            {/* When stream cannot be started or device has no direct webcam */}
            {!isStartingCamera && !isCameraActive && !isSnapshotCaptured && (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 sm:p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center text-2xl shadow-xs">
                  <i className="fa-solid fa-camera"></i>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">
                    Ambil Foto Menggunakan Kamera
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                    {cameraNotice ||
                      'Gunakan tombol di bawah untuk membuka aplikasi kamera perangkat Anda secara langsung.'}
                  </p>
                </div>

                <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.02]"
                  >
                    <i className="fa-solid fa-camera"></i>
                    <span>Buka Kamera & Jepret Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs border border-slate-300 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-images text-emerald-600"></i>
                    <span>Pilih dari Galeri</span>
                  </button>
                </div>
              </div>
            )}

            {/* When snapshot was captured */}
            {isSnapshotCaptured && (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                  <i className="fa-solid fa-circle-check text-emerald-600"></i>
                  <span>Foto berhasil diambil:</span>
                </p>
                <div className="relative rounded-2xl overflow-hidden aspect-video border border-slate-200 shadow-md">
                  <img
                    src={previewUrl}
                    alt="Hasil Kamera"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex justify-between items-center pt-1">
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="text-emerald-700 hover:text-emerald-800 font-bold text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <i className="fa-solid fa-camera text-[11px]"></i>
                    <span>Jepret Lagi via Kamera</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRetakeCamera}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-arrows-rotate"></i>
                    <span>Buka Ulang Kamera Live</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Helper button for smartphones */}
            {!isSnapshotCaptured && isCameraActive && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <i className="fa-solid fa-mobile-screen"></i>
                  <span>Atau gunakan aplikasi kamera bawaan ponsel</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Selected Preview Box */}
        {previewUrl && (activeTab === 'gallery' || isSnapshotCaptured) && (
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-600 block">
              Pratinjau Foto Terpilih:
            </span>
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200 shadow-sm">
              <img
                src={previewUrl}
                alt="Pratinjau Foto"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                Siap Disimpan
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {currentPhotoUrl ? (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
            >
              <i className="fa-solid fa-trash-can"></i>
              <span>Hapus Foto (Reset Default)</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center space-x-2 ml-auto">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!previewUrl}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-2 cursor-pointer ${
                previewUrl
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <i className="fa-solid fa-floppy-disk"></i>
              <span>Gunakan & Simpan Foto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
