import { Inbox } from "lucide-react";
import { ReactNode } from "react";

export const EmptyState = ({
  title = "No data available",
  description,
  icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center text-center py-12 px-4">
    <div className="h-14 w-14 rounded-2xl glass flex items-center justify-center mb-4 text-muted-foreground">
      {icon ?? <Inbox className="h-6 w-6" />}
    </div>
    <h3 className="font-semibold text-foreground">{title}</h3>
    {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);