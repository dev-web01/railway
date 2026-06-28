import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  Active: "bg-success/15 text-success border-success/30",
  Maintenance: "bg-warning/15 text-warning border-warning/30",
  Disposed: "bg-muted text-muted-foreground border-border",
  Approved: "bg-success/15 text-success border-success/30",
  Pending: "bg-warning/15 text-warning border-warning/30",
  Rejected: "bg-destructive/15 text-destructive border-destructive/30",
  "In Transit": "bg-info/15 text-info border-info/30",
  Scheduled: "bg-info/15 text-info border-info/30",
  "In Progress": "bg-warning/15 text-warning border-warning/30",
  Completed: "bg-success/15 text-success border-success/30",
  Expired: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={cn("font-medium", map[status] ?? "")}>{status}</Badge>;
}
