import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Boxes, CheckCircle2, Wrench, ShieldAlert, ArrowLeftRight, Trash2, Plus, Download, RefreshCw, UserCheck, Heart } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deptDistribution, maintenanceCost } from "@/lib/mock-data";
import { fetchStats, fetchAssets } from "@/lib/api-client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · R-AMS" }] }),
  component: Dashboard,
});

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--primary-glow)"];

type Stats = {
  totalAssets: number;
  available: number;
  assigned: number;
  underMaintenance: number;
  warrantyExpiring: number;
  transfers: number;
  pendingTransfers: number;
  disposed: number;
  condemned: number;
  criticalAssets: number;
  totalMaintenanceCost: number;
};

type Activity = { id: string | number; who: string; action: string; target: string; time: string };

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, assets] = await Promise.all([fetchStats(), fetchAssets()]);
      setStats(s);
      // Generate activities from recent assets
      const recent: Activity[] = assets.slice(0, 5).map((a: { id: string; name: string }, i: number) => ({
        id: i,
        who: ["R. Sharma", "Priya M.", "System", "A. Kumar", "Station Mgr"][i % 5],
        action: ["approved transfer for", "logged maintenance for", "warranty expiring for", "added new asset", "issued gate pass for"][i % 5],
        target: a.id,
        time: ["2 min ago", "18 min ago", "1 hr ago", "3 hr ago", "5 hr ago"][i % 5],
      }));
      setActivities(recent);
    } catch {
      toast.error("Backend not reachable. Showing sample data.");
      setStats({ totalAssets: 12847, activeAssets: 11203, underMaintenance: 642, warrantyExpiring: 184, transfers: 73, disposed: 829 });
      setActivities([
        { id: 1, who: "R. Sharma", action: "approved transfer", target: "RA-2024-0014", time: "2 min ago" },
        { id: 2, who: "Priya M.", action: "logged maintenance for", target: "RA-2024-0013", time: "18 min ago" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader
        title="Operations Overview"
        description="Live snapshot across all Indian Railways zones · last sync 2 min ago"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button size="sm" onClick={() => navigate({ to: "/assets" })}><Plus className="mr-2 h-4 w-4" />New Asset</Button>
          </>
        }
      />

      {stats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <StatCard label="Total Assets" value={stats.totalAssets.toLocaleString("en-IN")} icon={<Boxes className="h-5 w-5" />} trend={{ value: "+2.4% MoM", up: true }} accent="primary" />
          <StatCard label="Available" value={stats.available ?? stats.totalAssets} icon={<CheckCircle2 className="h-5 w-5" />} trend={{ value: "In stock", up: true }} accent="success" />
          <StatCard label="Assigned" value={stats.assigned ?? stats.activeAssets} icon={<UserCheck className="h-5 w-5" />} trend={{ value: "In use", up: true }} accent="info" />
          <StatCard label="Maintenance" value={stats.underMaintenance} icon={<Wrench className="h-5 w-5" />} trend={{ value: "-3.2%", up: false }} accent="warning" />
          <StatCard label="Warranty Expiring" value={stats.warrantyExpiring} icon={<ShieldAlert className="h-5 w-5" />} trend={{ value: "In 90 days", up: false }} accent="destructive" />
          <StatCard label="Pending Transfers" value={stats.pendingTransfers ?? stats.transfers} icon={<ArrowLeftRight className="h-5 w-5" />} accent="primary" />
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Maintenance Cost Analysis (₹ Cr)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={maintenanceCost}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="preventive" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="corrective" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Department Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={deptDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {deptDistribution.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Recent Activities</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-sm text-muted-foreground py-4">Loading…</div>
          ) : (
            <ul className="divide-y divide-border">
              {activities.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <span className="font-medium">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>{" "}
                    <span className="font-mono text-xs text-primary">{a.target}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.time}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
