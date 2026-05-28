import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { DebtPaymentMonthlyItem } from "@/features/analytics/analytics.types";
import { formatMoney } from "@/lib/format";

interface DebtPaymentsMonthlyChartProps {
  items: DebtPaymentMonthlyItem[];
}

interface ChartItem {
  month: string;
  principal: number;
  interest: number;
  total: number;
}

function toMonthLabel(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "short",
    year: "2-digit"
  }).format(new Date(value));
}

export function DebtPaymentsMonthlyChart({ items }: DebtPaymentsMonthlyChartProps) {
  const data: ChartItem[] = items.map((item) => ({
    month: toMonthLabel(item.month),
    principal: Number(item.principal_paid),
    interest: Number(item.interest_paid),
    total: Number(item.total_paid)
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
          <Tooltip formatter={(value) => formatMoney(Number(value))} />
          <Bar dataKey="principal" name="Тело долга" stackId="payments" />
          <Bar dataKey="interest" name="Проценты" stackId="payments" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}