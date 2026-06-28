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
import { CheckCircle2, RotateCcw, UserCheck, Search, Filter } from "lucide-react";
import { fetchAllocations, fetchAssets, fetchEmployees, createAllocation, returnAllocation, BASE_URL } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_app/allocation")({
  head: () => ({ meta: [{ title: "Allocation · R-AMS" }] }),
  component: AllocationPage,
});

function AllocationPage() {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Active");
  const [q, setQ] = useState("");

  const { user } = useAuth();
  const userRole = user?.role || "Employee";
  const canAllocate = ["Admin", "Supervisor", "Store Keeper"].includes(userRole);

  const load = async () => {
    setLoading(true);
    try {
      setAllocations(await fetchAllocations());
    } catch { toast.error("Failed to load allocations"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleReturn = async (id: string) => {
    if (!confirm("Confirm asset return? This will mark the asset as Available again.")) return;
    try {
      await returnAllocation(id);
      toast.success("Asset returned successfully");
      load();
    } catch (e: any) { toast.error(e.message || "Failed to return asset"); }
  };

  const filtered = allocations.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (q) {
      const qs = q.toLowerCase();
      return a.asset.name.toLowerCase().includes(qs) || a.employee.name.toLowerCase().includes(qs) || a.asset.serial?.toLowerCase().includes(qs);
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Asset Allocation & Issue"
        description="Issue assets to employees and track returns"
        actions={canAllocate && <IssueDialog onSuccess={load} />}
      />

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by asset or employee name…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Records</SelectItem>
                <SelectItem value="Active">Currently Assigned</SelectItem>
                <SelectItem value="Returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="text-center py-10">Loading…</TableCell></TableRow> :
                  filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No allocation records found</TableCell></TableRow> :
                  filtered.map((al) => (
                    <TableRow key={al.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{al.asset.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{al.asset.serial || al.asset.id.slice(0, 10)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary">{al.employee.name.charAt(0)}</div>
                          <div className="text-sm font-medium">{al.employee.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(al.assignedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{al.returnedAt ? new Date(al.returnedAt).toLocaleDateString() : "-"}</TableCell>
                      <TableCell><StatusBadge status={al.status} /></TableCell>
                      <TableCell>
                        {al.status === "Active" && canAllocate && (
                          <Button variant="outline" size="sm" onClick={() => handleReturn(al.id)} className="h-8 text-xs px-2">
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Return
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function IssueDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      Promise.all([
        fetch(`${BASE_URL}/api/assets?status=Available&limit=100`).then(r => r.json()),
        fetchEmployees()
      ]).then(([a, e]) => {
        setAssets(a.data || []);
        setEmployees(e.filter((emp: any) => emp.isActive));
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData(e.currentTarget);
      await createAllocation(Object.fromEntries(fd));
      toast.success("Asset assigned successfully");
      setOpen(false);
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || "Failed to assign asset");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><UserCheck className="mr-2 h-4 w-4" />Issue Asset</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Issue Asset to Employee</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          
          <div className="space-y-1.5"><Label>Select Employee *</Label>
            <Select name="employeeId" required>
              <SelectTrigger><SelectValue placeholder="Choose an employee…" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name} ({e.empId}) - {e.department}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5"><Label>Select Asset *</Label>
            <Select name="assetId" required>
              <SelectTrigger><SelectValue placeholder="Choose available asset…" /></SelectTrigger>
              <SelectContent>
                {assets.length === 0 && <SelectItem value="disabled" disabled>No available assets found</SelectItem>}
                {assets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} ({a.category}) - {a.location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground mt-1 text-right">Only assets with 'Available' status are shown.</div>
          </div>

          <div className="space-y-1.5"><Label>Notes (Optional)</Label>
            <Input name="notes" placeholder="e.g. Issued for Project X" />
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Issuing…" : "Issue Asset"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
