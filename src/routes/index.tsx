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
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { TopExpensesChart } from "@/components/dashboard/top-expenses-chart";
import { DreTable } from "@/components/dashboard/dre-table";
import { ImportPlanilha } from "@/components/dashboard/import-planilha";
import { PeriodFilter } from "@/components/dashboard/period-filter";
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
  const { dataset, periodKeys, previousKeys, status, errorMessage, successMessage } = useFinance();

  const faturamento = dataset ? totalReceitas(dataset, periodKeys) : 0;
  const lucroBrutoVal = dataset ? lucroBruto(dataset, periodKeys) : 0;
  const lucroClinicaVal = dataset ? lucroClinica(dataset, periodKeys) : 0;
  const proLaboreVal = dataset ? proLabore(dataset, periodKeys) : 0;

  const hasPrev = !!dataset && previousKeys.length > 0;
  const d = (current: number, previous: number) => (hasPrev ? delta(current, previous) : null);

  return (
    <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 mb-6 lg:flex lg:flex-wrap lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src="/logo-dra-tersia.jpeg"
            alt="Logo Dra. Térsia"
            className="h-11 w-auto rounded-lg object-contain ring-1 ring-border shadow-sm"
          />
          <h1 className="truncate text-2xl md:text-3xl font-black tracking-tight">
            Dra. Térsia | Financeiro
          </h1>
        </div>
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
          Última atualização:{" "}
          <span className="font-medium text-foreground">{dataset.fileName}</span> ·{" "}
          {formatDateTime(dataset.importedAt)}
        </p>
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
              label="Lucro Bruto"
              rawValue={lucroBrutoVal}
              tone="auto"
              icon={ArrowUpRight}
              iconBg="bg-blue-500/15 text-blue-600 dark:text-blue-400"
              delta={d(lucroBrutoVal, dataset ? lucroBruto(dataset, previousKeys) : 0)}
            />
            <KpiCard
              label="Lucro da Clínica"
              rawValue={lucroClinicaVal}
              tone="auto"
              icon={PiggyBank}
              iconBg="bg-violet-500/15 text-violet-600 dark:text-violet-400"
              delta={d(lucroClinicaVal, dataset ? lucroClinica(dataset, previousKeys) : 0)}
            />
            <KpiCard
              label="Pró-labore Dra. Térsia"
              rawValue={proLaboreVal}
              tone="auto"
              icon={UserRound}
              iconBg="bg-amber-500/15 text-amber-600 dark:text-amber-400"
              delta={d(proLaboreVal, dataset ? proLabore(dataset, previousKeys) : 0)}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <PerformanceChart />
            <TopExpensesChart />
          </div>
          <DreTable />
        </div>

        {/* Side column */}
        <aside className="space-y-6 min-w-0">
          <ImportPlanilha />
        </aside>
      </div>
    </main>
  );
}
