'use client';

import { useAuth } from "@/src/hooks/useAuth";
import { logout } from "@/src/lib/auth";
import { Button } from "@/src/components/ui/button";
import { motion } from "framer-motion";

export function Navbar() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <motion.header
      className="flex h-20 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex flex-col">
        <span className="text-sm font-normal text-muted-foreground">
          Track your services and maintenance history.
        </span>
        <span className="text-md font-semibold text-foreground">
          Dashboard
        </span>
      </div>
      {user && (
        <div className="flex items-center gap-3">
          <div className="hidden flex-col text-right text-sm text-muted-foreground sm:flex">
            <span className="font-medium text-foreground">
              {user.email ?? "Signed in"}
            </span>
            <div>
              Role: {" "}<span className="font-medium text-foreground">{user.role}</span>
            </div>
          </div>
          <Button variant="outline" size="md" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      )}
    </motion.header>
  );
}

