import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: any;
let db: any;
let auth: any;
let googleProvider: any;

// Diagnostic helper to show exactly what's missing in a user-friendly way
const missingEnvVars = [];
if (!firebaseConfig.apiKey) missingEnvVars.push("VITE_FIREBASE_API_KEY");
if (!firebaseConfig.authDomain) missingEnvVars.push("VITE_FIREBASE_AUTH_DOMAIN");
if (!firebaseConfig.projectId) missingEnvVars.push("VITE_FIREBASE_PROJECT_ID");

if (missingEnvVars.length > 0) {
  console.warn("⚠️ Firebase incompleto. Añade estas variables en 'Settings' (icono de engranaje):", missingEnvVars.join(", "));
}

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    // Use environment variable for DB ID, or fallback to standard (default)
    const databaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)';
    db = getFirestore(app, databaseId);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  }
} catch (e) {
  console.error("Firebase init error:", e);
}

export { db, auth, googleProvider };

function sanitizeData(data: any): any {
  return JSON.parse(JSON.stringify(data, (_, value) => (value === undefined ? null : value)));
}

export function subscribeToLeads(callback: (leads: any[]) => void) {
  if (!db) {
    console.error("Firebase no está inicializado.");
    return () => {};
  }
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
  const data = sanitizeData(leadData);
  
  // 1. Always attempt Sheets Sync (Fast & Indirect)
  fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(async res => {
    const result = await res.json();
    console.log("Sheets Sync Result:", result);
  }).catch(e => console.error("Sheets Sync Error:", e));

  // 2. Attempt Firebase if configured
  try {
    if (db) {
      const leadsRef = collection(db, 'leads');
      await addDoc(leadsRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log("Lead saved successfully to Firebase");
    }
  } catch (error) {
    console.error("Firebase save failed:", error);
  }

  // 3. Always fallback to local storage for Redundancy
  const leads = JSON.parse(localStorage.getItem('car_leads') || '[]');
  leads.push({ ...data, createdAt: new Date().toISOString() });
  localStorage.setItem('car_leads', JSON.stringify(leads.slice(-50)));
}

export async function saveChatSession(chatId: string, messages: any[]) {
  try {
    if (!db) return;
    const chatRef = doc(db, 'chats', chatId);
    await setDoc(chatRef, {
      messages: sanitizeData(messages),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving chat session:", error);
  }
}

export async function loginWithGoogle() {
  if (!auth) {
    alert("Error de conexión con Firebase. Por favor intenta refrescar la página.");
    return;
  }
  return signInWithPopup(auth, googleProvider);
}
