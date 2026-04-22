import { useMemo } from "react";
import { useFinance } from "@/hooks/useFinance";
import { EmptyState } from "@/components/EmptyState";
import { inr } from "@/lib/format";
import { AlertTriangle, Info } from "lucide-react";

const Alerts = () => {
  const { budgets, expenses, balance, totalIncome } = useFinance();

  const alerts = useMemo(() => {
    const out: { level: "warn" | "info"; text: string }[] = [];
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

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Alerts</h2>
        <p className="text-sm text-muted-foreground">Real-time financial warnings</p>
      </div>
      {alerts.length === 0 ? (
        <div className="glass rounded-2xl p-5">
          <EmptyState title="All clear" description="No alerts based on your current data" />
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a, i) => (
            <li
              key={i}
              className={`glass rounded-xl p-4 flex items-start gap-3 ${
                a.level === "warn" ? "border-expense/30" : ""
              }`}
            >
              {a.level === "warn" ? (
                <AlertTriangle className="h-5 w-5 text-expense shrink-0 mt-0.5" />
              ) : (
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              )}
              <span className="text-sm">{a.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
export default Alerts;