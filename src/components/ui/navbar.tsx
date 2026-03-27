'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/src/hooks/useAuth";
import { logout } from "@/src/lib/auth";

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const menuLabel =
    pathname.startsWith("/dashboard/user/cars")
      ? "Cars"
      : pathname.startsWith("/dashboard/mechanic/appointments")
        ? "Appointments"
        : "Dashboard";
  const contextText =
    pathname.startsWith("/dashboard/user/cars/")
      ? "Single car: service status and history."
      : pathname.startsWith("/dashboard/user/cars")
        ? "My cars and total spend."
        : pathname.startsWith("/dashboard/mechanic/appointments")
          ? "Appointments and history by date."
          : pathname.startsWith("/dashboard/mechanic/service/")
            ? "Add maintenance and finish service."
            : "Clear overview of current activity.";
  const links =
    user?.role === "mechanic"
      ? [
          { href: "/dashboard/mechanic", label: "Dashboard" },
          { href: "/dashboard/mechanic/appointments", label: "Appointments" },
        ]
      : [
          { href: "/dashboard/user", label: "Dashboard" },
          { href: "/dashboard/user/cars", label: "Cars" },
        ];
  const activeHref =
    links
      .slice()
      .sort((a, b) => b.href.length - a.href.length)
      .find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
      ?.href ?? "";

  return (
    <motion.header
      className="border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:px-5"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block truncate text-sm font-normal text-muted-foreground sm:text-base">
              {contextText}
            </span>
            <span className="block text-xl font-semibold text-foreground sm:text-2xl">
              {menuLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted md:hidden"
          >
            Logout
          </button>
        </div>

        <nav className="flex flex-wrap gap-2 md:hidden">
          {links.map((link) => {
            const active = activeHref === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.header>
  );
}

