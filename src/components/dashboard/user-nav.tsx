import { LogOut, Shield, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { UserManagementDialog } from "@/components/auth/user-management-dialog";

export function UserNav() {
  const { user, profile, role, isAdmin, signOut } = useAuth();

  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Usuário";

  return (
    <div className="flex items-center gap-2">
      {/* Botão de Usuários (Apenas Admin) */}
      {isAdmin && <UserManagementDialog />}

      {/* Identificação do Usuário */}
      <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-1.5 border border-border/60 shadow-xs">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <User className="h-4 w-4" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-bold text-foreground leading-none truncate max-w-[130px]">
            {displayName}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 font-medium">
            {isAdmin ? (
              <span className="text-primary flex items-center gap-0.5 font-semibold">
                <Shield className="h-2.5 w-2.5" /> Admin
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-0.5">
                <Users className="h-2.5 w-2.5" /> Participante
              </span>
            )}
          </p>
        </div>

        {/* Botão Sair */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void signOut()}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-danger-soft cursor-pointer ml-1"
          title="Sair da conta"
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
