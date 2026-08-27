import { Calendar, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinance } from "@/lib/finance/finance-store";

export function PeriodFilter() {
  const { selection, setSelection, dataset } = useFinance();
  const allPeriods = dataset?.periods ?? [];

  // Verifica se há um único mês selecionado
  const isSingleMonth = selection.id === "custom" && selection.from === selection.to;
  const selectedMonthKey = isSingleMonth ? selection.from : "";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-card p-1.5 border border-border/60 shadow-xs">
      {/* Visualizar todos os meses (Desempenho Anual) */}
      <button
        onClick={() => setSelection({ id: "this-year" })}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs md:text-sm font-medium transition-all cursor-pointer",
          selection.id === "this-year"
            ? "bg-primary/10 text-primary border border-primary/30 font-semibold"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Layers className="h-4 w-4" />
        <span>Desempenho Anual</span>
      </button>

      {/* Selecionar mês em questão */}
      <div className="relative flex items-center">
        <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
        <select
          value={selectedMonthKey}
          disabled={allPeriods.length === 0}
          onChange={(e) => {
            const val = e.target.value;
            if (!val) {
              setSelection({ id: "this-year" });
            } else {
              setSelection({ id: "custom", from: val, to: val });
            }
          }}
          className={cn(
            "cursor-pointer appearance-none rounded-lg border px-3 py-1.5 pl-9 pr-8 text-xs md:text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20",
            selectedMonthKey
              ? "bg-primary/10 text-primary border-primary/30 font-semibold"
              : "bg-background text-foreground border-border hover:bg-muted",
          )}
        >
          <option value="">Selecionar mês...</option>
          {allPeriods.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 text-xs text-muted-foreground">▼</span>
      </div>
    </div>
  );
}

