import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { ExpenseStructureItem } from "@/features/analytics/analytics.types";
import { formatMoney } from "@/lib/format";

interface ExpenseStructureChartProps {
  items: ExpenseStructureItem[];
}

interface ChartItem {
  category: string;
  amount: number;
  percent: number;
}

export function ExpenseStructureChart({ items }: ExpenseStructureChartProps) {
  const data: ChartItem[] = items.map((item) => ({
    category: item.category,
    amount: Number(item.amount),
    percent: Number(item.percent)
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
          />
          <YAxis type="category" dataKey="category" width={100} />
          <Tooltip formatter={(value) => formatMoney(Number(value))} />
          <Bar dataKey="amount" name="Расходы" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}