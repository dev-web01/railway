import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Cog, Database, Download, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings · R-AMS" }] }),
  component: SettingsPage,
});

import { BASE_URL } from "@/lib/api-client";
const API = `${BASE_URL}/api`;

const users = [
  { name: "R. Sharma", email: "r.sharma@indianrailways.gov.in", role: "Admin", zone: "NR", active: true },
  { name: "Priya Menon", email: "p.menon@indianrailways.gov.in", role: "Supervisor", zone: "SR", active: true },
  { name: "M. Khan", email: "m.khan@indianrailways.gov.in", role: "Station Manager", zone: "CR", active: true },
  { name: "T. Singh", email: "t.singh@indianrailways.gov.in", role: "Employee", zone: "WR", active: false },
];

const roles = [
  { name: "Admin", color: "bg-destructive/10 text-destructive", perms: ["All Assets", "User Management", "System Config", "Reports", "Audit Trail", "Backup & Restore"] },
  { name: "Supervisor", color: "bg-primary/10 text-primary", perms: ["Assets (R/W)", "Approvals", "Reports", "Maintenance", "Transfers"] },
  { name: "Station Manager", color: "bg-warning/10 text-warning", perms: ["Assets (R/W)", "Gate Pass", "Transfers", "Local Reports"] },
  { name: "Employee", color: "bg-success/10 text-success", perms: ["My Allocations", "Maintenance Log", "QR Lookup"] },
];

function SettingsPage() {
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch(`${API}/backup`, { headers: { "x-user": "Admin" } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `r-ams-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Database backup downloaded successfully");
    } catch {
      toast.error("Failed to create backup");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async (file: File) => {
    if (!confirm("⚠️ This will REPLACE all data in the database. Are you sure?")) return;
    setRestoreLoading(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      const res = await fetch(`${API}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user": "Admin" },
        body: JSON.stringify(backup),
      });
      const data = await res.json();
      if (data.success) toast.success("Database restored successfully");
      else toast.error(data.error || "Restore failed");
    } catch {
      toast.error("Invalid backup file or restore failed");
    } finally {
      setRestoreLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Users, roles, system configuration and backup management" />
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Users</TabsTrigger>
          <TabsTrigger value="roles"><Shield className="mr-2 h-4 w-4" />Roles & Permissions</TabsTrigger>
          <TabsTrigger value="system"><Cog className="mr-2 h-4 w-4" />System</TabsTrigger>
          <TabsTrigger value="backup"><Database className="mr-2 h-4 w-4" />Backup & Restore</TabsTrigger>
        </TabsList>

        {/* Users */}
        <TabsContent value="users" className="mt-6">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>User</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead>
                <TableHead>Zone</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.email}>
                    <TableCell><div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {u.name.split(" ").map((p) => p[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{u.name}</span>
                    </div></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{u.zone}</TableCell>
                    <TableCell>
                      <Badge className={u.active ? "bg-success/10 text-success border-0" : "bg-muted text-muted-foreground border-0"}>
                        {u.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* Roles */}
        <TabsContent value="roles" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((r) => (
              <Card key={r.name}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${r.color}`}>
                      <Shield className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base">{r.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {r.perms.map((p) => (
                    <div key={p} className="flex items-center gap-1 text-xs bg-muted rounded-full px-3 py-1">
                      <CheckCircle2 className="h-3 w-3 text-success" />{p}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* System */}
        <TabsContent value="system" className="mt-6">
          <Card><CardHeader><CardTitle className="text-base">System Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Organization Name</Label><Input defaultValue="Indian Railways · Ministry of Railways" /></div>
                <div className="space-y-2"><Label>Default Currency</Label><Input defaultValue="INR (₹)" /></div>
                <div className="space-y-2"><Label>Asset ID Prefix</Label><Input defaultValue="RA-" /></div>
                <div className="space-y-2"><Label>Session Timeout (min)</Label><Input type="number" defaultValue={30} /></div>
                <div className="space-y-2"><Label>SMTP Host (for emails)</Label><Input placeholder="smtp.yourserver.com" /></div>
                <div className="space-y-2"><Label>SMTP User</Label><Input placeholder="noreply@railways.gov.in" /></div>
              </div>
              {[
                ["Email notifications on warranty expiry", true],
                ["Email notifications on transfer approval", true],
                ["SMS alerts for transfers", true],
                ["Auto-renew AMC reminders", false],
                ["Audit log retention (1 yr)", true],
              ].map(([label, on]) => (
                <div key={label as string} className="flex items-center justify-between rounded-md border p-3">
                  <Label className="text-sm">{label}</Label>
                  <Switch defaultChecked={on as boolean} />
                </div>
              ))}
              <Button onClick={() => toast.success("Settings saved")}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Restore */}
        <TabsContent value="backup" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Download className="h-5 w-5 text-primary" /></div>
                <div>
                  <CardTitle className="text-base">Backup Database</CardTitle>
                  <p className="text-sm text-muted-foreground">Export all data as a JSON file for safekeeping</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                {["Assets & Vendors", "Maintenance Records", "Transfers & Audit Log"].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-md border p-3">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Button onClick={handleBackup} disabled={backupLoading} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                {backupLoading ? "Creating Backup…" : "Download Backup"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><Upload className="h-5 w-5 text-warning" /></div>
                <div>
                  <CardTitle className="text-base">Restore Database</CardTitle>
                  <p className="text-sm text-muted-foreground">Upload a JSON backup file to restore the database</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border-2 border-dashed border-border p-8 text-center">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Drop backup file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Only .json backup files are supported</p>
                <input ref={fileRef} type="file" accept=".json" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRestore(f); }} />
                <Button variant="outline" size="sm" className="mt-4" onClick={() => fileRef.current?.click()} disabled={restoreLoading}>
                  {restoreLoading ? "Restoring…" : "Choose Backup File"}
                </Button>
              </div>
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                ⚠️ Restoring will permanently replace all current data. Make sure to download a backup first.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
