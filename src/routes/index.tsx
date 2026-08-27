import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Info, Loader2, TrendingUp, TrendingDown, Percent, Wallet } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueExpenseChart } from "@/components/dashboard/revenue-expense-chart";
import { ExpenseComposition } from "@/components/dashboard/expense-composition";
import { DreTable } from "@/components/dashboard/dre-table";
import { ImportPlanilha } from "@/components/dashboard/import-planilha";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { useFinance } from "@/lib/finance/finance-store";
import {
  delta,
  margemContribuicao,
  saldoFinal,
  totalDespesas,
  totalReceitas,
} from "@/lib/finance/selectors";
import { formatBRL, formatDateTime } from "@/lib/finance/format";

export const Route = createFileRoute("/")({
  component: FinanceiroPage,
  head: () => ({
    meta: [
      { title: "Dra. Térsia | Financeiro" },
      { name: "description", content: "Dashboard financeiro executivo com KPIs, DRE e composição de despesas." },
      { property: "og:title", content: "Dra. Térsia | Financeiro" },
      { property: "og:description", content: "KPIs, receitas vs despesas, DRE e composição das despesas." },
    ],
  }),
});

function FinanceiroPage() {
  const { dataset, periodKeys, previousKeys, status, errorMessage, successMessage } = useFinance();

  const receitas = dataset ? totalReceitas(dataset, periodKeys) : 0;
  const despesas = dataset ? totalDespesas(dataset, periodKeys) : 0;
  const margem = dataset ? margemContribuicao(dataset, periodKeys) : 0;
  const saldo = dataset ? saldoFinal(dataset, periodKeys) : 0;

  const hasPrev = !!dataset && previousKeys.length > 0;
  const d = (current: number, previous: number) => (hasPrev ? delta(current, previous) : null);

  return (
    <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 mb-6 lg:flex lg:flex-wrap lg:justify-between">
        <h1 className="truncate text-2xl md:text-3xl font-black tracking-tight">Dra. Térsia | Financeiro</h1>
        <div className="col-span-2 lg:col-auto">
          <PeriodFilter />
        </div>
      </header>

      {/* Estado da importação */}
      {status === "loading" && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-card border border-border/60 p-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Processando arquivo...
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
          Importe uma planilha financeira para visualizar os dados.
        </div>
      )}
      {dataset && (
        <p className="mb-4 text-xs text-muted-foreground">
          Última atualização: <span className="font-medium text-foreground">{dataset.fileName}</span> ·{" "}
          {formatDateTime(dataset.importedAt)}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard
              label="Total de Receitas"
              rawValue={receitas}
              tone="success"
              icon={TrendingUp}
              iconBg="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              delta={d(receitas, dataset ? totalReceitas(dataset, previousKeys) : 0)}
            />
            <KpiCard
              label="Total de Despesas"
              rawValue={despesas}
              tone="danger"
              icon={TrendingDown}
              iconBg="bg-rose-500/15 text-rose-600 dark:text-rose-400"
              delta={d(despesas, dataset ? totalDespesas(dataset, previousKeys) : 0)}
            />
            <KpiCard
              label="Margem de Contribuição"
              rawValue={margem}
              tone="auto"
              icon={Percent}
              iconBg="bg-blue-500/15 text-blue-600 dark:text-blue-400"
              delta={d(margem, dataset ? margemContribuicao(dataset, previousKeys) : 0)}
            />
            <KpiCard
              label="Saldo Final"
              rawValue={saldo}
              tone="auto"
              icon={Wallet}
              iconBg={saldo >= 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"}
              delta={d(saldo, dataset ? saldoFinal(dataset, previousKeys) : 0)}
            />
          </div>

          <RevenueExpenseChart />
          <DreTable />
        </div>

        {/* Side column */}
        <aside className="space-y-6 min-w-0">
          <ExpenseComposition />
          <ImportPlanilha />
        </aside>
      </div>
    </main>
  );
}
