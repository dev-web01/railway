import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, ShieldAlert, Shield, ShieldCheck, RefreshCw } from "lucide-react";
import { fetchWarrantyAlerts } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/warranty")({
  head: () => ({ meta: [{ title: "Warranty Alerts · R-AMS" }] }),
  component: WarrantyPage,
});

function WarrantyPage() {
  const [data, setData] = useState<{ expired: any[]; in30: any[]; in60: any[]; in90: any[] }>({ expired: [], in30: [], in60: [], in90: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchWarrantyAlerts();
      setData(res);
    } catch { toast.error("Failed to load warranty alerts"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const WarrantyTable = ({ items, emptyMsg }: { items: any[]; emptyMsg: string }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Days Left</TableHead>
          <TableHead>Vendor Contact</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">{emptyMsg}</TableCell></TableRow>
        ) : (
          items.map(a => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.name}</TableCell>
              <TableCell>{a.category}</TableCell>
              <TableCell className="text-muted-foreground">{a.location}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">{a.status}</Badge>
              </TableCell>
              <TableCell>{new Date(a.expiryDate).toLocaleDateString("en-IN")}</TableCell>
              <TableCell>
                <span className={`font-bold ${a.daysLeft <= 0 ? "text-destructive" : a.daysLeft <= 30 ? "text-orange-500" : a.daysLeft <= 60 ? "text-warning" : "text-info"}`}>
                  {a.daysLeft <= 0 ? "Expired" : `${a.daysLeft} days`}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">{a.vendorContact || "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div>
      <PageHeader
        title="Warranty Alert System"
        description="Monitor asset warranty expiry dates and take proactive action"
        actions={<Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button>}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-destructive/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-destructive">{data.expired.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Expiring in 30 days</p>
                <p className="text-2xl font-bold text-orange-500">{data.in30.length}</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-orange-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Expiring in 60 days</p>
                <p className="text-2xl font-bold text-warning">{data.in60.length}</p>
              </div>
              <Shield className="h-8 w-8 text-warning/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-info/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Expiring in 90 days</p>
                <p className="text-2xl font-bold text-info">{data.in90.length}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-info/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Tabs defaultValue="expired">
          <CardHeader className="border-b pb-0">
            <TabsList className="-mb-px">
              <TabsTrigger value="expired" className="data-[state=active]:text-destructive">
                Expired ({data.expired.length})
              </TabsTrigger>
              <TabsTrigger value="in30" className="data-[state=active]:text-orange-500">
                30 Days ({data.in30.length})
              </TabsTrigger>
              <TabsTrigger value="in60" className="data-[state=active]:text-warning">
                60 Days ({data.in60.length})
              </TabsTrigger>
              <TabsTrigger value="in90" className="data-[state=active]:text-info">
                90 Days ({data.in90.length})
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-0">
            <TabsContent value="expired" className="m-0">
              <WarrantyTable items={data.expired} emptyMsg="No expired warranties" />
            </TabsContent>
            <TabsContent value="in30" className="m-0">
              <WarrantyTable items={data.in30} emptyMsg="No warranties expiring within 30 days" />
            </TabsContent>
            <TabsContent value="in60" className="m-0">
              <WarrantyTable items={data.in60} emptyMsg="No warranties expiring within 60 days" />
            </TabsContent>
            <TabsContent value="in90" className="m-0">
              <WarrantyTable items={data.in90} emptyMsg="No warranties expiring within 90 days" />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
