import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Download, FileText, Trash2, QrCode, Search, Filter, Wrench, MoreHorizontal, Image as ImageIcon, CheckCircle2, AlertTriangle, ArrowRightLeft, History, Upload, Activity, File, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { fetchAssets, createAsset, updateAsset, deleteAsset, fetchVendors, fetchAssetDocuments, uploadAssetDocument, deleteDocument, fetchAssetTimeline, BASE_URL } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { inr } from "@/lib/mock-data";
import { QRCodeSVG } from "qrcode.react";

export const Route = createFileRoute("/_app/assets")({
  head: () => ({ meta: [{ title: "Assets · R-AMS" }] }),
  component: AssetsPage,
});

function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const [vendors, setVendors] = useState<any[]>([]);
  const [viewAsset, setViewAsset] = useState<any>(null);

  const { user } = useAuth();
  const userRole = user?.role || "Employee";
  const canAdd = ["Admin", "Store Keeper"].includes(userRole);
  const canDelete = ["Admin"].includes(userRole);
  const canEdit = ["Admin", "Store Keeper", "Supervisor", "Station Manager"].includes(userRole);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { page: String(page), limit: "10" };
      if (q) params.search = q;
      if (statusFilter !== "all") params.status = statusFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;
      
      const [res, v] = await Promise.all([fetch(`${BASE_URL}/api/assets?` + new URLSearchParams(params)).then(r => r.json()), fetchVendors()]);
      setAssets(res.data || []);
      setTotal(res.total || 0);
      setVendors(v);
    } catch {
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, statusFilter, categoryFilter, q]);

  const handleView = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/assets/${id}`, {
        headers: { "x-user": user?.name || "Admin", "x-user-role": user?.role || "Admin" }
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setViewAsset(data);
    } catch {
      toast.error("Failed to load asset details");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    try {
      await deleteAsset(id);
      toast.success("Asset deleted");
      load();
    } catch {
      toast.error("Failed to delete asset (Check permissions)");
    }
  };

  const handleExport = () => {
    const csv = [
      ["ID", "Name", "Model", "Category", "Location", "Department", "Cost", "Status"],
      ...assets.map((a) => [a.id, a.name, a.modelNumber || "-", a.category, a.location, a.department, a.cost, a.status])
    ].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "assets.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Assets exported");
  };

  return (
    <div>
      <PageHeader
        title="Asset Management"
        description="Comprehensive inventory across all zones and departments"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
            {canAdd && <AssetDialog vendors={vendors} onSuccess={load} />}
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search assets by name, ID, serial…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Assigned">Assigned</SelectItem>
                <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                <SelectItem value="Retired">Retired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Rolling Stock">Rolling Stock</SelectItem>
                <SelectItem value="Signalling">Signalling</SelectItem>
                <SelectItem value="Track Equipment">Track Equipment</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Serial/Model</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10">Loading assets…</TableCell></TableRow>
                ) : assets.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No assets found</TableCell></TableRow>
                ) : (
                  assets.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-mono text-xs text-primary">{a.id.slice(0, 12)}</div>
                        <div className="font-medium text-sm">{a.name}</div>
                        <div className="text-xs text-muted-foreground">{a.category}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{a.serial || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">{a.modelNumber || "N/A"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{a.location}</div>
                        <div className="text-xs text-muted-foreground">{a.department}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.allocations?.[0] ? a.allocations[0].employee.name : <span className="text-muted-foreground">Unassigned</span>}
                      </TableCell>
                      <TableCell className="font-medium">{inr(a.cost)}</TableCell>
                      <TableCell><StatusBadge status={a.status} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleView(a.id)}><FileText className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                            {canEdit && <AssetDialog vendors={vendors} asset={a} onSuccess={load} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Plus className="mr-2 h-4 w-4" />Edit Asset</DropdownMenuItem>} />}
                            <DropdownMenuItem onClick={() => { setViewAsset(a); setTimeout(() => document.getElementById("qr-tab")?.click(), 100); }}><QrCode className="mr-2 h-4 w-4" />Generate QR</DropdownMenuItem>
                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDelete(a.id)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border p-4">
            <div className="text-sm text-muted-foreground">Showing {assets.length} of {total} assets</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={assets.length < 10} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Details Dialog */}
      {viewAsset && (
        <AssetDetailDialog asset={viewAsset} onClose={() => setViewAsset(null)} canAdd={canAdd} />
      )}
    </div>
  );
}

// ─── ASSET DETAIL DIALOG ────────────────────────────────────────────────────
function AssetDetailDialog({ asset: viewAsset, onClose, canAdd }: { asset: any; onClose: () => void; canAdd: boolean }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("Invoice");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocs = async () => {
    setDocsLoading(true);
    try { setDocs(await fetchAssetDocuments(viewAsset.id)); } catch {}
    finally { setDocsLoading(false); }
  };

  const loadTimeline = async () => {
    setTimelineLoading(true);
    try { setTimeline(await fetchAssetTimeline(viewAsset.id)); } catch {}
    finally { setTimelineLoading(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadAssetDocument(viewAsset.id, file, docType);
      toast.success("Document uploaded");
      loadDocs();
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleDeleteDoc = async (id: number) => {
    try { await deleteDocument(id); toast.success("Document deleted"); loadDocs(); }
    catch (err: any) { toast.error(err.message); }
  };

  const healthColor = viewAsset.healthScore >= 90 ? "text-success" : viewAsset.healthScore >= 70 ? "text-info" : viewAsset.healthScore >= 50 ? "text-warning" : viewAsset.healthScore >= 30 ? "text-orange-500" : "text-destructive";

  const timelineIcons: Record<string, string> = { audit: "🔍", allocation: "👤", maintenance: "🔧", transfer: "🚛", verification: "✅" };

  return (
    <Dialog open={!!viewAsset} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start justify-between border-b pb-4">
          <div>
            <DialogTitle className="text-xl flex items-center gap-2">{viewAsset.name} <StatusBadge status={viewAsset.status} /></DialogTitle>
            <div className="text-sm text-muted-foreground font-mono mt-1">{viewAsset.id}</div>
          </div>
          <div className="flex items-center gap-3">
            {viewAsset.healthScore !== undefined && (
              <div className="text-center">
                <div className={`text-2xl font-bold ${healthColor}`}>{viewAsset.healthScore}</div>
                <div className="text-xs text-muted-foreground">{viewAsset.healthCategory || "Health"}</div>
              </div>
            )}
            {viewAsset.imageUrl && (
              <div className="h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                <img src={`${BASE_URL}${viewAsset.imageUrl}`} alt={viewAsset.name} className="h-full w-full object-cover" />
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="history">Assignment</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="qr" id="qr-tab">QR Code</TabsTrigger>
            <TabsTrigger value="docs" onClick={loadDocs}>Documents</TabsTrigger>
            <TabsTrigger value="timeline" onClick={loadTimeline}>Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 space-y-4 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50 border">
              <div><div className="text-muted-foreground text-xs mb-1">Category</div><div className="font-medium">{viewAsset.category}</div></div>
              <div><div className="text-muted-foreground text-xs mb-1">Type</div><div className="font-medium">{viewAsset.type}</div></div>
              <div><div className="text-muted-foreground text-xs mb-1">Model Number</div><div className="font-medium">{viewAsset.modelNumber || "-"}</div></div>
              <div><div className="text-muted-foreground text-xs mb-1">Serial Number</div><div className="font-medium">{viewAsset.serial || "-"}</div></div>
              <div><div className="text-muted-foreground text-xs mb-1">Department</div><div className="font-medium">{viewAsset.department}</div></div>
              <div><div className="text-muted-foreground text-xs mb-1">Location</div><div className="font-medium">{viewAsset.location}</div></div>
              <div><div className="text-muted-foreground text-xs mb-1">Purchase Date</div><div className="font-medium">{new Date(viewAsset.purchaseDate).toLocaleDateString()}</div></div>
              <div><div className="text-muted-foreground text-xs mb-1">Cost</div><div className="font-medium">{inr(viewAsset.cost)}</div></div>
              <div><div className="text-muted-foreground text-xs mb-1">Warranty Expiry</div><div className="font-medium">{viewAsset.warranty || "-"}</div></div>
            </div>
            {viewAsset.description && (
              <div><div className="text-muted-foreground text-xs mb-1">Description</div><div className="text-sm p-3 rounded-md bg-muted/30 border">{viewAsset.description}</div></div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {viewAsset.allocations?.length > 0 ? (
              <div className="space-y-3">
                {viewAsset.allocations.map((al: any) => (
                  <div key={al.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> {al.employee.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">Assigned: {new Date(al.assignedAt).toLocaleDateString()}</div>
                    </div>
                    <StatusBadge status={al.status} />
                  </div>
                ))}
              </div>
            ) : <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">No assignment history</div>}
          </TabsContent>

          <TabsContent value="maintenance" className="mt-4">
            {viewAsset.maintenance?.length > 0 ? (
              <div className="space-y-3">
                {viewAsset.maintenance.map((m: any) => (
                  <div key={m.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="font-medium flex items-center gap-2"><Wrench className="h-4 w-4 text-warning" /> {m.type}</div>
                      <StatusBadge status={m.status} />
                    </div>
                    <div className="text-sm text-muted-foreground">{m.description || "No description provided"}</div>
                    <div className="text-xs flex gap-4 text-muted-foreground">
                      <span>Scheduled: {new Date(m.scheduled).toLocaleDateString()}</span>
                      {m.cost > 0 && <span>Cost: {inr(m.cost)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">No maintenance records</div>}
          </TabsContent>

          <TabsContent value="qr" className="mt-4">
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
              <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
                <QRCodeSVG value={viewAsset.id} size={200} level="H" />
              </div>
              <div className="font-mono text-sm font-semibold">{viewAsset.id}</div>
              <div className="text-sm text-muted-foreground mt-1">Scan this code using the QR Tracking module</div>
            </div>
          </TabsContent>

          <TabsContent value="docs" className="mt-4">
            {canAdd && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border bg-muted/30">
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Invoice", "Purchase Order", "Warranty Certificate", "Service Report", "User Manual"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
                <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  <Upload className="mr-2 h-4 w-4" />{uploading ? "Uploading..." : "Upload File"}
                </Button>
              </div>
            )}
            {docsLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading documents...</div>
            ) : docs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
                <File className="h-8 w-8 mx-auto mb-2 opacity-30" />No documents attached
              </div>
            ) : (
              <div className="space-y-2">
                {docs.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium text-sm">{d.fileName}</div>
                        <div className="text-xs text-muted-foreground">{d.fileType} · {d.uploadedBy} · {new Date(d.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`${BASE_URL}${d.filePath}`} target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5" /></a>
                      </Button>
                      {canAdd && (
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteDoc(d.id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            {timelineLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading timeline...</div>
            ) : timeline.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />No activity recorded yet
              </div>
            ) : (
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
                {timeline.map((item: any, i: number) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-4 top-1 h-4 w-4 rounded-full bg-muted border-2 border-border flex items-center justify-center text-[10px]">
                      {timelineIcons[item.type] || "•"}
                    </div>
                    <div className="p-3 border rounded-lg ml-2 bg-card">
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-medium text-sm">{item.action}</div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(item.timestamp).toLocaleString("en-IN")}</div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">{item.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">by {item.user}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── ADD/EDIT DIALOG ──────────────────────────────────────────────────────────
function AssetDialog({ vendors, asset, onSuccess, trigger }: { vendors: any[], asset?: any, onSuccess: () => void, trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    setSaving(true);
    try {
      const fd = new FormData(formRef.current);
      if (fd.get("vendorId") === "unassigned" || !fd.get("vendorId")) {
        fd.delete("vendorId");
      }
      
      if (asset) await updateAsset(asset.id, fd);
      else await createAsset(fd);
      
      toast.success(asset ? "Asset updated" : "Asset added successfully");
      setOpen(false);
      onSuccess();
    } catch {
      toast.error("Failed to save asset");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Asset</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{asset ? "Edit Asset" : "Register New Asset"}</DialogTitle></DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 mt-2">
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Asset Name *</Label><Input name="name" defaultValue={asset?.name} required /></div>
            <div className="space-y-1.5"><Label>Category *</Label>
              <Select name="category" defaultValue={asset?.category || "Rolling Stock"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rolling Stock">Rolling Stock</SelectItem>
                  <SelectItem value="Signalling">Signalling</SelectItem>
                  <SelectItem value="Track Equipment">Track Equipment</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Machinery">Machinery</SelectItem>
                  <SelectItem value="General">General IT/Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Model Number</Label><Input name="modelNumber" defaultValue={asset?.modelNumber} /></div>
            <div className="space-y-1.5"><Label>Serial Number</Label><Input name="serial" defaultValue={asset?.serial} /></div>
            
            <div className="space-y-1.5"><Label>Department *</Label><Input name="department" defaultValue={asset?.department} required /></div>
            <div className="space-y-1.5"><Label>Location *</Label><Input name="location" defaultValue={asset?.location} required /></div>
            
            <div className="space-y-1.5"><Label>Purchase Cost (₹) *</Label><Input type="number" name="cost" defaultValue={asset?.cost} required min="1" /></div>
            <div className="space-y-1.5"><Label>Purchase Date *</Label><Input type="date" name="purchaseDate" defaultValue={asset?.purchaseDate?.slice(0,10) || new Date().toISOString().slice(0,10)} required /></div>
            
            <div className="space-y-1.5"><Label>Warranty Expiry</Label><Input type="date" name="warranty" defaultValue={asset?.warranty} /></div>
            <div className="space-y-1.5"><Label>Vendor</Label>
              <Select name="vendorId" defaultValue={asset?.vendorId || "unassigned"}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Internal / Unknown</SelectItem>
                  {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input name="description" defaultValue={asset?.description} placeholder="Asset specs, conditions, etc." />
          </div>

          <div className="space-y-1.5">
            <Label>Asset Photo (Optional)</Label>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded border bg-muted"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>
              <Input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="flex-1" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Asset"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
