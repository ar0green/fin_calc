import { Card } from "@/components/ui/Card";

export function ScenariosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">Сценарии</h2>
        <p className="text-slate-500">Сравнение стратегий погашения долгов.</p>
      </div>

      <Card>
        <p className="text-sm text-slate-600">
          Здесь подключим `/calculations/scenario-compare` и `/calculations/debt-strategy`.
        </p>
      </Card>
    </div>
  );
}