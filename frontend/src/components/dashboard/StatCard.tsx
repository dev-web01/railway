import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label, value, icon, trend, accent = "primary",
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  trend?: { value: string; up?: boolean };
  accent?: "primary" | "success" | "warning" | "info" | "destructive";
}) {
  const accents: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/10 text-info",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-2 text-2xl font-bold">{value}</div>
            {trend && (
              <div className={cn("mt-1 text-xs font-medium", trend.up ? "text-success" : "text-destructive")}>
                {trend.up ? "▲" : "▼"} {trend.value}
              </div>
            )}
          </div>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", accents[accent])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
