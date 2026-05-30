import type { ElementType } from "react";
import {
  CalendarDays,
  CreditCard,
  PiggyBank,
  Receipt,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PLANNING_SETTINGS,
  loadPlanningSettings,
  resetPlanningSettings,
  savePlanningSettings,
} from "@/features/planning/planning.settings";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageState } from "@/components/ui/PageState";
import { Select } from "@/components/ui/Select";
import { useMonthlyPlan } from "@/features/planning/planning.queries";
import type {
  DebtStrategyType,
  MonthlyPlanDebtItem,
  SafetyBufferType,
} from "@/features/planning/planning.types";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { buildMonthOptions } from "@/lib/month";
import { useMonthlyBudgetSummary } from "@/features/budgets/budgets.queries";

const SAFETY_BUFFER_TYPE_OPTIONS = [
  { label: "% от дохода", value: "percent" },
  { label: "Фиксированная сумма", value: "fixed" },
];

const STRATEGY_OPTIONS = [
  { label: "Avalanche", value: "avalanche" },
  { label: "Snowball", value: "snowball" },
];

function incomeSourceLabel(type: string): string {
  if (type === "regular") {
    return "Регулярный";
  }

  return "Нерегулярный";
}

function expenseRecurrenceLabel(type: string): string {
  if (type === "monthly") {
    return "Ежемесячный";
  }

  return "Разовый";
}

function expenseTypeLabel(type: string): string {
  if (type === "mandatory") {
    return "Обязательный";
  }

  return "Переменный";
}

function debtTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    loan: "Кредит",
    credit_card: "Кредитная карта",
    personal_loan: "Личный займ",
    mortgage: "Ипотека",
    car_loan: "Автокредит",
  };

  return labels[type] ?? type;
}

function getSuggestedDebtTarget(
  debts: MonthlyPlanDebtItem[],
): MonthlyPlanDebtItem | null {
  if (debts.length === 0) {
    return null;
  }

  return [...debts].sort((a, b) => {
    const rateDiff =
      Number(b.annual_interest_rate) - Number(a.annual_interest_rate);

    if (rateDiff !== 0) {
      return rateDiff;
    }

    return Number(a.principal_balance) - Number(b.principal_balance);
  })[0];
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

export function PlanningPage() {
  const [settings, setSettings] = useState(() => loadPlanningSettings());

  const updateSettings = (patch: Partial<typeof settings>) => {
    setSettings((current) => ({
      ...current,
      ...patch,
    }));
  };

  const handleResetSettings = () => {
    setSettings(resetPlanningSettings());
  };

  const month = settings.month;
  const safetyBufferType = settings.safetyBufferType;
  const safetyBufferValue = settings.safetyBufferValue;
  const strategyType = settings.strategyType;
  const maxMonths = settings.maxMonths;

  const monthlyPlanParams = useMemo(
    () => ({
      month,
      safetyBufferType,
      safetyBufferValue,
      strategyType,
      maxMonths,
    }),
    [month, safetyBufferType, safetyBufferValue, strategyType, maxMonths],
  );

  const monthOptions = useMemo(
    () =>
      buildMonthOptions({
        monthsBack: 6,
        monthsForward: 18,
        includeDemoMonths: true,
      }),
    [],
  );

  useEffect(() => {
    savePlanningSettings(settings);
  }, [settings]);

  const monthlyPlanQuery = useMonthlyPlan(monthlyPlanParams);
  const budgetSummaryQuery = useMonthlyBudgetSummary(month);

  if (monthlyPlanQuery.isLoading || budgetSummaryQuery.isLoading) {
    return (
      <PageState
        title="Загружаем план месяца"
        description="Получаем данные из backend..."
      />
    );
  }

  if (monthlyPlanQuery.isError || budgetSummaryQuery.isError) {
    return (
      <PageState
        title="Не удалось загрузить план месяца"
        description="Проверь backend, авторизацию и planning API."
      />
    );
  }

  const plan = monthlyPlanQuery.data;
  const budgetSummary = budgetSummaryQuery.data;

  if (!plan || !budgetSummary) {
    return (
      <PageState
        title="Нет данных"
        description="Backend ответил, но план месяца отсутствует."
      />
    );
  }

  const suggestedDebtTarget =
    plan.recommended_debt_target_id && plan.recommended_debt_target_name
      ? (plan.active_debts.find(
          (debt) => debt.debt_id === plan.recommended_debt_target_id,
        ) ?? getSuggestedDebtTarget(plan.active_debts))
      : getSuggestedDebtTarget(plan.active_debts);

  const hasPositiveFreeCash = Number(plan.free_cash) > 0;
  const hasRecommendedExtra = Number(plan.recommended_extra_payment) > 0;
  const impact = plan.scenario_impact;
  const overBudgetItems = budgetSummary.items.filter(
    (item) => item.is_over_budget,
  );

  const hasBudgetOverruns = overBudgetItems.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">План месяца</h2>
          <p className="text-slate-500">
            Планирование доходов, расходов и платежей по долгам.
          </p>
        </div>

        <div className="rounded-xl bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
          Strategy:{" "}
          <span className="font-semibold text-slate-950">
            {strategyType === "avalanche" ? "Avalanche" : "Snowball"}
          </span>
        </div>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-6">
          <Select
            label="Месяц"
            value={month}
            onChange={(event) => updateSettings({ month: event.target.value })}
            options={monthOptions}
          />

          <Select
            label="Тип буфера"
            value={safetyBufferType}
            onChange={(event) =>
              updateSettings({
                safetyBufferType: event.target.value as SafetyBufferType,
              })
            }
            options={SAFETY_BUFFER_TYPE_OPTIONS}
          />

          <Input
            label={safetyBufferType === "percent" ? "Буфер, %" : "Буфер, ₽"}
            type="number"
            min="0"
            step={safetyBufferType === "percent" ? "1" : "1000"}
            value={safetyBufferValue}
            onChange={(event) =>
              updateSettings({
                safetyBufferValue: Number(event.target.value),
              })
            }
          />

          <Select
            label="Стратегия"
            value={strategyType}
            onChange={(event) =>
              updateSettings({
                strategyType: event.target.value as DebtStrategyType,
              })
            }
            options={STRATEGY_OPTIONS}
          />

          <Input
            label="Горизонт, мес."
            type="number"
            min="1"
            max="1200"
            step="1"
            value={maxMonths}
            onChange={(event) =>
              updateSettings({
                maxMonths: Number(event.target.value),
              })
            }
          />

          <div className="flex items-end">
            <Button
              variant="secondary"
              className="w-full gap-2"
              onClick={handleResetSettings}
            >
              <RotateCcw className="h-4 w-4" />
              Сбросить
            </Button>
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Настройки плана сохраняются в браузере и применяются автоматически при
          следующем открытии страницы.
        </div>
      </Card>

      {monthlyPlanQuery.isFetching ? (
        <div className="text-sm text-slate-500">Пересчитываем план...</div>
      ) : null}

      <Card>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-slate-500">Период планирования</div>
            <div className="mt-1 text-xl font-bold text-slate-950">
              {formatDate(plan.period.date_from)} —{" "}
              {formatDate(plan.period.date_to)}
            </div>
          </div>

          <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
            Safety buffer:{" "}
            <span className="font-semibold text-slate-950">
              {formatMoney(plan.safety_buffer)}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Доходы месяца"
          value={formatMoney(plan.total_income)}
          description="Все поступления месяца"
          icon={TrendingUp}
        />

        <MetricCard
          title="Расходы месяца"
          value={formatMoney(plan.total_expenses)}
          description="Обязательные + переменные"
          icon={Receipt}
        />

        <MetricCard
          title="Мин. платежи"
          value={formatMoney(plan.minimum_debt_payments)}
          description="Обязательная долговая нагрузка"
          icon={CreditCard}
        />

        <MetricCard
          title="Свободный остаток"
          value={formatMoney(plan.free_cash)}
          description="После расходов и мин. платежей"
          icon={PiggyBank}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Бюджет месяца"
          value={formatMoney(budgetSummary.total_budget_limit)}
          description="Сумма лимитов категорий"
          icon={Wallet}
        />

        <MetricCard
          title="Факт по бюджету"
          value={formatMoney(budgetSummary.total_actual_amount)}
          description="Расходы по категориям с лимитами"
          icon={Wallet}
        />

        <MetricCard
          title="Остаток бюджета"
          value={formatMoney(budgetSummary.total_remaining_amount)}
          description="Доступно в рамках лимитов"
          icon={Wallet}
        />

        <MetricCard
          title="Использовано бюджета"
          value={formatPercent(budgetSummary.total_usage_percent)}
          description={
            hasBudgetOverruns
              ? `${overBudgetItems.length} категорий с превышением`
              : "Без превышений"
          }
          icon={hasBudgetOverruns ? AlertTriangle : Wallet}
        />
      </div>

      <Card>
        <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-start">
          <div>
            <h3 className="text-base font-semibold text-slate-950">
              Бюджетные лимиты месяца
            </h3>
            <p className="text-sm text-slate-500">
              Сравнение плановых лимитов категорий с фактическими и регулярными
              расходами.
            </p>
          </div>

          <div
            className={
              hasBudgetOverruns
                ? "rounded-xl bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
                : "rounded-xl bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700"
            }
          >
            {hasBudgetOverruns
              ? `Превышений: ${overBudgetItems.length}`
              : "В пределах бюджета"}
          </div>
        </div>

        {budgetSummary.items.length > 0 ? (
          <div className="space-y-4">
            {budgetSummary.items.map((item) => {
              const usage = Math.min(Number(item.usage_percent), 100);

              return (
                <div
                  key={item.category}
                  className={
                    item.is_over_budget
                      ? "rounded-2xl border border-red-200 bg-red-50 p-4"
                      : "rounded-2xl border border-slate-200 p-4"
                  }
                >
                  <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">
                        {item.category}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Факт {formatMoney(item.actual_amount)} из лимита{" "}
                        {formatMoney(item.budget_limit)}
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <div
                        className={
                          item.is_over_budget
                            ? "text-sm font-semibold text-red-700"
                            : "text-sm font-semibold text-slate-950"
                        }
                      >
                        {item.is_over_budget ? "Превышение" : "Остаток"}{" "}
                        {formatMoney(item.remaining_amount)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatPercent(item.usage_percent)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                    <div
                      className={
                        item.is_over_budget
                          ? "h-full rounded-full bg-red-500"
                          : "h-full rounded-full bg-slate-900"
                      }
                      style={{
                        width: `${usage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Нет бюджетов"
            description="Создай бюджеты категорий на странице Бюджеты, чтобы видеть ограничения месяца."
          />
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Рекомендованный extra"
          value={formatMoney(plan.recommended_extra_payment)}
          description="Можно направить на ускоренное погашение"
          icon={PiggyBank}
        />

        <MetricCard
          title="Остаток после extra"
          value={formatMoney(plan.remaining_after_recommended_extra_payment)}
          description="Должен быть не меньше safety buffer"
          icon={CalendarDays}
        />

        <MetricCard
          title="Активный долг"
          value={formatMoney(plan.active_debt_balance)}
          description={`${plan.active_debt_count} активных долгов`}
          icon={CreditCard}
        />

        <MetricCard
          title="Debt payoff capacity"
          value={formatMoney(plan.debt_payoff_capacity)}
          description="Потенциал погашения долгов"
          icon={TrendingDown}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Регулярные доходы"
          value={formatMoney(plan.income_regular)}
          description="Виртуально применены к месяцу"
          icon={TrendingUp}
        />

        <MetricCard
          title="Нерегулярные доходы"
          value={formatMoney(plan.income_irregular)}
          description="Фактические доходы месяца"
          icon={TrendingUp}
        />

        <MetricCard
          title="Ежемесячные расходы"
          value={formatMoney(plan.expenses_recurring)}
          description="Виртуально применены к месяцу"
          icon={Receipt}
        />

        <MetricCard
          title="Разовые расходы"
          value={formatMoney(plan.expenses_one_time)}
          description="Фактические расходы месяца"
          icon={Receipt}
        />
      </div>

      {impact ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="text-sm text-slate-500">Экономия месяцев</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">
              {impact.months_saved ?? "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              По сравнению с платежами без extra
            </div>
          </Card>

          <Card>
            <div className="text-sm text-slate-500">Экономия процентов</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">
              {impact.interest_saved ? formatMoney(impact.interest_saved) : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              За счёт recommended extra
            </div>
          </Card>

          <Card>
            <div className="text-sm text-slate-500">Новая дата закрытия</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">
              {impact.recommended_paid_off
                ? formatDate(impact.recommended_payoff_date)
                : "Не закрывается"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Baseline:{" "}
              {impact.baseline_paid_off
                ? formatDate(impact.baseline_payoff_date)
                : "не закрывается"}
            </div>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">
              Рекомендация на месяц
            </h3>
            <p className="text-sm text-slate-500">
              Рекомендация зависит от safety buffer и выбранной стратегии.
            </p>
          </div>

          {hasBudgetOverruns ? (
            <div className="mb-4 rounded-2xl bg-amber-50 p-4 text-amber-900">
              <div className="text-sm font-semibold">
                Есть превышения бюджета
              </div>
              <div className="mt-1 text-sm">
                Перед увеличением extra payment стоит проверить категории с
                превышением. Иначе план погашения долгов может быть слишком
                агрессивным.
              </div>
            </div>
          ) : null}

          {plan.budget_adjustment_applied ? (
            <div className="mb-4 rounded-2xl bg-blue-50 p-4 text-blue-900">
              <div className="text-sm font-semibold">
                Recommended extra payment скорректирован
              </div>
              <div className="mt-1 text-sm">
                Без учёта бюджета рекомендация была бы{" "}
                {formatMoney(
                  plan.recommended_extra_payment_before_budget_adjustment,
                )}
                . Из-за превышения бюджета на{" "}
                {formatMoney(plan.budget_overrun_total)} итоговая рекомендация
                снижена до {formatMoney(plan.recommended_extra_payment)}.
              </div>
            </div>
          ) : null}

          {hasPositiveFreeCash ? (
            <div className="space-y-4">
              {hasRecommendedExtra ? (
                <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-900">
                  <div className="text-sm font-semibold">
                    Можно ускорить погашение долгов
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {formatMoney(plan.recommended_extra_payment)}
                  </div>
                  <div className="mt-1 text-sm">
                    Эту сумму можно направить сверх минимальных платежей,
                    оставив safety buffer {formatMoney(plan.safety_buffer)}
                    {plan.budget_adjustment_applied ? (
                      <>
                        {" "}
                        и учитывая превышение бюджета{" "}
                        {formatMoney(plan.budget_overrun_total)}.
                      </>
                    ) : (
                      "."
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-amber-50 p-4 text-amber-900">
                  <div className="text-sm font-semibold">
                    Свободный остаток есть, но лучше оставить его как буфер
                  </div>
                  <div className="mt-2 text-sm">
                    Текущий остаток меньше или равен safety buffer.
                  </div>
                </div>
              )}

              {suggestedDebtTarget ? (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-500">
                    Рекомендуемая цель для extra payment
                  </div>
                  <div className="mt-1 text-xl font-bold text-slate-950">
                    {suggestedDebtTarget.name}
                  </div>
                  <div className="mt-2 grid gap-3 md:grid-cols-3">
                    <div>
                      <div className="text-xs text-slate-500">Тип</div>
                      <div className="text-sm font-medium text-slate-900">
                        {debtTypeLabel(suggestedDebtTarget.debt_type)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Ставка</div>
                      <div className="text-sm font-medium text-slate-900">
                        {formatPercent(
                          suggestedDebtTarget.annual_interest_rate,
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Остаток</div>
                      <div className="text-sm font-medium text-slate-900">
                        {formatMoney(suggestedDebtTarget.principal_balance)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl bg-red-50 p-4 text-red-900">
              <div className="text-sm font-semibold">
                В этом месяце отрицательный свободный остаток
              </div>
              <div className="mt-2 text-sm">
                Расходы и минимальные платежи превышают доходы. Стоит сократить
                переменные расходы или пересмотреть план платежей.
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">
              Детали сценария
            </h3>
            <p className="text-sm text-slate-500">
              Baseline vs recommended extra payment.
            </p>
          </div>

          {impact ? (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-500">Baseline процентов</div>
                <div className="mt-1 text-xl font-bold text-slate-950">
                  {formatMoney(impact.baseline_total_interest_paid)}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500">
                  Recommended процентов
                </div>
                <div className="mt-1 text-xl font-bold text-slate-950">
                  {formatMoney(impact.recommended_total_interest_paid)}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500">Baseline месяцев</div>
                <div className="mt-1 text-xl font-bold text-slate-950">
                  {impact.baseline_months_simulated}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500">
                  Recommended месяцев
                </div>
                <div className="mt-1 text-xl font-bold text-slate-950">
                  {impact.recommended_months_simulated}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Нет сценария"
              description="Добавь активные долги, чтобы увидеть влияние recommended extra."
            />
          )}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Extra до бюджета"
          value={formatMoney(
            plan.recommended_extra_payment_before_budget_adjustment,
          )}
          description="Без учёта превышений бюджета"
          icon={PiggyBank}
        />

        <MetricCard
          title="Превышение бюджета"
          value={formatMoney(plan.budget_overrun_total)}
          description="Сумма перерасхода по лимитам"
          icon={AlertTriangle}
        />

        <MetricCard
          title="Extra после бюджета"
          value={formatMoney(plan.recommended_extra_payment)}
          description="Осторожная рекомендация"
          icon={PiggyBank}
        />

        <MetricCard
          title="Корректировка"
          value={plan.budget_adjustment_applied ? "Применена" : "Нет"}
          description={
            plan.budget_adjustment_applied
              ? "Extra payment уменьшен"
              : "Превышений бюджета нет"
          }
          icon={plan.budget_adjustment_applied ? AlertTriangle : Wallet}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">
              Состав доходов
            </h3>
            <p className="text-sm text-slate-500">
              Что формирует доходную часть выбранного месяца.
            </p>
          </div>

          {plan.income_items.length > 0 ? (
            <div className="space-y-3">
              {plan.income_items.map((item) => (
                <div
                  key={`${item.source_type}-${item.income_id}`}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">
                        {item.category}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {incomeSourceLabel(item.source_type)} · с{" "}
                        {formatDate(item.original_date)}
                      </div>
                      {item.comment ? (
                        <div className="mt-1 text-xs text-slate-500">
                          {item.comment}
                        </div>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-950">
                        {formatMoney(item.amount)}
                      </div>
                      <div
                        className={
                          item.source_type === "regular"
                            ? "mt-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                            : "mt-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                        }
                      >
                        {incomeSourceLabel(item.source_type)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Нет доходов"
              description="Для выбранного месяца доходы не найдены."
            />
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">
              Состав расходов
            </h3>
            <p className="text-sm text-slate-500">
              Что формирует расходную часть выбранного месяца.
            </p>
          </div>

          {plan.expense_items.length > 0 ? (
            <div className="space-y-3">
              {plan.expense_items.map((item) => (
                <div
                  key={`${item.recurrence_type}-${item.expense_id}`}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">
                        {item.category}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {expenseTypeLabel(item.expense_type)} ·{" "}
                        {expenseRecurrenceLabel(item.recurrence_type)} · с{" "}
                        {formatDate(item.original_date)}
                      </div>
                      {item.comment ? (
                        <div className="mt-1 text-xs text-slate-500">
                          {item.comment}
                        </div>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-950">
                        {formatMoney(item.amount)}
                      </div>
                      <div
                        className={
                          item.recurrence_type === "monthly"
                            ? "mt-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
                            : "mt-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                        }
                      >
                        {expenseRecurrenceLabel(item.recurrence_type)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Нет расходов"
              description="Для выбранного месяца расходы не найдены."
            />
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">
              Структура расходов
            </h3>
            <p className="text-sm text-slate-500">
              Категории расходов за выбранный месяц.
            </p>
          </div>

          {plan.expense_categories.length > 0 ? (
            <div className="space-y-4">
              {plan.expense_categories.map((item) => (
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
              description="За выбранный месяц расходы не найдены."
            />
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">
              Активные долги
            </h3>
            <p className="text-sm text-slate-500">
              Минимальные платежи и приоритеты.
            </p>
          </div>

          {plan.active_debts.length > 0 ? (
            <div className="space-y-3">
              {plan.active_debts.map((debt) => (
                <div
                  key={debt.debt_id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">
                        {debt.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {debtTypeLabel(debt.debt_type)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-950">
                        {formatMoney(debt.principal_balance)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatPercent(debt.annual_interest_rate)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div>
                      <div className="text-xs text-slate-500">Мин. платёж</div>
                      <div className="text-sm font-medium text-slate-900">
                        {formatMoney(debt.minimum_monthly_payment)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">День платежа</div>
                      <div className="text-sm font-medium text-slate-900">
                        {debt.due_day}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">Приоритет</div>
                      <div className="text-sm font-medium text-slate-900">
                        {debt.payoff_priority}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Нет активных долгов"
              description="Добавь активные долги, чтобы увидеть план платежей."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
