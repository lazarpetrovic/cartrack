import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/src/hooks/useAuth";

const links = [
  { href: "/dashboard/user", label: "Dashboard" },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 220 }}
      className="relative flex h-screen flex-col border-r border-border bg-sidebar/80 px-3 py-4 backdrop-blur"
    >
      <div className="mb-6 flex items-center gap-2 px-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-xs font-semibold text-white">
          CT
        </div>
        {!collapsed && (
          <span className="text-[0.95rem] font-semibold tracking-tight text-foreground">
            CarTrack
          </span>
        )}
      </div>
      <nav className="space-y-1 text-[0.9rem]">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "bg-muted text-foreground"
              )}
            >
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}

