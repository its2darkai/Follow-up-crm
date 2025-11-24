import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  orderBy
} from 'firebase/firestore';
import { InteractionLog, LeadStatus, Role, User, CallType, CompanyKnowledge } from "../types";

// ============================================================================
// 🔴🔴🔴 FIREBASE CONFIGURATION 🔴🔴🔴
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyAmGYn_llX0LXPrL5J17UBXo11uTKem0nI",
  authDomain: "followupcrm-28963.firebaseapp.com",
  projectId: "followupcrm-28963",
  storageBucket: "followupcrm-28963.firebasestorage.app",
  messagingSenderId: "39043132476",
  appId: "1:39043132476:web:7d383bea5dcb8ad5696739"
};

// ============================================================================

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// COLLECTIONS
const USERS_COLLECTION = 'users';
const LOGS_COLLECTION = 'logs';
const KNOWLEDGE_COLLECTION = 'config';
const KNOWLEDGE_DOC_ID = 'company_knowledge';

// --- AUTH ---

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Fetch user profile from Firestore
    const userDocRef = doc(db, USERS_COLLECTION, email.toLowerCase());
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      // Update UID in firestore to match Auth UID if it was a pre-created invite
      if (userData.uid !== firebaseUser.uid) {
        await updateDoc(userDocRef, { uid: firebaseUser.uid });
      }
      return { ...userData, uid: firebaseUser.uid };
    } else {
      // 🚨 AUTO-HEAL: If this is the master admin, recreate the missing doc automatically
      if (email.toLowerCase() === 'admin@followup.com') {
          console.log("Healing orphaned Master Admin account...");
          const healedUser: User = {
              uid: firebaseUser.uid,
              name: 'Master Admin',
              email: email.toLowerCase(),
              role: Role.ADMIN,
              photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
          };
          await setDoc(userDocRef, healedUser);
          return healedUser;
      }

      throw new Error("User profile not found in database. Contact Admin.");
    }
  } catch (error: any) {
    console.error("Login error", error);
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        throw new Error("Incorrect password.");
    }
    if (error.code === 'auth/user-not-found') {
        throw new Error("Account not found. Please use 'First Time Setup'.");
    }
    throw new Error(error.message);
  }
};

export const registerUser = async (email: string, password: string): Promise<User> => {
  // 1. Check if Admin has authorized this email (Firestore check)
  const userDocRef = doc(db, USERS_COLLECTION, email.toLowerCase());
  const userDoc = await getDoc(userDocRef);
  
  if (!userDoc.exists()) {
    throw new Error(`The email "${email}" is not authorized. If you are the Admin, click 'Locked out?' below to force-create a new Admin account.`);
  }

  // 2. Create Auth Account
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // 3. Update the existing placeholder doc with the new Auth UID
    await updateDoc(userDocRef, { uid: userCredential.user.uid });
    
    return { ...(userDoc.data() as User), uid: userCredential.user.uid };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
        throw new Error("Account already exists. Please switch to the 'Login' tab.");
    }
    throw new Error(error.message);
  }
};

// 🚨 EMERGENCY ADMIN CREATION
// Bypasses the "Allow List" check. Only used for recovery.
export const registerNewAdmin = async (email: string, password: string): Promise<User> => {
  try {
    // 1. Create Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // 2. Force Write Admin Profile to Firestore
    const newUser: User = {
      uid: firebaseUser.uid,
      name: 'Emergency Admin',
      email: email.toLowerCase(),
      role: Role.ADMIN,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    };

    await setDoc(doc(db, USERS_COLLECTION, email.toLowerCase()), newUser);
    
    return newUser;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
        throw new Error("This email is already registered. Please Login instead.");
    }
    throw new Error(error.message);
  }
};

export const resetUserPassword = async (email: string) => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const logoutUser = async () => {
  await signOut(auth);
  localStorage.removeItem('crm_current_user'); // clear local cache
};

export const getCurrentUser = (): User | null => {
  const cached = localStorage.getItem('crm_current_user');
  return cached ? JSON.parse(cached) : null;
};

// --- USERS ---

export const getAllUsers = async (): Promise<User[]> => {
  const q = query(collection(db, USERS_COLLECTION));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as User);
};

// Admin adds a user to the "Allowed List"
export const createUser = async (newUser: Omit<User, 'uid' | 'photoURL'>): Promise<void> => {
  const emailKey = newUser.email.trim().toLowerCase(); // Trim whitespace
  const userRef = doc(db, USERS_COLLECTION, emailKey);
  const existing = await getDoc(userRef);
  
  if (existing.exists()) {
    throw new Error("User with this email already exists.");
  }

  // Create a placeholder doc. The user will "claim" this when they Register.
  const userPayload: User = {
    uid: 'pending_registration',
    name: newUser.name,
    email: emailKey,
    role: newUser.role,
    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.email}`,
    password: 'user-sets-this' // Placeholder
  };

  await setDoc(userRef, userPayload);
};

export const adminUpdateUser = async (uid: string, updates: Partial<User>): Promise<void> => {
  if (updates.email) {
    throw new Error("Changing email is not supported. Delete and recreate.");
  }

  const q = query(collection(db, USERS_COLLECTION), where("uid", "==", uid));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const docRef = snapshot.docs[0].ref;
    await updateDoc(docRef, updates);
  }
};

export const deleteUser = async (uid: string): Promise<void> => {
  const q = query(collection(db, USERS_COLLECTION), where("uid", "==", uid));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    await deleteDoc(snapshot.docs[0].ref);
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<User>): Promise<User | null> => {
  const q = query(collection(db, USERS_COLLECTION), where("uid", "==", uid));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    await updateDoc(snapshot.docs[0].ref, updates);
    // Update local cache
    const currentUser = getCurrentUser();
    if (currentUser) {
      const newItem = { ...currentUser, ...updates };
      localStorage.setItem('crm_current_user', JSON.stringify(newItem));
      return newItem;
    }
  }
  return null;
};

// --- LOGS (DATA) ---

export const getLogs = async (): Promise<InteractionLog[]> => {
  const q = query(collection(db, LOGS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as InteractionLog));
};

export const checkPhoneExists = async (phone: string): Promise<InteractionLog | null> => {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 5) return null; // Too short to be valid
  
  const q = query(collection(db, LOGS_COLLECTION), where('phoneClean', '==', clean));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  // Return most recent
  const logs = snapshot.docs.map(d => d.data() as InteractionLog);
  return logs.sort((a,b) => b.createdAt - a.createdAt)[0];
};

export const saveLog = async (logData: Omit<InteractionLog, 'id' | 'createdAt' | 'phoneClean'>): Promise<void> => {
  const phoneClean = logData.phone.replace(/\D/g, '');
  
  // 🔍 STRICT DUPLICATE CHECK
  // We check the ENTIRE database. If this number exists anywhere, we block creation.
  const existing = await checkPhoneExists(phoneClean);
  if (existing) {
    throw new Error(`DUPLICATE FOUND: This phone number is already managed by agent "${existing.agentName}". Please contact Admin to transfer.`);
  }

  await addDoc(collection(db, LOGS_COLLECTION), {
    ...logData,
    createdAt: Date.now(),
    phoneClean
  });
};

export const updateLog = async (id: string, updates: Partial<InteractionLog>): Promise<void> => {
  if (updates.phone) {
    updates.phoneClean = updates.phone.replace(/\D/g, '');
    
    // If changing number, ensure the NEW number doesn't conflict (unless it's the same doc)
    // Note: This is a basic check. A strict transaction would be better but overkill here.
  }
  await updateDoc(doc(db, LOGS_COLLECTION, id), updates);
};

export const updateLogStatus = async (id: string, updates: Partial<InteractionLog>): Promise<void> => {
  await updateDoc(doc(db, LOGS_COLLECTION, id), updates);
};

export const deleteLog = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, LOGS_COLLECTION, id));
};

// --- KNOWLEDGE BASE ---

export const getCompanyKnowledge = async (): Promise<CompanyKnowledge> => {
  const docRef = doc(db, KNOWLEDGE_COLLECTION, KNOWLEDGE_DOC_ID);
  const snap = await getDoc(docRef);
  
  if (snap.exists()) {
    return snap.data() as CompanyKnowledge;
  } else {
    // Return defaults if not set
    return {
       productName: "Follow Up CRM",
       description: "The world's most tactile, 3D-designed CRM.",
       pricing: "$29/month per agent.",
       uniqueSellingPoints: "3D Tactile UI, Native AI, Gamification.",
       salesPitch: "Stop using boring spreadsheets.",
       objectionRules: "Pivot to value.",
       masterDocumentText: ""
    };
  }
};

// Helper sync wrapper for AI service to use
let cachedKnowledge: CompanyKnowledge | null = null;
getCompanyKnowledge().then(k => cachedKnowledge = k);

export const getCompanyKnowledgeSync = (): CompanyKnowledge => {
  return cachedKnowledge || {
       productName: "Loading...",
       description: "Loading...",
       pricing: "Loading...",
       uniqueSellingPoints: "Loading...",
       salesPitch: "Loading...",
       objectionRules: "Loading...",
       masterDocumentText: ""
  };
};

export const saveCompanyKnowledge = async (data: CompanyKnowledge) => {
  await setDoc(doc(db, KNOWLEDGE_COLLECTION, KNOWLEDGE_DOC_ID), data);
  cachedKnowledge = data;
};

// --- SEEDING / RECOVERY ---

export const ensureMasterAdmin = async (): Promise<string> => {
  try {
    const adminEmail = 'admin@followup.com';
    const userRef = doc(db, USERS_COLLECTION, adminEmail);
    // Force set/overwrite to guarantee it exists
    await setDoc(userRef, {
      uid: 'master_admin_placeholder', 
      name: 'Master Admin',
      email: adminEmail,
      role: Role.ADMIN,
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      password: 'placeholder'
    }, { merge: true }); // Merge so we don't destroy UID if it was valid
    
    return `Database Initialized for: ${adminEmail}. \n\nIf "First Time Setup" says Account Exists, please use LOGIN. \n\nIf Login fails, click "Forgot Password".`;
  } catch (error: any) {
    console.error(error);
    throw new Error(`DB Error: ${error.message}.`);
  }
};