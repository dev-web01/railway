import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TrainFront, Lock, Mail, ShieldCheck, Eye, EyeOff, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · R-AMS" }] }),
  component: LoginPage,
});

const DEMO_USERS = [
  {
    role: "Admin",
    name: "R. Sharma",
    email: "admin@railways.gov.in",
    password: "Admin@123",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
  {
    role: "Store Keeper",
    name: "S. Patel",
    email: "store@railways.gov.in",
    password: "Store@123",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    dot: "bg-purple-500",
  },
  {
    role: "Supervisor",
    name: "Priya Menon",
    email: "supervisor@railways.gov.in",
    password: "Super@123",
    color: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  {
    role: "Station Manager",
    name: "M. Khan",
    email: "stationmgr@railways.gov.in",
    password: "Station@123",
    color: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
  },
  {
    role: "Employee",
    name: "T. Singh",
    email: "employee@railways.gov.in",
    password: "Emp@1234",
    color: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("admin@railways.gov.in");
  const [password, setPassword] = useState("Admin@123");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = DEMO_USERS.find((u) => u.email === email && u.password === password);
    if (!user) {
      toast.error("Invalid email or password");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("r-ams-user", JSON.stringify({ name: user.name, role: user.role, email: user.email }));
      toast.success(`Welcome, ${user.name} · ${user.role}`);
      navigate({ to: "/dashboard" });
    }, 600);
  };

  const fillCredentials = (user: typeof DEMO_USERS[0]) => {
    setEmail(user.email);
    setPassword(user.password);
    toast.info(`Filled credentials for ${user.role}`);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left panel */}
      <div
        className="relative hidden lg:flex flex-col justify-between bg-sidebar text-sidebar-foreground p-12 overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(800px 400px at 20% 20%, var(--primary-glow), transparent), radial-gradient(600px 400px at 80% 80%, var(--primary), transparent)" }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <TrainFront className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-semibold">R-AMS</div>
            <div className="text-xs text-sidebar-foreground/60">Railway Asset Management System</div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Track every asset.<br />Across every zone.
          </h1>
          <p className="max-w-md text-sm text-sidebar-foreground/70">
            Unified platform for Indian Railways — asset lifecycle, QR tracking, transfers,
            maintenance, warranty, depreciation, audit trail and analytics across 17 zones.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[{ k: "12,847", v: "Assets" }, { k: "17", v: "Zones" }, { k: "68", v: "Divisions" }].map((s) => (
              <div key={s.v}>
                <div className="text-2xl font-bold">{s.k}</div>
                <div className="text-xs text-sidebar-foreground/60">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo credentials panel */}
        <div className="relative z-10 space-y-3">
          <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">Demo Credentials</div>
          {DEMO_USERS.map((u) => (
            <div key={u.role} className={cn("rounded-lg border p-3 cursor-pointer hover:opacity-90 transition-opacity", u.color)}
              onClick={() => fillCredentials(u)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", u.dot)} />
                  <span className="font-semibold text-sm">{u.role}</span>
                  <span className="text-xs opacity-70">· {u.name}</span>
                </div>
                <span className="text-xs opacity-60">click to fill</span>
              </div>
              <div className="mt-1.5 text-xs opacity-80 font-mono">
                {u.email} / {u.password}
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 text-xs text-sidebar-foreground/50">
          Government of India · Ministry of Railways
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <div className="lg:hidden mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <TrainFront className="h-5 w-5" />
            </div>
            <div className="font-semibold">R-AMS</div>
          </div>

          <h2 className="text-2xl font-bold">Sign in to your account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use your official Railways credentials</p>

          {/* Mobile demo buttons */}
          <div className="mt-4 lg:hidden space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick fill demo:</div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map((u) => (
                <button key={u.role} type="button"
                  className={cn("rounded-md border px-3 py-2 text-xs font-medium text-left transition-opacity hover:opacity-80", u.color)}
                  onClick={() => fillCredentials(u)}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", u.dot)} />
                    <span className="font-bold">{u.role}</span>
                  </div>
                  <div className="opacity-70 font-mono text-[10px]">{u.password}</div>
                </button>
              ))}
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-9" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-10" required />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>

            <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Secured by Railways CRIS · SSO enabled
            </div>
          </form>

          {/* Role hint below form */}
          <div className="mt-5 rounded-lg border border-dashed border-border p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <UserCircle2 className="h-3.5 w-3.5" /> Demo Credentials
            </div>
            {DEMO_USERS.map((u) => (
              <div key={u.role}
                className={cn("rounded-md border px-3 py-2 text-xs cursor-pointer hover:opacity-80 transition-opacity", u.color)}
                onClick={() => fillCredentials(u)}>
                <div className="flex items-center justify-between">
                  <span className="font-bold">{u.role}</span>
                  <span className="opacity-60">click to fill →</span>
                </div>
                <div className="font-mono opacity-70 mt-0.5">{u.email}</div>
                <div className="font-mono opacity-70">Password: <strong>{u.password}</strong></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
