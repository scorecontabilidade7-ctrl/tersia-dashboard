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
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { TopExpensesChart } from "@/components/dashboard/top-expenses-chart";
import { DreTable } from "@/components/dashboard/dre-table";
import { ImportPlanilha } from "@/components/dashboard/import-planilha";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { UserNav } from "@/components/dashboard/user-nav";
import { AuthView } from "@/components/auth/auth-view";
import { useAuth } from "@/lib/auth/auth-context";
import { useFinance } from "@/lib/finance/finance-store";
import { delta, lucroBruto, lucroClinica, proLabore, totalReceitas } from "@/lib/finance/selectors";
import { formatBRL, formatDateTime } from "@/lib/finance/format";

export const Route = createFileRoute("/")({
  component: FinanceiroPage,
  head: () => ({
    meta: [
      { title: "Dra. Térsia | Financeiro" },
      {
        name: "description",
        content: "Dashboard financeiro executivo com KPIs, DRE e composição de despesas.",
      },
      { property: "og:title", content: "Dra. Térsia | Financeiro" },
      {
        property: "og:description",
        content: "KPIs, receitas vs despesas, DRE e composição das despesas.",
      },
    ],
  }),
});

function FinanceiroPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { dataset, periodKeys, previousKeys, status, errorMessage, successMessage } = useFinance();

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
    <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <header className="grid grid-cols-1 items-center gap-4 mb-6 lg:flex lg:flex-wrap lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src="/logo-dra-tersia.jpeg"
            alt="Logo Dra. Térsia"
            className="h-11 w-auto rounded-lg object-contain ring-1 ring-border shadow-sm"
          />
          <div>
            <h1 className="truncate text-xl md:text-2xl font-black tracking-tight">
              Dra. Térsia | Financeiro
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Gestão executiva, KPIs e DRE em tempo real
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PeriodFilter />
          <UserNav />
        </div>
      </header>

      {/* Estado da importação */}
      {status === "loading" && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-card border border-border/60 p-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Processando arquivo e sincronizando com a nuvem...
        </div>
      )}
      {status !== "loading" && errorMessage && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}
      {status !== "loading" && !errorMessage && successMessage && dataset && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-success-soft p-3 text-sm text-success">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      )}
      {!dataset && status !== "loading" && !errorMessage && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-card border border-border/60 p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Importe uma planilha financeira para visualizar os dados ou aguarde a sincronização com o
          banco.
        </div>
      )}
      {dataset && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            Última atualização:{" "}
            <span className="font-medium text-foreground">{dataset.fileName}</span> ·{" "}
            {formatDateTime(dataset.importedAt)}
          </p>
          <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Cloud className="h-3 w-3 text-primary" />
            Nuvem Supabase Ativa
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
        {/* Main column */}
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
              tone="info"
              icon={ArrowUpRight}
              iconBg="bg-sky-500/15 text-sky-600 dark:text-sky-400"
              delta={d(lucroClinicaVal, dataset ? lucroClinica(dataset, previousKeys) : 0)}
            />
            <KpiCard
              label="Lucro Bruto"
              rawValue={lucroBrutoVal}
              tone="warning"
              icon={PiggyBank}
              iconBg="bg-amber-500/15 text-amber-600 dark:text-amber-400"
              delta={d(lucroBrutoVal, dataset ? lucroBruto(dataset, previousKeys) : 0)}
            />
            <KpiCard
              label="Pró-labore"
              rawValue={proLaboreVal}
              tone="accent"
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

        {/* Sidebar */}
        <aside className="space-y-6">
          <ImportPlanilha />
          <TopExpensesChart />
        </aside>
      </div>
    </main>
  );
}
