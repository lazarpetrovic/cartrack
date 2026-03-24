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
    pathname.startsWith("/dashboard/user/cars")
      ? "Manage your vehicles and total spend."
      : pathname.startsWith("/dashboard/user/vehicles/")
        ? "Track one vehicle status and service flow."
        : pathname.startsWith("/dashboard/mechanic/appointments")
          ? "Review planned/completed work by date."
          : pathname.startsWith("/dashboard/mechanic/service/")
            ? "Add maintenance and finish service."
            : "Track your services and maintenance history.";

  return (
    <motion.header
      className="flex h-20 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex flex-col">
        <span className="text-sm font-normal text-muted-foreground">
          {contextText}
        </span>
        <span className="text-md font-semibold text-foreground">
          {menuLabel}
        </span>
      </div>
    </motion.header>
  );
}

