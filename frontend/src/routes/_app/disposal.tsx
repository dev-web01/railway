import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, CheckCircle2, AlertTriangle, Search, PackageX } from "lucide-react";
import { fetchDisposals, createDisposal, approveDisposal, completeDisposal, fetchAssets } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { BASE_URL } from "@/lib/api-client";

const API = `${BASE_URL}/api`;

const condemn = async (id: number) => {
  const headers: Record<string, string> = {};
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('r-ams-user') : null;
  if (userStr) { const u = JSON.parse(userStr); headers['x-user'] = u.name; headers['x-user-role'] = u.role; }
  const res = await fetch(`${API}/disposal/${id}/condemn`, { method: 'PUT', headers });
  if (!res.ok) throw new Error('Failed to condemn disposal');
  return res.json();
};

export const Route = createFileRoute("/_app/disposal")({
  head: () => ({ meta: [{ title: "Asset Disposal · R-AMS" }] }),
  component: DisposalPage,
});

const statusColors: Record<string, string> = {
  "Under Review": "bg-warning/15 text-warning border-warning/30",
  "Condemned": "bg-orange-500/15 text-orange-500 border-orange-500/30",
  "Approved for Disposal": "bg-info/15 text-info border-info/30",
  "Disposed": "bg-destructive/15 text-destructive border-destructive/30",
};

function DisposalPage() {
  const { user } = useAuth();
  const role = user?.role || "Employee";
  const [disposals, setDisposals] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);

  const canCreate = ["Admin", "Supervisor"].includes(role);
  const canApprove = ["Admin", "Station Manager"].includes(role);
  const canComplete = role === "Admin";

  const load = async () => {
    setLoading(true);
    try {
      const [d, a] = await Promise.all([fetchDisposals(), fetchAssets()]);
      setDisposals(Array.isArray(d) ? d : []);
      setAssets((a.data || a).filter((x: any) => !["Disposed"].includes(x.status)));
    } catch { toast.error("Failed to load disposals"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = disposals.filter(d =>
    [d.asset?.name, d.reason, d.status, d.condition].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    setSaving(true);
    try {
      const fd = new FormData(formRef.current);
      await createDisposal({
        assetId: fd.get("assetId"),
        reason: fd.get("reason"),
        condition: fd.get("condition"),
        inspectionNotes: fd.get("inspectionNotes"),
        disposalValue: fd.get("disposalValue"),
      });
      toast.success("Disposal request submitted");
      setCreateOpen(false);
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title="Asset Disposal & Condemnation"
        description="Manage end-of-life assets through a controlled disposal workflow"
        actions={canCreate ? (
          <Button variant="destructive" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Initiate Disposal
          </Button>
        ) : undefined}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Requests", value: disposals.length, color: "text-primary" },
          { label: "Under Review", value: disposals.filter(d => d.status === "Under Review").length, color: "text-warning" },
          { label: "Condemned", value: disposals.filter(d => d.status === "Condemned").length, color: "text-orange-500" },
          { label: "Disposed", value: disposals.filter(d => d.status === "Disposed").length, color: "text-destructive" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search disposals..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Disposal Value</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.asset?.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{d.reason}</TableCell>
                    <TableCell>{d.condition || "—"}</TableCell>
                    <TableCell>₹{Number(d.disposalValue || 0).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-muted-foreground">{d.approvedBy || "—"}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs border ${statusColors[d.status] || ""}`}>{d.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(d.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {d.status === "Under Review" && canApprove && (
                          <Button size="sm" variant="outline" className="text-orange-500 border-orange-500/30 hover:bg-orange-500/10" onClick={async () => {
                            try { await condemn(d.id); toast.success("Disposal condemned for approval"); load(); }
                            catch (err: any) { toast.error(err.message); }
                          }}>
                            <AlertTriangle className="h-3.5 w-3.5 mr-1" />Condemn
                          </Button>
                        )}
                        {d.status === "Condemned" && canApprove && (
                          <Button size="sm" variant="outline" className="text-info border-info/30 hover:bg-info/10" onClick={async () => {
                            try { await approveDisposal(d.id); toast.success("Disposal approved"); load(); }
                            catch (err: any) { toast.error(err.message); }
                          }}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve
                          </Button>
                        )}
                        {d.status === "Approved for Disposal" && canComplete && (
                          <Button size="sm" variant="destructive" onClick={async () => {
                            if (!confirm("This will permanently dispose the asset. Are you sure?")) return;
                            try { await completeDisposal(d.id); toast.success("Asset disposed"); load(); }
                            catch (err: any) { toast.error(err.message); }
                          }}>
                            <PackageX className="h-3.5 w-3.5 mr-1" />Dispose
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No disposal records found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form ref={formRef} onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Initiate Disposal Request
              </DialogTitle>
              <DialogDescription>
                This will change the asset status to "Condemned" pending approval.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label>Asset</Label>
                <Select name="assetId" required>
                  <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                  <SelectContent>
                    {assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name} — {a.category}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Physical Condition</Label>
                  <Select name="condition" required>
                    <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
                    <SelectContent>
                      {["Beyond Repair", "Obsolete", "Damaged", "Non-functional", "End of Life"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Disposal/Salvage Value (₹)</Label>
                  <Input name="disposalValue" type="number" placeholder="0" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Reason for Disposal</Label>
                <Textarea name="reason" placeholder="Detailed reason..." required rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Inspection Notes</Label>
                <Textarea name="inspectionNotes" placeholder="Inspector observations..." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={saving}>{saving ? "Submitting..." : "Submit Request"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
