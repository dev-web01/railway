import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Shield, Activity } from "lucide-react";
import { toast } from "sonner";
import { BASE_URL } from "@/lib/api-client";

export const Route = createFileRoute("/_app/audit-trail")({
  head: () => ({ meta: [{ title: "Audit Trail · R-AMS" }] }),
  component: AuditTrailPage,
});

type AuditLog = { id: number; action: string; entity: string; entityId: string; user: string; details?: string; createdAt: string };

const actionColors: Record<string, string> = {
  CREATE: "bg-success/10 text-success",
  UPDATE: "bg-info/10 text-info",
  DELETE: "bg-destructive/10 text-destructive",
  DISPOSE: "bg-warning/10 text-warning",
  BACKUP: "bg-primary/10 text-primary",
  RESTORE: "bg-primary/10 text-primary",
};

function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [q, setQ] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`${BASE_URL}/api/audit?limit=200`)
      .then((r) => r.json())
      .then(setLogs)
      .catch(() => toast.error("Failed to load audit logs"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter((l) => {
    const matchQ = [l.entity, l.entityId, l.user, l.details ?? "", l.action].some((v) => v.toLowerCase().includes(q.toLowerCase()));
    const matchEntity = entityFilter === "all" || l.entity === entityFilter;
    const matchAction = actionFilter === "all" || l.action === actionFilter;
    return matchQ && matchEntity && matchAction;
  });

  const entities = [...new Set(logs.map((l) => l.entity))];
  const actions = [...new Set(logs.map((l) => l.action))];

  const handleExport = () => {
    const csv = [
      ["ID", "Timestamp", "Action", "Entity", "Entity ID", "User", "Details"],
      ...filtered.map((l) => [l.id, new Date(l.createdAt).toLocaleString("en-IN"), l.action, l.entity, l.entityId, l.user, l.details ?? ""])
    ].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "audit-trail.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit trail exported");
  };

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        description="Complete log of all system actions — create, update, delete and system events"
        actions={<>
          <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
          <Button size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
        </>}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        {[
          { label: "Total Events", value: logs.length, icon: Activity },
          { label: "Creates", value: logs.filter((l) => l.action === "CREATE").length, icon: Shield },
          { label: "Updates", value: logs.filter((l) => l.action === "UPDATE").length, icon: Shield },
          { label: "Deletes", value: logs.filter((l) => l.action === "DELETE").length, icon: Shield },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-2xl font-bold">{s.value}</div>
              </div>
              <s.icon className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search logs…" className="pl-9" />
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Entities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entities.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Actions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading audit logs…</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${actionColors[l.action] ?? "bg-muted text-muted-foreground"} border-0 font-mono text-xs`}>
                          {l.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{l.entity}</TableCell>
                      <TableCell className="font-mono text-xs text-primary">{l.entityId.slice(0, 12)}</TableCell>
                      <TableCell>{l.user}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.details ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && !loading && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No audit logs found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
