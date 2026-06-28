import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Ticket, Plus, CheckCircle2, Printer } from "lucide-react";
import { fetchAssets } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/gate-pass")({
  head: () => ({ meta: [{ title: "Gate Pass · R-AMS" }] }),
  component: GatePassPage,
});

type GatePass = { id: string; asset: string; purpose: string; issued: string; approver: string; status: string };
type Asset = { id: string; name: string };

function GatePassPage() {
  const [passes, setPasses] = useState<GatePass[]>([
    { id: "GP-7782", asset: "RA-2024-0014", purpose: "Workshop transfer", issued: "2024-09-22 09:14", approver: "DRM Chennai", status: "Approved" },
    { id: "GP-7783", asset: "RA-2024-0019", purpose: "Vendor servicing", issued: "2024-09-22 11:02", approver: "Station Mgr SC", status: "Pending" },
    { id: "GP-7784", asset: "RA-2024-0017", purpose: "Decommission", issued: "2024-09-21 16:48", approver: "ADRM SBC", status: "Approved" },
  ]);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    fetchAssets().then(setAssets).catch(() => {});
  }, []);

  const handleApprove = (pass: GatePass) => {
    setPasses((prev) => prev.map((p) => p.id === pass.id ? { ...p, status: "Approved" } : p));
    toast.success(`Gate Pass ${pass.id} approved`);
  };

  const handlePrint = (pass: GatePass) => {
    toast.success(`Gate Pass ${pass.id} sent to printer`);
  };

  const handleAdd = (pass: GatePass) => {
    setPasses((prev) => [pass, ...prev]);
    toast.success(`Gate Pass ${pass.id} generated`);
  };

  return (
    <div>
      <PageHeader title="Digital Gate Pass"
        description="Generate, approve and track asset movement out of premises"
        actions={<GeneratePassDialog assets={assets} onAdd={handleAdd} />} />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Pass No.</TableHead><TableHead>Asset</TableHead><TableHead>Purpose</TableHead>
            <TableHead>Issued</TableHead><TableHead>Approver</TableHead><TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {passes.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs text-primary">
                  <div className="flex items-center gap-2"><Ticket className="h-4 w-4" />{p.id}</div>
                </TableCell>
                <TableCell className="font-mono text-xs">{p.asset}</TableCell>
                <TableCell>{p.purpose}</TableCell>
                <TableCell className="text-sm">{p.issued}</TableCell>
                <TableCell>{p.approver}</TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    {p.status === "Pending" && (
                      <Button size="sm" onClick={() => handleApprove(p)}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Approve
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handlePrint(p)}>
                      <Printer className="mr-1 h-3.5 w-3.5" />Print
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

function GeneratePassDialog({ assets, onAdd }: { assets: Asset[]; onAdd: (pass: GatePass) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.asset) { toast.error("Please select an asset"); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const id = `GP-${Math.floor(7800 + Math.random() * 200)}`;
    onAdd({
      id,
      asset: form.asset,
      purpose: form.purpose ?? "General",
      issued: new Date().toLocaleString("en-IN").replace(",", ""),
      approver: form.approver ?? "Pending",
      status: "Pending",
    });
    setOpen(false);
    setForm({});
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" />Generate Pass</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Generate Gate Pass</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5"><Label>Asset *</Label>
            <Select onValueChange={(v) => setForm((f) => ({ ...f, asset: v }))}>
              <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
              <SelectContent>
                {assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.id} — {a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Purpose *</Label><Input required placeholder="Workshop transfer / Vendor servicing…" onChange={set("purpose")} /></div>
          <div className="space-y-1.5"><Label>Approver</Label><Input placeholder="DRM / Station Manager" onChange={set("approver")} /></div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Generating…" : "Generate Pass"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
