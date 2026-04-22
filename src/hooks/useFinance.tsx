import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Income {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  description: string | null;
  occurred_at: string;
  created_at: string;
}
export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string | null;
  occurred_at: string;
  created_at: string;
}
export interface Budget {
  id: string;
  user_id: string;
  category: string | null;
  amount: number;
  period_start: string;
}

export const useFinance = () => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [i, e, b] = await Promise.all([
      supabase.from("incomes").select("*").order("occurred_at", { ascending: false }),
      supabase.from("expenses").select("*").order("occurred_at", { ascending: false }),
      supabase.from("budgets").select("*").order("period_start", { ascending: false }),
    ]);
    if (i.data) setIncomes(i.data.map((r: any) => ({ ...r, amount: Number(r.amount) })));
    if (e.data) setExpenses(e.data.map((r: any) => ({ ...r, amount: Number(r.amount) })));
    if (b.data) setBudgets(b.data.map((r: any) => ({ ...r, amount: Number(r.amount) })));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    refresh();
    const ch = supabase
      .channel("finance-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "incomes", filter: `user_id=eq.${user.id}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `user_id=eq.${user.id}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "budgets", filter: `user_id=eq.${user.id}` }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, refresh]);

  const totalIncome = incomes.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expenses.reduce((s, r) => s + r.amount, 0);
  const balance = totalIncome - totalExpense;

  return { incomes, expenses, budgets, totalIncome, totalExpense, balance, loading, refresh };
};