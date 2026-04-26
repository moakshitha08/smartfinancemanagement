import { useMemo } from "react";
import { useFinance } from "./useFinance";
import { inr } from "@/lib/format";

export type AlertLevel = "warn" | "info";
export interface FinanceAlert {
  level: AlertLevel;
  text: string;
}

/** Compute real-time alerts from current finance data. */
export const useAlerts = (): FinanceAlert[] => {
  const { budgets, expenses, balance, totalIncome } = useFinance();

  return useMemo(() => {
    const out: FinanceAlert[] = [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthExp = expenses.filter((e) => new Date(e.occurred_at) >= monthStart);
    const totalSpent = monthExp.reduce((s, r) => s + r.amount, 0);

    budgets
      .filter((b) => {
        const d = new Date(b.period_start);
        return d.getMonth() === monthStart.getMonth() && d.getFullYear() === monthStart.getFullYear();
      })
      .forEach((b) => {
        const spent = b.category
          ? monthExp.filter((e) => e.category === b.category).reduce((s, r) => s + r.amount, 0)
          : totalSpent;
        if (b.amount <= 0) return;
        const pct = (spent / b.amount) * 100;
        if (pct >= 100) {
          out.push({
            level: "warn",
            text: `${b.category ?? "Overall"} budget exceeded — ${inr(spent)} of ${inr(b.amount)}`,
          });
        } else if (pct >= 80) {
          out.push({
            level: "warn",
            text: `${b.category ?? "Overall"} budget at ${Math.round(pct)}% — ${inr(spent)} of ${inr(b.amount)}`,
          });
        }
      });

    if (totalIncome > 0 && balance < 0) {
      out.push({ level: "warn", text: `Negative balance: ${inr(balance)}. Spending exceeds income.` });
    }

    return out;
  }, [budgets, expenses, balance, totalIncome]);
};