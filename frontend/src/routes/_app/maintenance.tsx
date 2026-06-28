import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Calendar, Wrench, History } from "lucide-react";
import { inr } from "@/lib/mock-data";
import { fetchMaintenance, createMaintenance, fetchAssets, updateAsset } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance · R-AMS" }] }),
  component: MaintenancePage,
});

type MaintenanceRecord = {
  id: string;
  type: string;
  scheduled: string;
  technician?: string;
  status: string;
  cost: number;
  assetId: string;
  asset?: { id: string; name: string };
};

type Asset = { id: string; name: string };

function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const userRole = user?.role || "Employee";
  const canManage = ["Admin", "Supervisor", "Store Keeper"].includes(userRole);

  const load = async () => {
    try {
      const [m, a] = await Promise.all([fetchMaintenance(), fetchAssets()]);
      setRecords(m);
      setAssets(a);
    } catch {
      toast.error("Failed to load maintenance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (record: MaintenanceRecord, status: string) => {
    try {
      // Update the asset status to match if completing
      if (status === "Completed" && record.assetId) {
        await updateAsset(record.assetId, { status: "Active" });
      }
      toast.success(`Work order ${record.id} marked as ${status}`);
      load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const filterByTab = (tab: string) => {
    if (tab === "schedule" || tab === "history") return records;
    return records.filter((m) => m.type.toLowerCase() === tab);
  };

  return (
    <div>
      <PageHeader title="Maintenance Management"
        description="Preventive and corrective schedules, service history and cost tracking"
        actions={<ScheduleMaintenanceDialog assets={assets} onSuccess={load} />} />
      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule"><Calendar className="mr-2 h-4 w-4" />Schedule</TabsTrigger>
          <TabsTrigger value="preventive"><Wrench className="mr-2 h-4 w-4" />Preventive</TabsTrigger>
          <TabsTrigger value="corrective"><Wrench className="mr-2 h-4 w-4" />Corrective</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-2 h-4 w-4" />Service History</TabsTrigger>
        </TabsList>
        {["schedule", "preventive", "corrective", "history"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <Card>
              <CardHeader><CardTitle className="text-base capitalize">{tab} records</CardTitle></CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading…</div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Work Order</TableHead><TableHead>Asset</TableHead><TableHead>Type</TableHead>
                      <TableHead>Scheduled</TableHead><TableHead>Technician</TableHead><TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {filterByTab(tab).map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-mono text-xs text-primary">{m.id.slice(0, 8)}</TableCell>
                          <TableCell className="font-mono text-xs">{m.asset?.id ?? m.assetId}</TableCell>
                          <TableCell>{m.type}</TableCell>
                          <TableCell>{m.scheduled?.slice(0, 10)}</TableCell>
                          <TableCell>{m.technician ?? "—"}</TableCell>
                          <TableCell>{inr(m.cost)}</TableCell>
                          <TableCell><StatusBadge status={m.status} /></TableCell>
                          <TableCell className="text-right">
                            {m.status !== "Completed" && canManage && (
                              <div className="flex gap-1 justify-end">
                                {m.status === "Scheduled" && (
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(m, "In Progress")}>Start</Button>
                                )}
                                {m.status === "In Progress" && (
                                  <Button size="sm" onClick={() => handleStatusChange(m, "Completed")}>Complete</Button>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filterByTab(tab).length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No records found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ScheduleMaintenanceDialog({ assets, onSuccess }: { assets: Asset[]; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ type: "Preventive", status: "Scheduled" });
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assetId) { toast.error("Please select an asset"); return; }
    setSaving(true);
    try {
      await createMaintenance(form);
      // Update asset status
      await updateAsset(form.assetId, { status: "Maintenance" });
      toast.success("Maintenance scheduled successfully");
      setOpen(false);
      setForm({ type: "Preventive", status: "Scheduled" });
      onSuccess();
    } catch {
      toast.error("Failed to schedule maintenance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" />Schedule Maintenance</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Schedule Maintenance</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5"><Label>Asset *</Label>
            <Select onValueChange={(v) => setForm((f) => ({ ...f, assetId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
              <SelectContent>{assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.id} — {a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Preventive">Preventive</SelectItem>
                <SelectItem value="Corrective">Corrective</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Scheduled Date *</Label><Input type="date" required onChange={set("scheduled")} /></div>
          <div className="space-y-1.5"><Label>Technician</Label><Input placeholder="Technician name" onChange={set("technician")} /></div>
          <div className="space-y-1.5"><Label>Estimated Cost (₹)</Label><Input type="number" placeholder="0" onChange={set("cost")} /></div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Scheduling…" : "Schedule"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
