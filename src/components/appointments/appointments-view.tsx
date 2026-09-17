import { useState } from "react";
import {
  CalendarDays,
  RefreshCw,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Info,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PainelKpiCards } from "./painel-kpi-cards";
import { PainelConveniosAccordion } from "./painel-convenios-accordion";
import { PainelProcedimentosAccordion } from "./painel-procedimentos-accordion";
import { PainelPacientesAccordion } from "./painel-pacientes-accordion";
import { useFourMedicPainel } from "@/lib/fourmedic/use-fourmedic-painel";
import { type ProfessionalFilterOption } from "@/lib/fourmedic/transformers";
import { useAuth } from "@/lib/auth/auth-context";
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

export function AppointmentsView() {
  const { isAdmin } = useAuth();
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
  } = useFourMedicPainel(mes, ano, filterProfessional);

  const selectedMonthName = MONTHS.find((m) => m.value === mes)?.label || "";

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Controles do Painel 4Medic */}
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
              👩‍⚕️ Dra. Térsia Guimarães
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
            title={isAdmin ? "Atualizar dados da API 4Medic" : "Atualizar agendamentos"}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5 text-primary", isFetching && "animate-spin")}
            />
            <span className="hidden sm:inline">
              {isFetching ? "Atualizando..." : "Sincronizar"}
            </span>
          </Button>

          {/* Badge de Conexão Ativa - Exibido apenas para Administradores */}
          {isAdmin && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>4Medic Painel Ativo</span>
            </div>
          )}
        </div>
      </div>

      {/* Alerta informativo sobre o período consultado */}
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
        <span className="font-semibold text-primary shrink-0 hidden sm:inline">
          {summary.totalAtendidos} atendimentos concluídos ({summary.taxaComparecimento.toFixed(1)}% taxa de presença)
        </span>
      </div>

      {/* Erro de conexão se houver */}
      {isError && (
        <div className="flex items-start gap-3 rounded-2xl bg-danger-soft p-4 text-xs text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">
              {isAdmin ? "Erro ao consultar o Painel 4Medic" : "Erro ao carregar dados"}
            </p>
            <p className="mt-0.5 opacity-90">
              {(error as any)?.message || "Verifique sua conexão ou tente novamente."}
            </p>
          </div>
        </div>
      )}

      {/* Loading state inicial */}
      {isLoading && (
        <div className="flex items-center justify-center p-12 rounded-3xl bg-card border border-border/60">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isAdmin ? "Carregando dados do Painel 4Medic..." : "Carregando agendamentos..."}
            </p>
          </div>
        </div>
      )}

      {/* Conteúdo Principal do Painel 4Medic */}
      {!isLoading && (
        <div className="space-y-6">
          {/* 1. KPIs Grandes Oficiais do 4Medic (121, 84, 84, 32) */}
          <PainelKpiCards
            summary={summary}
            isDraTersiaOnly={filterProfessional === "tersia"}
          />

          {/* 2. Seção Atendimentos Convênio / Particular */}
          <PainelConveniosAccordion
            convenios={summary.conveniosBreakdown}
            totalAtendidos={summary.totalAtendidos}
          />

          {/* 3. Seção Procedimentos Realizados (Com Gráfico de Rosca) */}
          <PainelProcedimentosAccordion
            procedimentos={summary.procedimentosRealizados}
            donutData={summary.procedimentosDonut}
          />

          {/* 4. Seção Pacientes e Grade de Consultas */}
          <PainelPacientesAccordion
            pacientes={summary.pacientesAtendidos}
            todosAgendamentos={summary.todosAgendamentos}
          />
        </div>
      )}
    </div>
  );
}
