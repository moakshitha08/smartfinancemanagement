import { useMemo, useState } from "react";
import { useFinance } from "@/hooks/useFinance";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransactionList } from "@/components/TransactionList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Transactions = () => {
  const { incomes, expenses } = useFinance();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cat, setCat] = useState("all");

  const allCats = useMemo(() => {
    const s = new Set<string>();
    incomes.forEach((i) => s.add(i.source));
    expenses.forEach((e) => s.add(e.category));
    return Array.from(s).sort();
  }, [incomes, expenses]);

  const filterRows = <T extends { occurred_at: string; category?: string; source?: string }>(rows: T[]) =>
    rows.filter((r) => {
      const d = +new Date(r.occurred_at);
      if (from && d < +new Date(from)) return false;
      if (to && d > +new Date(to) + 86400000) return false;
      const c = r.category ?? r.source;
      if (cat !== "all" && c !== cat) return false;
      return true;
    });

  const filteredIncomes = filterRows(incomes);
  const filteredExpenses = filterRows(expenses);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
        <p className="text-sm text-muted-foreground">Full history with filters</p>
      </div>

      <div className="glass rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-secondary/60" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-secondary/60" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Category</label>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="bg-secondary/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {allCats.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <div className="glass rounded-2xl p-5 space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Income</h3>
              <TransactionList rows={filteredIncomes} type="income" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Expenses</h3>
              <TransactionList rows={filteredExpenses} type="expense" />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="income">
          <div className="glass rounded-2xl p-5">
            <TransactionList rows={filteredIncomes} type="income" />
          </div>
        </TabsContent>
        <TabsContent value="expense">
          <div className="glass rounded-2xl p-5">
            <TransactionList rows={filteredExpenses} type="expense" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Transactions;