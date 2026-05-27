import { Card } from "@/components/ui/Card";

export function IncomesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">Доходы</h2>
        <p className="text-slate-500">Список доходов, создание и редактирование.</p>
      </div>

      <Card>
        <p className="text-sm text-slate-600">
          На следующем frontend-шаге подключим `GET /incomes` и форму создания дохода.
        </p>
      </Card>
    </div>
  );
}