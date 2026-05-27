import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { DebtProjectionMonthItem } from "@/features/scenarios/scenarios.types";
import { formatMoney } from "@/lib/format";

interface DebtProjectionChartProps {
  items: DebtProjectionMonthItem[];
}

interface ChartItem {
  month: string;
  balance: number;
  paid: number;
  interest: number;
}

function toMonthLabel(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "short",
    year: "2-digit"
  }).format(new Date(value));
}

export function DebtProjectionChart({ items }: DebtProjectionChartProps) {
  const data: ChartItem[] = items.map((item) => ({
    month: toMonthLabel(item.month_date),
    balance: Number(item.total_balance_end),
    paid: Number(item.total_paid),
    interest: Number(item.total_interest_accrued)
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
          <Tooltip formatter={(value) => formatMoney(Number(value))} />
          <Line
            type="monotone"
            dataKey="balance"
            name="Остаток долга"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="paid"
            name="Платёж за месяц"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="interest"
            name="Проценты за месяц"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}