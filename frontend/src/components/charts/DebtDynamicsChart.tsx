import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { DebtDynamicsMonthItem } from "@/features/dashboard/dashboard.types";
import { formatMoney } from "@/lib/format";

interface DebtDynamicsChartProps {
  items: DebtDynamicsMonthItem[];
}

interface ChartItem {
  month: string;
  balance: number;
}

function toMonthLabel(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "short",
    year: "2-digit"
  }).format(new Date(value));
}

export function DebtDynamicsChart({ items }: DebtDynamicsChartProps) {
  const data: ChartItem[] = items.map((item) => ({
    month: toMonthLabel(item.month_date),
    balance: Number(item.total_balance_end)
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}