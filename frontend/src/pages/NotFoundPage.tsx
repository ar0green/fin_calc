import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-slate-950">404</h1>
        <p className="mt-2 text-slate-500">Страница не найдена.</p>

        <Link to="/">
          <Button className="mt-6">На главную</Button>
        </Link>
      </Card>
    </div>
  );
}