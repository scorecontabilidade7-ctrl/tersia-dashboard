import { Stethoscope, Activity, TrendingUp, Users } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { type FourMedicDashboardSummary } from "@/lib/fourmedic/types";

interface ProcedureKpisProps {
  summary: FourMedicDashboardSummary;
  isDraTersiaOnly?: boolean;
}

export function ProcedureKpis({ summary, isDraTersiaOnly = true }: ProcedureKpisProps) {
  const topProcedimento = summary.topProcedimentos[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Faturamento Total */}
      <KpiCard
        label={isDraTersiaOnly ? "Faturamento (Dra. Térsia)" : "Faturamento Total (4Medic)"}
        rawValue={summary.totalFaturamento}
        tone="success"
        icon={Stethoscope}
        iconBg="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        subtitle={`${summary.totalProcedimentos} procedimentos contabilizados`}
      />

      {/* 2. Total de Procedimentos */}
      <KpiCard
        label="Procedimentos Realizados"
        rawValue={summary.totalProcedimentos}
        formatAsCurrency={false}
        tone="neutral"
        icon={Activity}
        iconBg="bg-primary/15 text-primary"
        subtitle={topProcedimento ? `Mais frequente: ${topProcedimento.nome}` : undefined}
      />

      {/* 3. Ticket Médio */}
      <KpiCard
        label="Ticket Médio / Procedimento"
        rawValue={summary.ticketMedio}
        tone="neutral"
        icon={TrendingUp}
        iconBg="bg-blue-500/15 text-blue-600 dark:text-blue-400"
        subtitle="Média por procedimento faturado"
      />

      {/* 4. Pacientes / Consultas Atendidas */}
      <KpiCard
        label="Atendimentos na Clínica"
        rawValue={summary.totalAtendimentos}
        formatAsCurrency={false}
        tone="neutral"
        icon={Users}
        iconBg="bg-purple-500/15 text-purple-600 dark:text-purple-400"
        subtitle={`Taxa de conclusão: ${summary.taxaConclusao.toFixed(1)}%`}
      />
    </div>
  );
}
