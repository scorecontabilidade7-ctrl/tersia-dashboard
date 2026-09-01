import { useEffect, useState, useMemo } from "react";
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
  Search,
  CheckCircle2,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

export function UserManagementView() {
  const { user, profile, isAdmin } = useAuth();
  const [users, setUsers] = useState<TersiaUserWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "participante">("all");

  // Modal de cadastro
  const [openModal, setOpenModal] = useState(false);
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
    if (isAdmin) {
      void loadUsers();
    }
  }, [isAdmin]);

  const handleRoleChange = async (userId: string, targetRole: TersiaRole) => {
    setActionLoading(userId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await updateTersiaUserRole(userId, targetRole);
      if (res.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u)));
        setSuccessMessage("Função de acesso atualizada com sucesso.");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(res.error || "Não foi possível alterar a função.");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    setActionLoading(userId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await updateTersiaUserActive(userId, !currentActive);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, active: !currentActive } : u)),
        );
        setSuccessMessage(
          `Usuário ${!currentActive ? "ativado" : "desativado"} com sucesso.`,
        );
        setTimeout(() => setSuccessMessage(null), 3000);
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

      setOpenModal(false);
      setNewEmail("");
      setNewPassword("");
      setNewFullName("");
      setNewRole("participante");
      setSuccessMessage("Novo membro cadastrado com sucesso!");
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadUsers();
    } catch (err) {
      setErrorMessage("Erro ao criar novo usuário.");
    } finally {
      setAddLoading(false);
    }
  };

  // Métricas
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const participanteCount = users.filter((u) => u.role === "participante").length;
  const activeCount = users.filter((u) => u.active).length;

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        (u.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = filterRole === "all" || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [users, searchTerm, filterRole]);

  // Se o usuário não for Admin, exibe tela de informações de seu perfil
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">Meu Perfil de Acesso</h2>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground border border-border">
                  Participante
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Sua conta possui permissão executiva de visualização. Você pode acompanhar KPIs, gráficos de desempenho e relatórios de DRE em tempo real.
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-border/60 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Dados da Sua Conta
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <span className="text-[11px] font-medium text-muted-foreground block">Nome Completo</span>
                <span className="text-sm font-semibold text-foreground mt-0.5 block truncate">
                  {profile?.full_name || "Não informado"}
                </span>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <span className="text-[11px] font-medium text-muted-foreground block">E-mail Cadastrado</span>
                <span className="text-sm font-semibold text-foreground mt-0.5 block truncate">
                  {user?.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {errorMessage && (
        <div className="flex items-start gap-2 rounded-2xl bg-danger-soft p-3.5 text-xs text-destructive border border-destructive/20 animate-in fade-in">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="flex items-start gap-2 rounded-2xl bg-success-soft p-3.5 text-xs text-success border border-success/20 animate-in fade-in">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* KPI Cards de Usuários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total de Membros</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">{totalUsers}</p>
          <span className="text-[11px] text-muted-foreground">{activeCount} ativos na plataforma</span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Administradores</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">{adminCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Acesso total + uploads</span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Participantes</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/15 text-sky-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">{participanteCount}</p>
          <span className="text-[11px] text-sky-600 font-medium">Visualização de relatórios</span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Ação Rápida</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <UserPlus className="h-4 w-4" />
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setOpenModal(true)}
            className="mt-3 w-full gap-2 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Cadastrar Novo Membro
          </Button>
        </div>
      </div>

      {/* Tabela de Usuários & Controles */}
      <div className="rounded-3xl border border-border/60 bg-card p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground">Lista de Membros</h2>
            <p className="text-xs text-muted-foreground">
              Controle os níveis de acesso e permissões individuais
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Campo de Busca */}
            <div className="relative flex items-center min-w-[200px] flex-1 sm:flex-initial">
              <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* Filtro de Função */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="rounded-xl border border-border bg-background py-1.5 px-3 text-xs font-medium text-foreground focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as funções</option>
              <option value="admin">Apenas Admins</option>
              <option value="participante">Apenas Participantes</option>
            </select>
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="overflow-x-auto rounded-2xl border border-border/50">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/50">
              <tr>
                <th className="py-3 px-4 font-semibold">Membro</th>
                <th className="py-3 px-4 font-semibold">E-mail</th>
                <th className="py-3 px-4 font-semibold">Função</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Carregando membros...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Nenhum membro encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === user?.id;
                  const initial = (u.full_name || u.email || "U").charAt(0).toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                            {initial}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                              {u.full_name || "Sem nome cadastrado"}
                              {isCurrent && (
                                <span className="rounded-md bg-muted px-1.5 py-0.2 text-[9px] font-bold text-muted-foreground">
                                  Você
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                        {u.email}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
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
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            u.active
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.active ? "bg-emerald-500" : "bg-destructive"
                            }`}
                          />
                          {u.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={u.role}
                            disabled={actionLoading === u.id || isCurrent}
                            onChange={(e) => void handleRoleChange(u.id, e.target.value as TersiaRole)}
                            className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground focus:outline-none cursor-pointer disabled:opacity-50"
                            title={isCurrent ? "Não é possível alterar a própria função" : "Alterar função"}
                          >
                            <option value="participante">Participante</option>
                            <option value="admin">Administrador</option>
                          </select>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading === u.id || isCurrent}
                            onClick={() => void handleToggleActive(u.id, u.active)}
                            className={`h-7 px-2.5 text-[11px] rounded-lg cursor-pointer border-border/70 ${
                              u.active
                                ? "text-destructive hover:bg-danger-soft hover:border-destructive/30"
                                : "text-emerald-600 hover:bg-success-soft hover:border-emerald-300"
                            }`}
                            title={isCurrent ? "Não é possível desativar a própria conta" : ""}
                          >
                            {actionLoading === u.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : u.active ? (
                              "Desativar"
                            ) : (
                              "Ativar"
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro de Novo Usuário */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md rounded-3xl border-border bg-card p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Cadastrar Novo Membro
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Conceda acesso à plataforma Dra. Térsia Dashboard
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {errorMessage && (
            <div className="mt-2 flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Nome Completo
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="Nome do membro"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                E-mail
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="email@clinica.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Senha Inicial
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Função de Acesso
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as TersiaRole)}
                className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="participante">Participante (Apenas Visualização)</option>
                <option value="admin">Administrador (Total + Importação de Planilhas)</option>
              </select>
            </div>

            <div className="mt-5 flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenModal(false)}
                className="flex-1 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={addLoading}
                className="flex-1 gap-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {addLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cadastrando...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" /> Confirmar
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
