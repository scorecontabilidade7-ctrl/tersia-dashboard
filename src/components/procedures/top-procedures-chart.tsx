import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Award, Flame } from "lucide-react";
import { type ProcedureAggregate } from "@/lib/fourmedic/types";
import { formatCurrency } from "@/lib/finance/format";

interface TopProceduresChartProps {
  procedures: ProcedureAggregate[];
  maxItems?: number;
}

const COLORS = [
  "#E11D48", // Rose 600 (Primary)
  "#F43F5E", // Rose 500
  "#FB7185", // Rose 400
  "#0D9488", // Teal 600
  "#14B8A6", // Teal 500
  "#2DD4BF", // Teal 400
  "#6366F1", // Indigo 500
  "#8B5CF6", // Violet 500
];

export function TopProceduresChart({
  procedures,
  maxItems = 8,
}: TopProceduresChartProps) {
  const topList = procedures.slice(0, maxItems).map((p, idx) => ({
    name: p.nome.length > 28 ? `${p.nome.substring(0, 26)}...` : p.nome,
    fullName: p.nome,
    receita: p.totalReceita,
    quantidade: p.quantidade,
    ticketMedio: p.ticketMedio,
    percentual: p.percentual,
    color: COLORS[idx % COLORS.length],
  }));

  if (topList.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-3xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground shadow-2xs">
        <Award className="mb-2 h-8 w-8 text-muted-foreground/40" />
        <p className="font-semibold">Nenhum procedimento registrado no período.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-3xl border border-border/60 bg-card p-5 md:p-6 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-2 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Top Procedimentos por Faturamento
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Procedimentos com maior geração de receita no período
            </p>
          </div>
        </div>
      </div>

      <div className="h-[340px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topList}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
          >
            <XAxis
              type="number"
              tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              width={140}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-2xl border border-border/80 bg-popover/95 p-3.5 shadow-xl backdrop-blur-md">
                      <p className="text-xs font-bold text-foreground mb-1">
                        {data.fullName}
                      </p>
                      <div className="space-y-1 text-xs">
                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Receita Total: {formatCurrency(data.receita)}
                        </p>
                        <p className="text-muted-foreground">
                          Quantidade: <span className="font-bold text-foreground">{data.quantidade} un.</span>
                        </p>
                        <p className="text-muted-foreground">
                          Ticket Médio: <span className="font-bold text-foreground">{formatCurrency(data.ticketMedio)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Participação: <span className="font-bold text-primary">{data.percentual.toFixed(1)}%</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="receita"
              radius={[0, 8, 8, 0]}
              animationDuration={800}
            >
              {topList.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
