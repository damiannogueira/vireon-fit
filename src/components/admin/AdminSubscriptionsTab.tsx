import { useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

type SubStatus = Database["public"]["Enums"]["subscription_status"];

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubStatus;
  started_at: string;
  expires_at: string | null;
  subscription_plans?: { name: string; price_usd: number } | null;
}

interface Props {
  subscriptions: Subscription[] | undefined;
}

export const AdminSubscriptionsTab = ({ subscriptions }: Props) => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleChangeStatus = async (subId: string, newStatus: SubStatus) => {
    try {
      const { error } = await supabase.from("user_subscriptions").update({ status: newStatus }).eq("id", subId);
      if (error) throw error;
      toast.success(t.admin.subscriptionUpdated);
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      // user_subscriptions doesn't have a DELETE RLS policy, so we cancel instead
      const { error } = await supabase.from("user_subscriptions").update({ 
        status: "cancelled" as SubStatus, 
        cancelled_at: new Date().toISOString() 
      }).eq("id", deleteId);
      if (error) throw error;
      toast.success(t.admin.subscriptionDeleted);
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    } catch (e: any) {
      toast.error(e.message);
    }
    setDeleteId(null);
  };

  return (
    <>
      <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.admin.plan}</TableHead>
              <TableHead>{t.admin.status}</TableHead>
              <TableHead>{t.admin.startedAt}</TableHead>
              <TableHead>{t.admin.expiresAt}</TableHead>
              <TableHead>{t.admin.userId}</TableHead>
              <TableHead>{t.admin.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions?.length ? subscriptions.map(sub => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">
                  {(sub as any).subscription_plans?.name || "—"}
                </TableCell>
                <TableCell>
                  <Select value={sub.status} onValueChange={(v) => handleChangeStatus(sub.id, v as SubStatus)}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue>
                        <Badge variant={sub.status === "active" ? "default" : "secondary"}>{sub.status}</Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t.admin.active}</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(sub.started_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{sub.user_id.slice(0, 8)}...</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(sub.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t.admin.noData}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin.deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{t.admin.deleteConfirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t.common.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
