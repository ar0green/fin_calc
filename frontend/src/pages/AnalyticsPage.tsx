import type { ElementType } from "react";
import {
  BarChart3,
  CreditCard,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp
} from "lucide-react";

import { AnalyticsDebtDynamicsChart } from "@/components/charts/AnalyticsDebtDynamicsChart";
import { ExpenseStructureChart } from "@/components/charts/ExpenseStructureChart";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageState } from "@/components/ui/PageState";
import {
  useAnalyticsDebtDynamics,
  useAnalyticsOverview,
  useExpenseStructure,
  useIncomeExpenseByMonth
} from "@/features/analytics/analytics.queries";
import { formatMoney, formatPercent } from "@/lib/format";

const ANALYTICS_DATE_FROM = "2026-01-01";
const ANALYTICS_DATE_TO = "2026-04-30";

const CURRENT_MONTH_FROM = "2026-04-01";
const CURRENT_MONTH_TO = "2026-04-30";

const DEBT_START_DATE = "2026-04-01";
const DEBT_STRATEGY = "avalanche";
const DEBT_EXTRA_PAYMENT = 15000;
const DEBT_MAX_MONTHS = 120;

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  icon: ElementType;
}

function MetricCard({ title, value, description, icon: Icon }: MetricCardProps) {
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

export function AnalyticsPage() {
  const overviewQuery = useAnalyticsOverview(CURRENT_MONTH_FROM, CURRENT_MONTH_TO);
  const incomeExpenseQuery = useIncomeExpenseByMonth(
    ANALYTICS_DATE_FROM,
    ANALYTICS_DATE_TO
  );
  const expenseStructureQuery = useExpenseStructure(
    CURRENT_MONTH_FROM,
    CURRENT_MONTH_TO
  );
  const debtDynamicsQuery = useAnalyticsDebtDynamics(
    DEBT_START_DATE,
    DEBT_STRATEGY,
    DEBT_EXTRA_PAYMENT,
    DEBT_MAX_MONTHS
  );

  const isLoading =
    overviewQuery.isLoading ||
    incomeExpenseQuery.isLoading ||
    expenseStructureQuery.isLoading ||
    debtDynamicsQuery.isLoading;

  const isError =
    overviewQuery.isError ||
    incomeExpenseQuery.isError ||
    expenseStructureQuery.isError ||
    debtDynamicsQuery.isError;

  if (isLoading) {
    return (
      <PageState
        title="Загружаем аналитику"
        description="Получаем данные доходов, расходов и долгов из backend..."
      />
    );
  }

  if (isError) {
    return (
      <PageState
        title="Не удалось загрузить аналитику"
        description="Проверь backend, авторизацию и доступность analytics API."
      />
    );
  }

  const overview = overviewQuery.data;
  const incomeExpense = incomeExpenseQuery.data;
  const expenseStructure = expenseStructureQuery.data;
  const debtDynamics = debtDynamicsQuery.data;

  if (!overview || !incomeExpense || !expenseStructure || !debtDynamics) {
    return (
      <PageState
        title="Нет данных"
        description="Backend ответил, но аналитические данные отсутствуют."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Аналитика</h2>
          <p className="text-slate-500">
            Детальный обзор доходов, расходов, cashflow и долгов.
          </p>
        </div>

        <div className="rounded-xl bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
          Период: {ANALYTICS_DATE_FROM} — {ANALYTICS_DATE_TO}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Доходы за месяц"
          value={formatMoney(overview.total_income)}
          description="Текущий аналитический месяц"
          icon={TrendingUp}
        />

        <MetricCard
          title="Расходы за месяц"
          value={formatMoney(overview.total_expenses)}
          description="Обязательные + переменные"
          icon={Receipt}
        />

        <MetricCard
          title="Свободный остаток"
          value={formatMoney(overview.free_cash)}
          description="После расходов и мин. платежей"
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
          description="Фиксированная нагрузка"
          icon={Receipt}
        />

        <MetricCard
          title="Переменные расходы"
          value={formatMoney(overview.variable_expenses)}
          description="Гибкие траты"
          icon={Receipt}
        />

        <MetricCard
          title="Debt payoff capacity"
          value={formatMoney(overview.debt_payoff_capacity)}
          description="Потенциал ускоренного погашения"
          icon={PiggyBank}
        />

        <MetricCard
          title="Debt / income"
          value={
            overview.debt_to_income_ratio_percent
              ? formatPercent(overview.debt_to_income_ratio_percent)
              : "—"
          }
          description="Долг относительно месячного дохода"
          icon={BarChart3}
        />
      </div>

      <Card>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-950">
            Доходы / расходы / cashflow
          </h3>
          <p className="text-sm text-slate-500">
            Помесячная динамика за аналитический период.
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

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">
              Структура расходов
            </h3>
            <p className="text-sm text-slate-500">
              Расходы по категориям за текущий месяц.
            </p>
          </div>

          {expenseStructure.items.length > 0 ? (
            <ExpenseStructureChart items={expenseStructure.items} />
          ) : (
            <EmptyState
              title="Нет расходов"
              description="За выбранный период расходы не найдены."
            />
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">
              Категории расходов
            </h3>
            <p className="text-sm text-slate-500">
              Доля каждой категории в общем объёме.
            </p>
          </div>

          {expenseStructure.items.length > 0 ? (
            <div className="space-y-4">
              {expenseStructure.items.map((item) => (
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
                        width: `${Math.min(Number(item.percent), 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Нет категорий"
              description="Структура расходов пока пустая."
            />
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">
              Динамика долга
            </h3>
            <p className="text-sm text-slate-500">
              Прогноз по стратегии Avalanche с доп. платежом{" "}
              {formatMoney(DEBT_EXTRA_PAYMENT)}.
            </p>
          </div>

          {debtDynamics.items.length > 0 ? (
            <AnalyticsDebtDynamicsChart items={debtDynamics.items} />
          ) : (
            <EmptyState
              title="Нет активных долгов"
              description="Добавь долги, чтобы увидеть динамику погашения."
            />
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">
              Итоги прогноза
            </h3>
            <p className="text-sm text-slate-500">
              Основные показатели долгового прогноза.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-slate-500">Дата закрытия</div>
              <div className="mt-1 text-xl font-bold text-slate-950">
                {debtDynamics.paid_off && debtDynamics.payoff_date
                  ? debtDynamics.payoff_date
                  : "Не закрывается"}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Месяцев в прогнозе</div>
              <div className="mt-1 text-xl font-bold text-slate-950">
                {debtDynamics.months_simulated}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Начальный долг</div>
              <div className="mt-1 text-xl font-bold text-slate-950">
                {formatMoney(debtDynamics.initial_total_balance)}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Финальный остаток</div>
              <div className="mt-1 text-xl font-bold text-slate-950">
                {formatMoney(debtDynamics.final_total_balance)}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Всего выплачено</div>
              <div className="mt-1 text-xl font-bold text-slate-950">
                {formatMoney(debtDynamics.total_paid)}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Переплата</div>
              <div className="mt-1 text-xl font-bold text-slate-950">
                {formatMoney(debtDynamics.total_interest_paid)}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}