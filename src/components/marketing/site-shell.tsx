'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

interface SiteShellProps {
  children: React.ReactNode;
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#features", label: "Features" },
  { href: "/#workflow", label: "Workflow" },
];

export function SiteShell({ children }: SiteShellProps) {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("cartrack-marketing-popup-seen");
    if (seen === "1") return;

    const timer = window.setTimeout(() => {
      setShowPopup(true);
    }, 450);

    return () => window.clearTimeout(timer);
  }, []);

  const handleClosePopup = () => {
    sessionStorage.setItem("cartrack-marketing-popup-seen", "1");
    setShowPopup(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <motion.div
        className="border-b border-sky-400/20 bg-sky-500/10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mx-auto w-full max-w-6xl px-6 py-2 text-center text-sm text-sky-200">
          Built for independent garages and modern car owners.
        </div>
      </motion.div>

      <motion.header
        className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur"
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            CarTrack
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <motion.div key={link.href} whileHover={{ y: -1 }}>
                <Link
                  href={link.href}
                  className="text-sm text-slate-300 transition hover:text-white"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <motion.div whileHover={{ y: -1, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/login"
                className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Login
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -1, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/signup"
                className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 hover:shadow-lg hover:shadow-sky-500/30"
              >
                Get started
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main>{children}</main>

      <motion.footer
        className="border-t border-slate-800/80"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8 md:grid-cols-3">
          <div>
            <p className="text-lg font-semibold text-white">CarTrack</p>
            <p className="mt-2 text-sm text-slate-400">
              Service communication that removes confusion for both owners and mechanics.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-200">Explore</p>
            <div className="mt-2 flex flex-col gap-2 text-sm text-slate-400">
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
              <Link href="/#features" className="transition hover:text-white">
                Features
              </Link>
              <Link href="/#workflow" className="transition hover:text-white">
                Workflow
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-200">Start</p>
            <div className="mt-2 flex flex-col gap-2 text-sm text-slate-400">
              <Link href="/login" className="transition hover:text-white">
                Login
              </Link>
              <Link href="/signup" className="transition hover:text-white">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </motion.footer>

      <AnimatePresence>
        {showPopup ? (
          <motion.aside
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-md rounded-xl border border-sky-400/30 bg-slate-900/95 p-4 shadow-2xl shadow-black/50 backdrop-blur"
          >
            <button
              type="button"
              onClick={handleClosePopup}
              className="absolute right-2 top-2 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-white"
              aria-label="Close popup"
            >
              ✕
            </button>

            <p className="text-lg font-semibold text-white">Welcome to CarTrack</p>
            <p className="mt-1 text-sm text-slate-300">
              Create your account or log in to start tracking vehicle service requests.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/signup"
                onClick={handleClosePopup}
                className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 hover:shadow-lg hover:shadow-sky-500/30"
              >
                Create account
              </Link>
              <Link
                href="/login"
                onClick={handleClosePopup}
                className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Login
              </Link>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
