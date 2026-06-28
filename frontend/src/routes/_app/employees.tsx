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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Users } from "lucide-react";
import { fetchEmployees, createEmployee } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/employees")({
  head: () => ({ meta: [{ title: "Employees · R-AMS" }] }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const userRole = user?.role || "Employee";
  const canManage = ["Admin", "Store Keeper"].includes(userRole);

  const load = async () => {
    setLoading(true);
    try {
      setEmployees(await fetchEmployees());
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader
        title="Employee Management"
        description="Manage users, roles, and view asset assignments"
        actions={canManage && <EmployeeDialog onSuccess={load} />}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-center">Assigned Assets</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10">Loading…</TableCell></TableRow>
              ) : employees.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No employees found</TableCell></TableRow>
              ) : (
                employees.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">{e.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{e.name}</div>
                          <div className="text-xs font-mono text-muted-foreground">{e.empId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{e.email}</div>
                      <div className="text-xs text-muted-foreground">{e.phone}</div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{e.role}</Badge></TableCell>
                    <TableCell>
                      <div className="text-sm">{e.department}</div>
                      <div className="text-xs text-muted-foreground">{e.designation}</div>
                    </TableCell>
                    <TableCell className="text-center font-medium">{e._count?.allocations || 0}</TableCell>
                    <TableCell>
                      <Badge className={e.isActive ? "bg-success/10 text-success hover:bg-success/20 border-0" : "bg-muted text-muted-foreground hover:bg-muted border-0"}>
                        {e.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function EmployeeDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData(e.currentTarget);
      await createEmployee(Object.fromEntries(fd));
      toast.success("Employee created successfully");
      setOpen(false);
      onSuccess();
    } catch {
      toast.error("Failed to create employee");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Employee</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Register New Employee</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Employee ID *</Label><Input name="empId" placeholder="E-1234" required /></div>
            <div className="space-y-1.5"><Label>Full Name *</Label><Input name="name" required /></div>
            
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" name="email" required /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input name="phone" /></div>
            
            <div className="space-y-1.5"><Label>Department *</Label><Input name="department" required /></div>
            <div className="space-y-1.5"><Label>Designation *</Label><Input name="designation" required /></div>
          </div>
          
          <div className="space-y-1.5"><Label>System Role *</Label>
            <Select name="role" defaultValue="Employee">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Store Keeper">Store Keeper</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
                <SelectItem value="Station Manager">Station Manager</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 mt-4">
            <div className="space-y-0.5">
              <Label className="text-sm">Active Account</Label>
              <div className="text-xs text-muted-foreground">Allow employee to log in and be assigned assets</div>
            </div>
            <Switch name="isActive" defaultChecked value="true" />
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Employee"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
