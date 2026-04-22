import { useMemo, useState } from "react";
import { useFinance } from "@/hooks/useFinance";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategorySelect } from "@/components/CategorySelect";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { inr } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/EmptyState";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const budgetSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0").max(1e10),
  category: z.string().trim().max(40).optional(),
});

const Budget = () => {
  const { user } = useAuth();
  const { budgets, expenses } = useFinance();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [scope, setScope] = useState<"overall" | "category">("overall");
  const [busy, setBusy] = useState(false);

  const monthStart = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, []);

  const monthExpenses = expenses.filter((e) => new Date(e.occurred_at) >= monthStart);
  const totalSpent = monthExpenses.reduce((s, r) => s + r.amount, 0);

  const currentBudgets = budgets.filter((b) => {
    const d = new Date(b.period_start);
    return d.getMonth() === monthStart.getMonth() && d.getFullYear() === monthStart.getFullYear();
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = budgetSchema.safeParse({
      amount: Number(amount),
      category: scope === "category" ? category.trim() : undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (scope === "category" && !parsed.data.category) return toast.error("Pick a category");

    setBusy(true);
    const period_start = monthStart.toISOString().slice(0, 10);
    const { error } = await supabase
      .from("budgets")
      .upsert(
        {
          user_id: user.id,
          amount: parsed.data.amount,
          category: scope === "category" ? parsed.data.category! : null,
          period_start,
        },
        { onConflict: "user_id,category,period_start" },
      );
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Budget saved");
    setAmount("");
    setCategory("");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Removed");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Budget</h2>
        <p className="text-sm text-muted-foreground">Set monthly limits and track usage</p>
      </div>

      <form onSubmit={submit} className="glass rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="space-y-2">
          <Label>Scope</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={scope === "overall" ? "default" : "outline"}
              onClick={() => setScope("overall")}
              className={scope === "overall" ? "bg-[image:var(--gradient-primary)]" : ""}
            >
              Overall
            </Button>
            <Button
              type="button"
              variant={scope === "category" ? "default" : "outline"}
              onClick={() => setScope("category")}
              className={scope === "category" ? "bg-[image:var(--gradient-primary)]" : ""}
            >
              Category
            </Button>
          </div>
        </div>
        {scope === "category" && (
          <div className="space-y-2">
            <Label>Category</Label>
            <CategorySelect value={category} onChange={setCategory} options={EXPENSE_CATEGORIES} />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="bamount">Monthly limit (₹)</Label>
          <Input
            id="bamount"
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10000"
            className="bg-secondary/60"
            required
          />
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90"
        >
          {busy ? "Saving…" : "Save budget"}
        </Button>
      </form>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold mb-3">This Month</h3>
        {currentBudgets.length === 0 ? (
          <EmptyState title="Set budget to track usage" description="Create your first monthly budget above" />
        ) : (
          <div className="space-y-3">
            {currentBudgets.map((b) => {
              const spent = b.category
                ? monthExpenses.filter((e) => e.category === b.category).reduce((s, r) => s + r.amount, 0)
                : totalSpent;
              const pct = Math.min(100, Math.round((spent / b.amount) * 100));
              const over = spent > b.amount;
              return (
                <div key={b.id} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{b.category ?? "Overall budget"}</div>
                      <div className="text-xs text-muted-foreground">
                        {inr(spent)} of {inr(b.amount)} {over && <span className="text-expense">· Over budget</span>}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => remove(b.id)} className="text-expense">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Progress value={pct} className={over ? "[&>div]:bg-expense" : "[&>div]:bg-primary"} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Budget;