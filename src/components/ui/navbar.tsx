'use client';

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export function Navbar() {
  const pathname = usePathname();
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

  return (
    <motion.header
      className="flex h-24 items-center justify-between border-b border-border bg-background/80 px-5 backdrop-blur"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex flex-col">
        <span className="text-base font-normal text-muted-foreground">
          {contextText}
        </span>
        <span className="text-2xl font-semibold text-foreground">
          {menuLabel}
        </span>
      </div>
    </motion.header>
  );
}

