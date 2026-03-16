'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/src/lib/firebase";
import { fetchUserRole } from "@/src/lib/auth";
import type { AppUser, UserRole } from "@/src/types/auth";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PUBLIC_ROUTES = ["/login", "/signup", "/"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);

        if (!PUBLIC_ROUTES.includes(pathname)) {
          router.replace("/login");
        }
        return;
      }

      const role = (await fetchUserRole(firebaseUser.uid)) ?? ("user" as UserRole);

      setUser((prev) => ({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        firstName: prev?.firstName ?? null,
        lastName: prev?.lastName ?? null,
        role,
      }));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}

