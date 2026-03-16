import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type UserCredential,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/src/lib/firebase";
import type { UserRole } from "@/src/types/auth";

const USERS_COLLECTION = "users";

export async function signUp(
  email: string,
  password: string,
  role: UserRole,
  firstName: string,
  lastName: string
): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  const userRef = doc(db, USERS_COLLECTION, credential.user.uid);
  await setDoc(userRef, {
    uid: credential.user.uid,
    email: credential.user.email,
    firstName,
    lastName,
    role,
    createdAt: serverTimestamp(),
  });

  return credential;
}

export async function signIn(
  email: string,
  password: string
): Promise<UserCredential> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function fetchUserRole(uid: string): Promise<UserRole | null> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return null;

  const data = snap.data() as { role?: UserRole };
  return data.role ?? null;
}

export interface MechanicProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
}

export async function getMechanics(): Promise<MechanicProfile[]> {
  const q = query(collection(db, USERS_COLLECTION), where("role", "==", "mechanic"));
  const snapshot = await getDocs(q);
  const mechanics: MechanicProfile[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as {
      uid?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
    };

    mechanics.push({
      uid: data.uid ?? docSnap.id,
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      email: data.email ?? "",
    });
  });

  mechanics.sort((a, b) => {
    const nameA = `${a.firstName} ${a.lastName}`.trim().toLowerCase();
    const nameB = `${b.firstName} ${b.lastName}`.trim().toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return mechanics;
}

