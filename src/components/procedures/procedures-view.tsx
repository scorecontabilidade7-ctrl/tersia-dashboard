import { useState } from "react";
import {
  Stethoscope,
  RefreshCw,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProcedureKpis } from "./procedure-kpis";
import { TopProceduresChart } from "./top-procedures-chart";
import { DistributionCharts } from "./distribution-charts";
import { ProceduresTable } from "./procedures-table";
import { useFourMedicData } from "@/lib/fourmedic/use-fourmedic";
import { type ProfessionalFilterOption } from "@/lib/fourmedic/transformers";
import { formatCurrency } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

const YEARS = [2026, 2025, 2024];

export function ProceduresView() {
  const [mes, setMes] = useState<number>(8); // Padrão Agosto/2026
  const [ano, setAno] = useState<number>(2026);
  const [filterProfessional, setFilterProfessional] =
    useState<ProfessionalFilterOption>("tersia");

  const {
    summary,
    isLoading,
    isFetching,
    isError,
    error,
    refresh,
    dateRange,
  } = useFourMedicData(mes, ano, filterProfessional);

  const selectedMonthName = MONTHS.find((m) => m.value === mes)?.label || "";

  return (
    <div className="space-y-6">
      {/* Barra Superior de Filtros e Controles da 4Medic */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-border/60 bg-card p-4 md:p-5 shadow-2xs">
        {/* Seletor de Profissional (Dra. Térsia como padrão) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground mr-1 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-primary" />
            Profissional:
          </span>
          <div className="inline-flex rounded-2xl bg-muted/60 p-1 border border-border/50">
            <button
              type="button"
              onClick={() => setFilterProfessional("tersia")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                filterProfessional === "tersia"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              👩‍⚕️ Dra. Térsia (Foco)
            </button>
            <button
              type="button"
              onClick={() => setFilterProfessional("pedro")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                filterProfessional === "pedro"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              👨‍⚕️ Dr. Pedro Paulo
            </button>
            <button
              type="button"
              onClick={() => setFilterProfessional("todos")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                filterProfessional === "todos"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              🏥 Toda a Clínica
            </button>
          </div>
        </div>

        {/* Controles de Data e Atualização */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Mês */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="h-9 rounded-xl border border-border/70 bg-background/80 px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Ano */}
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="h-9 rounded-xl border border-border/70 bg-background/80 px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Botão de Atualizar / Sincronizar */}
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isFetching}
            className="h-9 rounded-xl border-border/80 text-xs font-bold gap-1.5 cursor-pointer shadow-2xs"
            title="Atualizar dados da API 4Medic"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5 text-primary", isFetching && "animate-spin")}
            />
            <span className="hidden sm:inline">
              {isFetching ? "Atualizando..." : "Sincronizar"}
            </span>
          </Button>

          {/* Badge de Conexão Ativa */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>4Medic API Conectada</span>
          </div>
        </div>
      </div>

      {/* Alerta informativo sobre a origem dos dados */}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 border border-border/50 px-4 py-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 min-w-0">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">
            Período consultado:{" "}
            <strong className="text-foreground">
              {dateRange.dataInicial} até {dateRange.dataFinal}
            </strong>{" "}
            ({selectedMonthName}/{ano}) · Visualizando:{" "}
            <strong className="text-foreground">
              {filterProfessional === "tersia"
                ? "Dra. Térsia Guimarães"
                : filterProfessional === "pedro"
                  ? "Dr. Pedro Paulo"
                  : "Todos os profissionais"}
            </strong>
          </span>
        </div>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
          Total: {formatCurrency(summary.totalFaturamento)}
        </span>
      </div>

      {/* Erro de conexão se houver */}
      {isError && (
        <div className="flex items-start gap-3 rounded-2xl bg-danger-soft p-4 text-xs text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Erro ao consultar a API da 4Medic</p>
            <p className="mt-0.5 opacity-90">{(error as any)?.message || "Verifique sua conexão ou token."}</p>
          </div>
        </div>
      )}

      {/* 1. KPIs Rápidos */}
      <ProcedureKpis
        summary={summary}
        isDraTersiaOnly={filterProfessional === "tersia"}
      />

      {/* 2. Grid de Gráficos de Levantamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking dos Top Procedimentos */}
        <TopProceduresChart procedures={summary.topProcedimentos} />

        {/* Faturamento por Convênio */}
        <DistributionCharts
          convenios={summary.distribuicaoConvenios}
          profissionais={summary.distribuicaoProfissionais}
          showProfessionalChart={filterProfessional === "todos"}
        />
      </div>

      {/* 3. Tabela Analítica de Procedimentos Estilo 4Medic */}
      <ProceduresTable rows={summary.rows} isLoading={isLoading || isFetching} />
    </div>
  );
}
