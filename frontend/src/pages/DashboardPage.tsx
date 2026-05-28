import type { ElementType } from "react";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  CreditCard,
  PiggyBank,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Wallet,
} from "lucide-react";

import { DebtDynamicsChart } from "@/components/charts/DebtDynamicsChart";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageState } from "@/components/ui/PageState";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import {
  useAnalyticsOverview,
  useDebtDynamics,
  useIncomeExpenseByMonth,
} from "@/features/dashboard/dashboard.queries";
import { useDebtPaymentsSummary } from "@/features/analytics/analytics.queries";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { useMonthlyBudgetSummary } from "@/features/budgets/budgets.queries";
import { monthValueFromIsoDate } from "@/lib/month";

const DEFAULT_DATE_FROM = "2026-04-01";
const DEFAULT_DATE_TO = "2026-04-30";

function getMonthStart(value: string): string {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  icon: ElementType;
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: MetricCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">{title}</div>
          <div className="mt-2 text-2xl font-bold text-slate-950">{value}</div>

          {description ? (
            <div className="mt-1 text-xs text-slate-500">{description}</div>
          ) : null}
        </div>

        <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const [dateFrom, setDateFrom] = useState(DEFAULT_DATE_FROM);
  const [dateTo, setDateTo] = useState(DEFAULT_DATE_TO);
  const budgetMonth = monthValueFromIsoDate(dateFrom);

  const chartDateFrom = useMemo(() => getMonthStart(dateFrom), [dateFrom]);
  const chartDateTo = dateTo;

  const overviewQuery = useAnalyticsOverview(dateFrom, dateTo);
  const incomeExpenseQuery = useIncomeExpenseByMonth(
    chartDateFrom,
    chartDateTo,
  );
  const debtDynamicsQuery = useDebtDynamics(dateFrom);
  const debtPaymentsSummaryQuery = useDebtPaymentsSummary(dateFrom, dateTo);
  const budgetSummaryQuery = useMonthlyBudgetSummary(budgetMonth);

  const isLoading =
    overviewQuery.isLoading ||
    incomeExpenseQuery.isLoading ||
    debtDynamicsQuery.isLoading ||
    debtPaymentsSummaryQuery.isLoading ||
    budgetSummaryQuery.isLoading;

  const isFetching =
    overviewQuery.isFetching ||
    incomeExpenseQuery.isFetching ||
    debtDynamicsQuery.isFetching ||
    debtPaymentsSummaryQuery.isFetching;

  const isError =
    overviewQuery.isError ||
    incomeExpenseQuery.isError ||
    debtDynamicsQuery.isError ||
    debtPaymentsSummaryQuery.isError ||
    budgetSummaryQuery.isError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageState
          title="Загружаем Dashboard"
          description="Получаем финансовые данные из backend..."
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageState
          title="Не удалось загрузить Dashboard"
          description="Проверь, что backend запущен, токен авторизации актуален, а API отвечает."
        >
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            Ошибка загрузки данных
          </div>
        </PageState>
      </div>
    );
  }

  const overview = overviewQuery.data;
  const incomeExpense = incomeExpenseQuery.data;
  const debtDynamics = debtDynamicsQuery.data;
  const debtPaymentsSummary = debtPaymentsSummaryQuery.data;
  const budgetSummary = budgetSummaryQuery.data;

  if (
    !overview ||
    !incomeExpense ||
    !debtDynamics ||
    !debtPaymentsSummary ||
    !budgetSummary
  ) {
    return (
      <PageState
        title="Нет данных"
        description="Backend ответил, но данные Dashboard отсутствуют."
      />
    );
  }

  const overBudgetCategoriesCount = budgetSummary.items.filter(
    (item) => item.is_over_budget,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Dashboard</h2>
          <p className="text-slate-500">
            Сводка за период {formatDate(dateFrom)} — {formatDate(dateTo)}
          </p>
        </div>

        <div className="rounded-xl bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
          Strategy: avalanche · Extra: 15 000 ₽
        </div>
      </div>

      <PeriodFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        disabled={isFetching}
      />

      {isFetching ? (
        <div className="text-sm text-slate-500">Обновляем данные...</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Доходы за период"
          value={formatMoney(overview.total_income)}
          description="Все доходы за выбранный период"
          icon={TrendingUp}
        />

        <MetricCard
          title="Расходы за период"
          value={formatMoney(overview.total_expenses)}
          description="Обязательные + переменные"
          icon={Receipt}
        />

        <MetricCard
          title="Свободный остаток"
          value={formatMoney(overview.free_cash)}
          description="После расходов и минимальных платежей"
          icon={PiggyBank}
        />

        <MetricCard
          title="Активный долг"
          value={formatMoney(overview.active_debt_balance)}
          description={`${overview.active_debt_count} активных долгов`}
          icon={CreditCard}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Обязательные расходы"
          value={formatMoney(overview.mandatory_expenses)}
          description="Жёсткая регулярная нагрузка"
          icon={Receipt}
        />

        <MetricCard
          title="Переменные расходы"
          value={formatMoney(overview.variable_expenses)}
          description="Гибкие расходы периода"
          icon={Receipt}
        />

        <MetricCard
          title="Мин. платежи по долгам"
          value={formatMoney(overview.minimum_debt_payments)}
          description="Ежемесячная долговая нагрузка"
          icon={CreditCard}
        />

        <MetricCard
          title="Debt payoff capacity"
          value={formatMoney(overview.debt_payoff_capacity)}
          description="Потенциал ускоренного погашения"
          icon={PiggyBank}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Выплачено по долгам"
          value={formatMoney(debtPaymentsSummary.total_paid)}
          description="Все платежи за период"
          icon={CreditCard}
        />

        <MetricCard
          title="В тело долга"
          value={formatMoney(debtPaymentsSummary.principal_paid)}
          description="Реальное снижение долга"
          icon={PiggyBank}
        />

        <MetricCard
          title="Проценты"
          value={formatMoney(debtPaymentsSummary.interest_paid)}
          description="Стоимость долга за период"
          icon={Receipt}
        />

        <MetricCard
          title="Доля процентов"
          value={formatPercent(debtPaymentsSummary.interest_share_percent)}
          description="В структуре платежей"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Бюджет месяца"
          value={formatMoney(budgetSummary.total_budget_limit)}
          description={`Месяц: ${budgetSummary.month}`}
          icon={Wallet}
        />

        <MetricCard
          title="Факт по бюджету"
          value={formatMoney(budgetSummary.total_actual_amount)}
          description="Расходы по бюджетируемым категориям"
          icon={Wallet}
        />

        <MetricCard
          title="Остаток бюджета"
          value={formatMoney(budgetSummary.total_remaining_amount)}
          description="Может быть отрицательным"
          icon={Wallet}
        />

        <MetricCard
          title="Превышения"
          value={String(overBudgetCategoriesCount)}
          description="Категорий сверх лимита"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">
              Доходы / расходы / cashflow
            </h3>
            <p className="text-sm text-slate-500">
              Помесячная динамика за выбранный период
            </p>
          </div>

          {incomeExpense.items.length > 0 ? (
            <IncomeExpenseChart items={incomeExpense.items} />
          ) : (
            <EmptyState
              title="Нет данных для графика"
              description="Добавь доходы и расходы, чтобы увидеть динамику."
            />
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">
              Топ расходов
            </h3>
            <p className="text-sm text-slate-500">
              Категории расходов за выбранный период
            </p>
          </div>

          {overview.top_expense_categories.length > 0 ? (
            <div className="space-y-4">
              {overview.top_expense_categories.map((item) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-medium text-slate-900">
                      {item.category}
                    </div>
                    <div className="text-sm text-slate-500">
                      {formatPercent(item.percent)}
                    </div>
                  </div>

                  <div className="mt-1 text-sm text-slate-600">
                    {formatMoney(item.amount)}
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{
                        width: `${Math.min(Number(item.percent), 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Нет расходов"
              description="За выбранный период расходы не найдены."
            />
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">
              Прогноз снижения долга
            </h3>
            <p className="text-sm text-slate-500">
              Avalanche-стратегия с дополнительным платежом 15 000 ₽
            </p>
          </div>

          {debtDynamics.items.length > 0 ? (
            <DebtDynamicsChart items={debtDynamics.items} />
          ) : (
            <EmptyState
              title="Нет активных долгов"
              description="Добавь долги, чтобы увидеть прогноз погашения."
            />
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">
              Прогноз погашения
            </h3>
            <p className="text-sm text-slate-500">
              Расчёт по текущим активным долгам
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-slate-500">Закрытие долгов</div>
              <div className="mt-1 text-xl font-bold text-slate-950">
                {debtDynamics.paid_off
                  ? (formatDate(debtDynamics.payoff_date) ?? "—")
                  : "Не закрываются в горизонте"}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Месяцев в прогнозе</div>
              <div className="mt-1 text-xl font-bold text-slate-950">
                {debtDynamics.months_simulated}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">
                Всего будет выплачено
              </div>
              <div className="mt-1 text-xl font-bold text-slate-950">
                {formatMoney(debtDynamics.total_paid)}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Проценты / переплата</div>
              <div className="mt-1 text-xl font-bold text-slate-950">
                {formatMoney(debtDynamics.total_interest_paid)}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Debt / income ratio</div>
              <div className="mt-1 text-xl font-bold text-slate-950">
                {overview.debt_to_income_ratio_percent
                  ? formatPercent(overview.debt_to_income_ratio_percent)
                  : "—"}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
