import { Card } from "@/components/ui/Card";

export function DebtsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">Долги</h2>
        <p className="text-slate-500">Кредиты, займы и кредитные карты.</p>
      </div>

      <Card>
        <p className="text-sm text-slate-600">
          Здесь подключим `GET /debts`, карточки долгов и форму добавления долга.
        </p>
      </Card>
    </div>
  );
}