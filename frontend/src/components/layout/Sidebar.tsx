import { NavLink } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  FolderTree,
  HandCoins,
  Home,
  LineChart,
  Receipt,
  TrendingUp
} from "lucide-react";

import clsx from "clsx";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    icon: Home
  },
  {
    to: "/planning",
    label: "План месяца",
    icon: CalendarDays
  },
  {
    to: "/budgets",
    label: "Бюджеты",
    icon: FolderTree
  },
  {
    to: "/incomes",
    label: "Доходы",
    icon: TrendingUp
  },
  {
    to: "/expenses",
    label: "Расходы",
    icon: Receipt
  },
  {
    to: "/debts",
    label: "Долги",
    icon: CreditCard
  },
  {
    to: "/debt-payments",
    label: "Платежи",
    icon: HandCoins
  },
  {
    to: "/analytics",
    label: "Аналитика",
    icon: BarChart3
  },
  {
    to: "/scenarios",
    label: "Сценарии",
    icon: LineChart
  }
];

interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ onNavigate, className }: SidebarProps) {
  return (
    <aside
      className={clsx(
        "min-h-screen w-64 border-r border-slate-200 bg-white px-4 py-5",
        className
      )}
    >
      <div className="mb-8 px-2">
        <div className="text-lg font-bold text-slate-950">Finance Calculator</div>
        <div className="text-sm text-slate-500">Personal finance MVP</div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}