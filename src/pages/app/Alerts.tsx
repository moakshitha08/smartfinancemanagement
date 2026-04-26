import { EmptyState } from "@/components/EmptyState";
import { useAlerts } from "@/hooks/useAlerts";
import { AlertTriangle, Info } from "lucide-react";

const Alerts = () => {
  const alerts = useAlerts();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Alerts</h2>
        <p className="text-sm text-muted-foreground">Real-time financial warnings</p>
      </div>
      {alerts.length === 0 ? (
        <div className="glass rounded-2xl p-5">
          <EmptyState title="All clear" description="No alerts based on your current data" />
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a, i) => (
            <li
              key={i}
              className={`glass rounded-xl p-4 flex items-start gap-3 ${
                a.level === "warn" ? "border-expense/30" : ""
              }`}
            >
              {a.level === "warn" ? (
                <AlertTriangle className="h-5 w-5 text-expense shrink-0 mt-0.5" />
              ) : (
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              )}
              <span className="text-sm">{a.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
export default Alerts;