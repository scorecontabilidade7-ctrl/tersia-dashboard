import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Building2, ShieldCheck } from "lucide-react";
import { type ConvenioAggregate, type ProfessionalAggregate } from "@/lib/fourmedic/types";
import { formatCurrency } from "@/lib/finance/format";

interface DistributionChartsProps {
  convenios: ConvenioAggregate[];
  profissionais: ProfessionalAggregate[];
  showProfessionalChart?: boolean;
}

const CONVENIO_COLORS = [
  "#2563EB", // Blue 600
  "#059669", // Emerald 600
  "#D97706", // Amber 600
  "#7C3AED", // Violet 600
  "#DB2777", // Pink 600
  "#0891B2", // Cyan 600
];

export function DistributionCharts({
  convenios,
  profissionais,
  showProfessionalChart = false,
}: DistributionChartsProps) {
  const conveniosData = convenios.map((c, idx) => ({
    name: c.nome,
    value: c.totalReceita,
    quantidade: c.quantidade,
    percentual: c.percentual,
    color: CONVENIO_COLORS[idx % CONVENIO_COLORS.length],
  }));

  return (
    <div className="flex flex-col rounded-3xl border border-border/60 bg-card p-5 md:p-6 shadow-2xs">
      <div className="flex items-center gap-2.5 pb-4 mb-2 border-b border-border/40">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">
            Faturamento por Convênio
          </h2>
          <p className="text-xs text-muted-foreground font-medium">
            Origem e fontes de recebimento dos procedimentos
          </p>
        </div>
      </div>

      {conveniosData.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center text-sm text-muted-foreground">
          <Building2 className="mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="font-semibold">Nenhum dado de convênio disponível.</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
          {/* Donut Chart */}
          <div className="h-[220px] w-[220px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conveniosData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={800}
                >
                  {conveniosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-2xl border border-border/80 bg-popover/95 p-3 shadow-xl backdrop-blur-md text-xs">
                          <p className="font-bold text-foreground mb-1">{data.name}</p>
                          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {formatCurrency(data.value)} ({data.percentual.toFixed(1)}%)
                          </p>
                          <p className="text-muted-foreground">{data.quantidade} procedimentos</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda Customizada */}
          <div className="flex-1 w-full space-y-2.5">
            {conveniosData.map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between gap-2 text-xs p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="font-bold text-foreground truncate">{c.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-foreground mr-1.5">
                    {formatCurrency(c.value)}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    ({c.percentual.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
