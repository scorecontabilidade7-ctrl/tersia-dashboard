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
      const year = all.some((p) => p.year === now.getFullYear())
        ? now.getFullYear()
        : all[all.length - 1].year;
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

export type TopExpenseItem = {
  /** Nome da categoria (ex.: Investimentos). */
  label: string;
  /** Soma das subcontas da categoria no período. */
  value: number;
  /** Subcontas que compõem a categoria (para detalhamento no tooltip). */
  children: { label: string; value: number }[];
};

/** Grupos que compõem "Despesas Fixas da Clínica" na DRE. */
const FIXED_EXPENSE_LABELS = new Set([
  "Gastos com Pessoal",
  "Despesas Administrativas",
  "Materiais e Equipamentos",
  "Despesas com Veículos",
  "Despesas Financeiras",
  "Investimentos",
]);

/**
 * Top N categorias de "Despesas Fixas da Clínica" da DRE no período, agregadas
 * pela soma das suas subcontas (contas-filhas), ordenadas por magnitude.
 */
export function topExpenseItems(
  dataset: FinanceDataset,
  keys: string[],
  limit: number,
): TopExpenseItem[] {
  const items: TopExpenseItem[] = [];
  for (const g of dataset.despesaGroups) {
    if (!FIXED_EXPENSE_LABELS.has(g.label)) continue;
    const value = sumSeries(g, keys);
    if (Math.abs(value) <= 0.005) continue;

    const subs = (g.children ?? [])
      .map((c) => ({ label: c.label, value: sumSeries(c, keys) }))
      .filter((s) => Math.abs(s.value) > 0.005)
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    items.push({ label: g.label, value, children: subs });
  }
  items.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return items.slice(0, limit);
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

/** Item componente de uma linha da DRE (conta/grupo que a compõe). */
export type DreBreakItem = {
  label: string;
  value: number;
  /** Subcontas que compõem este item (para itens que são grupos). */
  children?: DreBreakItem[];
};

export type DreLine = {
  id: string;
  label: string;
  value: number;
  kind: "income" | "expense" | "total";
  indent?: boolean;
  /** Grupos de contas que compõem esta linha (somente os com movimentação). */
  children?: DreBreakItem[];
};

/** Guarda o label normalizado (sem acentos, minúsculas) para casar padrões. */
function normalizeLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function findChild(row: SeriesRow | undefined, keys: string[], matcher: RegExp): number {
  if (!row?.children) return 0;
  for (const c of row.children) {
    if (matcher.test(normalizeLabel(c.label))) return sumSeries(c, keys);
  }
  return 0;
}

/** Soma dos grupos de despesas fixas (5.x) + investimentos, excluindo pró-labore. */
function despesasFixasTotal(dataset: FinanceDataset, keys: string[], prolabore: number): number {
  const fixedLabels = new Set([
    "Gastos com Pessoal",
    "Despesas Administrativas",
    "Materiais e Equipamentos",
    "Despesas com Veículos",
    "Despesas Financeiras",
  ]);
  let total = 0;
  for (const row of dataset.despesaGroups) {
    if (fixedLabels.has(row.label)) total += sumSeries(row, keys);
  }
  const invest = dataset.despesaGroups.find((g) => g.label === "Investimentos");
  if (invest) total += sumSeries(invest, keys);
  return total - prolabore;
}

/** Filtra itens com valor ~0 (sem movimentação). */
function breaks(items: DreBreakItem[]): DreBreakItem[] {
  return items.filter((i) => Math.abs(i.value) > 0.005);
}

/**
 * Converte linhas filhos de uma série em itens de breakdown de forma recursiva,
 * permitindo explorar subgrupos (ex.: grupo -> contas que o compõem).
 * `exclude` remove contas específicas (ex.: pró-labore de Gastos com Pessoal).
 */
function rowBreaks(
  rows: SeriesRow[] | undefined,
  keys: string[],
  exclude?: (label: string) => boolean,
): DreBreakItem[] {
  if (!rows) return [];
  const items: DreBreakItem[] = [];
  for (const r of rows) {
    const label = r.label;
    if (exclude && exclude(label)) continue;
    const item: DreBreakItem = { label, value: sumSeries(r, keys) };
    const nested = rowBreaks(r.children, keys, exclude);
    if (nested.length) item.children = nested;
    items.push(item);
  }
  return breaks(items);
}

/**
 * DRE simplificada, pensada para facilitar a leitura da cliente e a explicação
 * do consultor — apresenta apenas linhas principais, sem subcategorias.
 */
export function buildSimpleDre(dataset: FinanceDataset, keys: string[]): DreLine[] {
  const lines: DreLine[] = [];

  // ---- Faturamento (+)
  const faturamento = totalReceitas(dataset, keys);
  const receitaItems = rowBreaks(dataset.receitas?.children, keys);
  lines.push({
    id: "faturamento",
    label: "Faturamento",
    value: faturamento,
    kind: "income",
    children: receitaItems,
  });

  const custos = dataset.despesaGroups.find((g) => g.label === "Custos Variáveis");
  const custosTotal = custos ? sumSeries(custos, keys) : 0;

  // ---- Despesas Tributárias (-)
  const tributaryChildren =
    custos?.children?.filter((c) =>
      /tribut|pis|cofins|icms|csll|irpj|dae|imposto|simples|taxa/.test(normalizeLabel(c.label)),
    ) ?? [];
  const tributarias = tributaryChildren.reduce((acc, c) => acc + sumSeries(c, keys), 0);
  lines.push({
    id: "desp-tributarias",
    label: "Despesas Tributárias",
    value: -tributarias,
    kind: "expense",
    children: rowBreaks(tributaryChildren, keys),
  });

  // ---- Despesas com Comissões (-)
  const comissaoChildren =
    custos?.children?.filter((c) => /comiss/.test(normalizeLabel(c.label))) ?? [];
  const comissoes = comissaoChildren.reduce((acc, c) => acc + sumSeries(c, keys), 0);
  lines.push({
    id: "desp-comissoes",
    label: "Despesas com Comissões",
    value: -comissoes,
    kind: "expense",
    children: rowBreaks(comissaoChildren, keys),
  });

  // ---- Despesas com Produtos (-) -> restante dos custos variáveis
  const produtos = custosTotal - tributarias - comissoes;
  const produtoChildren =
    custos?.children?.filter((c) => {
      const label = normalizeLabel(c.label);
      return !/(tribut|pis|cofins|icms|csll|irpj|dae|imposto|simples|taxa|comiss)/.test(label);
    }) ?? [];
  lines.push({
    id: "desp-produtos",
    label: "Despesas com Produtos",
    value: -produtos,
    kind: "expense",
    children: rowBreaks(produtoChildren, keys),
  });

  // ---- Lucro Bruto (=)
  const lucroBruto = faturamento - custosTotal;
  lines.push({
    id: "lucro-bruto",
    label: "Lucro Bruto",
    value: lucroBruto,
    kind: "total",
    indent: true,
  });

  // ---- Pró-labore (-) -> dentro de Gastos com Pessoal
  const pessoal = dataset.despesaGroups.find((g) => g.label === "Gastos com Pessoal");
  const prolabore = findChild(pessoal, keys, /pro[- ]?labore/);

  // ---- Despesas Fixas da Clínica (-)
  const fixedLabels = new Set([
    "Gastos com Pessoal",
    "Despesas Administrativas",
    "Materiais e Equipamentos",
    "Despesas com Veículos",
    "Despesas Financeiras",
  ]);
  const invest = dataset.despesaGroups.find((g) => g.label === "Investimentos");
  const fixedGroupRows = dataset.despesaGroups.filter((g) => fixedLabels.has(g.label));
  const despesasFixas =
    fixedGroupRows.reduce((acc, g) => acc + sumSeries(g, keys), 0) +
    (invest ? sumSeries(invest, keys) : 0) -
    prolabore;

  const fixedBreakItems: DreBreakItem[] = [];
  const excludePessoal = (label: string) => /pro[- ]?labore/.test(normalizeLabel(label));
  for (const g of fixedGroupRows) {
    let v = sumSeries(g, keys);
    if (g.label === "Gastos com Pessoal") v -= prolabore;
    const exclude = g.label === "Gastos com Pessoal" ? excludePessoal : undefined;
    const nested = rowBreaks(g.children, keys, exclude);
    fixedBreakItems.push({
      label: g.label,
      value: v,
      children: nested.length ? nested : undefined,
    });
  }
  if (invest) {
    const nested = rowBreaks(invest.children, keys);
    fixedBreakItems.push({
      label: invest.label,
      value: sumSeries(invest, keys),
      children: nested.length ? nested : undefined,
    });
  }

  lines.push({
    id: "desp-fixas",
    label: "Despesas Fixas da Clínica",
    value: -despesasFixas,
    kind: "expense",
    children: breaks(fixedBreakItems),
  });

  // ---- Lucro da Clínica (=)
  const lucroClinica = lucroBruto - despesasFixas;
  lines.push({
    id: "lucro-clinica",
    label: "Lucro da Clínica",
    value: lucroClinica,
    kind: "total",
    indent: true,
  });

  // ---- Pró-labore (-)
  lines.push({ id: "pro-labore", label: "Pró-labore", value: -prolabore, kind: "expense" });

  // ---- Acertos de Caixa (-) e Saídas Não Operacionais (-)
  const outras = dataset.despesaGroups.find((g) => g.label === "Outras Despesas Operacionais");
  const acertosCaixa = findChild(outras, keys, /acerto/);
  const saidasNaoOperacionais = findChild(
    outras,
    keys,
    /nao operacional|saidas nao|saida nao operacional|resultado nao operacional/,
  );
  lines.push({
    id: "acertos-caixa",
    label: "Acertos de Caixa",
    value: -acertosCaixa,
    kind: "expense",
  });
  lines.push({
    id: "saidas-nao-op",
    label: "Saídas Não Operacionais",
    value: -saidasNaoOperacionais,
    kind: "expense",
  });

  // ---- Lucro Líquido (=)
  const lucroLiquido = saldoFinal(dataset, keys);
  lines.push({
    id: "lucro-liquido",
    label: "Lucro Líquido",
    value: lucroLiquido,
    kind: "total",
    indent: true,
  });

  // Oculta linhas sem movimentação (valor ~0) para manter a DRE limpa,
  // mas sempre preserva as linhas de total (Lucro Bruto, da Clínica, Líquido).
  return lines.filter((l) => l.kind === "total" || Math.abs(l.value) > 0.005);
}

/** Lucro Bruto do período: Faturamento - Custos Variáveis. */
export function lucroBruto(dataset: FinanceDataset, keys: string[]): number {
  const custos = dataset.despesaGroups.find((g) => g.label === "Custos Variáveis");
  const custosTotal = custos ? sumSeries(custos, keys) : 0;
  return totalReceitas(dataset, keys) - custosTotal;
}

/** Lucro da Clínica do período: Lucro Bruto - Despesas Fixas. */
export function lucroClinica(dataset: FinanceDataset, keys: string[]): number {
  const fixas = despesasFixasTotal(dataset, keys, proLabore(dataset, keys));
  return lucroBruto(dataset, keys) - fixas;
}

/** Pró-labore do período (item "Pró-labores" em Gastos com Pessoal). */
export function proLabore(dataset: FinanceDataset, keys: string[]): number {
  const pessoal = dataset.despesaGroups.find((g) => g.label === "Gastos com Pessoal");
  return findChild(pessoal, keys, /pro[- ]?labore/);
}

/** Despesas Fixas da Clínica do período (fixas + investimentos - pró-labore). */
export function despesasFixasClinica(dataset: FinanceDataset, keys: string[]): number {
  return despesasFixasTotal(dataset, keys, proLabore(dataset, keys));
}
