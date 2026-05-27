import { Card } from "@/components/ui/Card";

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">Аналитика</h2>
        <p className="text-slate-500">Доходы, расходы, структура и динамика долгов.</p>
      </div>

      <Card>
        <p className="text-sm text-slate-600">
          Здесь подключим графики Recharts поверх `/analytics/*`.
        </p>
      </Card>
    </div>
  );
}