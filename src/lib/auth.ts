import {
  EmailAuthProvider,
  deleteUser as deleteAuthUser,
  reauthenticateWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword as updateAuthPassword,
  type UserCredential,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
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

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface CommonSettings {
  appearance: {
    theme: "system" | "light" | "dark";
  };
}

export interface UserOnlySettings {
  preferences: {
    mileageUnit: "km" | "mi";
    serviceReminder: boolean;
    registrationReminder: boolean;
  };
}

export interface MechanicOnlySettings {
  workshop: {
    serviceName: string;
    address: string;
    phone: string;
    workingHours: string;
    specializations: string;
  };
}

export interface UserSettingsBundle {
  profile: UserProfile;
  common: CommonSettings;
  userOnly: UserOnlySettings;
  mechanicOnly: MechanicOnlySettings;
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

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as {
    uid?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: UserRole;
  };

  return {
    uid: data.uid ?? uid,
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    email: data.email ?? "",
    role: data.role ?? "user",
  };
}

export async function updateUserProfile(
  uid: string,
  data: { firstName: string; lastName: string }
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
  });
}

export async function getUserSettings(uid: string): Promise<UserSettingsBundle | null> {
  const profile = await getUserProfile(uid);
  if (!profile) return null;

  const userRef = doc(db, USERS_COLLECTION, uid);
  const snapshot = await getDoc(userRef);
  const data = (snapshot.data() ?? {}) as {
    appearance?: { theme?: "system" | "light" | "dark" };
    preferences?: {
      mileageUnit?: "km" | "mi";
      serviceReminder?: boolean;
      registrationReminder?: boolean;
    };
    workshop?: {
      serviceName?: string;
      address?: string;
      phone?: string;
      workingHours?: string;
      specializations?: string;
    };
  };

  return {
    profile,
    common: {
      appearance: {
        theme: data.appearance?.theme ?? "system",
      },
    },
    userOnly: {
      preferences: {
        mileageUnit: data.preferences?.mileageUnit ?? "km",
        serviceReminder: data.preferences?.serviceReminder ?? true,
        registrationReminder: data.preferences?.registrationReminder ?? true,
      },
    },
    mechanicOnly: {
      workshop: {
        serviceName: data.workshop?.serviceName ?? "",
        address: data.workshop?.address ?? "",
        phone: data.workshop?.phone ?? "",
        workingHours: data.workshop?.workingHours ?? "",
        specializations: data.workshop?.specializations ?? "",
      },
    },
  };
}

export async function updateCommonSettings(
  uid: string,
  data: CommonSettings
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    appearance: {
      theme: data.appearance.theme,
    },
  });
}

export async function updateUserOnlySettings(
  uid: string,
  data: UserOnlySettings
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    preferences: {
      mileageUnit: data.preferences.mileageUnit,
      serviceReminder: data.preferences.serviceReminder,
      registrationReminder: data.preferences.registrationReminder,
    },
  });
}

export async function updateMechanicOnlySettings(
  uid: string,
  data: MechanicOnlySettings
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    workshop: {
      serviceName: data.workshop.serviceName.trim(),
      address: data.workshop.address.trim(),
      phone: data.workshop.phone.trim(),
      workingHours: data.workshop.workingHours.trim(),
      specializations: data.workshop.specializations.trim(),
    },
  });
}

export async function changePassword(
  currentPassword: string,
  nextPassword: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) {
    throw new Error("You must be signed in.");
  }
  const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
  await reauthenticateWithCredential(currentUser, credential);
  await updateAuthPassword(currentUser, nextPassword);
}

export async function deleteCurrentAccount(currentPassword: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) {
    throw new Error("You must be signed in.");
  }
  const userId = currentUser.uid;
  const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
  await reauthenticateWithCredential(currentUser, credential);
  await deleteAuthUser(currentUser);

  // Best effort cleanup; auth deletion is the primary action.
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
  } catch {
    // Ignore cleanup failures after auth account deletion.
  }
}

