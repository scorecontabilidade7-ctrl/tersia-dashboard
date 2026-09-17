import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  LogOut,
  Shield,
  User as UserIcon,
  Menu,
  X,
  PanelLeftClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

export type NavModule = "financeiro" | "agendamentos" | "usuarios";

interface AppSidebarProps {
  activeModule: NavModule;
  onSelectModule: (module: NavModule) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AppSidebar({
  activeModule,
  onSelectModule,
  collapsed = false,
  onToggleCollapse,
}: AppSidebarProps) {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";
  const userEmail = user?.email || "";

  const handleSelect = (module: NavModule) => {
    onSelectModule(module);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    {
      id: "financeiro" as NavModule,
      label: "Painel Financeiro",
      description: "KPIs, DRE e Despesas",
      icon: LayoutDashboard,
    },
    {
      id: "agendamentos" as NavModule,
      label: "Agendamentos",
      description: isAdmin ? "Painel 4Medic & Pacientes" : "Consultas & Pacientes",
      icon: CalendarDays,
    },
    {
      id: "usuarios" as NavModule,
      label: "Usuários",
      description: isAdmin ? "Gestão de Acessos" : "Meu Acesso",
      icon: Users,
      badge: isAdmin ? "Admin" : undefined,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4 md:p-5">
      {/* Top: Logo, Branding & Close Button */}
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2.5 pb-4 border-b border-border/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative group shrink-0">
              <img
                src="/logo-dra-tersia.jpeg"
                alt="Logo Dra. Térsia"
                className="h-11 w-11 rounded-2xl object-cover ring-2 ring-primary/20 shadow-sm transition-transform group-hover:scale-105"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card shadow-2xs" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-base font-black tracking-tight text-foreground truncate block leading-tight">
                Dra. Térsia
              </span>
              <p className="text-[11px] font-medium text-muted-foreground truncate mt-0.5">
                Gestão Executiva
              </p>
            </div>
          </div>

          {/* Botão de Fechar Sidebar no Desktop */}
          {onToggleCollapse && (
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleCollapse}
              className="hidden md:flex h-8 w-8 rounded-xl border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer shrink-0 shadow-2xs"
              title="Recolher menu lateral"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="space-y-1.5">
          <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Navegação
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer group text-left",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground group-hover:text-foreground group-hover:bg-muted/80",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate leading-tight font-bold">{item.label}</p>
                      <p
                        className={cn(
                          "text-[10px] font-normal truncate mt-0.5",
                          isActive ? "text-primary-foreground/80" : "text-muted-foreground/70",
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        "ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-primary/10 text-primary border border-primary/20",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom: User Profile & Logout */}
      <div className="pt-4 border-t border-border/70 space-y-2.5">
        {/* User Card */}
        <div className="rounded-2xl bg-muted/60 dark:bg-muted/30 p-3 border border-border/80 shadow-xs hover:border-border transition-all">
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-xs ring-2 ring-primary/20">
              {displayName.charAt(0).toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-foreground leading-tight truncate">{displayName}</p>
              <p className="text-[11px] font-medium text-muted-foreground truncate mt-0.5">{userEmail}</p>
              <div className="mt-1.5 flex items-center">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 text-primary border border-primary/25 px-2 py-0.5 text-[10px] font-bold">
                    <Shield className="h-3 w-3" /> Administrador
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-background text-foreground/80 border border-border/80 px-2 py-0.5 text-[10px] font-semibold shadow-2xs">
                    <UserIcon className="h-3 w-3 text-muted-foreground" /> Participante
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          size="sm"
          disabled={isLoggingOut}
          onClick={() => void handleSignOut()}
          className="w-full justify-center gap-2 rounded-xl border border-border/80 bg-card text-xs font-bold text-foreground/80 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all cursor-pointer h-9 shadow-2xs"
        >
          <LogOut className="h-4 w-4" />
          <span>{isLoggingOut ? "Saindo..." : "Sair da conta"}</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed & Collapsible) */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed inset-y-0 left-0 w-64 lg:w-72 bg-card border-r border-border/70 z-30 shadow-xs transition-transform duration-300 ease-in-out",
          collapsed ? "-translate-x-full" : "translate-x-0",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Topbar with Hamburger */}
      <div className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/70 bg-card/95 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo-dra-tersia.jpeg"
            alt="Logo Dra. Térsia"
            className="h-8 w-8 rounded-lg object-contain ring-1 ring-border"
          />
          <span className="text-sm font-black tracking-tight text-foreground">Dra. Térsia</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-xl h-9 w-9 text-foreground cursor-pointer"
          aria-label="Abrir menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Drawer Backdrop and Sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-card shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="absolute right-3 top-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
