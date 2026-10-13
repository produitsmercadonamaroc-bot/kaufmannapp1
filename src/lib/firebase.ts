import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { AutoProduct, InvoiceDocument, AppUser } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyAnIz-P_KI1FCzhHuD_mvaQ55jbUUEJlGc",
  authDomain: "kaufmann-projet.firebaseapp.com",
  projectId: "kaufmann-projet",
  storageBucket: "kaufmann-projet.firebasestorage.app",
  messagingSenderId: "274359009734",
  appId: "1:274359009734:web:049962d851b87ce6a072c7",
  measurementId: "G-5MC1N8NP2X",
};

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Firestore collection names
export const PRODUCTS_COLLECTION = 'products';
export const INVOICES_COLLECTION = 'invoices';
export const USERS_COLLECTION = 'users';
export const LOGINS_COLLECTION = 'logins';

// Helper to remove any undefined values so Firestore does not reject documents
function cleanFirestoreData<T>(obj: T): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(cleanFirestoreData);
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Test reading and writing to Firestore to diagnose permission/rules status
 */
export async function testFirestoreConnection(): Promise<{
  success: boolean;
  code?: string;
  message?: string;
}> {
  try {
    const testDoc = doc(db, '_connection_test', 'status');
    await setDoc(testDoc, {
      lastTest: new Date().toISOString(),
      connected: true,
      app: 'EL HAJI AUTO',
    });
    return { success: true };
  } catch (error: any) {
    console.warn('Firestore connection check notice:', error?.code || error?.message);
    return {
      success: false,
      code: error?.code || 'unknown',
      message: error?.message || String(error),
    };
  }
}

// Products operations
export async function saveProductToFirestore(product: AutoProduct): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
  const data = cleanFirestoreData({
    ...product,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(docRef, data, { merge: true });
}

export async function updateProductStockInFirestore(
  productId: string,
  stockQuantity: number,
  priceMAD?: number
): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  const data: Record<string, any> = {
    stockQuantity,
    status: stockQuantity > 0 ? 'in_stock' : 'out_of_stock',
    updatedAt: new Date().toISOString(),
  };
  if (priceMAD !== undefined) {
    data.priceMAD = priceMAD;
  }
  await updateDoc(docRef, cleanFirestoreData(data));
}

export async function updateProductImageInFirestore(
  productId: string,
  imageUrl: string
): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await updateDoc(docRef, {
    imageUrl,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await deleteDoc(docRef);
}

// Invoices operations
export async function saveInvoiceToFirestore(invoice: InvoiceDocument): Promise<void> {
  const docRef = doc(db, INVOICES_COLLECTION, invoice.id);
  const data = cleanFirestoreData({
    ...invoice,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(docRef, data, { merge: true });
}

export async function updateInvoiceStatusInFirestore(
  invoiceId: string,
  status: 'PAYÉ' | 'EN_ATTENTE'
): Promise<void> {
  const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
  await updateDoc(docRef, {
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteInvoiceFromFirestore(invoiceId: string): Promise<void> {
  const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
  await deleteDoc(docRef);
}

/**
 * Synchronize all local products and invoices into Firestore
 */
export async function syncAllToFirestore(
  products: AutoProduct[],
  invoices: InvoiceDocument[]
): Promise<{
  success: boolean;
  productsSynced: number;
  invoicesSynced: number;
  error?: string;
  code?: string;
}> {
  try {
    let pCount = 0;
    for (const prod of products) {
      await saveProductToFirestore(prod);
      pCount++;
    }

    let iCount = 0;
    for (const inv of invoices) {
      await saveInvoiceToFirestore(inv);
      iCount++;
    }

    return {
      success: true,
      productsSynced: pCount,
      invoicesSynced: iCount,
    };
  } catch (error: any) {
    return {
      success: false,
      productsSynced: 0,
      invoicesSynced: 0,
      code: error?.code,
      error: error?.message || 'Erreur lors de la synchronisation',
    };
  }
}

// -------------------------------------------------------------
// USER AUTHENTICATION & FIRESTORE DATABASE PERSISTENCE
// -------------------------------------------------------------

export const DEFAULT_ADMIN_EMAIL = 'elhajiauto@gmail.com';
export const DEFAULT_ADMIN_PASS = 'Mrd.0658629841';
export const STORAGE_SESSION_KEY = 'kaufmann_elhaji_user_session';

/**
 * Persist user record in Firebase Firestore database
 */
export async function saveUserToFirestore(user: AppUser): Promise<boolean> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, user.uid);
    const data = cleanFirestoreData({
      ...user,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(userDocRef, data, { merge: true });

    // Also store alias document for easy lookup
    const aliasRef = doc(db, USERS_COLLECTION, 'admin_elhajiauto');
    await setDoc(aliasRef, data, { merge: true });

    // Also log this session into the logins collection in Firestore
    try {
      const loginDocRef = doc(db, LOGINS_COLLECTION, `${user.uid}_${Date.now()}`);
      await setDoc(loginDocRef, {
        uid: user.uid,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        timestamp: new Date().toISOString(),
        device: typeof navigator !== 'undefined' ? navigator.userAgent : 'Navigateur Web',
      });
    } catch {
      // Continue even if logging collection has permission restriction
    }

    return true;
  } catch (error) {
    console.warn('Notice saving user profile to Firestore:', error);
    return false;
  }
}

/**
 * Authenticate EL HAJI AUTO admin with Firebase Auth and sync to Firestore
 */
export async function authenticateUser(
  email: string,
  pass: string
): Promise<{
  success: boolean;
  user?: AppUser;
  error?: string;
  firebaseAuthStatus?: 'authenticated' | 'created' | 'fallback';
  firestoreSyncStatus?: boolean;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const isMasterUser =
    cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase() && pass === DEFAULT_ADMIN_PASS;

  let firebaseUser: FirebaseUser | null = null;
  let authStatus: 'authenticated' | 'created' | 'fallback' = 'fallback';

  // 1. Attempt Firebase Authentication
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    firebaseUser = cred.user;
    authStatus = 'authenticated';
  } catch (signInErr: any) {
    const errCode = signInErr?.code || '';
    // If account not yet registered in Firebase Auth, automatically create it!
    if (
      errCode === 'auth/user-not-found' ||
      errCode === 'auth/invalid-credential' ||
      errCode === 'auth/invalid-login-credentials'
    ) {
      try {
        const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        firebaseUser = newCred.user;
        authStatus = 'created';
      } catch (createErr: any) {
        console.warn('Firebase Auth user creation notice:', createErr?.code || createErr);
      }
    } else {
      console.warn('Firebase Auth sign in notice:', errCode);
    }
  }

  // 2. Validate user identity
  if (firebaseUser || isMasterUser) {
    const uid = firebaseUser ? firebaseUser.uid : 'elhaji_auto_admin_uid';
    const appUser: AppUser = {
      uid,
      email: cleanEmail,
      displayName: 'EL HAJI AUTO',
      role: 'admin',
      phone: '0658629841',
      city: 'Tanger',
      garageName: 'GARAGE AUTO EL HAJI',
      lastLoginAt: new Date().toISOString(),
      createdAt: '2025-01-01T00:00:00.000Z',
      isFirebaseSynced: false,
    };

    // 3. Save to Firestore database collection 'users'
    const firestoreSaved = await saveUserToFirestore(appUser);
    appUser.isFirebaseSynced = firestoreSaved;

    // 4. Save local session cache
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(appUser));
    } catch (e) {
      // ignore
    }

    return {
      success: true,
      user: appUser,
      firebaseAuthStatus: authStatus,
      firestoreSyncStatus: firestoreSaved,
    };
  }

  return {
    success: false,
    error: 'Identifiants incorrects. Veuillez saisir le mot de passe valide pour elhajiauto@gmail.com.',
  };
}

/**
 * Log out and clear active session
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Firebase signOut notice:', e);
  }
  try {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  } catch (e) {
    // ignore
  }
}

/**
 * Retrieve saved user session from localStorage
 */
export function getStoredUserSession(): AppUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
