import { ReactNode } from "react";

import { Card } from "@/components/ui/Card";

interface PageStateProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageState({ title, description, children }: PageStateProps) {
  return (
    <Card>
      <div className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">{title}</div>

        {description ? (
          <div className="text-sm text-slate-500">{description}</div>
        ) : null}

        {children ? <div className="pt-2">{children}</div> : null}
      </div>
    </Card>
  );
}