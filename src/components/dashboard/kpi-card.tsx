import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/finance/format";

interface KpiCardProps {
  label: string;
  rawValue?: number;
  value?: string;
  delta?: number | null; // percentage
  tone?: "default" | "success" | "danger" | "auto";
  icon?: LucideIcon;
  iconBg?: string;
}

export function KpiCard({
  label,
  rawValue,
  value,
  delta,
  tone = "auto",
  icon: Icon,
  iconBg,
}: KpiCardProps) {
  const displayValue = rawValue !== undefined ? formatBRL(rawValue) : (value ?? "R$ 0,00");
  const num = rawValue ?? (displayValue.includes("-") ? -1 : displayValue === "R$ 0,00" ? 0 : 1);

  let valueClass = "text-foreground font-black";
  let defaultIconBg = "bg-primary/10 text-primary";

  if (tone === "success" || (tone === "auto" && num > 0)) {
    valueClass = "text-emerald-600 dark:text-emerald-400 font-black";
    defaultIconBg = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  } else if (tone === "danger" || (tone === "auto" && num < 0)) {
    valueClass = "text-rose-600 dark:text-rose-400 font-black";
    defaultIconBg = "bg-rose-500/15 text-rose-600 dark:text-rose-400";
  } else if (tone === "default") {
    valueClass = "text-foreground font-black";
  }

  const finalIconBg = iconBg ?? defaultIconBg;
  const positiveDelta = (delta ?? 0) >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-border/60 transition-all hover:border-border hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors", finalIconBg)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className={cn("text-2xl md:text-3xl tracking-tight truncate", valueClass)}>
          {displayValue}
        </p>
        {delta != null && Number.isFinite(delta) && (
          <span
            className={cn(
              "shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
              positiveDelta
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
            )}
          >
            {positiveDelta ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {positiveDelta ? "+" : "-"}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}


