import { Fragment, useState } from "react";
import { ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinance } from "@/lib/finance/finance-store";
import { buildSimpleDre, delta, type DreBreakItem } from "@/lib/finance/selectors";
import { formatBRL } from "@/lib/finance/format";

const HIGHLIGHT_IDS = new Set(["faturamento", "lucro-bruto", "lucro-clinica", "lucro-liquido"]);

function BreakRows({
  items,
  path,
  isExpense,
  open,
  toggle,
  depth,
}: {
  items: DreBreakItem[];
  path: string;
  isExpense: boolean;
  open: Set<string>;
  toggle: (key: string) => void;
  depth: number;
}) {
  return (
    <>
      {items.map((item, i) => {
        const key = `${path}/${i}`;
        const expandable = !!item.children?.length;
        const expanded = expandable && open.has(key);
        return (
          <Fragment key={key}>
            <tr
              className={cn(
                "border-b border-border/50 last:border-b-0 bg-muted/30",
                expandable && expanded && "border-b-0",
              )}
            >
              <td className="py-2" style={{ paddingLeft: 40 + depth * 22 }}>
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  className={cn(
                    "flex w-full items-center gap-1 rounded text-left text-sm text-muted-foreground",
                    expandable && "cursor-pointer hover:text-primary",
                  )}
                  disabled={!expandable}
                  aria-expanded={expanded}
                >
                  {expandable && (
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform",
                        expanded && "rotate-180",
                      )}
                    />
                  )}
                  <span>{item.label}</span>
                </button>
              </td>
              <td
                className={cn(
                  "text-right py-2 pr-3 text-sm tabular-nums",
                  item.value < 0
                    ? "text-destructive"
                    : isExpense
                      ? "text-foreground"
                      : "text-success",
                )}
              >
                {formatBRL(item.value)}
              </td>
              <td className="text-right py-2 pr-2">
                <span className="text-xs text-muted-foreground">—</span>
              </td>
            </tr>
            {expanded && item.children && (
              <BreakRows
                items={item.children}
                path={key}
                isExpense={isExpense}
                open={open}
                toggle={toggle}
                depth={depth + 1}
              />
            )}
          </Fragment>
        );
      })}
    </>
  );
}

export function DreTable() {
  const { dataset, periodKeys, previousKeys } = useFinance();
  const rows = dataset ? buildSimpleDre(dataset, periodKeys) : [];
  const prevRows = dataset && previousKeys.length ? buildSimpleDre(dataset, previousKeys) : [];

  const [open, setOpen] = useState<Set<string>>(
    () => new Set(rows.filter((r) => r.children?.length).map((r) => r.id)),
  );
  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="rounded-2xl bg-card p-5 md:p-6 border border-border/60">
      <div className="mb-5">
        <h3 className="text-base font-bold">
          <span className="text-primary">DRE</span>: Demonstrativo de Resultado do Exercício
        </h3>
        <p className="text-sm text-muted-foreground">
          {dataset
            ? `Fonte: aba DFC ANO — ${dataset.fileName}`
            : "Aguardando importação da planilha"}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Importe uma planilha financeira para visualizar os dados.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm border-collapse">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="text-left font-medium py-2.5 pl-2">Descrição</th>
                <th className="text-right font-medium py-2.5">Valor</th>
                <th className="text-right font-medium py-2.5 pr-2 w-24">Variação</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const prevRow = prevRows.find((p) => p.id === r.id);
                const prev = prevRow?.value ?? 0;
                const variation = delta(r.value, prev);
                const hasVariation = prevRows.length > 0 && prev !== 0;

                const isHighlight = HIGHLIGHT_IDS.has(r.id);
                const expandable = !!r.children?.length;
                const expanded = expandable && open.has(r.id);

                return (
                  <Fragment key={r.id || r.label}>
                    <tr
                      className={cn(
                        "border-b border-border/50 last:border-b-0 transition-colors",
                        r.kind === "total" && "border-b border-border/70",
                        isHighlight && "bg-primary/[0.06] font-bold border-l-4 border-primary",
                        expandable && expanded && "border-b-0",
                      )}
                    >
                      <td className="py-3 pl-3">
                        <span
                          className={cn(
                            "flex items-center tracking-tight",
                            isHighlight
                              ? "text-[15px] font-extrabold text-foreground"
                              : "font-medium",
                            r.indent && "pl-5",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggle(r.id)}
                            className={cn(
                              "flex w-full items-center gap-1 rounded text-left",
                              expandable && "cursor-pointer hover:text-primary",
                            )}
                            disabled={!expandable}
                            aria-expanded={expanded}
                          >
                            {expandable && (
                              <ChevronDown
                                className={cn(
                                  "-ml-1 h-4 w-4 shrink-0 transition-transform text-muted-foreground",
                                  expanded && "rotate-180",
                                )}
                              />
                            )}
                            <span>{r.label}</span>
                          </button>
                        </span>
                      </td>
                      <td
                        className={cn(
                          "text-right py-3 tabular-nums",
                          isHighlight ? "text-[15px] font-extrabold" : "font-semibold",
                          r.value < 0
                            ? "text-destructive"
                            : r.kind === "expense"
                              ? "text-foreground"
                              : "text-success",
                        )}
                      >
                        {formatBRL(r.value)}
                      </td>
                      <td className="text-right py-3 pr-2">
                        {hasVariation ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
                              variation >= 0
                                ? "bg-success-soft text-success"
                                : "bg-danger-soft text-destructive",
                            )}
                          >
                            {variation >= 0 ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {Math.abs(variation).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                    {expanded && r.children && (
                      <BreakRows
                        items={r.children}
                        path={`main-${r.id}`}
                        isExpense={r.kind === "expense"}
                        open={open}
                        toggle={toggle}
                        depth={0}
                      />
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
