import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Gym {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  is_active: boolean | null;
  owner_id: string | null;
  created_at: string;
}

interface Props {
  gyms: Gym[] | undefined;
}

export const AdminGymsTab = ({ gyms }: Props) => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Gym | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", address: "", is_active: true });
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", address: "", is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (gym: Gym) => {
    setEditing(gym);
    setForm({ name: gym.name, slug: gym.slug, address: gym.address || "", is_active: gym.is_active ?? true });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) return;
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from("gyms").update({
          name: form.name, slug: form.slug, address: form.address || null, is_active: form.is_active,
        }).eq("id", editing.id);
        if (error) throw error;
        toast.success(t.admin.gymUpdated);
      } else {
        const { error } = await supabase.from("gyms").insert({
          name: form.name, slug: form.slug, address: form.address || null, is_active: form.is_active,
        });
        if (error) throw error;
        toast.success(t.admin.gymCreated);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-gyms"] });
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("gyms").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success(t.admin.gymDeleted);
      queryClient.invalidateQueries({ queryKey: ["admin-gyms"] });
    } catch (e: any) {
      toast.error(e.message);
    }
    setDeleteId(null);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" /> {t.admin.createGym}
        </Button>
      </div>
      <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.admin.gymName}</TableHead>
              <TableHead>{t.admin.gymSlug}</TableHead>
              <TableHead>{t.admin.gymStatus}</TableHead>
              <TableHead>{t.admin.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gyms?.length ? gyms.map(gym => (
              <TableRow key={gym.id}>
                <TableCell className="font-medium">{gym.name}</TableCell>
                <TableCell className="text-muted-foreground">{gym.slug}</TableCell>
                <TableCell>
                  <Badge variant={gym.is_active ? "default" : "secondary"}>
                    {gym.is_active ? t.admin.active : t.admin.inactive}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(gym)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(gym.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t.admin.editGym : t.admin.createGym}</DialogTitle>
            <DialogDescription>{editing ? t.admin.editGym : t.admin.createGym}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.admin.gymName}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>{t.admin.gymSlug}</Label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s/g, "-") }))} />
            </div>
            <div>
              <Label>{t.admin.gymAddress}</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>{t.admin.active}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.slug}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin.deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{t.admin.deleteGymConfirm}</AlertDialogDescription>
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
