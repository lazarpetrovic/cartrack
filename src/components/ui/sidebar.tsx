import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/src/hooks/useAuth";
import { logout } from "@/src/lib/auth";
import { Button } from "@/src/components/ui/button";

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
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
      .find(
        (link) =>
          pathname === link.href || pathname.startsWith(`${link.href}/`)
      )?.href ?? "";
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 220 }}
      className="sticky top-0 hidden h-screen shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar/80 px-3 py-4 backdrop-blur md:flex"
    >
      <div className="mb-6 flex items-center gap-2 px-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-xs font-semibold text-white">
          CT
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight text-foreground">
            CarTrack
          </span>
        )}
      </div>
      <nav className="space-y-2">
        {links.map((link) => {
          const active = activeHref === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-base font-medium transition-colors hover:bg-muted hover:text-foreground ${
                active ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border/70 pt-3">
        {!collapsed && user ? (
          <div className="mb-2 rounded-md border border-border/60 bg-background/40 px-3 py-3 text-sm">
            <p className="truncate font-medium text-foreground">
              {user.email ?? "Signed in"}
            </p>
            <p className="text-muted-foreground">
              Role: <span className="font-medium text-foreground">{user.role}</span>
            </p>
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="md"
          className={`w-full ${collapsed ? "px-2" : ""}`}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </motion.aside>
  );
}

