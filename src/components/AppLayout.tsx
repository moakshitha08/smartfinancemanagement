import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  TrendingDown,
  BarChart3,
  ListChecks,
  Target,
  Bell,
  Download,
  Settings,
  LogOut,
  Menu,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAlerts } from "@/hooks/useAlerts";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/income", label: "Income", icon: Wallet },
  { to: "/app/expenses", label: "Expenses", icon: TrendingDown },
  { to: "/app/transactions", label: "Transactions", icon: ListChecks },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/budget", label: "Budget", icon: Target },
  { to: "/app/alerts", label: "Alerts", icon: Bell },
  { to: "/app/export", label: "Export & Import", icon: Download },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export const AppLayout = () => {
  const { signOut, user } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const alerts = useAlerts();
  const alertCount = alerts.length;

  const handleLogout = async () => {
    await signOut();
    nav("/auth", { replace: true });
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 transition-transform duration-300",
          "glass-strong border-r border-border/50",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center gap-2 px-5 border-b border-border/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Smart Budget</div>
            <div className="text-[11px] text-muted-foreground">CIICP Lab</div>
          </div>
        </div>
        <nav className="px-3 py-4 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  isActive
                    ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                )
              }
            >
              <n.icon className="h-4 w-4" />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border/40">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 h-16 flex items-center gap-3 px-4 lg:px-8 glass border-b border-border/40">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-muted/50"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm text-muted-foreground">
              Welcome back, <span className="text-foreground font-medium">{user?.email?.split("@")[0]}</span>
            </h1>
          </div>
          {alertCount > 0 && (
            <button
              onClick={() => nav("/app/alerts")}
              aria-label={`${alertCount} alert${alertCount > 1 ? "s" : ""}`}
              className="relative p-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <Bell className="h-5 w-5 text-foreground" />
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-expense text-[10px] font-semibold text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)]">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            </button>
          )}
        </header>
        <main className="flex-1 p-4 lg:p-8 animate-fade">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;