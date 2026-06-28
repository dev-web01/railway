import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import {
  LayoutDashboard, Boxes, QrCode, MapPin, UserCheck, ArrowLeftRight,
  Wrench, ShieldCheck, Building2, Ticket, FileBarChart, Bell, Settings,
  TrainFront, TrendingDown, Trash2, Shield, Users,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { fetchNotificationCount } from "@/lib/api-client";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Admin", "Store Keeper", "Supervisor", "Station Manager", "Employee"] },
  { to: "/assets", label: "Asset Management", icon: Boxes, roles: ["Admin", "Store Keeper", "Supervisor", "Station Manager"] },
  { to: "/employees", label: "Employees", icon: Users, roles: ["Admin", "Store Keeper", "Supervisor"] },
  { to: "/allocation", label: "Allocation / Issue", icon: UserCheck, roles: ["Admin", "Store Keeper", "Supervisor", "Employee"] },
  { to: "/disposal", label: "Disposal History", icon: Trash2, roles: ["Admin", "Station Manager"] },
  { to: "/depreciation", label: "Depreciation", icon: TrendingDown, roles: ["Admin"] },
  { to: "/qr-tracking", label: "QR Tracking", icon: QrCode, roles: ["Admin", "Store Keeper", "Station Manager", "Employee"] },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, roles: ["Admin", "Supervisor", "Employee"] },
  { to: "/warranty", label: "Warranty & AMC", icon: ShieldCheck, roles: ["Admin", "Supervisor"] },
  { to: "/vendors", label: "Vendors", icon: Building2, roles: ["Admin", "Supervisor"] },
  { to: "/transfers", label: "Transfers", icon: ArrowLeftRight, roles: ["Admin", "Supervisor", "Station Manager"] },
  { to: "/gate-pass", label: "Gate Pass", icon: Ticket, roles: ["Admin", "Station Manager"] },
  { to: "/locations", label: "Locations", icon: MapPin, roles: ["Admin", "Station Manager"] },
  { to: "/reports", label: "Reports", icon: FileBarChart, roles: ["Admin", "Supervisor", "Station Manager"] },
  { to: "/audit-trail", label: "Audit Trail", icon: Shield, roles: ["Admin"] },
  { to: "/notifications", label: "Notifications", icon: Bell, roles: ["Admin", "Store Keeper", "Supervisor", "Station Manager", "Employee"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["Admin", "Supervisor", "Station Manager"] },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const userRole = user?.role || "Employee";
  const filteredNav = loading ? [] : nav.filter((item) => item.roles.includes(userRole));

  useEffect(() => {
    const pollNotifications = async () => {
      try { const res = await fetchNotificationCount(); setUnreadCount(res.count || 0); } catch {}
    };
    pollNotifications();
    const interval = setInterval(pollNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 z-40 h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <TrainFront className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">R-AMS</div>
            <div className="text-[11px] text-sidebar-foreground/60">Indian Railways</div>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5 p-3 overflow-y-auto h-[calc(100vh-4rem)]">
          {filteredNav.map((item) => {
            const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="mt-auto pt-4 text-[11px] text-sidebar-foreground/50 px-3">
            v1.0 · Ministry of Railways
          </div>
        </nav>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Railway Asset Management System</div>
            <div className="text-sm font-semibold">{filteredNav.find((n) => path.startsWith(n.to))?.label ?? "Dashboard"}</div>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => { setUnreadCount(0); navigate({ to: "/notifications" }); }}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
          <UserMenu />
        </header>

        <main className="flex-1 p-4 lg:p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
