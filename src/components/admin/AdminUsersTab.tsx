import { useI18n } from "@/i18n";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  level: number;
  xp: number;
}

interface Props {
  profiles: Profile[] | undefined;
}

export const AdminUsersTab = ({ profiles }: Props) => {
  const { t } = useI18n();

  return (
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.admin.userName}</TableHead>
            <TableHead>{t.admin.userLevel}</TableHead>
            <TableHead>{t.admin.userXP}</TableHead>
            <TableHead>ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles?.length ? profiles.map(p => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.display_name || "—"}</TableCell>
              <TableCell>{p.level}</TableCell>
              <TableCell>{p.xp} XP</TableCell>
              <TableCell className="text-xs text-muted-foreground font-mono">{p.user_id.slice(0, 8)}...</TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t.admin.noData}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
