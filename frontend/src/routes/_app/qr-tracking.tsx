import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, QrCode, ArrowRight, ShieldCheck, UserCheck, Wrench, AlertTriangle, ArrowLeftRight, CheckCircle2, CheckCircle, Activity, Box, Search, RotateCcw } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { scanQR, verifyAsset, fetchQRAnalytics, BASE_URL } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/qr-tracking")({
  head: () => ({ meta: [{ title: "QR Tracking · R-AMS" }] }),
  component: QRTrackingPage,
});

function QRTrackingPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verifyMode, setVerifyMode] = useState(false);
  
  // Analytics
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchQRAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (scanning) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render(
        async (text) => {
          scanner?.clear();
          setScanning(false);
          setLoading(true);
          try {
            const asset = await scanQR(text, navigator.userAgent);
            setResult(asset);
            toast.success("Asset identified successfully");
          } catch (e: any) {
            toast.error(e.message || "Invalid QR Code or Asset Not Found");
          } finally {
            setLoading(false);
          }
        },
        (error) => { /* Ignore periodic scan failures */ }
      );
    }
    
    return () => { scanner?.clear().catch(() => {}); };
  }, [scanning]);

  const { user } = useAuth();
  const userRole = user?.role || "Employee";

  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [condition, setCondition] = useState("Good");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await verifyAsset({ assetId: result.id, condition, notes });
      toast.success("Verification report generated successfully!");
      setVerifyDialogOpen(false);
      // Refresh analytics
      fetchQRAnalytics().then(setAnalytics).catch(() => {});
    } catch (error: any) {
      toast.error(error.message || "Failed to verify asset");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-10">
      <PageHeader
        title="QR Code Tracking & Verification"
        description="Unified hub for asset scanning, physical verification, and analytics"
      />

      <Tabs defaultValue="scanner" className="mt-4 space-y-6">
        <TabsList>
          <TabsTrigger value="scanner"><ScanLine className="h-4 w-4 mr-2" /> Scanner & Actions</TabsTrigger>
          <TabsTrigger value="analytics"><Activity className="h-4 w-4 mr-2" /> Scan Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-6 m-0">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Scanner Panel */}
            <Card className="flex flex-col relative overflow-hidden">
              <div className={`absolute top-0 inset-x-0 h-1 transition-colors ${verifyMode ? "bg-warning" : "bg-primary"}`}></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5" /> Live Scanner
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Switch checked={verifyMode} onCheckedChange={(v) => { setVerifyMode(v); if(v) toast.info("Physical Verification Mode Enabled"); }} id="verify-mode" />
                  <Label htmlFor="verify-mode" className={`font-semibold cursor-pointer ${verifyMode ? "text-warning" : "text-muted-foreground"}`}>Verification Mode</Label>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center p-6 min-h-[350px]">
                {!scanning && !loading && (
                  <div className="text-center space-y-4 w-full">
                    <div className={`mx-auto w-32 h-32 border-4 border-dashed rounded-xl flex items-center justify-center bg-muted/20 ${verifyMode ? "border-warning/50 text-warning" : "border-primary/30 text-primary/40"}`}>
                      {verifyMode ? <ShieldCheck className="w-12 h-12" /> : <QrCode className="w-12 h-12" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{verifyMode ? "Ready for Verification" : "Ready to Scan"}</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        {verifyMode ? "Point camera at the asset to verify its physical existence and log its current condition." : "Point your device camera at the asset's QR code to fetch records and actions."}
                      </p>
                    </div>
                    <Button size="lg" variant={verifyMode ? "secondary" : "default"} className="w-full sm:w-auto mt-4" onClick={() => { setResult(null); setScanning(true); }}>
                      <ScanLine className="mr-2 h-5 w-5" /> Start Camera
                    </Button>
                  </div>
                )}
                
                {loading && <div className="text-center py-12 animate-pulse font-medium text-primary">Fetching asset data from server...</div>}
                
                <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-lg" style={{ display: scanning ? 'block' : 'none' }}></div>
              </CardContent>
            </Card>

            {/* Scan Result View Panel */}
            <Card>
              <CardHeader className="border-b bg-muted/20">
                <CardTitle>Scan Results</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {!result ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[350px] px-4 text-center text-muted-foreground">
                    <QrCode className="h-12 w-12 mb-3 opacity-20" />
                    <p>Scan a QR code to load asset information and actions</p>
                  </div>
                ) : (
                  <div className="p-0 animate-in fade-in zoom-in-95 duration-200">
                    {/* Header Profile */}
                    <div className="p-6 border-b flex flex-col sm:flex-row gap-6">
                      {result.imageUrl ? (
                        <div className="w-24 h-24 rounded-lg border bg-muted flex-shrink-0 overflow-hidden">
                          <img src={`${BASE_URL}${result.imageUrl}`} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-lg border bg-muted flex flex-shrink-0 items-center justify-center">
                          <Box className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h2 className="text-xl font-bold">{result.name}</h2>
                            <p className="text-sm text-muted-foreground font-mono mt-0.5">{result.id}</p>
                          </div>
                          <StatusBadge status={result.status} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-2 text-sm pt-2">
                          <div><span className="text-muted-foreground text-xs block uppercase">Category</span>{result.category}</div>
                          <div><span className="text-muted-foreground text-xs block uppercase">Location</span>{result.location}</div>
                          <div><span className="text-muted-foreground text-xs block uppercase">Warranty</span>{result.warranty ? new Date(result.warranty).toLocaleDateString() : 'N/A'}</div>
                          <div>
                            <span className="text-muted-foreground text-xs block uppercase">Last Maint.</span>
                            {result.maintenance?.length > 0 ? new Date(result.maintenance[0].scheduled).toLocaleDateString() : 'None'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Assignment Status */}
                    <div className="p-6 border-b bg-muted/10">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Current Assignment</h3>
                      {result.allocations?.length > 0 && result.allocations[0].status === "Active" ? (
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {result.allocations[0].employee.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{result.allocations[0].employee.name}</div>
                            <div className="text-xs text-muted-foreground">{result.allocations[0].employee.department} · {result.allocations[0].employee.designation}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <div className="h-10 w-10 rounded-full bg-muted border flex items-center justify-center">?</div>
                          <span>Not currently assigned to any employee</span>
                        </div>
                      )}
                    </div>

                    {/* Role-Based Actions */}
                    <div className="p-6">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        {verifyMode ? "Verification Action" : "Actions (" + userRole + ")"}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {verifyMode ? (
                          <Button size="lg" className="sm:col-span-2" onClick={() => setVerifyDialogOpen(true)}>
                            <ShieldCheck className="mr-2 h-5 w-5" /> Generate Verification Report
                          </Button>
                        ) : (
                          <>
                            {/* STORE KEEPER ACTIONS */}
                            {userRole === "Store Keeper" && (
                              <>
                                <Button variant="outline" className="justify-start h-12" onClick={() => navigate({ to: "/allocations" })}>
                                  <UserCheck className="mr-2 h-4 w-4" /> Issue Asset
                                </Button>
                                <Button variant="outline" className="justify-start h-12" onClick={() => navigate({ to: "/allocations" })}>
                                  <RotateCcw className="mr-2 h-4 w-4" /> Receive Asset
                                </Button>
                                <Button variant="outline" className="justify-start h-12 sm:col-span-2" onClick={() => toast.info("Opening Transfer dialog...")}>
                                  <ArrowLeftRight className="mr-2 h-4 w-4" /> Transfer Asset
                                </Button>
                              </>
                            )}

                            {/* SUPERVISOR ACTIONS */}
                            {(userRole === "Supervisor" || userRole === "Admin") && (
                              <>
                                <Button variant="outline" className="justify-start h-12" onClick={() => navigate({ to: "/allocations" })}>
                                  <UserCheck className="mr-2 h-4 w-4" /> Assign Asset
                                </Button>
                                <Button variant="outline" className="justify-start h-12 text-warning hover:text-warning" onClick={() => toast.info("Opening Maintenance log...")}>
                                  <Wrench className="mr-2 h-4 w-4" /> Maintenance Req.
                                </Button>
                                <Button variant="outline" className="justify-start h-12 sm:col-span-2" onClick={() => navigate({ to: "/assets" })}>
                                  <Search className="mr-2 h-4 w-4" /> View Full History
                                </Button>
                              </>
                            )}

                            {/* EMPLOYEE ACTIONS */}
                            {userRole === "Employee" && (
                              <>
                                <Button variant="outline" className="justify-start h-12" onClick={() => navigate({ to: "/assets" })}>
                                  <Search className="mr-2 h-4 w-4" /> View Details
                                </Button>
                                <Button variant="outline" className="justify-start h-12 text-destructive hover:text-destructive" onClick={() => toast.info("Maintenance request flagged")}>
                                  <AlertTriangle className="mr-2 h-4 w-4" /> Report Issue
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="m-0">
          <div className="grid sm:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Total Scans</p>
                  <ScanLine className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{analytics?.totalScans || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all devices</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Verified Assets</p>
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{analytics?.verifiedAssetsCount || 0} <span className="text-sm font-normal text-muted-foreground">/ {analytics?.totalAssets || 0}</span></div>
                <p className="text-xs text-muted-foreground mt-1">Physically verified on site</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Verification Rate</p>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{analytics?.verificationRate || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">Completion percentage</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Most Scanned Assets</CardTitle>
              <CardDescription>The top 5 assets scanned across the organization</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.mostScanned?.length > 0 ? (
                <div className="space-y-4">
                  {analytics.mostScanned.map((asset: any) => (
                    <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                          <Box className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{asset.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        <ScanLine className="h-3.5 w-3.5" />
                        {asset.scans} scans
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm border rounded-lg bg-muted/20">
                  No scan analytics available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Verification Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleVerifySubmit}>
            <DialogHeader>
              <DialogTitle>Physical Verification</DialogTitle>
              <DialogDescription>
                Submit a condition report to verify the physical existence of {result?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Current Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Good">Good - No issues</SelectItem>
                    <SelectItem value="Fair">Fair - Minor wear</SelectItem>
                    <SelectItem value="Poor">Poor - Needs attention</SelectItem>
                    <SelectItem value="Damaged">Damaged - Unusable</SelectItem>
                    <SelectItem value="Missing">Missing - Not found</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Verification Notes (Optional)</Label>
                <Textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any visual damage or discrepancies..." 
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple Switch component for local use to avoid importing full shadcn switch if missing
function Switch({ checked, onCheckedChange, id }: { checked: boolean, onCheckedChange: (c: boolean) => void, id: string }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${checked ? 'bg-primary' : 'bg-input'}`}
    >
      <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}
