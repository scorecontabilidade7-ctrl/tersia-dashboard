import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useFinance } from "@/lib/finance/finance-store";
import {
  monthlySeries,
  monthCategorySeries,
  totalReceitas,
  totalDespesas,
  sumSeries,
} from "@/lib/finance/selectors";
import { formatBRL, formatBRLCompact, formatPercent } from "@/lib/finance/format";

export function RevenueExpenseChart() {
  const { dataset, selection } = useFinance();

  const isSingleMonth = selection.id === "custom" && selection.from === selection.to;
  const selectedMonthKey = isSingleMonth ? (selection.from ?? "") : "";

  // 1. Caso Mês Específico Selecionado: O gráfico adapta para mostrar a curva e composição de Receita vs Despesas daquele mês
  const monthlyCategoryData =
    dataset && isSingleMonth && selectedMonthKey
      ? monthCategorySeries(dataset, selectedMonthKey)
      : [];

  const selectedMonthObj = dataset?.periods.find((p) => p.key === selectedMonthKey);
  const selectedMonthLabel = selectedMonthObj?.label ?? "";

  const monthReceitas = dataset && isSingleMonth ? totalReceitas(dataset, [selectedMonthKey]) : 0;
  const monthDespesas = dataset && isSingleMonth ? totalDespesas(dataset, [selectedMonthKey]) : 0;
  const monthResultado = monthReceitas - monthDespesas;

  // 2. Caso Desempenho Anual / Múltiplos Meses: Filtramos apenas meses com movimentação (para não exibir linha reta zerada no futuro)
  const activeAnnualPeriods = dataset
    ? dataset.periods.filter(
        (p) =>
          sumSeries(dataset.receitas, [p.key]) > 0 ||
          totalDespesas(dataset, [p.key]) > 0
      )
    : [];

  const annualData = dataset ? monthlySeries(dataset, activeAnnualPeriods) : [];

  const hasData = isSingleMonth ? monthlyCategoryData.length > 0 : annualData.length > 0;

  return (
    <div className="rounded-2xl bg-card p-5 md:p-6 border border-border/60 shadow-xs">
      {/* Header do Card */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {isSingleMonth
              ? `Receitas vs Despesas — ${selectedMonthLabel}`
              : "Receitas vs Despesas — Desempenho Anual"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isSingleMonth
              ? `Detalhamento comparativo de receitas e grupos de despesas em ${selectedMonthLabel}`
              : "Evolução temporal consolidada mês a mês"}
          </p>
        </div>

        {/* Indicadores / Legendas */}
        {isSingleMonth ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Receitas:{" "}
              <strong className="tabular-nums">{formatBRL(monthReceitas)}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 font-medium text-primary border border-primary/20">
              <span className="h-2 w-2 rounded-full bg-primary" /> Despesas:{" "}
              <strong className="tabular-nums">{formatBRL(monthDespesas)}</strong>
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold border ${
                monthResultado >= 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
              }`}
            >
              Resultado: <span className="tabular-nums">{formatBRL(monthResultado)}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Receitas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Despesas
            </span>
          </div>
        )}
      </div>

      {/* Área do Gráfico */}
      <div className="h-72 w-full">
        {!hasData ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            {dataset
              ? "Nenhuma movimentação financeira encontrada para este período."
              : "Importe uma planilha financeira para visualizar os dados."}
          </div>
        ) : isSingleMonth ? (
          /* Gráfico adaptado para o Mês Selecionado */
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={monthlyCategoryData}
              margin={{ top: 15, right: 20, left: 0, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="shortLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={40}
              />
              <YAxis
                tickFormatter={formatBRLCompact}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                width={70}
              />
              <Tooltip content={<CategoryChartTooltip />} />
              <Line
                type="monotone"
                dataKey="valor"
                name="Valor"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={<CustomCategoryDot />}
                activeDot={{ r: 8, stroke: "var(--card)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          /* Gráfico Anual (Meses com movimentação) */
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={annualData}
              margin={{ top: 10, right: 15, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                tickFormatter={formatBRLCompact}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                width={70}
              />
              <Tooltip content={<AnnualChartTooltip />} />
              <Line
                type="monotone"
                dataKey="receitas"
                name="Receitas"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                activeDot={{ r: 7, stroke: "var(--card)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="despesas"
                name="Despesas"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
                activeDot={{ r: 7, stroke: "var(--card)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// Dot personalizado para o gráfico de categorias do mês
function CustomCategoryDot(props: any) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;

  const isReceita = payload?.tipo === "receita";
  const fill = isReceita ? "#10b981" : "var(--primary)";

  return (
    <circle
      cx={cx}
      cy={cy}
      r={isReceita ? 6 : 5}
      fill={fill}
      stroke="var(--card)"
      strokeWidth={2}
    />
  );
}

// Tooltip para o gráfico de categorias do mês selecionado
function CategoryChartTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const isReceita = data.tipo === "receita";

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-xs space-y-1.5 min-w-[180px]">
      <p className="font-bold text-foreground border-b border-border/60 pb-1 mb-1 flex items-center justify-between gap-2">
        <span>{data.category}</span>
        <span
          className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-semibold ${
            isReceita
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-primary/10 text-primary"
          }`}
        >
          {isReceita ? "Receita" : "Despesa"}
        </span>
      </p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Valor:</span>
        <span
          className={`font-bold text-sm ${
            isReceita
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {formatBRL(data.valor)}
        </span>
      </div>
      {!isReceita && data.percentual > 0 && (
        <div className="flex items-center justify-between gap-4 text-muted-foreground border-t border-border/60 pt-1">
          <span>% da Receita:</span>
          <span className="font-semibold text-rose-600 dark:text-rose-400">
            {formatPercent(data.percentual)}
          </span>
        </div>
      )}
    </div>
  );
}

// Tooltip para o gráfico anual
function AnnualChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const receitasVal = payload.find((p: any) => p.dataKey === "receitas")?.value ?? 0;
  const despesasVal = payload.find((p: any) => p.dataKey === "despesas")?.value ?? 0;
  const resultado = receitasVal - despesasVal;

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-xs space-y-1.5 min-w-[170px]">
      <p className="font-bold text-foreground border-b border-border/60 pb-1 mb-1">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Receitas:
        </span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {formatBRL(receitasVal)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" /> Despesas:
        </span>
        <span className="font-semibold text-rose-600 dark:text-rose-400">
          {formatBRL(despesasVal)}
        </span>
      </div>
      <div className="border-t border-border/60 pt-1 mt-1 flex items-center justify-between gap-4 font-bold">
        <span className="text-muted-foreground">Resultado:</span>
        <span
          className={
            resultado >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }
        >
          {formatBRL(resultado)}
        </span>
      </div>
    </div>
  );
}
