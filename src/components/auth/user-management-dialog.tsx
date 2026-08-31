import { useEffect, useState } from "react";
import {
  Users,
  Shield,
  UserPlus,
  Loader2,
  Check,
  X,
  AlertCircle,
  Mail,
  User,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  listTersiaUsers,
  updateTersiaUserRole,
  updateTersiaUserActive,
  supabase,
  type TersiaUserWithRole,
  type TersiaRole,
} from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

export function UserManagementDialog() {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<TersiaUserWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Formulário para novo usuário
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<TersiaRole>("participante");
  const [addLoading, setAddLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await listTersiaUsers();
      setUsers(data);
    } catch (err) {
      setErrorMessage("Erro ao carregar lista de usuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && isAdmin) {
      void loadUsers();
    }
  }, [open, isAdmin]);

  const handleRoleChange = async (userId: string, targetRole: TersiaRole) => {
    setActionLoading(userId);
    try {
      const res = await updateTersiaUserRole(userId, targetRole);
      if (res.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u)));
      } else {
        setErrorMessage(res.error || "Não foi possível alterar a função.");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    setActionLoading(userId);
    try {
      const res = await updateTersiaUserActive(userId, !currentActive);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, active: !currentActive } : u)),
        );
      } else {
        setErrorMessage(res.error || "Não foi possível alterar o status do usuário.");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: {
            system: "tersia",
            full_name: newFullName,
            role: newRole,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setShowAddForm(false);
      setNewEmail("");
      setNewPassword("");
      setNewFullName("");
      setNewRole("participante");
      await loadUsers();
    } catch (err) {
      setErrorMessage("Erro ao criar novo usuário.");
    } finally {
      setAddLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl border-border/80 text-xs font-semibold hover:bg-muted cursor-pointer"
        >
          <Users className="h-4 w-4 text-primary" />
          <span>Usuários</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl rounded-3xl border-border bg-card p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Gerenciamento de Acesso
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Controle de membros e permissões do Tersia Dashboard
                </DialogDescription>
              </div>
            </div>

            <Button
              size="sm"
              variant={showAddForm ? "ghost" : "default"}
              onClick={() => setShowAddForm(!showAddForm)}
              className="gap-1.5 rounded-xl text-xs font-semibold cursor-pointer"
            >
              {showAddForm ? (
                <>
                  <X className="h-3.5 w-3.5" /> Cancelar
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" /> Novo Usuário
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        {errorMessage && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulário de Criação de Usuário */}
        {showAddForm && (
          <form
            onSubmit={handleCreateUser}
            className="mt-4 space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
              Cadastrar Novo Membro
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Nome Completo
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="Nome do membro"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  E-mail
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    placeholder="email@clinica.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Senha Inicial
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Função
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as TersiaRole)}
                  className="w-full rounded-lg border border-border bg-background py-1.5 px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="participante">Participante (Apenas Visualizar)</option>
                  <option value="admin">Administrador (Total + Uploads)</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={addLoading}
              className="w-full gap-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              {addLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cadastrando...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" /> Confirmar Cadastro
                </>
              )}
            </Button>
          </form>
        )}

        {/* Lista de Usuários */}
        <div className="mt-4 max-h-[360px] overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-xs">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Carregando usuários...
            </div>
          ) : users.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Nenhum usuário cadastrado no Tersia ainda.
            </p>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 p-3.5 transition hover:bg-muted/60"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {u.full_name || u.email}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        u.role === "admin"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {u.role === "admin" ? (
                        <>
                          <Shield className="h-3 w-3" /> Administrador
                        </>
                      ) : (
                        <>
                          <Users className="h-3 w-3" /> Participante
                        </>
                      )}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{u.email}</p>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2">
                  <select
                    value={u.role}
                    disabled={actionLoading === u.id}
                    onChange={(e) => void handleRoleChange(u.id, e.target.value as TersiaRole)}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground focus:outline-none"
                  >
                    <option value="participante">Participante</option>
                    <option value="admin">Administrador</option>
                  </select>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={actionLoading === u.id}
                    onClick={() => void handleToggleActive(u.id, u.active)}
                    className={`h-7 px-2 text-[11px] rounded-lg cursor-pointer ${
                      u.active
                        ? "text-success hover:bg-success-soft"
                        : "text-destructive hover:bg-danger-soft"
                    }`}
                  >
                    {u.active ? "Ativo" : "Inativo"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
