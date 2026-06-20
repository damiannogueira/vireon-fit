import { useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/i18n";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function NotificationBell() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30000, // poll every 30s
  });

  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return locale === "es" ? "ahora" : "now";
    if (mins < 60)
      return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)
      return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label={locale === "es" ? `Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}` : `Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          className="relative w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[340px] sm:w-[400px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>
              {locale === "es" ? "Notificaciones" : "Notifications"}
            </SheetTitle>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary font-medium hover:underline"
              >
                {locale === "es" ? "Marcar todo leído" : "Mark all read"}
              </button>
            )}
          </div>
        </SheetHeader>
        <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
          {notifications && notifications.length > 0 ? (
            notifications.map((n: any) => (
              <button
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all",
                  n.is_read
                    ? "bg-card border-border/30 opacity-60"
                    : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-foreground leading-tight">
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                {n.message && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {n.message}
                  </p>
                )}
                {!n.is_read && (
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {locale === "es"
                ? "No tenés notificaciones"
                : "No notifications"}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
