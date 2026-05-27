import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, LineChart, Play, TrendingDown } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { DateInput } from "@/components/ui/DateInput";
import { Select } from "@/components/ui/Select";
import { z } from "zod";

import { DebtProjectionChart } from "@/components/charts/DebtProjectionChart";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageState } from "@/components/ui/PageState";
import {
  useDebtStrategyCalculation,
  useScenarioCompare,
} from "@/features/scenarios/scenarios.queries";
import type {
  DebtStrategyType,
  ScenarioCompareResult,
} from "@/features/scenarios/scenarios.types";
import { formatDate, formatMoney } from "@/lib/format";

const scenarioFormSchema = z.object({
  start_date: z.string().min(1, "Укажи дату старта"),
  extra_monthly_payment: z.coerce
    .number()
    .min(0, "Дополнительный платёж не может быть отрицательным"),
  max_months: z.coerce
    .number()
    .int("Горизонт должен быть целым числом")
    .min(1, "Минимум 1 месяц")
    .max(1200, "Максимум 1200 месяцев"),
  projection_strategy_type: z.enum(["snowball", "avalanche"]),
});

type ScenarioFormValues = z.infer<typeof scenarioFormSchema>;

function getDefaultStartDate(): string {
  return "2026-04-01";
}

function strategyLabel(strategy: DebtStrategyType): string {
  if (strategy === "snowball") {
    return "Snowball";
  }

  return "Avalanche";
}

function buildComparisonScenarios(extraMonthlyPayment: number) {
  return [
    {
      strategy_type: "snowball" as const,
      extra_monthly_payment: 0,
    },
    {
      strategy_type: "snowball" as const,
      extra_monthly_payment: extraMonthlyPayment,
    },
    {
      strategy_type: "avalanche" as const,
      extra_monthly_payment: 0,
    },
    {
      strategy_type: "avalanche" as const,
      extra_monthly_payment: extraMonthlyPayment,
    },
  ];
}

interface ScenarioResultCardProps {
  result: ScenarioCompareResult;
  isBaseline?: boolean;
}

function ScenarioResultCard({ result, isBaseline }: ScenarioResultCardProps) {
  return (
    <Card className={isBaseline ? "ring-2 ring-slate-900" : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-950">
            {strategyLabel(result.strategy_type)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Extra: {formatMoney(result.extra_monthly_payment)}
          </div>
        </div>

        {isBaseline ? (
          <div className="rounded-full bg-slate-900 px-2 py-1 text-xs font-medium text-white">
            baseline
          </div>
        ) : null}
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <div className="text-xs text-slate-500">Дата закрытия</div>
          <div className="text-lg font-bold text-slate-950">
            {result.paid_off
              ? formatDate(result.payoff_date)
              : "Не закрывается"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-500">Месяцев</div>
            <div className="text-base font-semibold text-slate-950">
              {result.months_simulated}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Переплата</div>
            <div className="text-base font-semibold text-slate-950">
              {formatMoney(result.total_interest_paid)}
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500">Всего будет выплачено</div>
          <div className="text-base font-semibold text-slate-950">
            {formatMoney(result.total_paid)}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500">Финальный остаток</div>
          <div className="text-base font-semibold text-slate-950">
            {formatMoney(result.final_total_balance)}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ScenariosPage() {
  const scenarioCompareMutation = useScenarioCompare();
  const debtStrategyMutation = useDebtStrategyCalculation();

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ScenarioFormValues>({
    resolver: zodResolver(scenarioFormSchema),
    defaultValues: {
      start_date: getDefaultStartDate(),
      extra_monthly_payment: 15000,
      max_months: 240,
      projection_strategy_type: "avalanche",
    },
  });

  const STRATEGY_OPTIONS = [
    {
      label: "Avalanche",
      value: "avalanche",
    },
    {
      label: "Snowball",
      value: "snowball",
    },
  ];

  const watchedValues = watch();

  const runCalculations = (values: ScenarioFormValues) => {
    const scenarios = buildComparisonScenarios(values.extra_monthly_payment);

    scenarioCompareMutation.mutate({
      start_date: values.start_date,
      max_months: values.max_months,
      scenarios,
    });

    debtStrategyMutation.mutate({
      strategy_type: values.projection_strategy_type,
      start_date: values.start_date,
      extra_monthly_payment: values.extra_monthly_payment,
      max_months: values.max_months,
    });
  };

  useEffect(() => {
    runCalculations({
      start_date: getDefaultStartDate(),
      extra_monthly_payment: 15000,
      max_months: 240,
      projection_strategy_type: "avalanche",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading =
    scenarioCompareMutation.isPending || debtStrategyMutation.isPending;

  const isError =
    scenarioCompareMutation.isError || debtStrategyMutation.isError;

  const compare = scenarioCompareMutation.data;
  const strategy = debtStrategyMutation.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Сценарии</h2>
          <p className="text-slate-500">
            Сравни стратегии погашения долгов и влияние дополнительного платежа.
          </p>
        </div>

        <div className="rounded-xl bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
          Projection:{" "}
          <span className="font-semibold text-slate-950">
            {strategyLabel(watchedValues.projection_strategy_type)}
          </span>
        </div>
      </div>

      <Card>
        <form
          className="grid gap-4 md:grid-cols-5"
          onSubmit={handleSubmit(runCalculations)}
        >
          <Controller
            name="start_date"
            control={control}
            render={({ field }) => (
              <DateInput
                label="Дата старта"
                value={field.value}
                onChange={field.onChange}
                error={errors.start_date?.message}
              />
            )}
          />

          <Input
            label="Доп. платёж"
            type="number"
            min="0"
            step="1000"
            error={errors.extra_monthly_payment?.message}
            {...register("extra_monthly_payment")}
          />

          <Input
            label="Горизонт, месяцев"
            type="number"
            min="1"
            max="1200"
            step="1"
            error={errors.max_months?.message}
            {...register("max_months")}
          />

          <Select
            label="Стратегия графика"
            options={STRATEGY_OPTIONS}
            error={errors.projection_strategy_type?.message}
            {...register("projection_strategy_type")}
          />

          <div className="flex items-end">
            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              <Play className="h-4 w-4" />
              {isLoading ? "Считаем..." : "Рассчитать"}
            </Button>
          </div>
        </form>
      </Card>

      {isError ? (
        <PageState
          title="Не удалось рассчитать сценарии"
          description="Проверь, что есть активные долги и backend отвечает без ошибок."
        />
      ) : null}

      {compare ? (
        <>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-950">
                Сравнение сценариев
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {compare.scenarios.map((result) => (
                <ScenarioResultCard
                  key={`${result.strategy_type}-${result.extra_monthly_payment}`}
                  result={result}
                  isBaseline={result.label === compare.baseline.label}
                />
              ))}
            </div>
          </div>

          <Card>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-950">
                Экономия относительно baseline
              </h3>
              <p className="text-sm text-slate-500">
                Baseline — первый сценарий в сравнении: snowball без доп.
                платежа.
              </p>
            </div>

            {compare.deltas_vs_baseline.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Сценарий
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Месяцев сэкономлено
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Экономия процентов
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Экономия total paid
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {compare.deltas_vs_baseline.map((delta) => (
                      <tr key={delta.compared_label}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {delta.compared_label}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-700">
                          {delta.months_saved ?? "—"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-slate-950">
                          {delta.interest_saved
                            ? formatMoney(delta.interest_saved)
                            : "—"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-slate-950">
                          {delta.total_paid_saved
                            ? formatMoney(delta.total_paid_saved)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="Нет данных для сравнения"
                description="Добавь минимум два сценария."
              />
            )}
          </Card>
        </>
      ) : null}

      {strategy ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <LineChart className="h-5 w-5 text-slate-700" />
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  Прогноз погашения
                </h3>
                <p className="text-sm text-slate-500">
                  {strategyLabel(strategy.strategy_type)} · extra{" "}
                  {formatMoney(strategy.extra_monthly_payment)}
                </p>
              </div>
            </div>

            {strategy.projection.length > 0 ? (
              <DebtProjectionChart items={strategy.projection} />
            ) : (
              <EmptyState
                title="Нет активных долгов"
                description="Добавь активные долги, чтобы построить прогноз."
              />
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-slate-700" />
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  Итоги стратегии
                </h3>
                <p className="text-sm text-slate-500">
                  Детальный расчёт выбранного сценария.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-500">Стратегия</div>
                <div className="mt-1 text-xl font-bold text-slate-950">
                  {strategyLabel(strategy.strategy_type)}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500">Дата закрытия</div>
                <div className="mt-1 text-xl font-bold text-slate-950">
                  {strategy.paid_off
                    ? formatDate(strategy.payoff_date)
                    : "Не закрывается"}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500">Месяцев</div>
                <div className="mt-1 text-xl font-bold text-slate-950">
                  {strategy.months_simulated}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500">Начальный долг</div>
                <div className="mt-1 text-xl font-bold text-slate-950">
                  {formatMoney(strategy.initial_total_balance)}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500">Всего выплачено</div>
                <div className="mt-1 text-xl font-bold text-slate-950">
                  {formatMoney(strategy.total_paid)}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500">Переплата</div>
                <div className="mt-1 text-xl font-bold text-slate-950">
                  {formatMoney(strategy.total_interest_paid)}
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {strategy?.debts && strategy.debts.length > 0 ? (
        <Card>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">
              Закрытие по каждому долгу
            </h3>
            <p className="text-sm text-slate-500">
              Когда закроется каждый долг в выбранной стратегии.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Долг
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Начальный остаток
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Месяц закрытия
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Дата закрытия
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Всего выплачено
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Проценты
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {strategy.debts.map((debt) => (
                  <tr key={debt.debt_id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {debt.debt_name}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-700">
                      {formatMoney(debt.initial_balance)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-700">
                      {debt.payoff_month ?? "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-700">
                      {formatDate(debt.payoff_date)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-slate-950">
                      {formatMoney(debt.total_paid)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-slate-950">
                      {formatMoney(debt.total_interest_paid)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
