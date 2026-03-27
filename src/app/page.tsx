'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { SiteShell } from "@/src/components/marketing/site-shell";

export default function Home() {
  return (
    <SiteShell>
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <p className="inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-sm font-medium text-sky-300">
            Built for real workshop workflows
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Stop explaining service status on calls. Let CarTrack do it.
          </h1>
          <p className="text-lg text-slate-300">
            CarTrack is a shared timeline between owners and mechanics. From request and
            drop-off to service details and pickup, everyone sees the same truth.
          </p>
          <div className="flex flex-wrap gap-3">
            <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/signup"
                className="rounded-md bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 hover:shadow-lg hover:shadow-sky-500/35"
              >
                Create account
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/login"
                className="rounded-md border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Login
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-2xl shadow-black/30 transition hover:border-sky-400/40"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          whileHover={{ y: -3 }}
        >
          <p className="text-sm font-semibold text-slate-200">Live request snapshot</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
              <p className="font-medium text-white">Golf 7 - Brake vibration</p>
              <p className="mt-1 text-slate-400">Mechanic: AutoServis Vuk</p>
              <p className="mt-2 inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-1 text-xs text-violet-200">
                Dropped off
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
              <p className="font-medium text-white">Action queue</p>
              <ul className="mt-2 space-y-1 text-slate-300">
                <li>- Mechanic starts service</li>
                <li>- Maintenance + cost entered</li>
                <li>- Owner confirms pickup</li>
              </ul>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
              <p className="text-slate-300">Total spent this year</p>
              <p className="mt-1 text-2xl font-semibold text-white">1,240.00 EUR</p>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="features" className="mx-auto grid w-full max-w-6xl gap-4 px-6 pb-8 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="text-3xl font-semibold text-white">5</p>
          <p className="mt-2 text-sm text-slate-300">clear statuses in one flow</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="text-3xl font-semibold text-white">2</p>
          <p className="mt-2 text-sm text-slate-300">role-specific dashboards</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="text-3xl font-semibold text-white">1</p>
          <p className="mt-2 text-sm text-slate-300">shared source of truth</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="text-3xl font-semibold text-white">0</p>
          <p className="mt-2 text-sm text-slate-300">confusing status calls</p>
        </div>
      </section>

      <section id="workflow" className="mx-auto w-full max-w-6xl px-6 py-8">
        <motion.div
          className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/60 to-slate-950/60 p-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35 }}
        >
          <h2 className="text-3xl font-semibold text-white">Designed around real pain points</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <motion.article
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-rose-300/40"
              whileHover={{ y: -3 }}
            >
              <p className="text-sm uppercase tracking-wide text-rose-300">Before CarTrack</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>- Owners ask for updates through calls and messages</li>
                <li>- Mechanics repeat status info all day</li>
                <li>- Service notes and costs end up in separate places</li>
              </ul>
            </motion.article>
            <motion.article
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-emerald-300/40"
              whileHover={{ y: -3 }}
            >
              <p className="text-sm uppercase tracking-wide text-emerald-300">With CarTrack</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>- Owner sees live status at any moment</li>
                <li>- Mechanic focuses on actual work</li>
                <li>- Every maintenance entry is saved with mileage and cost</li>
              </ul>
            </motion.article>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-8">
        <motion.div
          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35 }}
        >
          <h2 className="text-3xl font-semibold text-white">Who CarTrack is for</h2>
          <p className="mt-2 max-w-4xl text-sm text-slate-300">
            CarTrack is built for workshops that want to stay organized without adding
            heavy software. It is also ideal for owners who want visibility without
            repeatedly calling for updates.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <motion.article
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 transition hover:border-slate-600"
              whileHover={{ y: -3 }}
            >
              <p className="text-lg font-semibold text-white">Independent garages</p>
              <p className="mt-2 text-sm text-slate-300">
                Keep all active repairs, drop-off dates, and service progress in one dashboard.
              </p>
            </motion.article>
            <motion.article
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 transition hover:border-slate-600"
              whileHover={{ y: -3 }}
            >
              <p className="text-lg font-semibold text-white">Fleet owners</p>
              <p className="mt-2 text-sm text-slate-300">
                Track spend and maintenance history per vehicle with a clear repair timeline.
              </p>
            </motion.article>
            <motion.article
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 transition hover:border-slate-600"
              whileHover={{ y: -3 }}
            >
              <p className="text-lg font-semibold text-white">Busy car owners</p>
              <p className="mt-2 text-sm text-slate-300">
                See exactly what is happening with your car and what action is required next.
              </p>
            </motion.article>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-8">
        <motion.div
          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35 }}
        >
          <h2 className="text-3xl font-semibold text-white">Frequently asked questions</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="font-semibold text-slate-100">Can owners and mechanics use the same request?</p>
              <p className="mt-1 text-sm text-slate-300">
                Yes. The request is shared, but each role sees different actions depending on status.
              </p>
            </article>
            <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="font-semibold text-slate-100">Can service start before drop-off confirmation?</p>
              <p className="mt-1 text-sm text-slate-300">
                No. Service starts only after the owner confirms that the car is dropped off.
              </p>
            </article>
            <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="font-semibold text-slate-100">Where are maintenance costs saved?</p>
              <p className="mt-1 text-sm text-slate-300">
                Each maintenance entry stores parts, labor, and total cost under the selected vehicle.
              </p>
            </article>
            <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="font-semibold text-slate-100">How fast can I start?</p>
              <p className="mt-1 text-sm text-slate-300">
                Create an account, add your first vehicle or request, and you can start immediately.
              </p>
            </article>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <motion.div
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-400/30 bg-sky-500/10 p-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35 }}
        >
          <div>
            <p className="text-2xl font-semibold text-white">Ready to make service updates effortless?</p>
            <p className="mt-1 text-sm text-sky-100/90">
              Set up owners and mechanics in minutes.
            </p>
          </div>
          <div className="flex gap-2">
            <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/signup"
                className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 hover:shadow-lg hover:shadow-sky-500/30"
              >
                Register now
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/login"
                className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Go to login
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </SiteShell>
  );
}

