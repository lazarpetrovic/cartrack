'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/src/lib/auth";
import { useAuth } from "@/src/hooks/useAuth";

export function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <nav className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        CarTrack
      </Link>

      <div className="flex items-center gap-3">
        {!user && !isAuthPage && (
          <>
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Sign Up
            </Link>
          </>
        )}

        {user && (
          <>
            <span className="hidden text-sm text-zinc-600 sm:inline">
              {user.email} ({user.role})
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

