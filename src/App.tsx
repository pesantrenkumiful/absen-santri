import { useState, useEffect } from 'react';
import {
  LandingCMS,
  Santri,
  Guru,
  AbsensiRecord,
  PelanggaranRecord,
  ChatMessage,
  RoleType,
  ActiveUser,
  AdminCredentials,
} from './types';
import {
  defaultLandingCMS,
  initialSantri,
  initialGuru,
  initialAbsensi,
  initialPelanggaran,
  initialMessages,
} from './data/initialData';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingView } from './components/LandingView';
import { AdminView } from './components/AdminView';
import { GuruView } from './components/GuruView';
import { WaliView } from './components/WaliView';
import { LoginModal } from './components/LoginModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  testConnection,
  seedInitialDataIfEmpty,
  listenToDocument,
  listenToCollection,
  saveCMSToFirestore,
  saveAdminCredentialsToFirestore,
  saveSantriToFirestore,
  deleteSantriFromFirestore,
  saveGuruToFirestore,
  deleteGuruFromFirestore,
  saveBatchAbsensiToFirestore,
  savePelanggaranToFirestore,
  deletePelanggaranFromFirestore,
  saveMessageToFirestore,
  markMessagesReadInFirestore,
} from './firebase';

export default function App() {
  // Persisted state with local storage fallbacks
  const [cms, setCms] = useState<LandingCMS>(() => {
    try {
      const stored = localStorage.getItem('sipondok_cms');
      return stored ? JSON.parse(stored) : defaultLandingCMS;
    } catch {
      return defaultLandingCMS;
    }
  });

  const [santris, setSantris] = useState<Santri[]>(() => {
    try {
      const stored = localStorage.getItem('sipondok_santris');
      return stored ? JSON.parse(stored) : initialSantri;
    } catch {
      return initialSantri;
    }
  });

  const [gurus, setGurus] = useState<Guru[]>(() => {
    try {
      const stored = localStorage.getItem('sipondok_gurus');
      return stored ? JSON.parse(stored) : initialGuru;
    } catch {
      return initialGuru;
    }
  });

  const [absensis, setAbsensis] = useState<AbsensiRecord[]>(() => {
    try {
      const stored = localStorage.getItem('sipondok_absensis');
      return stored ? JSON.parse(stored) : initialAbsensi;
    } catch {
      return initialAbsensi;
    }
  });

  const [pelanggarans, setPelanggarans] = useState<PelanggaranRecord[]>(() => {
    try {
      const stored = localStorage.getItem('sipondok_pelanggarans');
      return stored ? JSON.parse(stored) : initialPelanggaran;
    } catch {
      return initialPelanggaran;
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem('sipondok_messages');
      return stored ? JSON.parse(stored) : initialMessages;
    } catch {
      return initialMessages;
    }
  });

  // Admin Credentials State (Editable & Persisted)
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>(() => {
    try {
      const stored = localStorage.getItem('sipondok_admin_credentials');
      return stored
        ? JSON.parse(stored)
        : { username: 'admin', pass: 'admin123', name: 'Administrator Utama' };
    } catch {
      return { username: 'admin', pass: 'admin123', name: 'Administrator Utama' };
    }
  });

  useEffect(() => {
    localStorage.setItem('sipondok_admin_credentials', JSON.stringify(adminCredentials));
  }, [adminCredentials]);

  // Active Session State
  const [currentUser, setCurrentUser] = useState<ActiveUser | null>(() => {
    try {
      const stored = localStorage.getItem('sipondok_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Modal dialog states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<RoleType>('admin');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Confirm dialog state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Firebase connection state
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // Initialize and synchronize with Firebase Firestore
  useEffect(() => {
    let unsubCMS: (() => void) | undefined;
    let unsubAdmin: (() => void) | undefined;
    let unsubSantris: (() => void) | undefined;
    let unsubGurus: (() => void) | undefined;
    let unsubAbsensis: (() => void) | undefined;
    let unsubPelanggarans: (() => void) | undefined;
    let unsubMessages: (() => void) | undefined;

    async function setupFirebaseSync() {
      try {
        const connected = await testConnection();
        setIsFirebaseConnected(connected);

        if (connected) {
          // Seed initial data if Firestore collections are empty
          await seedInitialDataIfEmpty({
            cms,
            adminCredentials,
            santris,
            gurus,
            absensis,
            pelanggarans,
            messages,
          });

          // Subscribe to CMS settings
          unsubCMS = listenToDocument<LandingCMS>('settings', 'cms', (cloudCms) => {
            if (cloudCms) setCms(cloudCms);
          });

          // Subscribe to Admin credentials
          unsubAdmin = listenToDocument<AdminCredentials>('settings', 'adminCredentials', (cloudCreds) => {
            if (cloudCreds) setAdminCredentials(cloudCreds);
          });

          // Subscribe to Santris
          unsubSantris = listenToCollection<Santri>('santris', (cloudSantris) => {
            if (cloudSantris && cloudSantris.length > 0) {
              setSantris(cloudSantris.sort((a, b) => a.id - b.id));
            }
          });

          // Subscribe to Gurus
          unsubGurus = listenToCollection<Guru>('gurus', (cloudGurus) => {
            if (cloudGurus && cloudGurus.length > 0) {
              setGurus(cloudGurus.sort((a, b) => a.id - b.id));
            }
          });

          // Subscribe to Absensis
          unsubAbsensis = listenToCollection<AbsensiRecord>('absensis', (cloudAbsensis) => {
            if (cloudAbsensis && cloudAbsensis.length > 0) {
              setAbsensis(cloudAbsensis.sort((a, b) => a.id - b.id));
            }
          });

          // Subscribe to Pelanggarans
          unsubPelanggarans = listenToCollection<PelanggaranRecord>('pelanggarans', (cloudPel) => {
            if (cloudPel && cloudPel.length > 0) {
              setPelanggarans(cloudPel.sort((a, b) => b.id - a.id));
            }
          });

          // Subscribe to Messages
          unsubMessages = listenToCollection<ChatMessage>('messages', (cloudMsgs) => {
            if (cloudMsgs && cloudMsgs.length > 0) {
              setMessages(cloudMsgs.sort((a, b) => a.id - b.id));
            }
          });
        }
      } catch (err) {
        console.warn('Firebase initial sync note:', err);
      }
    }

    setupFirebaseSync();

    return () => {
      unsubCMS?.();
      unsubAdmin?.();
      unsubSantris?.();
      unsubGurus?.();
      unsubAbsensis?.();
      unsubPelanggarans?.();
      unsubMessages?.();
    };
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('sipondok_cms', JSON.stringify(cms));
  }, [cms]);

  useEffect(() => {
    localStorage.setItem('sipondok_santris', JSON.stringify(santris));
  }, [santris]);

  useEffect(() => {
    localStorage.setItem('sipondok_gurus', JSON.stringify(gurus));
  }, [gurus]);

  useEffect(() => {
    localStorage.setItem('sipondok_absensis', JSON.stringify(absensis));
  }, [absensis]);

  useEffect(() => {
    localStorage.setItem('sipondok_pelanggarans', JSON.stringify(pelanggarans));
  }, [pelanggarans]);

  useEffect(() => {
    localStorage.setItem('sipondok_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sipondok_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('sipondok_current_user');
    }
  }, [currentUser]);

  // Toast trigger
  const showToast = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Confirm dialog helper
  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Login handler
  const handleOpenLogin = (role: RoleType) => {
    setLoginRole(role);
    setIsLoginModalOpen(true);
  };

  const handleLoginSubmit = (u: string, p: string) => {
    if (loginRole === 'admin') {
      if (u === adminCredentials.username && p === adminCredentials.pass) {
        const user: ActiveUser = { role: 'admin', name: adminCredentials.name || 'Administrator Utama' };
        setCurrentUser(user);
        setIsLoginModalOpen(false);
        showToast('Berhasil masuk sebagai Admin Pondok', 'success');
      } else {
        showToast('Username atau Kata Sandi Admin tidak sesuai. Akses ditolak.', 'error');
      }
    } else if (loginRole === 'guru') {
      const found = gurus.find((g) => g.username === u && g.pass === p);
      if (found) {
        const user: ActiveUser = { role: 'guru', id: found.id, name: found.nama, data: found };
        setCurrentUser(user);
        setIsLoginModalOpen(false);
        showToast(`Selamat datang, ${found.nama}`, 'success');
      } else {
        showToast('Username atau Password Guru tidak sesuai!', 'error');
      }
    } else if (loginRole === 'wali') {
      const found = santris.find((s) => s.nis === u && s.passWali === p);
      if (found) {
        const user: ActiveUser = { role: 'wali', id: found.id, name: found.nama, data: found };
        setCurrentUser(user);
        setIsLoginModalOpen(false);
        showToast(`Selamat datang Wali Santri dari ${found.nama}`, 'success');
      } else {
        showToast('NIS Santri atau Password Wali tidak sesuai!', 'error');
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Anda telah keluar dari sistem.', 'info');
  };

  // CMS update with Firestore sync
  const handleUpdateCMS = (newCms: LandingCMS) => {
    setCms(newCms);
    saveCMSToFirestore(newCms);
    showToast('Tampilan Halaman Depan (CMS) berhasil disimpan ke Cloud!', 'success');
  };

  // Santri Management with Firestore sync
  const handleAddSantri = (newS: Omit<Santri, 'id'>) => {
    const nextId = santris.length > 0 ? Math.max(...santris.map((s) => s.id)) + 1 : 1;
    const santriObj: Santri = { ...newS, id: nextId };
    setSantris((prev) => [...prev, santriObj]);
    saveSantriToFirestore(santriObj);
  };

  const handleEditSantri = (updated: Santri) => {
    setSantris((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    saveSantriToFirestore(updated);
    // If logged in as this wali, sync session
    if (currentUser?.role === 'wali' && currentUser.id === updated.id) {
      setCurrentUser({ ...currentUser, name: updated.nama, data: updated });
    }
  };

  const handleDeleteSantri = (id: number) => {
    setSantris((prev) => prev.filter((s) => s.id !== id));
    deleteSantriFromFirestore(id);
  };

  // Guru Management with Firestore sync
  const handleAddGuru = (newG: Omit<Guru, 'id'>) => {
    const nextId = gurus.length > 0 ? Math.max(...gurus.map((g) => g.id)) + 1 : 1;
    const guruObj: Guru = { ...newG, id: nextId };
    setGurus((prev) => [...prev, guruObj]);
    saveGuruToFirestore(guruObj);
  };

  const handleEditGuru = (updated: Guru) => {
    setGurus((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    saveGuruToFirestore(updated);
    if (currentUser?.role === 'guru' && currentUser.id === updated.id) {
      setCurrentUser({ ...currentUser, name: updated.nama, data: updated });
    }
  };

  const handleDeleteGuru = (id: number) => {
    setGurus((prev) => prev.filter((g) => g.id !== id));
    deleteGuruFromFirestore(id);
  };

  // Reset password Wali
  const handleResetWaliPass = (santriId: number, newPass: string) => {
    setSantris((prev) =>
      prev.map((s) => {
        if (s.id === santriId) {
          const updated = { ...s, passWali: newPass };
          saveSantriToFirestore(updated);
          return updated;
        }
        return s;
      })
    );
  };

  // Update Wali Account (both Username/NIS and Password)
  const handleUpdateWaliAccount = (santriId: number, newNis: string, newPass: string): boolean => {
    const trimmedNis = newNis.trim();
    const trimmedPass = newPass.trim();

    if (!trimmedNis || !trimmedPass) {
      showToast('NIS dan Kata Sandi tidak boleh kosong!', 'warning');
      return false;
    }

    const duplicate = santris.some(
      (s) => s.id !== santriId && s.nis.toLowerCase() === trimmedNis.toLowerCase()
    );
    if (duplicate) {
      showToast(`NIS / Username "${trimmedNis}" sudah digunakan oleh santri lain!`, 'error');
      return false;
    }

    setSantris((prev) =>
      prev.map((s) => {
        if (s.id === santriId) {
          const updated = { ...s, nis: trimmedNis, passWali: trimmedPass };
          saveSantriToFirestore(updated);
          return updated;
        }
        return s;
      })
    );
    showToast('Username (NIS) dan Kata Sandi Wali Santri berhasil diperbarui di Cloud!', 'success');
    return true;
  };

  // Update Admin Credentials (Username, Password, Name)
  const handleUpdateAdminCredentials = (newCreds: AdminCredentials) => {
    setAdminCredentials(newCreds);
    saveAdminCredentialsToFirestore(newCreds);
    if (currentUser?.role === 'admin') {
      setCurrentUser((prev) => (prev ? { ...prev, name: newCreds.name } : prev));
    }
    showToast('Kredensial Admin (Username & Kata Sandi) berhasil diperbarui di Cloud!', 'success');
  };

  // Guru changes own password
  const handleUpdateGuruPassword = (newPass: string) => {
    if (currentUser?.role === 'guru' && currentUser.id) {
      setGurus((prev) =>
        prev.map((g) => {
          if (g.id === currentUser.id) {
            const updated = { ...g, pass: newPass };
            saveGuruToFirestore(updated);
            return updated;
          }
          return g;
        })
      );
    }
  };

  // Wali changes own password
  const handleUpdateWaliPassword = (newPass: string) => {
    if (currentUser?.role === 'wali' && currentUser.id) {
      setSantris((prev) =>
        prev.map((s) => {
          if (s.id === currentUser.id) {
            const updated = { ...s, passWali: newPass };
            saveSantriToFirestore(updated);
            return updated;
          }
          return s;
        })
      );
    }
  };

  // Batch attendance saving with Firestore sync
  const handleSaveBatchAbsensi = (
    records: { santriId: number; tanggal: string; status: 'H' | 'S' | 'I' | 'A' }[]
  ) => {
    const toSave: AbsensiRecord[] = [];
    setAbsensis((prev) => {
      let updated = [...prev];
      records.forEach((rec) => {
        const idx = updated.findIndex(
          (a) => a.santriId === rec.santriId && a.tanggal === rec.tanggal
        );
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], status: rec.status };
          toSave.push(updated[idx]);
        } else {
          const newId = updated.length > 0 ? Math.max(...updated.map((a) => a.id)) + 1 : 1;
          const newRec: AbsensiRecord = {
            id: newId,
            santriId: rec.santriId,
            tanggal: rec.tanggal,
            status: rec.status,
          };
          updated.push(newRec);
          toSave.push(newRec);
        }
      });
      return updated;
    });
    if (toSave.length > 0) {
      saveBatchAbsensiToFirestore(toSave);
    }
  };

  // Pelanggaran with Firestore sync
  const handleAddPelanggaran = (p: Omit<PelanggaranRecord, 'id'>) => {
    const nextId = pelanggarans.length > 0 ? Math.max(...pelanggarans.map((x) => x.id)) + 1 : 1;
    const newRecord: PelanggaranRecord = { ...p, id: nextId };
    setPelanggarans((prev) => [...prev, newRecord]);
    savePelanggaranToFirestore(newRecord);
  };

  const handleDeletePelanggaran = (id: number) => {
    setPelanggarans((prev) => prev.filter((p) => p.id !== id));
    deletePelanggaranFromFirestore(id);
  };

  // Chat message sending with Firestore sync
  const handleAdminSendMessage = (santriId: number, text: string) => {
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const nextId = messages.length > 0 ? Math.max(...messages.map((m) => m.id)) + 1 : 1;

    const newMsg: ChatMessage = {
      id: nextId,
      santriId,
      senderRole: 'admin',
      recipientRole: 'wali',
      recipientId: santriId,
      text,
      time: timeStr,
      readByAdmin: true,
      readByGuru: true,
      readByWali: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    saveMessageToFirestore(newMsg);
  };

  const handleGuruSendMessage = (santriId: number, text: string) => {
    if (!currentUser || currentUser.role !== 'guru' || !currentUser.id) return;
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const nextId = messages.length > 0 ? Math.max(...messages.map((m) => m.id)) + 1 : 1;

    const newMsg: ChatMessage = {
      id: nextId,
      santriId,
      senderRole: 'guru',
      recipientRole: 'wali',
      recipientId: santriId,
      text,
      time: timeStr,
      readByAdmin: false,
      readByGuru: true,
      readByWali: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    saveMessageToFirestore(newMsg);
  };

  const handleWaliSendMessage = (
    recipientRole: 'admin' | 'guru',
    recipientId: number,
    text: string
  ) => {
    if (!currentUser || currentUser.role !== 'wali' || !currentUser.id) return;
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const nextId = messages.length > 0 ? Math.max(...messages.map((m) => m.id)) + 1 : 1;

    const newMsg: ChatMessage = {
      id: nextId,
      santriId: currentUser.id,
      senderRole: 'wali',
      recipientRole,
      recipientId,
      text,
      time: timeStr,
      readByAdmin: false,
      readByGuru: false,
      readByWali: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    saveMessageToFirestore(newMsg);
  };

  const handleMarkMessagesRead = (santriId: number) => {
    const unreadIds = messages
      .filter((m) => m.santriId === santriId && (!m.readByAdmin || !m.readByGuru))
      .map((m) => m.id);

    setMessages((prev) =>
      prev.map((m) => (m.santriId === santriId ? { ...m, readByAdmin: true, readByGuru: true } : m))
    );
    if (unreadIds.length > 0) {
      markMessagesReadInFirestore(unreadIds, currentUser?.role === 'guru' ? 'guru' : 'admin');
    }
  };

  // Find active teacher object for GuruView
  const currentGuruData =
    currentUser?.role === 'guru'
      ? gurus.find((g) => g.id === currentUser.id) || gurus[0]
      : null;

  // Find active student object for WaliView
  const currentSantriData =
    currentUser?.role === 'wali'
      ? santris.find((s) => s.id === currentUser.id) || santris[0]
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Top Header */}
      <Header
        cms={cms}
        currentUser={currentUser}
        isFirebaseConnected={isFirebaseConnected}
        onOpenApiKey={() => setIsApiKeyModalOpen(true)}
        onLogout={handleLogout}
        onSwitchRole={() => setCurrentUser(null)}
      />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!currentUser && (
          <LandingView cms={cms} onSelectRole={handleOpenLogin} />
        )}

        {currentUser?.role === 'admin' && (
          <AdminView
            cms={cms}
            onUpdateCMS={handleUpdateCMS}
            santris={santris}
            onAddSantri={handleAddSantri}
            onEditSantri={handleEditSantri}
            onDeleteSantri={handleDeleteSantri}
            gurus={gurus}
            onAddGuru={handleAddGuru}
            onEditGuru={handleEditGuru}
            onDeleteGuru={handleDeleteGuru}
            onResetWaliPass={handleResetWaliPass}
            onUpdateWaliAccount={handleUpdateWaliAccount}
            adminCredentials={adminCredentials}
            onUpdateAdminCredentials={handleUpdateAdminCredentials}
            absensis={absensis}
            pelanggarans={pelanggarans}
            onDeletePelanggaran={handleDeletePelanggaran}
            messages={messages}
            onSendMessage={handleAdminSendMessage}
            onMarkMessagesRead={handleMarkMessagesRead}
            onShowToast={showToast}
            onConfirm={openConfirm}
          />
        )}

        {currentUser?.role === 'guru' && currentGuruData && (
          <GuruView
            currentGuru={currentGuruData}
            santris={santris}
            absensis={absensis}
            onSaveBatchAbsensi={handleSaveBatchAbsensi}
            pelanggarans={pelanggarans}
            onAddPelanggaran={handleAddPelanggaran}
            messages={messages}
            onSendMessage={handleGuruSendMessage}
            onMarkMessagesRead={handleMarkMessagesRead}
            onUpdateGuruPassword={handleUpdateGuruPassword}
            onShowToast={showToast}
          />
        )}

        {currentUser?.role === 'wali' && currentSantriData && (
          <WaliView
            currentSantri={currentSantriData}
            gurus={gurus}
            absensis={absensis}
            pelanggarans={pelanggarans}
            messages={messages}
            onSendMessage={handleWaliSendMessage}
            onUpdateWaliPassword={handleUpdateWaliPassword}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <Footer cms={cms} />

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        role={loginRole}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLoginSubmit}
        gurus={gurus}
        santris={santris}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={(key) => {
          if (key) {
            localStorage.setItem('gemini_api_key', key);
            showToast('API Key Google AI Studio berhasil disimpan!', 'success');
          } else {
            showToast('Kembali ke koneksi AI server default.', 'info');
          }
        }}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
