import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TransactionForm } from "./TransactionForm";
import { inr, formatDate } from "@/lib/format";
import { categoryColor } from "@/lib/categories";
import { toast } from "sonner";
import { EmptyState } from "./EmptyState";
import { Inbox } from "lucide-react";
import { toUserMessage } from "@/lib/errors";

interface Row {
  id: string;
  amount: number;
  description: string | null;
  occurred_at: string;
  source?: string;
  category?: string;
}

export const TransactionList = ({
  rows,
  type,
  emptyTitle,
  emptyDesc,
}: {
  rows: Row[];
  type: "income" | "expense";
  emptyTitle?: string;
  emptyDesc?: string;
}) => {
  const [editing, setEditing] = useState<Row | null>(null);

  const remove = async (id: string) => {
    const table = type === "income" ? "incomes" : "expenses";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(toUserMessage(error, "Could not delete. Please try again."));
    toast.success("Deleted");
  };

  if (!rows.length) {
    return (
      <EmptyState
        title={emptyTitle ?? "No transactions yet"}
        description={emptyDesc ?? `Add your first ${type} to get started`}
        icon={<Inbox className="h-6 w-6" />}
      />
    );
  }

  return (
    <>
      <div className="divide-y divide-border/40">
        {rows.map((r) => {
          const cat = r.category ?? r.source ?? "—";
          return (
            <div key={r.id} className="flex items-center gap-3 py-3 px-1 group hover:bg-muted/20 rounded-lg transition-colors">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-xs font-semibold text-primary-foreground shrink-0"
                style={{ backgroundColor: categoryColor(cat) }}
              >
                {cat.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{cat}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.description || "—"} · {formatDate(r.occurred_at)}
                </div>
              </div>
              <div className={`shrink-0 font-semibold tabular-nums ${type === "income" ? "text-income" : "text-expense"}`}>
                {type === "income" ? "+" : "−"}
                {inr(r.amount)}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" onClick={() => setEditing(r)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="text-expense hover:text-expense" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-strong">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => remove(r.id)}
                        className="bg-expense text-expense-foreground hover:bg-expense/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </div>
      {editing && (
        <TransactionForm
          type={type}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          initial={{
            id: editing.id,
            amount: editing.amount,
            category: (editing.category ?? editing.source) as string,
            description: editing.description,
            occurred_at: editing.occurred_at,
          }}
          onDone={() => setEditing(null)}
        />
      )}
    </>
  );
};