import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { IncomeExpenseByMonthItem } from "@/features/dashboard/dashboard.types";
import { formatMoney } from "@/lib/format";

interface IncomeExpenseChartProps {
  items: IncomeExpenseByMonthItem[];
}

interface ChartItem {
  month: string;
  income: number;
  expenses: number;
  cashflow: number;
}

function toMonthLabel(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "short",
    year: "2-digit"
  }).format(new Date(value));
}

export function IncomeExpenseChart({ items }: IncomeExpenseChartProps) {
  const data: ChartItem[] = items.map((item) => ({
    month: toMonthLabel(item.month),
    income: Number(item.income),
    expenses: Number(item.expenses),
    cashflow: Number(item.cashflow)
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
          <Tooltip formatter={(value) => formatMoney(Number(value))} />
          <Bar dataKey="income" name="Доходы" />
          <Bar dataKey="expenses" name="Расходы" />
          <Line
            type="monotone"
            dataKey="cashflow"
            name="Cashflow"
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}