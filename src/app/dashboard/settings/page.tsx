'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    router.replace(
      user.role === "mechanic" ? "/dashboard/mechanic/settings" : "/dashboard/user/settings"
    );
  }, [user, router]);

  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-4 py-6 text-sm text-muted-foreground">
      Redirecting to your settings...
    </div>
  );
}
