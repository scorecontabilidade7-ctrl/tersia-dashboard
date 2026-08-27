import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { useFinance } from "@/lib/finance/finance-store";
import { topExpenseItems } from "@/lib/finance/selectors";
import { formatBRL, formatBRLCompact } from "@/lib/finance/format";

const RED_SHADES = [
  "#7f1d1d",
  "#991b1b",
  "#b91c1c",
  "#dc2626",
  "#ef4444",
  "#f87171",
  "#fca5a5",
  "#fecaca",
  "#fee2e2",
  "#fef2f2",
];
const PALLETE_LEN = 10;

export function TopExpensesChart() {
  const { dataset, periods } = useFinance();
  const [limit, setLimit] = useState<5 | 10>(10);

  const keys = useMemo(() => periods.map((p) => p.key), [periods]);

  const data = useMemo(() => {
    if (!dataset) return [];
    const items = topExpenseItems(dataset, keys, limit);
    return items.map((d, i) => ({ ...d, fill: RED_SHADES[i % PALLETE_LEN] }));
  }, [dataset, keys, limit]);

  const hasData = data.length > 0;

  const selectedLabel = useMemo(() => {
    const p = periods[periods.length - 1];
    return p ? (periods.length > 1 ? `${periods[0].label} a ${p.label}` : p.label) : "";
  }, [periods]);

  return (
    <div className="rounded-2xl bg-card p-5 md:p-6 border border-border/60 shadow-xs">
      {/* Header do Card */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {limit === 10 ? "TOP 10" : "TOP 5"} - Despesas da Clínica
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedLabel
              ? `Despesas Fixas da Clínica em ${selectedLabel} — agrupadas por categoria`
              : "Despesas Fixas da Clínica — agrupadas por categoria"}
          </p>
        </div>

        {/* Alternância TOP 5 / TOP 10 */}
        <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 p-1">
          {([5, 10] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setLimit(n)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                limit === n
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              TOP {n}
            </button>
          ))}
        </div>
      </div>

      {/* Área do Gráfico */}
      <div className="h-80 w-full">
        {!hasData ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            {dataset
              ? "Nenhuma despesa encontrada para este período."
              : "Importe uma planilha financeira para visualizar os dados."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 15, left: 0, bottom: 40 }}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tickFormatter={(v: number) => formatBRLCompact(v)}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                width={70}
              />
              <Tooltip
                content={<TopExpenseTooltip />}
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.label} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

type TooltipItem = {
  payload?: { label?: string; value?: number; children?: { label: string; value: number }[] };
};

function TopExpenseTooltip({ active, payload }: { active?: boolean; payload?: TooltipItem[] }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-xs space-y-1.5 min-w-[200px]">
      <p className="font-bold text-foreground border-b border-border/60 pb-1 mb-1">{data.label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Total:</span>
        <span className="font-bold text-sm text-rose-600 dark:text-rose-400">
          {formatBRL(data.value ?? 0)}
        </span>
      </div>
      {data.children && data.children.length > 0 && (
        <div className="space-y-1 border-t border-border/60 pt-1.5 mt-1">
          {data.children.map((c) => (
            <div
              key={c.label}
              className="flex items-center justify-between gap-4 text-muted-foreground"
            >
              <span className="truncate">{c.label}</span>
              <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                {formatBRL(c.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
