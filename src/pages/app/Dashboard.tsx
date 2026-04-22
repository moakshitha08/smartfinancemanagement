import { useMemo } from "react";
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { useFinance } from "@/hooks/useFinance";
import { StatCard } from "@/components/StatCard";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { EmptyState } from "@/components/EmptyState";
import { inr } from "@/lib/format";
import { categoryColor } from "@/lib/categories";

const Dashboard = () => {
  const { incomes, expenses, totalIncome, totalExpense, balance, loading } = useFinance();

  const recent = useMemo(() => {
    const merged = [
      ...incomes.map((i) => ({ ...i, _type: "income" as const, category: i.source })),
      ...expenses.map((e) => ({ ...e, _type: "expense" as const })),
    ]
      .sort((a, b) => +new Date(b.occurred_at) - +new Date(a.occurred_at))
      .slice(0, 6);
    return merged;
  }, [incomes, expenses]);

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const trendData = useMemo(() => {
    // last 6 months
    const buckets: { key: string; label: string; income: number; expense: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets.push({
        key,
        label: d.toLocaleDateString("en-IN", { month: "short" }),
        income: 0,
        expense: 0,
      });
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    incomes.forEach((r) => {
      const d = new Date(r.occurred_at);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      const i = idx.get(k);
      if (i !== undefined) buckets[i].income += r.amount;
    });
    expenses.forEach((r) => {
      const d = new Date(r.occurred_at);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      const i = idx.get(k);
      if (i !== undefined) buckets[i].expense += r.amount;
    });
    return buckets;
  }, [incomes, expenses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const hasAny = incomes.length + expenses.length > 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Live overview of your money</p>
        </div>
        <div className="flex gap-2">
          <TransactionForm type="income" />
          <TransactionForm type="expense" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Net Balance"
          value={hasAny ? inr(balance) : "—"}
          accent={balance < 0 ? "expense" : "primary"}
          icon={<Wallet className="h-4 w-4" />}
          hint={hasAny ? undefined : "No data available"}
        />
        <StatCard
          label="Total Income"
          value={incomes.length ? inr(totalIncome) : "—"}
          accent="income"
          icon={<TrendingUp className="h-4 w-4" />}
          hint={incomes.length ? `${incomes.length} entries` : "No income recorded"}
        />
        <StatCard
          label="Total Expenses"
          value={expenses.length ? inr(totalExpense) : "—"}
          accent="expense"
          icon={<TrendingDown className="h-4 w-4" />}
          hint={expenses.length ? `${expenses.length} entries` : "No expenses recorded"}
        />
        <StatCard
          label="Savings rate"
          value={totalIncome > 0 ? `${Math.max(0, Math.round((balance / totalIncome) * 100))}%` : "—"}
          accent="primary"
          icon={<PiggyBank className="h-4 w-4" />}
          hint={totalIncome > 0 ? undefined : "Add income to see"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 lg:col-span-1">
          <h3 className="font-semibold mb-1">Expense Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-4">By category</p>
          {pieData.length === 0 ? (
            <EmptyState title="No expenses yet" description="Add an expense to see your breakdown" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={categoryColor(d.name)} stroke="hsl(var(--background))" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(v: number) => inr(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h3 className="font-semibold mb-1">Monthly Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Last 6 months</p>
          {!hasAny ? (
            <EmptyState title="No data available" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
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
                  <Line type="monotone" dataKey="income" stroke="hsl(var(--income))" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="expense" stroke="hsl(var(--expense))" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Recent Transactions</h3>
            <p className="text-xs text-muted-foreground">Latest activity, in real time</p>
          </div>
        </div>
        {recent.length === 0 ? (
          <EmptyState title="No transactions yet" description="Add your first income or expense" />
        ) : (
          <div className="divide-y divide-border/40">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-3">
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-xs font-semibold text-primary-foreground shrink-0"
                  style={{ backgroundColor: categoryColor(r.category) }}
                >
                  {r.category.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{r.category}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.description || "—"}</div>
                </div>
                <div
                  className={`shrink-0 font-semibold tabular-nums ${
                    r._type === "income" ? "text-income" : "text-expense"
                  }`}
                >
                  {r._type === "income" ? "+" : "−"}
                  {inr(r.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;