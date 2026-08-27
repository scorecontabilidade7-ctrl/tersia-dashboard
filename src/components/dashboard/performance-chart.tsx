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
import { ArrowDownUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinance } from "@/lib/finance/finance-store";
import {
  totalReceitas,
  lucroClinica,
  proLabore,
  saldoFinal,
  despesasFixasClinica,
} from "@/lib/finance/selectors";
import { formatBRL } from "@/lib/finance/format";

type OrderMode = "dre" | "asc";

type BarDatum = {
  key: string;
  label: string;
  value: number; // valor com sinal (pode ser negativo)
  magnitude: number; // magnitude para exibição na barra
  positive: boolean;
  color: string;
};

// Paletas de tons verdes (positivo) e vermelhos (negativo)
const GREEN_SHADES = ["#10b981", "#34d399", "#059669", "#6ee7b7", "#16a34a"];
const RED_SHADES = ["#f43f5e", "#fb7185", "#e11d48", "#fda4af", "#dc2626"];

export function PerformanceChart() {
  const { dataset, selection, periods } = useFinance();
  const [order, setOrder] = useState<OrderMode>("dre");

  const keys = useMemo(() => periods.map((p) => p.key), [periods]);

  const data = useMemo<BarDatum[]>(() => {
    if (!dataset) return [];
    const base = [
      {
        key: "faturamento",
        label: "Faturamento Bruto",
        value: totalReceitas(dataset, keys),
      },
      { key: "lucro-clinica", label: "Lucro da Clínica", value: lucroClinica(dataset, keys) },
      { key: "pro-labore", label: "Pró-labore", value: -proLabore(dataset, keys) },
      { key: "lucro-liquido", label: "Lucro Líquido", value: saldoFinal(dataset, keys) },
      {
        key: "desp-fixas",
        label: "Despesas Fixas da Clínica",
        value: -despesasFixasClinica(dataset, keys),
      },
    ];

    // Atribui tonalidades conforme o sinal: verdes p/ positivos, vermelhos p/ negativos
    let gi = 0;
    let ri = 0;
    const items: BarDatum[] = base.map((d) => {
      const magnitude = Math.abs(d.value);
      const positive = d.value >= 0;
      const color = positive
        ? GREEN_SHADES[gi++ % GREEN_SHADES.length]
        : RED_SHADES[ri++ % RED_SHADES.length];
      return { ...d, magnitude, positive, color };
    });

    if (order === "asc") {
      items.sort((a, b) => a.magnitude - b.magnitude);
    }
    return items;
  }, [dataset, keys, order]);

  const hasData = data.some((d) => d.magnitude > 0.005);

  const selectedLabel = useMemo(() => {
    if (dataset && selection.id === "custom" && selection.from === selection.to) {
      const p = dataset.periods.find((x) => x.key === selection.from);
      if (p) return p.label;
    }
    const p = periods[periods.length - 1];
    return p ? (periods.length > 1 ? `${periods[0].label} a ${p.label}` : p.label) : "";
  }, [dataset, selection, periods]);

  return (
    <div className="rounded-2xl bg-card p-5 md:p-6 border border-border/60 shadow-xs">
      {/* Header do Card */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Gráfico de Desempenho
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedLabel
              ? `Desempenho financeiro em ${selectedLabel}`
              : "Desempenho financeiro do período selecionado"}
          </p>
        </div>

        {/* Alternância de ordenação */}
        <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 p-1">
          <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
          {(
            [
              { id: "dre", label: "Ordem da DRE" },
              { id: "asc", label: "Crescente" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setOrder(opt.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                order === opt.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Área do Gráfico */}
      <div className="h-72 w-full">
        {!hasData ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            {dataset
              ? "Nenhuma movimentação financeira encontrada para este período."
              : "Importe uma planilha financeira para visualizar os dados."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              barCategoryGap="28%"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis
                type="number"
                tickFormatter={(v: number) => compact(v)}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={160}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--foreground)", fontSize: 12 }}
              />
              <Tooltip
                content={<PerformanceTooltip />}
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              />
              <Bar dataKey="magnitude" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.key} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function compact(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return `${Math.round(v)}`;
}

type TooltipPayloadItem = { payload?: BarDatum };

function PerformanceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-xs space-y-1.5 min-w-[180px]">
      <p className="font-bold text-foreground border-b border-border/60 pb-1 mb-1">{data.label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Valor:</span>
        <span
          className={cn(
            "font-bold text-sm",
            data.positive
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400",
          )}
        >
          {formatBRL(data.value)}
        </span>
      </div>
    </div>
  );
}
