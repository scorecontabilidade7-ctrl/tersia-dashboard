import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { useFinance } from "@/lib/finance/finance-store";
import { expenseBreakdown } from "@/lib/finance/selectors";
import { formatBRL, formatPercent } from "@/lib/finance/format";

const COLORS = ["#7a1010", "#a01515", "#d92020", "#ef4444", "#f87171", "#fca5a5"];

export function ExpenseComposition() {
  const { dataset, periodKeys } = useFinance();
  const slices = dataset ? expenseBreakdown(dataset, periodKeys) : [];

  return (
    <div className="rounded-2xl bg-card p-5 border border-border/60">
      <h3 className="text-sm font-bold uppercase tracking-wider">Composição das Despesas</h3>

      {slices.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Importe uma planilha financeira para visualizar os dados.
        </p>
      ) : (
        <>
          <div className="mt-4 flex justify-center">
            <PieChart width={240} height={220}>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                cx={120}
                cy={110}
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                stroke="#ffffff"
                strokeWidth={3}
                isAnimationActive={false}
              >
                {slices.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(v: number) => formatBRL(v)}
              />
            </PieChart>
          </div>
          <ul className="mt-4 space-y-2">
            {slices.map((d, i) => (
              <li key={d.label} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="truncate text-muted-foreground">{d.label}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="font-semibold tabular-nums">{formatBRL(d.value)}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{formatPercent(d.percent)}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
