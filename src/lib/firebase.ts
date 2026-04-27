import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

let firebaseApp: any = null;
let firestoreDb: any = null;
let firebaseAuth: any = null;

async function ensureInitialized() {
  if (firebaseApp) return;

  try {
    const response = await fetch('/firebase-applet-config.json');
    if (response.ok) {
      const config = await response.json();
      firebaseApp = initializeApp(config);
      firestoreDb = getFirestore(firebaseApp);
      firebaseAuth = getAuth(firebaseApp);
    }
  } catch (e) {
    console.warn("Firebase config not found or invalid. Leads initialized in mock mode.");
  }
}

export const googleProvider = new GoogleAuthProvider();

export async function getFirebaseDb() {
  await ensureInitialized();
  return firestoreDb;
}

export async function getFirebaseAuth() {
  await ensureInitialized();
  return firebaseAuth;
}

export async function saveLead(leadData: any) {
  await ensureInitialized();
  if (!firestoreDb) {
    console.log("Local lead storage (No Firebase):", leadData);
    // You could also save to localStorage here
    const leads = JSON.parse(localStorage.getItem('car_leads') || '[]');
    leads.push({ ...leadData, createdAt: new Date().toISOString() });
    localStorage.setItem('car_leads', JSON.stringify(leads));
    return;
  }
  
  try {
    await addDoc(collection(firestoreDb, 'leads'), {
      ...leadData,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error saving lead:", error);
  }
}

export async function loginWithGoogle() {
  await ensureInitialized();
  if (!firebaseAuth) throw new Error("Firebase Auth not initialized");
  return signInWithPopup(firebaseAuth, googleProvider);
}
