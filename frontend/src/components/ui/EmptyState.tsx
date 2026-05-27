import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <div className="text-sm font-semibold text-slate-900">{title}</div>

      {description ? (
        <div className="mt-1 max-w-md text-sm text-slate-500">{description}</div>
      ) : null}

      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}