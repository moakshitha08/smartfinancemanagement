import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const StatCard = ({
  label,
  value,
  icon,
  accent,
  hint,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: "primary" | "income" | "expense";
  hint?: string;
}) => {
  const accentClass =
    accent === "income"
      ? "from-income/30 to-transparent"
      : accent === "expense"
        ? "from-expense/30 to-transparent"
        : "from-primary/30 to-transparent";
  const iconBg =
    accent === "income"
      ? "bg-income/15 text-income"
      : accent === "expense"
        ? "bg-expense/15 text-expense"
        : "bg-primary/15 text-primary";
  return (
    <div className="relative overflow-hidden glass rounded-2xl p-5 animate-in-up min-w-0">
      <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-60", accentClass)} />
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", iconBg)}>{icon}</div>
      </div>
      <div className="amount" title={value}>
        {value}
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
    </div>
  );
};