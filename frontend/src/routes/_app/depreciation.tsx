import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Search, TrendingDown, DollarSign, Calculator, Calendar } from "lucide-react";
import { fetchAssets, BASE_URL } from "@/lib/api-client";
import { inr } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/depreciation")({
  head: () => ({ meta: [{ title: "Asset Depreciation · R-AMS" }] }),
  component: DepreciationPage,
});

type DepRow = {
  id: string; name: string; category: string; location: string;
  cost: number; salvageValue: number; usefulLifeYears: number;
  yearsOwned: number; annualDepreciation: number;
  accumulatedDepreciation: number; bookValue: number; pctDepreciated: number; status: string;
};

function DepreciationPage() {
  const [rows, setRows] = useState<DepRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/api/depreciation`)
      .then((r) => r.json())
      .then(setRows)
      .catch(() => toast.error("Failed to load depreciation data"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = rows.filter((r) =>
    [r.id, r.name, r.category, r.location].some((v) => v.toLowerCase().includes(q.toLowerCase()))
  );

  const totalBookValue = filtered.reduce((s, r) => s + r.bookValue, 0);
  const totalOriginalCost = filtered.reduce((s, r) => s + r.cost, 0);
  const totalAccumulated = filtered.reduce((s, r) => s + r.accumulatedDepreciation, 0);

  const handleExport = () => {
    const csv = [
      ["ID", "Name", "Category", "Cost", "Salvage Value", "Useful Life (yrs)", "Years Owned", "Annual Depreciation", "Accumulated Dep.", "Book Value", "% Deprecated"],
      ...filtered.map((r) => [r.id, r.name, r.category, r.cost, r.salvageValue, r.usefulLifeYears, r.yearsOwned, r.annualDepreciation, r.accumulatedDepreciation, r.bookValue, r.pctDepreciated])
    ].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "depreciation-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Depreciation report exported");
  };

  return (
    <div>
      <PageHeader
        title="Asset Depreciation"
        description="Straight-line depreciation tracking for all active assets"
        actions={<Button size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export Report</Button>}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase">Total Original Cost</div>
              <div className="text-xl font-bold">{inr(totalOriginalCost)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase">Total Accumulated Depreciation</div>
              <div className="text-xl font-bold">{inr(totalAccumulated)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <Calculator className="h-6 w-6 text-success" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase">Total Book Value</div>
              <div className="text-xl font-bold">{inr(totalBookValue)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Method note */}
      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3 text-sm">
          <Calculator className="h-5 w-5 text-primary shrink-0" />
          <span><strong>Method:</strong> Straight-Line Depreciation — Annual Depreciation = (Cost − Salvage Value) ÷ Useful Life Years</span>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b border-border p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search assets…" className="pl-9" />
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Calculating depreciation…</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Original Cost</TableHead>
                    <TableHead>Salvage Value</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Years Owned</div>
                    </TableHead>
                    <TableHead>Annual Dep.</TableHead>
                    <TableHead>Accumulated Dep.</TableHead>
                    <TableHead>Book Value</TableHead>
                    <TableHead>Depreciation %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-mono text-xs text-primary">{r.id}</div>
                        <div className="font-medium text-sm">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.category}</div>
                      </TableCell>
                      <TableCell className="font-medium">{inr(r.cost)}</TableCell>
                      <TableCell>{inr(r.salvageValue)}</TableCell>
                      <TableCell>{r.yearsOwned} yrs</TableCell>
                      <TableCell className="text-destructive">{inr(r.annualDepreciation)}/yr</TableCell>
                      <TableCell className="text-destructive font-medium">{inr(r.accumulatedDepreciation)}</TableCell>
                      <TableCell className="text-success font-semibold">{inr(r.bookValue)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={r.pctDepreciated} className="h-1.5 flex-1" />
                          <span className={`text-xs w-10 ${r.pctDepreciated > 75 ? "text-destructive" : r.pctDepreciated > 50 ? "text-warning" : "text-muted-foreground"}`}>
                            {r.pctDepreciated}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No assets found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
