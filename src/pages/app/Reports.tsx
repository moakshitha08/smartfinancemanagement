import { useMemo } from "react";
import { useFinance } from "@/hooks/useFinance";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { inr } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

const Reports = () => {
  const { incomes, expenses } = useFinance();

  const dailyData = useMemo(() => {
    const buckets: { key: string; label: string; income: number; expense: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.push({ key, label: d.toLocaleDateString("en-IN", { weekday: "short" }), income: 0, expense: 0 });
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    incomes.forEach((r) => {
      const k = r.occurred_at.slice(0, 10);
      const i = idx.get(k);
      if (i !== undefined) buckets[i].income += r.amount;
    });
    expenses.forEach((r) => {
      const k = r.occurred_at.slice(0, 10);
      const i = idx.get(k);
      if (i !== undefined) buckets[i].expense += r.amount;
    });
    return buckets;
  }, [incomes, expenses]);

  const monthCmp = useMemo(() => {
    const now = new Date();
    const thisMonth = (r: { occurred_at: string }) => {
      const d = new Date(r.occurred_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };
    const lastMonth = (r: { occurred_at: string }) => {
      const d = new Date(r.occurred_at);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    };
    const sumExp = (fn: any) => expenses.filter(fn).reduce((s, r) => s + r.amount, 0);
    const tm = sumExp(thisMonth);
    const lm = sumExp(lastMonth);
    return { tm, lm, diff: lm > 0 ? Math.round(((tm - lm) / lm) * 100) : null };
  }, [expenses]);

  const insights = useMemo(() => {
    const out: string[] = [];
    if (monthCmp.diff !== null) {
      if (monthCmp.diff > 0) out.push(`You've spent ${monthCmp.diff}% more this month than last month.`);
      else if (monthCmp.diff < 0) out.push(`You've cut spending by ${Math.abs(monthCmp.diff)}% vs last month. Nice!`);
      else out.push("Your spending is on par with last month.");
    }
    // Top category this month
    const now = new Date();
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const d = new Date(e.occurred_at);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
      }
    });
    if (map.size) {
      const top = [...map.entries()].sort((a, b) => b[1] - a[1])[0];
      out.push(`Top category this month: ${top[0]} (${inr(top[1])}).`);
    }
    return out;
  }, [expenses, monthCmp]);

  const hasAny = incomes.length + expenses.length > 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="text-sm text-muted-foreground">Smart insights from your real data</p>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold mb-1">Last 7 Days</h3>
        <p className="text-xs text-muted-foreground mb-4">Income vs Expense (rolling)</p>
        {!hasAny ? (
          <EmptyState />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => inr(v)} width={70} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                  }}
                  formatter={(v: number) => inr(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" fill="hsl(var(--income))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(var(--expense))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold mb-3">Smart Insights</h3>
        {insights.length === 0 ? (
          <EmptyState title="No insights yet" description="Add some transactions to unlock insights" />
        ) : (
          <ul className="space-y-2 text-sm">
            {insights.map((i, k) => (
              <li key={k} className="glass rounded-lg p-3">
                {i}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Reports;