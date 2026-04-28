import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDdjXbkUTUaTk4r-rmYJDVfOEgzs-99ooE",
  authDomain: "ai-studio-applet-webapp-3d48e.firebaseapp.com",
  projectId: "ai-studio-applet-webapp-3d48e",
  storageBucket: "ai-studio-applet-webapp-3d48e.firebasestorage.app",
  messagingSenderId: "69135008810",
  appId: "1:69135008810:web:071fbb793481f1a52caf53"
};

let app: any;
let db: any;
let auth: any;
let googleProvider: any;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
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
  try {
    // 1. Save to Firebase
    if (!db) {
      throw new Error("Firebase no configurado");
    }
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
    if (!db) return;
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
  if (!auth) {
    alert("Error de conexión con Firebase. Por favor intenta refrescar la página.");
    return;
  }
  return signInWithPopup(auth, googleProvider);
}
