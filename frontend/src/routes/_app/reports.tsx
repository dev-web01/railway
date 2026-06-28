import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, FileText, Download, CheckCircle2, UserCheck, Wrench, BarChart2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, Legend } from "recharts";
import { maintenanceCost } from "@/lib/mock-data";
import { inr } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics · R-AMS" }] }),
  component: ReportsPage,
});

type Asset = { id: string; name: string; category: string; location: string; department: string; cost: number; status: string; vendor?: { name: string } | null };

import { BASE_URL } from "@/lib/api-client";
const API = `${BASE_URL}/api`;

function ReportsPage() {
  const [available, setAvailable] = useState<Asset[]>([]);
  const [faulty, setFaulty] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/reports/available`).then((r) => r.json()),
      fetch(`${API}/reports/faulty`).then((r) => r.json()),
    ])
      .then(([a, f]) => { setAvailable(a); setFaulty(f); })
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = (data: Asset[], filename: string) => {
    const csv = [
      ["ID", "Name", "Category", "Location", "Department", "Cost", "Status", "Vendor"],
      ...data.map((a) => [a.id, a.name, a.category, a.location, a.department, a.cost, a.status, a.vendor?.name ?? "—"])
    ].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a"); el.href = url; el.download = `${filename}.csv`; el.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} exported`);
  };

  const stdReports = [
    { title: "Monthly Asset Status Report", desc: "Comprehensive monthly snapshot of all assets" },
    { title: "Department Utilization Report", desc: "Utilization metrics grouped by department" },
    { title: "Maintenance Cost Report", desc: "Preventive vs corrective cost breakdown" },
    { title: "Warranty & AMC Report", desc: "Upcoming expirations and renewals" },
    { title: "Transfer & Movement Log", desc: "Full inter-zone movement history" },
    { title: "Audit Trail Report", desc: "User and system actions over time" },
  ];

  const AssetTable = ({ data, emptyMsg }: { data: Asset[]; emptyMsg: string }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset ID</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead>
          <TableHead>Location</TableHead><TableHead>Department</TableHead><TableHead>Cost</TableHead>
          <TableHead>Vendor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((a) => (
          <TableRow key={a.id}>
            <TableCell className="font-mono text-xs text-primary">{a.id}</TableCell>
            <TableCell className="font-medium">{a.name}</TableCell>
            <TableCell>{a.category}</TableCell>
            <TableCell>{a.location}</TableCell>
            <TableCell>{a.department}</TableCell>
            <TableCell>{inr(a.cost)}</TableCell>
            <TableCell>{a.vendor?.name ?? "—"}</TableCell>
          </TableRow>
        ))}
        {data.length === 0 && !loading && (
          <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{emptyMsg}</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div>
      <PageHeader title="Reports & Analytics" description="Download standard and custom reports across departments" />

      <Tabs defaultValue="charts">
        <TabsList>
          <TabsTrigger value="charts"><BarChart2 className="mr-2 h-4 w-4" />Analytics</TabsTrigger>
          <TabsTrigger value="available"><CheckCircle2 className="mr-2 h-4 w-4" />Available Assets</TabsTrigger>
          <TabsTrigger value="assigned"><UserCheck className="mr-2 h-4 w-4" />Assigned Assets</TabsTrigger>
          <TabsTrigger value="faulty"><Wrench className="mr-2 h-4 w-4" />Faulty / Under Repair</TabsTrigger>
          <TabsTrigger value="standard"><FileText className="mr-2 h-4 w-4" />Standard Reports</TabsTrigger>
        </TabsList>

        {/* Analytics tab */}
        <TabsContent value="charts" className="mt-6 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Asset Utilization Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={maintenanceCost}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="preventive" stroke="var(--primary)" fill="url(#g1)" strokeWidth={2} name="Preventive" />
                    <Area type="monotone" dataKey="corrective" stroke="var(--destructive)" fill="none" strokeWidth={2} name="Corrective" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-3 gap-4 text-center">
            <Card><CardContent className="p-5">
              <div className="text-3xl font-bold text-success">{available.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Available Assets</div>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <div className="text-3xl font-bold text-warning">{faulty.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Under Repair</div>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <div className="text-3xl font-bold text-primary">{inr(available.reduce((s, a) => s + a.cost, 0))}</div>
              <div className="text-sm text-muted-foreground mt-1">Available Asset Value</div>
            </CardContent></Card>
          </div>
        </TabsContent>

        {/* Available Assets */}
        <TabsContent value="available" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Available Assets ({available.length})</CardTitle>
              <Button size="sm" onClick={() => exportCSV(available, "available-assets")}>
                <Download className="mr-2 h-4 w-4" />Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <div className="p-8 text-center text-muted-foreground">Loading…</div> : <AssetTable data={available} emptyMsg="No available assets" />}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assigned Assets — uses allocation records from frontend */}
        <TabsContent value="assigned" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Assigned Assets</CardTitle>
              <Button size="sm" onClick={() => toast.info("Download assigned assets report")}>
                <Download className="mr-2 h-4 w-4" />Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { emp: "S. Ramesh (E-9921)", asset: "RA-2024-0017 — Ticket Vending Machine", dept: "Commercial", since: "2024-06-12" },
                  { emp: "Priya Menon (E-5563)", asset: "RA-2024-0019 — CCTV Surveillance System", dept: "Security", since: "2024-04-09" },
                  { emp: "T. Singh (E-8810)", asset: "RA-2024-0014 — Signal Controller Unit", dept: "S&T", since: "2024-02-22" },
                ].map((r) => (
                  <div key={r.emp} className="flex items-center justify-between rounded-md border p-4">
                    <div>
                      <div className="font-medium">{r.emp}</div>
                      <div className="text-sm text-muted-foreground">{r.asset}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{r.dept}</div>
                      <div className="text-muted-foreground">Since {r.since}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Faulty/Under Repair */}
        <TabsContent value="faulty" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Faulty / Under Repair ({faulty.length})</CardTitle>
              <Button size="sm" onClick={() => exportCSV(faulty, "faulty-assets")}>
                <Download className="mr-2 h-4 w-4" />Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <div className="p-8 text-center text-muted-foreground">Loading…</div> : <AssetTable data={faulty} emptyMsg="No faulty assets" />}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Standard Reports */}
        <TabsContent value="standard" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stdReports.map((r) => (
              <Card key={r.title}>
                <CardHeader><CardTitle className="text-base">{r.title}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.success("PDF report queued")}>
                      <FileText className="mr-2 h-4 w-4" />PDF
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => toast.success("Excel report queued")}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
