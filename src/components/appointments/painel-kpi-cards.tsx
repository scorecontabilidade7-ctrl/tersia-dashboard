import { Calendar, CheckCircle2, CheckCheck, XCircle, TrendingUp, Users } from "lucide-react";
import { type FourMedicPainelSummary } from "@/lib/fourmedic/painel-types";
import { cn } from "@/lib/utils";

interface PainelKpiCardsProps {
  summary: FourMedicPainelSummary;
  isDraTersiaOnly?: boolean;
}

export function PainelKpiCards({ summary, isDraTersiaOnly = true }: PainelKpiCardsProps) {
  return (
    <div className="space-y-4">
      {/* Grid de 4 Cards Principais - Estilo Oficial 4Medic Executivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Pacientes Agendados */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-card p-5 border border-blue-500/20 shadow-xs hover:border-blue-500/40 hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pacientes agendados
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-blue-600 dark:text-blue-400">
                  {summary.totalAgendados}
                </span>
              </div>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Grade total de pacientes</span>
            <span className="font-semibold text-foreground">100% da agenda</span>
          </div>
        </div>

        {/* 2. Pacientes Confirmados */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-card p-5 border border-cyan-500/20 shadow-xs hover:border-cyan-500/40 hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pacientes confirmados
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-cyan-600 dark:text-cyan-400">
                  {summary.totalConfirmados}
                </span>
              </div>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Confirmados / Atendidos</span>
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
              {summary.totalAgendados > 0 ? ((summary.totalConfirmados / summary.totalAgendados) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* 3. Pacientes Atendidos */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-card p-5 border border-emerald-500/20 shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pacientes atendidos
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                  {summary.totalAtendidos}
                </span>
              </div>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Consultas finalizadas</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {summary.taxaComparecimento.toFixed(1)}% taxa efetiva
            </span>
          </div>
        </div>

        {/* 4. Pacientes Cancelados e Ausentes */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-card p-5 border border-rose-500/20 shadow-xs hover:border-rose-500/40 hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cancelados e ausentes
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                  {summary.totalCanceladosEAusentes}
                </span>
              </div>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{summary.totalCancelados} cancelados · {summary.totalAusentes} faltas</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {summary.totalAgendados > 0 ? ((summary.totalCanceladosEAusentes / summary.totalAgendados) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
