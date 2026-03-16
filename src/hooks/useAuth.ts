'use client';

import { useAuthContext } from "@/src/context/AuthContext";

export function useAuth() {
  const { user, loading } = useAuthContext();
  return { user, loading };
}

