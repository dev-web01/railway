import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeftRight, Plus, CheckCircle2, XCircle, Truck, Clock, Search } from "lucide-react";
import { fetchTransfers, createTransfer, approveTransfer, rejectTransfer, completeTransfer, fetchAssets } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/transfers")({
  head: () => ({ meta: [{ title: "Asset Transfers · R-AMS" }] }),
  component: TransfersPage,
});

const statusColors: Record<string, string> = {
  Pending: "bg-warning/15 text-warning border-warning/30",
  Approved: "bg-info/15 text-info border-info/30",
  Rejected: "bg-destructive/15 text-destructive border-destructive/30",
  Completed: "bg-success/15 text-success border-success/30",
};

function TransfersPage() {
  const { user } = useAuth();
  const role = user?.role || "Employee";
  const [transfers, setTransfers] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);

  const canCreate = ["Admin", "Supervisor", "Store Keeper"].includes(role);
  const canApprove = ["Admin", "Station Manager"].includes(role);

  const load = async () => {
    setLoading(true);
    try {
      const [t, a] = await Promise.all([fetchTransfers(), fetchAssets()]);
      setTransfers(t.data || t);
      setAssets(a.data || a);
    } catch { toast.error("Failed to load transfers"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = transfers.filter(t =>
    [t.asset?.name, t.fromLocation, t.toLocation, t.requestedBy, t.status].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total: transfers.length,
    pending: transfers.filter(t => t.status === "Pending").length,
    approved: transfers.filter(t => t.status === "Approved").length,
    completed: transfers.filter(t => t.status === "Completed").length,
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    setSaving(true);
    try {
      const fd = new FormData(formRef.current);
      await createTransfer({
        assetId: fd.get("assetId"),
        fromLocation: fd.get("fromLocation"),
        toLocation: fd.get("toLocation"),
        remarks: fd.get("remarks"),
      });
      toast.success("Transfer request created");
      setCreateOpen(false);
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleAction = async (action: "approve" | "reject" | "complete", id: string) => {
    try {
      if (action === "approve") await approveTransfer(id);
      else if (action === "reject") await rejectTransfer(id);
      else await completeTransfer(id);
      toast.success(`Transfer ${action}d`);
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <PageHeader
        title="Asset Transfers"
        description="Track and manage asset movements between departments, stations, and locations"
        actions={canCreate ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Transfer
          </Button>
        ) : undefined}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Transfers", value: stats.total, icon: ArrowLeftRight, color: "text-primary" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-warning" },
          { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-info" },
          { label: "Completed", value: stats.completed, icon: Truck, color: "text-success" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
              <s.icon className={`h-6 w-6 ${s.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search transfers..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-muted-foreground">Loading transfers...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.asset?.name || t.assetId}</TableCell>
                    <TableCell className="text-muted-foreground">{t.fromLocation}</TableCell>
                    <TableCell>{t.toLocation}</TableCell>
                    <TableCell>{t.requestedBy}</TableCell>
                    <TableCell className="text-muted-foreground">{t.approvedBy || "—"}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs border ${statusColors[t.status] || ""}`}>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {t.transferDate ? new Date(t.transferDate).toLocaleDateString("en-IN") : new Date(t.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {t.status === "Pending" && canApprove && (
                          <>
                            <Button size="sm" variant="outline" className="text-success border-success/30 hover:bg-success/10" onClick={() => handleAction("approve", t.id)}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleAction("reject", t.id)}>
                              <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                            </Button>
                          </>
                        )}
                        {t.status === "Approved" && canCreate && (
                          <Button size="sm" variant="outline" className="text-info border-info/30 hover:bg-info/10" onClick={() => handleAction("complete", t.id)}>
                            <Truck className="h-3.5 w-3.5 mr-1" />Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No transfers found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Transfer Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form ref={formRef} onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Transfer Request</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label>Asset</Label>
                <Select name="assetId" required>
                  <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                  <SelectContent>
                    {assets.filter(a => !["Disposed", "Condemned"].includes(a.status)).map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name} ({a.status})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>From Location</Label>
                  <Input name="fromLocation" placeholder="Current location" required />
                </div>
                <div className="space-y-1.5">
                  <Label>To Location</Label>
                  <Input name="toLocation" placeholder="Destination" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Remarks</Label>
                <Textarea name="remarks" placeholder="Reason for transfer..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit Request"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
