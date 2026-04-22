import { useFinance } from "@/hooks/useFinance";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { StatCard } from "@/components/StatCard";
import { TrendingUp } from "lucide-react";
import { inr } from "@/lib/format";

const Income = () => {
  const { incomes, totalIncome } = useFinance();
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Income</h2>
          <p className="text-sm text-muted-foreground">Track every rupee coming in</p>
        </div>
        <TransactionForm type="income" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Total Income"
          value={incomes.length ? inr(totalIncome) : "—"}
          accent="income"
          icon={<TrendingUp className="h-4 w-4" />}
          hint={incomes.length ? `${incomes.length} entries` : "No income recorded"}
        />
      </div>
      <div className="glass rounded-2xl p-5">
        <TransactionList rows={incomes} type="income" />
      </div>
    </div>
  );
};
export default Income;