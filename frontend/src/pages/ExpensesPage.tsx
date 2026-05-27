import { Card } from "@/components/ui/Card";

export function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">Расходы</h2>
        <p className="text-slate-500">Обязательные и переменные расходы.</p>
      </div>

      <Card>
        <p className="text-sm text-slate-600">
          Здесь подключим `GET /expenses`, фильтры и форму создания расходов.
        </p>
      </Card>
    </div>
  );
}