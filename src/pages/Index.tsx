import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, BarChart3, Wallet, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const features = [
  { icon: Wallet, title: "Real-time Tracking", text: "Income & expenses sync instantly across devices." },
  { icon: BarChart3, title: "Smart Charts", text: "Pie & line charts give you instant clarity." },
  { icon: ShieldCheck, title: "Private by Default", text: "Row-level security keeps your data yours." },
  { icon: Zap, title: "Indian Rupee First", text: "Built for ₹ — formatting, budgets, reports." },
];

const Index = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="px-6 lg:px-10 h-16 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-glow)]">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold">Smart Budget</span>
        </div>
        <Link to={user ? "/app" : "/auth"}>
          <Button variant="ghost" size="sm">
            {user ? "Open App" : "Sign in"}
          </Button>
        </Link>
      </header>

      <section className="px-6 lg:px-10 max-w-7xl mx-auto pt-16 pb-24 text-center animate-in-up">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-muted-foreground mb-6">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> CIICP Lab · NeoFinance Glass UI
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">
          Your money, <span className="text-gradient-primary">in real time</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
          A modern budget planner built for India. Track income, control expenses, set monthly limits, and export PDF
          reports — all in INR, all in real time.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to={user ? "/app" : "/auth"}>
            <Button
              size="lg"
              className="gap-2 bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)]"
            >
              {user ? "Open Dashboard" : "Get started"} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="px-6 lg:px-10 max-w-7xl mx-auto pb-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f) => (
          <div key={f.title} className="glass rounded-2xl p-5 animate-in-up">
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-3">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Index;
