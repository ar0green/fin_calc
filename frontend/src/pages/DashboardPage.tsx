import { Card } from "@/components/ui/Card";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">Dashboard</h2>
        <p className="text-slate-500">Главная сводка по финансам.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="text-sm text-slate-500">Доходы за месяц</div>
          <div className="mt-2 text-2xl font-bold">—</div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Расходы за месяц</div>
          <div className="mt-2 text-2xl font-bold">—</div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Свободный остаток</div>
          <div className="mt-2 text-2xl font-bold">—</div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Активный долг</div>
          <div className="mt-2 text-2xl font-bold">—</div>
        </Card>
      </div>

      <Card>
        <div className="text-sm font-medium text-slate-900">
          Здесь скоро появится подключение к `/analytics/overview`.
        </div>
      </Card>
    </div>
  );
}