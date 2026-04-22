import { useFinance } from "@/hooks/useFinance";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { StatCard } from "@/components/StatCard";
import { TrendingDown } from "lucide-react";
import { inr } from "@/lib/format";

const Expenses = () => {
  const { expenses, totalExpense } = useFinance();
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Expenses</h2>
          <p className="text-sm text-muted-foreground">Where your money goes</p>
        </div>
        <TransactionForm type="expense" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Total Expenses"
          value={expenses.length ? inr(totalExpense) : "—"}
          accent="expense"
          icon={<TrendingDown className="h-4 w-4" />}
          hint={expenses.length ? `${expenses.length} entries` : "No expenses recorded"}
        />
      </div>
      <div className="glass rounded-2xl p-5">
        <TransactionList rows={expenses} type="expense" />
      </div>
    </div>
  );
};
export default Expenses;