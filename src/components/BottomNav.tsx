import { useLocation, useNavigate } from "react-router-dom";
import { Home, Dumbbell, Trophy, User, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();

  const navItems = [
    { path: "/dashboard", icon: Home, label: t.nav.dashboard },
    { path: "/workout", icon: Dumbbell, label: t.nav.workout },
    { path: "/gym", icon: LayoutGrid, label: t.nav.gym },
    { path: "/achievements", icon: Trophy, label: t.nav.achievements },
    { path: "/profile", icon: User, label: t.nav.profile },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_hsl(142_72%_50%/0.6)]")} />
              <span className="text-[10px] font-medium">{label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_hsl(142_72%_50%/0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
