import { useState } from "react";
import { ShieldCheck, ChevronDown, ChevronUp, PieChart } from "lucide-react";
import { type ConvenioBreakdownItem } from "@/lib/fourmedic/painel-types";
import { cn } from "@/lib/utils";

interface PainelConveniosAccordionProps {
  convenios: ConvenioBreakdownItem[];
  totalAtendidos: number;
}

export function PainelConveniosAccordion({
  convenios,
  totalAtendidos,
}: PainelConveniosAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const colors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-teal-500",
  ];

  return (
    <div className="rounded-3xl border border-border/60 bg-card shadow-2xs overflow-hidden transition-all">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              Atendimentos Convênio / Particular
            </h3>
            <p className="text-xs text-muted-foreground">
              Distribuição dos {totalAtendidos} atendimentos por tipo de cobertura
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-muted-foreground hidden sm:inline">
            {convenios.length} {convenios.length === 1 ? "tipo" : "tipos"}
          </span>
          <div className="h-8 w-8 rounded-xl bg-muted/60 grid place-items-center text-muted-foreground">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="px-3.5 pb-5 sm:px-5 sm:pb-6 md:px-6 space-y-5 border-t border-border/40 pt-4">
          {/* Barra de Distribuição Segmentada */}
          <div className="space-y-2">
            <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-muted/60 p-0.5">
              {convenios.map((c, i) => (
                <div
                  key={c.nome}
                  style={{ width: `${Math.max(c.percentual, 3)}%` }}
                  className={cn(
                    "h-full rounded-full transition-all",
                    colors[i % colors.length],
                  )}
                  title={`${c.nome}: ${c.quantidade} (${c.percentual.toFixed(1)}%)`}
                />
              ))}
            </div>
          </div>

          {/* Lista de Convênios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {convenios.map((c, idx) => (
              <div
                key={c.nome}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 border border-border/40 hover:border-border transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={cn(
                      "h-3 w-3 rounded-full shrink-0",
                      colors[idx % colors.length],
                    )}
                  />
                  <span className="text-xs font-bold text-foreground truncate" title={c.nome}>
                    {c.nome}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-foreground">
                    {c.quantidade}
                  </span>
                  <span className="ml-1.5 text-[11px] font-semibold text-muted-foreground">
                    ({c.percentual.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
