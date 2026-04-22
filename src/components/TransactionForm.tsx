import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { CategorySelect } from "./CategorySelect";
import { EXPENSE_CATEGORIES, INCOME_SOURCES } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  amount: z.number().positive("Amount must be greater than 0").max(1e10),
  category: z.string().trim().min(1, "Required").max(40),
  description: z.string().max(200).optional(),
  occurred_at: z.string().min(1),
});

interface Props {
  type: "income" | "expense";
  trigger?: React.ReactNode;
  initial?: { id: string; amount: number; category: string; description: string | null; occurred_at: string };
  onDone?: () => void;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}

export const TransactionForm = ({ type, trigger, initial, onDone, open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [occurredAt, setOccurredAt] = useState(
    (initial?.occurred_at ?? new Date().toISOString()).slice(0, 16),
  );
  const [busy, setBusy] = useState(false);

  const reset = () => {
    if (!initial) {
      setAmount("");
      setCategory("");
      setDescription("");
      setOccurredAt(new Date().toISOString().slice(0, 16));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      amount: Number(amount),
      category: category.trim(),
      description: description.trim() || undefined,
      occurred_at: occurredAt,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setBusy(true);
    const table = type === "income" ? "incomes" : "expenses";
    const payload: any = {
      user_id: user.id,
      amount: parsed.data.amount,
      description: parsed.data.description ?? null,
      occurred_at: new Date(parsed.data.occurred_at).toISOString(),
      [type === "income" ? "source" : "category"]: parsed.data.category,
    };

    const res = initial
      ? await supabase.from(table).update(payload).eq("id", initial.id)
      : await supabase.from(table).insert(payload);

    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(initial ? "Updated" : `${type === "income" ? "Income" : "Expense"} added`);
    setOpen(false);
    reset();
    onDone?.();
  };

  const options = type === "income" ? INCOME_SOURCES : EXPENSE_CATEGORIES;
  const title = `${initial ? "Edit" : "Add"} ${type === "income" ? "Income" : "Expense"}`;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && !isControlled && (
        <DialogTrigger asChild>
          <Button className="gap-2 bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90">
            <Plus className="h-4 w-4" /> Add {type === "income" ? "Income" : "Expense"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="glass-strong border-border/50 max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="bg-secondary/60"
            />
          </div>
          <div className="space-y-2">
            <Label>{type === "income" ? "Source" : "Category"}</Label>
            <CategorySelect value={category} onChange={setCategory} options={options} placeholder="Choose…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description (optional)</Label>
            <Input
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes…"
              maxLength={200}
              className="bg-secondary/60"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="when">When</Label>
            <Input
              id="when"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="bg-secondary/60"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90"
            >
              {busy ? "Saving…" : initial ? "Save changes" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};