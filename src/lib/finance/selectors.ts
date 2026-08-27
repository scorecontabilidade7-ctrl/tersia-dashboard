import type { FinanceDataset, Period, SeriesRow } from "./types";

export type PeriodFilterId = "this-month" | "last-month" | "this-year" | "last-12" | "custom";

export type PeriodSelection = {
  id: PeriodFilterId;
  /** inclusive range of period keys, only for custom */
  from?: string;
  to?: string;
};

export function sumSeries(series: SeriesRow | null | undefined, keys: string[]): number {
  if (!series) return 0;
  return keys.reduce((acc, k) => acc + (series.values[k] ?? 0), 0);
}

export function lastValue(series: SeriesRow | null | undefined, keys: string[]): number | null {
  if (!series) return null;
  for (let i = keys.length - 1; i >= 0; i--) {
    const v = series.values[keys[i]];
    if (typeof v === "number") return v;
  }
  return null;
}

export function resolvePeriods(dataset: FinanceDataset, selection: PeriodSelection): Period[] {
  const all = dataset.periods;
  if (all.length === 0) return [];
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  switch (selection.id) {
    case "this-month": {
      const found = all.find((p) => p.key === currentKey);
      return found ? [found] : all.slice(-1);
    }
    case "last-month": {
      const idx = all.findIndex((p) => p.key === currentKey);
      if (idx > 0) return [all[idx - 1]];
      return all.length > 1 ? [all[all.length - 2]] : all.slice(-1);
    }
    case "this-year": {
      const year = all.some((p) => p.year === now.getFullYear()) ? now.getFullYear() : all[all.length - 1].year;
      return all.filter((p) => p.year === year);
    }
    case "last-12":
      return all.slice(-12);
    case "custom": {
      const from = selection.from ?? all[0].key;
      const to = selection.to ?? all[all.length - 1].key;
      const [lo, hi] = from <= to ? [from, to] : [to, from];
      return all.filter((p) => p.key >= lo && p.key <= hi);
    }
    default:
      return all;
  }
}

/** Equivalent window immediately before the selected one, for variation %. */
export function previousWindow(dataset: FinanceDataset, current: Period[]): Period[] {
  if (current.length === 0) return [];
  const all = dataset.periods;
  const startIdx = all.findIndex((p) => p.key === current[0].key);
  if (startIdx <= 0) return [];
  const from = Math.max(0, startIdx - current.length);
  return all.slice(from, startIdx);
}

export function delta(current: number, previous: number): number {
  if (!previous) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export type ExpenseSlice = { label: string; value: number; percent: number };

export function expenseBreakdown(dataset: FinanceDataset, keys: string[]): ExpenseSlice[] {
  const items = dataset.despesaGroups
    .map((g) => ({ label: g.label, value: sumSeries(g, keys) }))
    .filter((i) => Math.abs(i.value) > 0.005);
  const total = items.reduce((a, i) => a + i.value, 0);
  return items
    .map((i) => ({ ...i, percent: total ? (i.value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

export function totalDespesas(dataset: FinanceDataset, keys: string[]): number {
  return dataset.despesaGroups.reduce((acc, g) => acc + sumSeries(g, keys), 0);
}

export function totalReceitas(dataset: FinanceDataset, keys: string[]): number {
  return sumSeries(dataset.receitas, keys);
}

export function margemContribuicao(dataset: FinanceDataset, keys: string[]): number {
  if (dataset.margemContribuicao) return sumSeries(dataset.margemContribuicao, keys);
  return totalReceitas(dataset, keys) - sumSeries(dataset.custosVariaveis, keys);
}

export function resultadoFinal(dataset: FinanceDataset, keys: string[]): number {
  if (dataset.resultadoFinal) return sumSeries(dataset.resultadoFinal, keys);
  return totalReceitas(dataset, keys) - totalDespesas(dataset, keys);
}

export function saldoFinal(dataset: FinanceDataset, keys: string[]): number {
  return resultadoFinal(dataset, keys);
}

export function resultadoOperacional(dataset: FinanceDataset, keys: string[]): number {
  if (dataset.resultadoOperacional) return sumSeries(dataset.resultadoOperacional, keys);
  const fixas = dataset.despesaGroups
    .filter((g) => g.label !== "Custos Variáveis" && g.label !== "Investimentos")
    .reduce((acc, g) => acc + sumSeries(g, keys), 0);
  return margemContribuicao(dataset, keys) - fixas;
}

export function monthlySeries(dataset: FinanceDataset, periods: Period[]) {
  return periods.map((p) => ({
    month: p.label,
    key: p.key,
    receitas: sumSeries(dataset.receitas, [p.key]),
    despesas: totalDespesas(dataset, [p.key]),
  }));
}

export type CategoryPoint = {
  category: string;
  shortLabel: string;
  valor: number;
  tipo: "receita" | "despesa";
  percentual: number;
};

export function monthCategorySeries(dataset: FinanceDataset, periodKey: string): CategoryPoint[] {
  const points: CategoryPoint[] = [];
  const recVal = sumSeries(dataset.receitas, [periodKey]);

  if (recVal > 0) {
    points.push({
      category: "Total de Receitas",
      shortLabel: "Receitas",
      valor: recVal,
      tipo: "receita",
      percentual: 100,
    });
  }

  for (const group of dataset.despesaGroups) {
    const val = sumSeries(group, [periodKey]);
    if (val > 0.005) {
      let short = group.label;
      if (short === "Despesas Administrativas") short = "Desp. Adm.";
      else if (short === "Gastos com Pessoal") short = "Pessoal";
      else if (short === "Despesas com Veículos") short = "Veículos";
      else if (short === "Despesas Financeiras") short = "Desp. Fin.";
      else if (short === "Materiais e Equipamentos") short = "Materiais";
      else if (short === "Outras Despesas Operacionais") short = "Outras Desp.";

      points.push({
        category: group.label,
        shortLabel: short,
        valor: val,
        tipo: "despesa",
        percentual: recVal > 0 ? (val / recVal) * 100 : 0,
      });
    }
  }

  return points;
}

export type DreLine = {
  id: string;
  label: string;
  value: number;
  kind: "income" | "expense" | "total";
  indent?: boolean;
  hasChildren?: boolean;
  children?: DreLine[];
};

export function buildDre(dataset: FinanceDataset, keys: string[]): DreLine[] {
  const lines: DreLine[] = [];

  // Total de Receitas
  const receitasVal = totalReceitas(dataset, keys);
  const receitasChildren: DreLine[] | undefined = dataset.receitas?.children
    ?.map((c) => ({
      id: `receitas-${c.label}`,
      label: c.label,
      value: sumSeries(c, keys),
      kind: "income" as const,
      indent: true,
    }))
    .filter((c) => Math.abs(c.value) > 0.001);

  lines.push({
    id: "receitas",
    label: "Total de Receitas",
    value: receitasVal,
    kind: "income",
    hasChildren: Boolean(receitasChildren && receitasChildren.length > 0),
    children: receitasChildren,
  });

  // Custos Variáveis
  const custos = dataset.despesaGroups.find((g) => g.label === "Custos Variáveis");
  if (custos) {
    const custosChildren: DreLine[] | undefined = custos.children
      ?.map((c) => ({
        id: `custos-${c.label}`,
        label: c.label,
        value: -sumSeries(c, keys),
        kind: "expense" as const,
        indent: true,
      }))
      .filter((c) => Math.abs(c.value) > 0.001);
    lines.push({
      id: `group-${custos.label}`,
      label: custos.label,
      value: -sumSeries(custos, keys),
      kind: "expense",
      hasChildren: Boolean(custosChildren && custosChildren.length > 0),
      children: custosChildren,
    });
  }

  // Margem de Contribuição
  lines.push({
    id: "margem-contribuicao",
    label: "Margem de Contribuição",
    value: margemContribuicao(dataset, keys),
    kind: "total",
    indent: true,
  });

  // Demais grupos de despesas
  for (const g of dataset.despesaGroups) {
    if (g.label === "Custos Variáveis" || g.label === "Investimentos") continue;
    const gChildren: DreLine[] | undefined = g.children
      ?.map((c) => ({
        id: `group-${g.label}-${c.label}`,
        label: c.label,
        value: -sumSeries(c, keys),
        kind: "expense" as const,
        indent: true,
      }))
      .filter((c) => Math.abs(c.value) > 0.001);
    lines.push({
      id: `group-${g.label}`,
      label: g.label,
      value: -sumSeries(g, keys),
      kind: "expense",
      hasChildren: Boolean(gChildren && gChildren.length > 0),
      children: gChildren,
    });
  }

  // Resultado Operacional
  lines.push({
    id: "resultado-operacional",
    label: "Resultado Operacional",
    value: resultadoOperacional(dataset, keys),
    kind: "total",
    indent: true,
  });

  // Investimentos
  const invest = dataset.despesaGroups.find((g) => g.label === "Investimentos");
  if (invest) {
    const investChildren: DreLine[] | undefined = invest.children
      ?.map((c) => ({
        id: `invest-${c.label}`,
        label: c.label,
        value: -sumSeries(c, keys),
        kind: "expense" as const,
        indent: true,
      }))
      .filter((c) => Math.abs(c.value) > 0.001);
    lines.push({
      id: `group-${invest.label}`,
      label: invest.label,
      value: -sumSeries(invest, keys),
      kind: "expense",
      hasChildren: Boolean(investChildren && investChildren.length > 0),
      children: investChildren,
    });
  }

  // Resultado Final
  lines.push({
    id: "resultado-final",
    label: "Resultado Final",
    value: resultadoFinal(dataset, keys),
    kind: "total",
    indent: true,
  });

  return lines;
}
