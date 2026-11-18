import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  LandingCMS,
  Santri,
  Guru,
  AbsensiRecord,
  PelanggaranRecord,
  ChatMessage,
  AdminCredentials,
} from './types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID as required
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test as required by skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase is offline. Local cache will be used.');
    }
    return false;
  }
}

// CMS Persistence
export async function saveCMSToFirestore(cms: LandingCMS) {
  const path = 'settings/cms';
  try {
    await setDoc(doc(db, 'settings', 'cms'), cms, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Admin Credentials Persistence
export async function saveAdminCredentialsToFirestore(creds: AdminCredentials) {
  const path = 'settings/adminCredentials';
  try {
    await setDoc(doc(db, 'settings', 'adminCredentials'), creds, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Santri Persistence
export async function saveSantriToFirestore(santri: Santri) {
  const path = `santris/${santri.id}`;
  try {
    const cleanSantri = Object.fromEntries(
      Object.entries(santri).filter(([, value]) => value !== undefined && value !== '')
    );
    await setDoc(doc(db, 'santris', String(santri.id)), cleanSantri);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteSantriFromFirestore(santriId: number) {
  const path = `santris/${santriId}`;
  try {
    await deleteDoc(doc(db, 'santris', String(santriId)));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Guru Persistence
export async function saveGuruToFirestore(guru: Guru) {
  const path = `gurus/${guru.id}`;
  try {
    await setDoc(doc(db, 'gurus', String(guru.id)), guru, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteGuruFromFirestore(guruId: number) {
  const path = `gurus/${guruId}`;
  try {
    await deleteDoc(doc(db, 'gurus', String(guruId)));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Absensi Persistence
export async function saveBatchAbsensiToFirestore(records: AbsensiRecord[]) {
  const path = 'absensis';
  try {
    const batch = writeBatch(db);
    records.forEach((rec) => {
      const docRef = doc(db, 'absensis', String(rec.id));
      batch.set(docRef, rec, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Pelanggaran Persistence
export async function savePelanggaranToFirestore(p: PelanggaranRecord) {
  const path = `pelanggarans/${p.id}`;
  try {
    await setDoc(doc(db, 'pelanggarans', String(p.id)), p, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deletePelanggaranFromFirestore(id: number) {
  const path = `pelanggarans/${id}`;
  try {
    await deleteDoc(doc(db, 'pelanggarans', String(id)));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Chat Messages Persistence
export async function saveMessageToFirestore(msg: ChatMessage) {
  const path = `messages/${msg.id}`;
  try {
    await setDoc(doc(db, 'messages', String(msg.id)), msg, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function markMessagesReadInFirestore(messageIds: number[], role: 'admin' | 'guru' | 'wali') {
  if (messageIds.length === 0) return;
  const path = 'messages';
  try {
    const batch = writeBatch(db);
    messageIds.forEach((id) => {
      const docRef = doc(db, 'messages', String(id));
      if (role === 'admin') batch.update(docRef, { readByAdmin: true });
      if (role === 'guru') batch.update(docRef, { readByGuru: true });
      if (role === 'wali') batch.update(docRef, { readByWali: true });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Realtime listeners
export function listenToCollection<T>(
  collectionName: string,
  onData: (items: T[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, collectionName),
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as T);
      });
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, collectionName);
      if (onError) onError(err);
    }
  );
}

export function listenToDocument<T>(
  collectionName: string,
  docId: string,
  onData: (data: T | null) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    doc(db, collectionName, docId),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as T);
      } else {
        onData(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `${collectionName}/${docId}`);
      if (onError) onError(err);
    }
  );
}

// Initial Data Seeder (only if Firestore is empty)
export async function seedInitialDataIfEmpty(data: {
  cms: LandingCMS;
  adminCredentials: AdminCredentials;
  santris: Santri[];
  gurus: Guru[];
  absensis: AbsensiRecord[];
  pelanggarans: PelanggaranRecord[];
  messages: ChatMessage[];
}) {
  try {
    // Check if CMS exists
    const cmsSnap = await getDoc(doc(db, 'settings', 'cms'));
    if (!cmsSnap.exists()) {
      await setDoc(doc(db, 'settings', 'cms'), data.cms);
    }

    // Check admin credentials
    const adminSnap = await getDoc(doc(db, 'settings', 'adminCredentials'));
    if (!adminSnap.exists()) {
      await setDoc(doc(db, 'settings', 'adminCredentials'), data.adminCredentials);
    }

    // Check santris
    const santriSnap = await getDocs(collection(db, 'santris'));
    if (santriSnap.empty && data.santris.length > 0) {
      const batch = writeBatch(db);
      data.santris.forEach((s) => {
        batch.set(doc(db, 'santris', String(s.id)), s);
      });
      await batch.commit();
    }

    // Check gurus
    const guruSnap = await getDocs(collection(db, 'gurus'));
    if (guruSnap.empty && data.gurus.length > 0) {
      const batch = writeBatch(db);
      data.gurus.forEach((g) => {
        batch.set(doc(db, 'gurus', String(g.id)), g);
      });
      await batch.commit();
    }

    // Check absensis
    const absenSnap = await getDocs(collection(db, 'absensis'));
    if (absenSnap.empty && data.absensis.length > 0) {
      const batch = writeBatch(db);
      data.absensis.forEach((a) => {
        batch.set(doc(db, 'absensis', String(a.id)), a);
      });
      await batch.commit();
    }

    // Check pelanggarans
    const pelSnap = await getDocs(collection(db, 'pelanggarans'));
    if (pelSnap.empty && data.pelanggarans.length > 0) {
      const batch = writeBatch(db);
      data.pelanggarans.forEach((p) => {
        batch.set(doc(db, 'pelanggarans', String(p.id)), p);
      });
      await batch.commit();
    }

    // Check messages
    const msgSnap = await getDocs(collection(db, 'messages'));
    if (msgSnap.empty && data.messages.length > 0) {
      const batch = writeBatch(db);
      data.messages.forEach((m) => {
        batch.set(doc(db, 'messages', String(m.id)), m);
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Initial seeding note:', err);
  }
}
