import { useState } from "react";
import { ArrowUp, ArrowDown, Plus, Minus, Equal, CornerDownRight, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinance } from "@/lib/finance/finance-store";
import { buildDre, delta, type DreLine } from "@/lib/finance/selectors";
import { formatBRL } from "@/lib/finance/format";

function KindIcon({ kind }: { kind: DreLine["kind"] }) {
  const cls = "h-4 w-4 text-white";
  if (kind === "income")
    return (
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success">
        <Plus className={cls} />
      </span>
    );
  if (kind === "expense")
    return (
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary">
        <Minus className={cls} />
      </span>
    );
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-foreground">
      <Equal className={cls} />
    </span>
  );
}

export function DreTable() {
  const { dataset, periodKeys, previousKeys } = useFinance();
  const rows = dataset ? buildDre(dataset, periodKeys) : [];
  const prevRows = dataset && previousKeys.length ? buildDre(dataset, previousKeys) : [];

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(["receitas"]));

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="rounded-2xl bg-card p-5 md:p-6 border border-border/60">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold">
            <span className="text-primary">DRE</span>: Demonstrativo de Resultado do Exercício
          </h3>
          <p className="text-sm text-muted-foreground">
            {dataset ? `Fonte: aba DFC ANO — ${dataset.fileName}` : "Aguardando importação da planilha"}
          </p>
        </div>
        {rows.length > 0 && (
          <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/40">
            Clique na categoria para expandir subitens
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Importe uma planilha financeira para visualizar os dados.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm border-collapse">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="text-left font-medium py-2.5 pl-2">Descrição</th>
                <th className="text-right font-medium py-2.5">Valor</th>
                <th className="text-right font-medium py-2.5 pr-2 w-24">Variação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.map((r, i) => {
                const prev = prevRows[i]?.value ?? 0;
                const variation = delta(r.value, prev);
                const hasVariation = prevRows.length > 0 && prev !== 0;
                const isExpandable = Boolean(r.hasChildren && r.children && r.children.length > 0);
                const isExpanded = expandedRows.has(r.id);

                return (
                  <FragmentRow
                    key={r.id || r.label}
                    row={r}
                    prevValue={prev}
                    variation={variation}
                    hasVariation={hasVariation}
                    isExpandable={isExpandable}
                    isExpanded={isExpanded}
                    onToggle={() => isExpandable && toggleRow(r.id)}
                    prevRows={prevRows}
                    periodKeys={periodKeys}
                    previousKeys={previousKeys}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FragmentRow({
  row,
  variation,
  hasVariation,
  isExpandable,
  isExpanded,
  onToggle,
}: {
  row: DreLine;
  prevValue: number;
  variation: number;
  hasVariation: boolean;
  isExpandable: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  prevRows: DreLine[];
  periodKeys: string[];
  previousKeys: string[];
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={cn(
          "transition-colors group",
          isExpandable ? "cursor-pointer hover:bg-muted/50" : "",
          row.kind === "total" && "bg-muted/40 font-semibold",
          isExpanded && isExpandable && "bg-muted/30",
        )}
      >
        <td className="py-3 pl-2">
          <div className={cn("flex items-center gap-2.5", row.indent && "pl-5")}>
            {/* Expand/Collapse Chevron Indicator */}
            {isExpandable ? (
              <button
                type="button"
                className="grid h-5 w-5 place-items-center rounded hover:bg-accent text-muted-foreground group-hover:text-foreground transition-colors shrink-0 -ml-1"
                aria-label={isExpanded ? "Recolher subcategorias" : "Expandir subcategorias"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : row.indent ? (
              <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 -ml-5" />
            ) : (
              <span className="w-4 shrink-0" />
            )}

            <KindIcon kind={row.kind} />
            <span
              className={cn(
                "font-medium tracking-tight",
                row.kind === "total" && "font-bold text-foreground",
                isExpandable && "group-hover:text-primary transition-colors",
              )}
            >
              {row.label}
            </span>
            {isExpandable && (
              <span className="text-[11px] font-normal text-muted-foreground/70 bg-muted/80 px-1.5 py-0.5 rounded border border-border/40 ml-1">
                {row.children?.length} {row.children?.length === 1 ? "item" : "itens"}
              </span>
            )}
          </div>
        </td>
        <td
          className={cn(
            "text-right py-3 font-semibold tabular-nums",
            row.value < 0 ? "text-destructive" : row.kind === "expense" ? "text-foreground" : "text-success",
          )}
        >
          {formatBRL(row.value)}
        </td>
        <td className="text-right py-3 pr-2">
          {hasVariation ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
                variation >= 0 ? "bg-success-soft text-success" : "bg-danger-soft text-destructive",
              )}
            >
              {variation >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(variation).toFixed(1)}%
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>
      </tr>

      {/* Render Subcategories when Expanded */}
      {isExpandable && isExpanded && row.children && row.children.length > 0 && (
        <>
          {row.children.map((child) => (
            <tr
              key={child.id}
              className="bg-muted/20 hover:bg-muted/40 transition-colors border-b border-border/30 text-xs"
            >
              <td className="py-2.5 pl-11 md:pl-14">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CornerDownRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                  <span className="font-normal text-foreground/90">{child.label}</span>
                </div>
              </td>
              <td
                className={cn(
                  "text-right py-2.5 font-medium tabular-nums text-xs",
                  child.value < 0 ? "text-destructive" : child.kind === "expense" ? "text-foreground/80" : "text-success",
                )}
              >
                {formatBRL(child.value)}
              </td>
              <td className="text-right py-2.5 pr-2">
                <span className="text-[11px] text-muted-foreground">—</span>
              </td>
            </tr>
          ))}
        </>
      )}
    </>
  );
}
