'use client';

import { AuthForm } from "@/src/components/AuthForm";
import { motion } from "framer-motion";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <motion.div
        className="mx-auto grid w-full max-w-5xl gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="space-y-4 text-left text-white/90">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Create your CarTrack workspace.
          </h1>
          <p className="max-w-md text-sm text-white/60">
            Whether you&apos;re a car owner or a mechanic, CarTrack keeps all
            your service history and requests organized in one place.
          </p>
          <div className="mt-4 grid gap-3 text-sm text-white/70 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur hover:border-white/50 hover:scale-105 hover:bg-white/10 transition-all duration-300">
              <p className="font-medium">For car owners</p>
              <p className="mt-1 text-xs text-white/60">
                Never lose track of invoices, services, and upcoming checks.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur hover:border-white/50 hover:scale-105 hover:bg-white/10 transition-all duration-300">
              <p className="font-medium">For mechanics</p>
              <p className="mt-1 text-xs text-white/60">
                Manage requests, clients, and status updates from one dashboard.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur hover:border-white/50 hover:scale-105 hover:bg-white/10 transition-all duration-300">
              <p className="font-medium">Shared visibility</p>
              <p className="mt-1 text-xs text-white/60">
                Keep everyone on the same page with real-time updates.
              </p>
            </div>
          </div>
        </div>
        <AuthForm mode="signup" />
      </motion.div>
    </div>
  );
}

