import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, Phone, Plus, Package, Eye } from "lucide-react";
import { fetchVendors, createVendor } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/vendors")({
  head: () => ({ meta: [{ title: "Vendors · R-AMS" }] }),
  component: VendorsPage,
});

type Vendor = { id: string; name: string; category: string; contact?: string; rating?: number; orders: number };

function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null);

  const load = async () => {
    try {
      setVendors(await fetchVendors());
    } catch {
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader title="Vendor Management"
        description="Vendor profiles, purchase history and performance ratings"
        actions={<AddVendorDialog onSuccess={load} />} />

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Loading vendors…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vendors.map((v) => (
            <Card key={v.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{v.name}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-1">{v.category}</div>
                  </div>
                  {v.rating != null && (
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Star className="h-4 w-4 fill-warning text-warning" />{v.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {v.contact && (
                  <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{v.contact}</div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Purchase Orders</span>
                  <span className="font-semibold">{v.orders}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewVendor(v)}><Eye className="mr-2 h-4 w-4" />View Profile</Button>
                  <Button size="sm" className="flex-1" onClick={() => toast.info(`Order history for ${v.name} — ${v.orders} orders`)}><Package className="mr-2 h-4 w-4" />Order History</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {vendors.length === 0 && (
            <div className="col-span-3 text-center text-muted-foreground py-12">No vendors found. Add your first vendor!</div>
          )}
        </div>
      )}

      {/* View Vendor Dialog */}
      {viewVendor && (
        <Dialog open={!!viewVendor} onOpenChange={() => setViewVendor(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{viewVendor.name}</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              {[
                ["Vendor ID", viewVendor.id],
                ["Category", viewVendor.category],
                ["Contact", viewVendor.contact ?? "—"],
                ["Rating", viewVendor.rating ? `${viewVendor.rating}/5.0` : "—"],
                ["Total Orders", String(viewVendor.orders)],
              ].map(([k, val]) => (
                <div key={k} className="flex justify-between border-b border-border pb-2 last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewVendor(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function AddVendorDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createVendor(form);
      toast.success("Vendor added successfully");
      setOpen(false);
      setForm({});
      onSuccess();
    } catch {
      toast.error("Failed to add vendor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Vendor</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add New Vendor</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5"><Label>Vendor Name *</Label><Input required placeholder="e.g. DLW Varanasi" onChange={set("name")} /></div>
          <div className="space-y-1.5"><Label>Category *</Label><Input required placeholder="Locomotives / Signalling…" onChange={set("category")} /></div>
          <div className="space-y-1.5"><Label>Contact</Label><Input placeholder="+91 XXXXX XXXXX" onChange={set("contact")} /></div>
          <div className="space-y-1.5"><Label>Rating (0–5)</Label><Input type="number" step="0.1" min="0" max="5" placeholder="4.5" onChange={set("rating")} /></div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Adding…" : "Add Vendor"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
