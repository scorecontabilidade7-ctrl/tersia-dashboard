import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/finance/format";

interface KpiCardProps {
  label: string;
  rawValue?: number;
  value?: string;
  delta?: number | null; // percentage
  tone?: "default" | "success" | "danger" | "warning" | "info" | "auto";
  icon?: LucideIcon;
  iconBg?: string;
  valueClassName?: string;
}

export function KpiCard({
  label,
  rawValue,
  value,
  delta,
  tone = "auto",
  icon: Icon,
  iconBg,
  valueClassName,
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
  } else if (tone === "warning") {
    valueClass = "text-amber-600 dark:text-amber-400 font-black";
    defaultIconBg = "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  } else if (tone === "info") {
    valueClass = "text-sky-600 dark:text-sky-400 font-black";
    defaultIconBg = "bg-sky-500/15 text-sky-600 dark:text-sky-400";
  } else if (tone === "default") {
    valueClass = "text-foreground font-black";
  }

  const finalValueClass = valueClassName ?? valueClass;
  const finalIconBg = iconBg ?? defaultIconBg;
  const positiveDelta = (delta ?? 0) >= 0;

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-card p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-border/60 transition-all hover:border-border hover:shadow-md">
      {/* Top Header: Label + Delta + Icon */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </p>
          {delta != null && Number.isFinite(delta) && (
            <div className="mt-1">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold",
                  positiveDelta
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                )}
              >
                {positiveDelta ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {positiveDelta ? "+" : "-"}
                {Math.abs(delta).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
              finalIconBg,
            )}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>

      {/* Value Display: Full Width, No Truncation */}
      <div className="mt-3">
        <p
          className={cn(
            "text-xl sm:text-2xl 2xl:text-3xl font-black tracking-tight whitespace-nowrap overflow-x-auto no-scrollbar",
            finalValueClass,
          )}
          title={displayValue}
        >
          {displayValue}
        </p>
      </div>
    </div>
  );
}
