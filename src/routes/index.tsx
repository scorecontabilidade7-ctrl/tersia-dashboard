import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  Coins,
  ArrowUpRight,
  PiggyBank,
  UserRound,
  Cloud,
  LayoutDashboard,
  Users,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { TopExpensesChart } from "@/components/dashboard/top-expenses-chart";
import { DreTable } from "@/components/dashboard/dre-table";
import { ImportPlanilha } from "@/components/dashboard/import-planilha";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { AppSidebar, type NavModule } from "@/components/layout/app-sidebar";
import { UserManagementView } from "@/components/auth/user-management-view";
import { AuthView } from "@/components/auth/auth-view";
import { useAuth } from "@/lib/auth/auth-context";
import { useFinance } from "@/lib/finance/finance-store";
import { delta, lucroBruto, lucroClinica, proLabore, totalReceitas } from "@/lib/finance/selectors";
import { formatDateTime } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dra. Térsia | Dashboard Executivo" },
      {
        name: "description",
        content: "Dashboard financeiro executivo com KPIs, DRE e gestão de usuários.",
      },
      { property: "og:title", content: "Dra. Térsia | Dashboard Executivo" },
      {
        property: "og:description",
        content: "KPIs, receitas vs despesas, DRE e controle de usuários.",
      },
    ],
  }),
});

function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, isAdmin } = useAuth();
  const [activeModule, setActiveModule] = useState<NavModule>("financeiro");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const { dataset, periodKeys, previousKeys, status, errorMessage, successMessage } = useFinance();

  // Carrega preferência de sidebar do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tersia_sidebar_collapsed");
      if (saved === "true") {
        setSidebarCollapsed(true);
      }
    } catch {
      // Ignora erro se localStorage indisponível
    }
  }, []);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tersia_sidebar_collapsed", String(next));
      } catch {
        // Ignora
      }
      return next;
    });
  };

  const faturamento = dataset ? totalReceitas(dataset, periodKeys) : 0;
  const lucroBrutoVal = dataset ? lucroBruto(dataset, periodKeys) : 0;
  const lucroClinicaVal = dataset ? lucroClinica(dataset, periodKeys) : 0;
  const proLaboreVal = dataset ? proLabore(dataset, periodKeys) : 0;

  const hasPrev = !!dataset && previousKeys.length > 0;
  const d = (current: number, previous: number) => (hasPrev ? delta(current, previous) : null);

  // Exibe tela de carregamento durante a verificação de sessão
  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Verificando acesso seguro...
          </p>
        </div>
      </div>
    );
  }

  // Se não estiver logado, exibe a tela de login/cadastro
  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Menu Lateral (Sidebar) com controle de recolhimento */}
      <AppSidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Conteúdo Principal com transição suave e expansão total quando fechada */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "md:pl-0" : "md:pl-64 lg:pl-72",
        )}
      >
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {/* Header Superior Dinâmico */}
          <header className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-3.5">
              {/* Botão para reabrir a Sidebar quando estiver recolhida no Desktop */}
              {sidebarCollapsed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleSidebar}
                  className="hidden md:flex items-center gap-2 rounded-2xl border-border/80 bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-muted cursor-pointer shadow-2xs animate-in fade-in duration-200"
                  title="Expandir menu lateral"
                >
                  <PanelLeftOpen className="h-4 w-4 text-primary" />
                  <span>Menu</span>
                </Button>
              )}

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-sm shadow-primary/25 shrink-0 ring-2 ring-primary/20">
                {activeModule === "financeiro" ? (
                  <LayoutDashboard className="h-5 w-5" />
                ) : (
                  <Users className="h-5 w-5" />
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                  {activeModule === "financeiro"
                    ? "Painel Financeiro"
                    : "Gestão de Usuários & Acessos"}
                </h1>
                <p className="text-xs md:text-sm font-medium text-muted-foreground mt-0.5">
                  {activeModule === "financeiro"
                    ? "Gestão executiva, KPIs e DRE em tempo real"
                    : isAdmin
                      ? "Controle de membros, cargos e permissões da clínica"
                      : "Informações da sua conta e nível de acesso"}
                </p>
              </div>
            </div>

            {/* Controles do Topo */}
            <div className="flex flex-wrap items-center gap-3">
              {activeModule === "financeiro" && <PeriodFilter />}
              {/* Nuvem Supabase Ativa: Exibida APENAS para Administradores */}
              {isAdmin && (
                <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Cloud className="h-3.5 w-3.5 text-primary" />
                  <span>Nuvem Supabase Ativa</span>
                </div>
              )}
            </div>
          </header>

          {/* Módulo Financeiro */}
          {activeModule === "financeiro" && (
            <div className="space-y-6">
              {/* Avisos técnicos de importação e sincronização exibidos APENAS para Administradores */}
              {isAdmin && (
                <>
                  {status === "loading" && (
                    <div className="flex items-center gap-2 rounded-2xl bg-card border border-border/60 p-3.5 text-xs shadow-2xs">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Processando arquivo e sincronizando com a nuvem...</span>
                    </div>
                  )}
                  {status !== "loading" && errorMessage && (
                    <div className="flex items-start gap-2 rounded-2xl bg-danger-soft p-3.5 text-xs text-destructive border border-destructive/20">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                  {status !== "loading" && !errorMessage && successMessage && dataset && (
                    <div className="flex items-start gap-2 rounded-2xl bg-success-soft p-3.5 text-xs text-success border border-success/20">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{successMessage}</span>
                    </div>
                  )}
                  {!dataset && status !== "loading" && !errorMessage && (
                    <div className="flex items-start gap-2 rounded-2xl bg-card border border-border/60 p-3.5 text-xs text-muted-foreground shadow-2xs">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Importe uma planilha financeira para visualizar os dados ou aguarde a
                        sincronização com a nuvem.
                      </span>
                    </div>
                  )}
                  {dataset && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground px-1">
                      <p>
                        Última sincronização:{" "}
                        <span className="font-semibold text-foreground">{dataset.fileName}</span> ·{" "}
                        {formatDateTime(dataset.importedAt)}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Mensagem simples para participante caso ainda não haja dados */}
              {!isAdmin && !dataset && status !== "loading" && (
                <div className="flex items-start gap-2 rounded-2xl bg-card border border-border/60 p-4 text-xs text-muted-foreground shadow-2xs">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Nenhum dado financeiro disponível no momento.</span>
                </div>
              )}

              {/* LAYOUT ADMINISTRADOR: Com coluna lateral para Importação de Planilhas e Top Despesas */}
              {isAdmin ? (
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
                  {/* Coluna Principal */}
                  <div className="min-w-0 space-y-6">
                    {/* KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <KpiCard
                        label="Faturamento Bruto"
                        rawValue={faturamento}
                        tone="success"
                        icon={Coins}
                        iconBg="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        delta={d(faturamento, dataset ? totalReceitas(dataset, previousKeys) : 0)}
                      />
                      <KpiCard
                        label="Lucro da Clínica"
                        rawValue={lucroClinicaVal}
                        tone="success"
                        icon={ArrowUpRight}
                        iconBg="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        delta={d(lucroClinicaVal, dataset ? lucroClinica(dataset, previousKeys) : 0)}
                      />
                      <KpiCard
                        label="Lucro Bruto"
                        rawValue={lucroBrutoVal}
                        tone="success"
                        icon={PiggyBank}
                        iconBg="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        delta={d(lucroBrutoVal, dataset ? lucroBruto(dataset, previousKeys) : 0)}
                      />
                      <KpiCard
                        label="Pró-labore"
                        rawValue={proLaboreVal}
                        tone="danger"
                        icon={UserRound}
                        iconBg="bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        delta={d(proLaboreVal, dataset ? proLabore(dataset, previousKeys) : 0)}
                      />
                    </div>

                    {/* Gráfico de Desempenho */}
                    <PerformanceChart />

                    {/* DRE Completa */}
                    <DreTable />
                  </div>

                  {/* Coluna Lateral Administrativa */}
                  <aside className="space-y-6">
                    <ImportPlanilha />
                    <TopExpensesChart />
                  </aside>
                </div>
              ) : (
                /* LAYOUT PARTICIPANTE (100% LIMPO E EXECUTIVO): Sem upload, sem termos técnicos */
                <div className="space-y-6">
                  {/* KPIs Executivos em 4 Colunas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                      label="Faturamento Bruto"
                      rawValue={faturamento}
                      tone="success"
                      icon={Coins}
                      iconBg="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      delta={d(faturamento, dataset ? totalReceitas(dataset, previousKeys) : 0)}
                    />
                    <KpiCard
                      label="Lucro da Clínica"
                      rawValue={lucroClinicaVal}
                      tone="success"
                      icon={ArrowUpRight}
                      iconBg="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      delta={d(lucroClinicaVal, dataset ? lucroClinica(dataset, previousKeys) : 0)}
                    />
                    <KpiCard
                      label="Lucro Bruto"
                      rawValue={lucroBrutoVal}
                      tone="success"
                      icon={PiggyBank}
                      iconBg="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      delta={d(lucroBrutoVal, dataset ? lucroBruto(dataset, previousKeys) : 0)}
                    />
                    <KpiCard
                      label="Pró-labore"
                      rawValue={proLaboreVal}
                      tone="danger"
                      icon={UserRound}
                      iconBg="bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      delta={d(proLaboreVal, dataset ? proLabore(dataset, previousKeys) : 0)}
                    />
                  </div>

                  {/* Gráficos lado a lado em telas maiores */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PerformanceChart />
                    <TopExpensesChart />
                  </div>

                  {/* DRE Completa em Largura Total */}
                  <DreTable />
                </div>
              )}
            </div>
          )}

          {/* Módulo Usuários */}
          {activeModule === "usuarios" && <UserManagementView />}
        </main>
      </div>
    </div>
  );
}
