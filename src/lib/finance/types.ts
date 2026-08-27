export type Period = {
  /** ISO-like key: YYYY-MM */
  key: string;
  label: string;
  year: number;
  month: number; // 1-12
};

export type SeriesRow = {
  label: string;
  /** values per period key */
  values: Record<string, number>;
  /** sub-item series rows */
  children?: SeriesRow[];
};

export type ExpenseGroup = {
  label: string;
  /** child rows detected under the group */
  children: SeriesRow[];
} & SeriesRow;

export type FinanceDataset = {
  fileName: string;
  importedAt: string; // ISO
  periods: Period[];
  receitas: SeriesRow | null;
  custosVariaveis: SeriesRow | null;
  margemContribuicao: SeriesRow | null;
  resultadoOperacional: SeriesRow | null;
  resultadoFinal: SeriesRow | null;
  saldoAcumulado: SeriesRow | null;
  investimentos: SeriesRow | null;
  despesaGroups: ExpenseGroup[];
};

export class ImportError extends Error {}
