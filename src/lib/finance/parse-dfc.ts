import type * as XLSXNS from "xlsx";

let XLSX: typeof XLSXNS;
import {
  ImportError,
  type ExpenseGroup,
  type FinanceDataset,
  type Period,
  type SeriesRow,
} from "./types";

const SHEET_NAME = "DFC ANO";

const MONTHS = [
  "janeiro",
  "fevereiro",
  "marco",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export function normalize(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findSheet(wb: XLSXNS.WorkBook): string | null {
  const target = normalize(SHEET_NAME);
  return wb.SheetNames.find((n) => normalize(n) === target) ?? null;
}

function excelDateToParts(serial: number): { year: number; month: number } | null {
  const parsed = XLSX.SSF.parse_date_code(serial);
  if (!parsed || !parsed.y || !parsed.m) return null;
  return { year: parsed.y, month: parsed.m };
}

/** Try to interpret a header cell as a month period. */
function cellToPeriod(cell: unknown, fallbackYear: number): Period | null {
  if (cell == null || cell === "") return null;

  if (cell instanceof Date) {
    if (!isNaN(cell.getTime())) {
      return makePeriod(cell.getFullYear(), cell.getMonth() + 1);
    }
  }

  if (typeof cell === "number") {
    if (cell > 20000 && cell < 80000) {
      const parts = excelDateToParts(cell);
      if (parts) return makePeriod(parts.year, parts.month);
    }
    if (cell >= 1 && cell <= 12 && Number.isInteger(cell)) {
      return makePeriod(fallbackYear, cell);
    }
    return null;
  }

  const raw = normalize(String(cell));
  if (!raw) return null;

  // Direct numeric date formats: 01/2024, 01-2024, 2024-01, 01/01/2024
  let m = raw.match(/^(\d{1,2})[/\-.](\d{4})$/);
  if (m) return makePeriod(Number(m[2]), Number(m[1]));
  m = raw.match(/^(\d{4})[/\-.](\d{1,2})$/);
  if (m) return makePeriod(Number(m[1]), Number(m[2]));
  m = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (m) {
    const y = Number(m[3]);
    return makePeriod(y < 100 ? 2000 + y : y, Number(m[2]));
  }

  // Month names/abbreviations: Jan, Janeiro, JAN/2026, Janeiro/26, etc.
  for (let idx = 0; idx < MONTHS.length; idx++) {
    const full = MONTHS[idx];
    const abbr = full.slice(0, 3);
    const pattern = new RegExp(`^(?:mes\\s*)?(${full}|${abbr})\\.?[\\s/\\-.de]*(\\d{2,4})?$`, "i");
    const match = raw.match(pattern);
    if (match) {
      let year = fallbackYear;
      if (match[2]) {
        const y = Number(match[2]);
        year = y < 100 ? 2000 + y : y;
      }
      return makePeriod(year, idx + 1);
    }
  }

  return null;
}

function makePeriod(year: number, month: number): Period {
  return {
    key: `${year}-${String(month).padStart(2, "0")}`,
    label: `${MONTH_LABELS[month - 1]}/${String(year).slice(-2)}`,
    year,
    month,
  };
}

function toNumber(cell: unknown): number | null {
  if (typeof cell === "number") return Number.isFinite(cell) ? cell : null;
  if (cell == null) return null;

  let s = String(cell).trim();
  if (!s) return null;

  // Dash representing zero in financial sheets
  if (s === "-" || s === "—" || s === "–" || s === "- ") return 0;

  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1).trim();
  } else if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1).trim();
  }

  s = s
    .replace(/r\$/gi, "")
    .replace(/\$/g, "")
    .replace(/%/g, "")
    .replace(/[\s\u00a0]+/g, "")
    .trim();

  if (!s) return null;
  if (!/[\d]/.test(s)) return null;

  if (s.includes(",") && s.includes(".")) {
    if (s.indexOf(".") < s.indexOf(",")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -Math.abs(n) : n;
}

function isAccountCode(str: string): boolean {
  return /^\d+([.-]\d+)*$/.test(str.trim());
}

type RawRow = { label: string; norm: string; values: Record<string, number>; sum: number };

const MATCHERS = {
  receitas: [
    /faturamento/,
    /^total (de )?receitas?$/,
    /^receitas? totais?$/,
    /^receita bruta$/,
    /^\(?=?\)? ?total (de )?receitas?/,
    /^total entradas$/,
    /^total de entradas$/,
    /^entradas/,
  ],
  custosVariaveis: [
    /custos? variaveis?/,
    /gastos? (de|com) vendas/,
    /despesas? variaveis?/,
    /custo (das )?mercadorias/,
    /^cmv$/,
  ],
  margem: [/margem de contribuicao/],
  resultadoOperacional: [/resultado operacional/, /lucro operacional/],
  resultadoFinal: [
    /resultado (final|liquido|do periodo)/,
    /resultado apos investimentos/,
    /lucro liquido/,
  ],
  saldo: [/saldo acumulado/, /saldo final/, /saldo de caixa acumulado/],
  investimentos: [
    /^investimentos?$/,
    /total (de )?investimentos?/,
    /gastos? (com|de) investimentos?/,
  ],
  despesasFinanceiras: [/despesas? financeiras?/],
  pessoal: [
    /gastos? (com|de) pessoal/,
    /despesas? (com|de) pessoal/,
    /folha de pagamento/,
    /pessoal/,
  ],
  estrutura: [
    /gastos? (de|com) estrutura/,
    /despesas? (de|com) estrutura/,
    /despesas? (fixas|administrativas)/,
    /gastos? fixos/,
    /administrativas/,
  ],
  outrasDespesas: [
    /outras (saidas|despesas)/,
    /outras? saida operacional/,
    /despesas? (nao operacionais|diversas)/,
    /nao operacionais/,
  ],
};

function matches(norm: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(norm));
}

function findRow(rows: RawRow[], patterns: RegExp[]): RawRow | undefined {
  return rows.find((r) => matches(r.norm, patterns));
}

function toSeries(row: RawRow | undefined): SeriesRow | null {
  return row ? { label: row.label, values: row.values } : null;
}

function abs(series: SeriesRow | null): SeriesRow | null {
  if (!series) return null;
  const values: Record<string, number> = {};
  for (const [k, v] of Object.entries(series.values)) values[k] = Math.abs(v);
  return { label: series.label, values };
}

export async function parseDfcWorkbook(file: File): Promise<FinanceDataset> {
  if (!/\.xlsx?$/i.test(file.name)) {
    throw new ImportError(
      "Não foi possível importar a planilha. O arquivo deve estar no formato XLSX.",
    );
  }

  const buffer = await file.arrayBuffer();
  XLSX = await import("xlsx");
  let wb: XLSXNS.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: "array", cellDates: true });
  } catch {
    throw new ImportError("Não foi possível ler o arquivo. Verifique se ele é um XLSX válido.");
  }

  const sheetName = findSheet(wb);
  if (!sheetName) {
    throw new ImportError(
      "Não foi possível importar a planilha. A aba DFC ANO não foi encontrada.",
    );
  }

  const sheet = wb.Sheets[sheetName];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
  });

  const fallbackYear = new Date().getFullYear();

  // Locate the header row: the row with most recognizable month columns.
  let headerIndex = -1;
  let periodsByCol: Map<number, Period> = new Map();
  for (let i = 0; i < Math.min(grid.length, 40); i++) {
    const row = grid[i] ?? [];
    const found = new Map<number, Period>();
    for (let c = 0; c < row.length; c++) {
      const period = cellToPeriod(row[c], fallbackYear);
      if (period && !Array.from(found.values()).some((p) => p.key === period.key)) {
        found.set(c, period);
      }
    }

    // Se a coluna 0 foi identificada mas existem mais colunas de meses à direita,
    // verificar se a Coluna 0 é um falso positivo (ex: "Nov/33" isolado em A enquanto B..M são Jan..Dez)
    if (found.size > 1 && found.has(0)) {
      const p0 = found.get(0)!;
      const otherPeriods = Array.from(found.entries())
        .filter(([c]) => c !== 0)
        .map(([, p]) => p);
      const commonYear = otherPeriods[0]?.year;
      if (commonYear && p0.year !== commonYear) {
        found.delete(0);
      }
    }

    if (found.size > periodsByCol.size) {
      periodsByCol = found;
      headerIndex = i;
    }
  }

  if (headerIndex < 0 || periodsByCol.size === 0) {
    throw new ImportError(
      "Não foi possível importar a planilha. Nenhum período financeiro válido foi encontrado na aba DFC ANO.",
    );
  }

  const periods = Array.from(periodsByCol.values()).sort((a, b) => a.key.localeCompare(b.key));

  // Separate rows in RESUMO section (between header and "DETALHADO")
  const resumoRows: RawRow[] = [];
  const detailedRows: RawRow[] = [];
  let isDetailedSection = false;

  for (let i = headerIndex + 1; i < grid.length; i++) {
    const row = grid[i] ?? [];
    let label = "";
    for (let c = 0; c < row.length; c++) {
      if (periodsByCol.has(c)) continue;
      const cell = row[c];
      if (cell != null) {
        const str = String(cell).trim();
        if (str && !isAccountCode(str) && toNumber(cell) === null) {
          label = str;
          break;
        }
      }
    }
    if (!label) continue;

    const normLabel = normalize(label);
    if (normLabel.includes("detalhado")) {
      isDetailedSection = true;
    }

    const values: Record<string, number> = {};
    let sum = 0;
    let hasValue = false;
    for (const [col, period] of periodsByCol) {
      const n = toNumber(row[col]);
      if (n !== null) {
        values[period.key] = (values[period.key] ?? 0) + n;
        sum += n;
        if (n !== 0) hasValue = true;
      }
    }

    if (!hasValue) continue;
    const rawRow = { label, norm: normLabel, values, sum };

    if (isDetailedSection) {
      detailedRows.push(rawRow);
    } else {
      resumoRows.push(rawRow);
    }
  }

  const rows = resumoRows.length > 0 ? resumoRows : detailedRows;

  if (rows.length === 0) {
    throw new ImportError(
      "Não foi possível importar a planilha. Nenhuma linha financeira reconhecível foi encontrada na aba DFC ANO.",
    );
  }

  // Exact matching for Resumo section indicators
  const receitas = abs(
    toSeries(
      findRow(rows, [/faturamento/, /3 - faturamento/, /total (de )?receitas?/, /receita bruta/]) ??
        findRow(detailedRows, [/entradas \(\+\)/, /total entradas/]),
    ),
  );

  if (!receitas) {
    throw new ImportError(
      'Não foi possível importar a planilha. A linha "Faturamento/Receitas" não foi encontrada na aba DFC ANO.',
    );
  }

  const custosVariaveis = abs(
    toSeries(findRow(rows, [/custos? variaveis?/, /4 - custos? variaveis?/])),
  );
  const margemContribuicao = toSeries(findRow(rows, [/margem de contribuicao/]));
  const resultadoOperacional = toSeries(
    findRow(rows, [/lucro operacional \(=?\)/, /resultado operacional/]),
  );
  const resultadoFinal = toSeries(
    findRow(rows, [/8 - lucro liquido/, /lucro liquido/, /resultado (final|liquido)/]),
  );
  const saldoAcumulado = toSeries(
    findRow(rows, [/9 - saldo acumulado/, /saldo acumulado/, /saldo final/]),
  );
  const investimentos = abs(toSeries(findRow(rows, [/6 - investimentos/, /investimentos/])));

  // Consolidated Expense Groups from Resumo Section
  const groupDefs: { pattern: RegExp; label: string }[] = [
    { pattern: /^4 -|custos? variaveis? total/, label: "Custos Variáveis" },
    { pattern: /5\.2|pessoal/, label: "Gastos com Pessoal" },
    { pattern: /5\.1|administrativas/, label: "Despesas Administrativas" },
    { pattern: /5\.3|materiais e equipamentos/, label: "Materiais e Equipamentos" },
    { pattern: /5\.4|despesas com veiculos/, label: "Despesas com Veículos" },
    { pattern: /5\.5|despesas financeiras/, label: "Despesas Financeiras" },
    { pattern: /^6 -|investimentos \(-\)/, label: "Investimentos" },
    { pattern: /^7 -|resultado nao operacionais/, label: "Outras Despesas Operacionais" },
  ];

  const used = new Set<RawRow>();
  const despesaGroups: ExpenseGroup[] = [];
  for (const def of groupDefs) {
    const row = rows.find((r) => !used.has(r) && def.pattern.test(r.norm));
    if (!row) continue;
    used.add(row);
    const series = abs({ label: def.label, values: row.values })!;
    despesaGroups.push({ label: def.label, values: series.values, children: [] });
  }

  if (despesaGroups.length === 0) {
    throw new ImportError(
      "Não foi possível importar a planilha. Nenhum grupo de despesas foi reconhecido na aba DFC ANO.",
    );
  }

  // Populate child subcategories from detailedRows with 1:1 DFC sheet account code mapping
  if (detailedRows.length > 0) {
    const receitasChildren: SeriesRow[] = [];
    const groupChildrenMap = new Map<string, SeriesRow[]>();

    for (const dRow of detailedRows) {
      const rawLabel = dRow.label.trim();
      const norm = dRow.norm;

      // Skip summary or header lines that repeat category subtotals
      if (
        /^total/i.test(norm) ||
        /(=|\(\+\)|\(-\))/.test(rawLabel) ||
        /resumo|detalhado|entradas total|custos variaveis|lucro operacional|margem de contribuicao|custos fixos|resultado nao operacionais|saldo acumulado/i.test(
          norm,
        )
      ) {
        continue;
      }

      // Extract account code prefix if present (e.g., 3.1.1, 4.1.4, 5.1.1, 5.2.1, 5.3.1, 5.4.1, 5.5.1)
      const codeMatch = rawLabel.match(/^(\d+(?:\.\d+)+)/);
      const code = codeMatch ? codeMatch[1] : "";

      // Clean display label for presentation (removing the numeric code prefix only,
      // so labels like "13º e Férias" aren't stripped of their leading digits)
      const cleanLabel = (code ? rawLabel.slice(code.length) : rawLabel).trim() || rawLabel;

      let targetCategory: string | null = null;

      // Exact Mapping based on DFC ANO sheet structure:
      // 3.x -> Receitas
      // 4.x -> Custos Variáveis
      // 5.1.x -> Despesas Financeiras (Tarifas Bancárias, Aluguel Máquinas Cartão, DOC/TED)
      // 5.2.x -> Despesas Administrativas (Telefone/Internet, Energia, Aluguel, Água, IPTU, Advogado, Contador)
      // 5.3.x -> Gastos com Pessoal (Salário Funcionários, INSS/FGTS, 13º/Férias, Pró-labores, Horas extras, Confraternizações)
      // 5.4.x -> Materiais e Equipamentos (Manutenção Máquinas, Compra de Máquina, Manutenção Predial)
      // 5.5.x -> Despesas com Veículos (Gasolina/Combustível, Manutenção de Veículos)
      // 6.x -> Investimentos (Marketing, Bens Materiais, Desenvolvimento Empresarial)
      // 7.x -> Outras Despesas Operacionais (Entradas/Saídas Não Operacionais)
      if (code.startsWith("3.")) {
        targetCategory = "Receitas";
      } else if (code.startsWith("4.")) {
        targetCategory = "Custos Variáveis";
      } else if (code.startsWith("5.1")) {
        targetCategory = "Despesas Financeiras";
      } else if (code.startsWith("5.2")) {
        targetCategory = "Despesas Administrativas";
      } else if (code.startsWith("5.3")) {
        targetCategory = "Gastos com Pessoal";
      } else if (code.startsWith("5.4")) {
        targetCategory = "Materiais e Equipamentos";
      } else if (code.startsWith("5.5")) {
        targetCategory = "Despesas com Veículos";
      } else if (code.startsWith("5.")) {
        targetCategory = "Despesas Administrativas";
      } else if (code.startsWith("6.")) {
        targetCategory = "Investimentos";
      } else if (code.startsWith("7.")) {
        targetCategory = "Outras Despesas Operacionais";
      }

      // Semantic keyword fallback if numeric code was missing
      if (!targetCategory) {
        if (/vendas?|faturamento|receita|pix|débito|crédito|dinheiro|entradas/i.test(norm)) {
          targetCategory = "Receitas";
        } else if (
          /salário|folha|pro-labore|pró-labore|fgts|inss|rescisão|férias|13º|diarista|confraternização|horas extras/i.test(
            norm,
          )
        ) {
          targetCategory = "Gastos com Pessoal";
        } else if (
          /aluguel|energia|luz|água|telefone|internet|celular|iptu|licença|advogado|contador|matadouro/i.test(
            norm,
          )
        ) {
          targetCategory = "Despesas Administrativas";
        } else if (/combustível|gasolina|diesel|frota|veículo/i.test(norm)) {
          targetCategory = "Despesas com Veículos";
        } else if (/tarifa|taxa|banco|doc|ted|maquininha/i.test(norm)) {
          targetCategory = "Despesas Financeiras";
        } else if (
          /manutenção máquinas|compra de maquina|manutenção predial|expediente/i.test(norm)
        ) {
          targetCategory = "Materiais e Equipamentos";
        } else if (/marketing|propaganda|anúncio|bens|desenvolvimento/i.test(norm)) {
          targetCategory = "Investimentos";
        } else if (
          /fornecedor|cmv|icms|pis|cofins|dae|simples|produtos|embalagem|comissão/i.test(norm)
        ) {
          targetCategory = "Custos Variáveis";
        }
      }

      if (!targetCategory) continue;

      const childRow: SeriesRow = {
        label: cleanLabel,
        values: Object.fromEntries(Object.entries(dRow.values).map(([k, v]) => [k, Math.abs(v)])),
      };

      if (targetCategory === "Receitas") {
        receitasChildren.push(childRow);
      } else {
        if (!groupChildrenMap.has(targetCategory)) {
          groupChildrenMap.set(targetCategory, []);
        }
        groupChildrenMap.get(targetCategory)!.push(childRow);
      }
    }

    if (receitas && receitasChildren.length > 0) {
      receitas.children = receitasChildren;
    }

    for (const group of despesaGroups) {
      const children = groupChildrenMap.get(group.label);
      if (children && children.length > 0) {
        group.children = children;
      }
    }
  }

  return {
    fileName: file.name,
    importedAt: new Date().toISOString(),
    periods,
    receitas,
    custosVariaveis,
    margemContribuicao: toSeries(findRow(rows, MATCHERS.margem)),
    resultadoOperacional: toSeries(findRow(rows, MATCHERS.resultadoOperacional)),
    resultadoFinal: toSeries(findRow(rows, MATCHERS.resultadoFinal)),
    saldoAcumulado: toSeries(findRow(rows, MATCHERS.saldo)),
    investimentos,
    despesaGroups,
  };
}
