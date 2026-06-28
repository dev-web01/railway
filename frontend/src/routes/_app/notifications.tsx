import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, CheckCheck, ArrowLeftRight, Wrench, ShieldCheck, Trash2, Package, AlertTriangle } from "lucide-react";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications · R-AMS" }] }),
  component: NotificationsPage,
});

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  ASSIGNMENT: { icon: Package, color: "text-primary", bg: "bg-primary/10" },
  RETURN: { icon: ArrowLeftRight, color: "text-success", bg: "bg-success/10" },
  TRANSFER: { icon: ArrowLeftRight, color: "text-info", bg: "bg-info/10" },
  MAINTENANCE: { icon: Wrench, color: "text-warning", bg: "bg-warning/10" },
  WARRANTY: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  DISPOSAL: { icon: Trash2, color: "text-destructive", bg: "bg-destructive/10" },
  VERIFICATION: { icon: ShieldCheck, color: "text-success", bg: "bg-success/10" },
};

function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load notifications"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { toast.error("Failed to mark as read"); }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch { toast.error("Failed"); }
  };

  const filtered = filter === "unread" ? notifications.filter(n => !n.isRead) : notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString("en-IN");
  };

  return (
    <div>
      <PageHeader
        title="Notification Center"
        description="Stay informed about asset assignments, maintenance, and system events"
        actions={
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAll}>
                <CheckCheck className="mr-2 h-4 w-4" /> Mark All Read
              </Button>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{notifications.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Unread</p>
          <p className="text-2xl font-bold text-primary">{unreadCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Read</p>
          <p className="text-2xl font-bold text-muted-foreground">{notifications.length - unreadCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Types</p>
          <p className="text-2xl font-bold">{new Set(notifications.map(n => n.type)).size}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notifications
            {unreadCount > 0 && <Badge className="bg-primary text-primary-foreground">{unreadCount}</Badge>}
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
            <Button size="sm" variant={filter === "unread" ? "default" : "outline"} onClick={() => setFilter("unread")}>Unread</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {loading ? (
            <div className="p-10 text-center text-muted-foreground">Loading notifications...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-muted-foreground gap-3">
              <BellOff className="h-12 w-12 opacity-20" />
              <p>No notifications to show</p>
            </div>
          ) : (
            filtered.map(n => {
              const config = typeConfig[n.type] || { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" };
              const Icon = config.icon;
              return (
                <div
                  key={n.id}
                  className={cn("flex items-start gap-4 p-4 transition-colors hover:bg-muted/30 cursor-pointer", !n.isRead && "bg-primary/5 border-l-4 border-l-primary")}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`font-medium text-sm ${!n.isRead ? "" : "text-muted-foreground"}`}>{n.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs px-1.5 py-0">{n.type}</Badge>
                      {n.targetRole && <Badge variant="outline" className="text-xs px-1.5 py-0">{n.targetRole}</Badge>}
                      {!n.isRead && <span className="text-xs text-primary font-medium">• Unread</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
