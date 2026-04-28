import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Simple diagnostic check
if (!firebaseConfig.apiKey) {
  console.warn("Firebase API Key is missing. Please add VITE_FIREBASE_API_KEY to the app settings.");
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

function sanitizeData(data: any): any {
  return JSON.parse(JSON.stringify(data, (_, value) => (value === undefined ? null : value)));
}

export function subscribeToLeads(callback: (leads: any[]) => void) {
  const leadsRef = collection(db, 'leads');
  const q = query(leadsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const leads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(leads);
  }, (error) => {
    console.error("Error subscribing to leads:", error);
  });
}

export async function saveLead(leadData: any) {
  try {
    // 1. Save to Firebase
    const leadsRef = collection(db, 'leads');
    await addDoc(leadsRef, {
      ...sanitizeData(leadData),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log("Lead saved successfully to Firebase");

    // 2. Sync with Google Sheets backend
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData)
    }).catch(e => console.error("Sheets Sync Error:", e));

  } catch (error) {
    console.error("Error saving lead to Firebase:", error);
    // Fallback to local storage if Firebase fails
    const leads = JSON.parse(localStorage.getItem('car_leads') || '[]');
    leads.push({ ...leadData, createdAt: new Date().toISOString(), fallback: true });
    localStorage.setItem('car_leads', JSON.stringify(leads));
  }
}

export async function saveChatSession(userId: string, messages: any[]) {
  try {
    const chatRef = doc(db, 'chats', userId);
    await setDoc(chatRef, {
      userId,
      messages: sanitizeData(messages),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving chat session:", error);
  }
}

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}
