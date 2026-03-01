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

type AppRole = Database["public"]["Enums"]["app_role"];

interface Role {
  id: string;
  user_id: string;
  role: AppRole;
  gym_id: string | null;
}

interface Props {
  roles: Role[] | undefined;
}

export const AdminRolesTab = ({ roles }: Props) => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const roleLabel = (role: string) => {
    switch (role) {
      case "admin": return t.admin.superAdmin;
      case "gym_admin": return t.admin.gymAdmin;
      default: return t.admin.user;
    }
  };

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive" as const;
      case "gym_admin": return "default" as const;
      default: return "secondary" as const;
    }
  };

  const handleChangeRole = async (roleRecord: Role, newRole: AppRole) => {
    try {
      const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("id", roleRecord.id);
      if (error) throw error;
      toast.success(t.admin.roleUpdated);
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("user_roles").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success(t.admin.roleDeleted);
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
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
              <TableHead>{t.admin.userId}</TableHead>
              <TableHead>{t.admin.role}</TableHead>
              <TableHead>{t.admin.userGym}</TableHead>
              <TableHead>{t.admin.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles?.length ? roles.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-mono text-muted-foreground">{r.user_id.slice(0, 8)}...</TableCell>
                <TableCell>
                  <Select value={r.role} onValueChange={(v) => handleChangeRole(r, v as AppRole)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue>
                        <Badge variant={roleBadgeVariant(r.role)}>{roleLabel(r.role)}</Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{t.admin.user}</SelectItem>
                      <SelectItem value="gym_admin">{t.admin.gymAdmin}</SelectItem>
                      <SelectItem value="admin">{t.admin.superAdmin}</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {r.gym_id ? `${r.gym_id.slice(0, 8)}...` : "—"}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t.admin.noData}</TableCell>
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
