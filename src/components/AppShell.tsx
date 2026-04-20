import { motion } from "framer-motion";
import { Wallet, LayoutDashboard, Receipt, Tags, LogOut, Moon, Sun, Download } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";
import { Button } from "@/components/ui/button";

export type Tab = "dashboard" | "transactions" | "categories";

const tabs: { id: Tab; label: string; icon: typeof Wallet }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: Receipt },
  { id: "categories", label: "Categories", icon: Tags },
];

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
  onExport: () => void;
}

export function AppShell({ active, onChange, onExport }: Props) {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg hidden sm:block">Finly</span>
        </div>

        <nav className="flex items-center gap-1 p-1 rounded-full bg-muted">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className="relative px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition-colors z-10"
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-card shadow-soft rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className={`relative flex items-center gap-2 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={onExport} title="Export" className="hidden sm:inline-flex">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggle} title="Toggle theme">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <div className="hidden md:flex items-center gap-2 pl-2 ml-1 border-l border-border">
            <div className="h-8 w-8 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="text-sm leading-tight">
              <div className="font-medium">{user?.name}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut()} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
