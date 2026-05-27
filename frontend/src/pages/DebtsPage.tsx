import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageState } from "@/components/ui/PageState";
import {
  useCreateDebt,
  useDebts,
  useDeleteDebt,
  useUpdateDebt,
} from "@/features/debts/debts.queries";
import type { Debt } from "@/features/debts/debts.types";
import { formatMoney, formatPercent } from "@/lib/format";

const DEBT_TYPE_OPTIONS = [
  {
    label: "Кредит",
    value: "loan",
  },
  {
    label: "Кредитная карта",
    value: "credit_card",
  },
  {
    label: "Личный займ",
    value: "personal_loan",
  },
  {
    label: "Ипотека",
    value: "mortgage",
  },
  {
    label: "Автокредит",
    value: "car_loan",
  },
];

const debtSchema = z.object({
  name: z.string().min(1, "Укажи название долга"),
  debt_type: z.string().min(1, "Укажи тип долга"),
  principal_balance: z.coerce.number().positive("Остаток должен быть больше 0"),
  annual_interest_rate: z.coerce
    .number()
    .min(0, "Ставка не может быть отрицательной")
    .max(1000, "Слишком большая ставка"),
  minimum_monthly_payment: z.coerce
    .number()
    .positive("Минимальный платёж должен быть больше 0"),
  due_day: z.coerce
    .number()
    .int("День платежа должен быть целым числом")
    .min(1, "Минимум 1")
    .max(31, "Максимум 31"),
  early_repayment_allowed: z.boolean(),
  payoff_priority: z.coerce
    .number()
    .int("Приоритет должен быть целым числом")
    .min(1, "Минимум 1")
    .max(1000, "Максимум 1000"),
  is_active: z.boolean(),
  comment: z.string().optional(),
});

type DebtFormValues = z.infer<typeof debtSchema>;

function getDefaultFormValues(): DebtFormValues {
  return {
    name: "",
    debt_type: "loan",
    principal_balance: 0,
    annual_interest_rate: 0,
    minimum_monthly_payment: 0,
    due_day: 15,
    early_repayment_allowed: true,
    payoff_priority: 100,
    is_active: true,
    comment: "",
  };
}

function mapDebtToFormValues(debt: Debt): DebtFormValues {
  return {
    name: debt.name,
    debt_type: debt.debt_type,
    principal_balance: Number(debt.principal_balance),
    annual_interest_rate: Number(debt.annual_interest_rate),
    minimum_monthly_payment: Number(debt.minimum_monthly_payment),
    due_day: debt.due_day,
    early_repayment_allowed: debt.early_repayment_allowed,
    payoff_priority: debt.payoff_priority,
    is_active: debt.is_active,
    comment: debt.comment ?? "",
  };
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

export function DebtsPage() {
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const debtsQuery = useDebts({
    limit: 100,
    offset: 0,
  });

  const createDebtMutation = useCreateDebt();
  const updateDebtMutation = useUpdateDebt();
  const deleteDebtMutation = useDeleteDebt();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: getDefaultFormValues(),
  });

  const isEditMode = Boolean(editingDebt);
  const isSubmitting =
    createDebtMutation.isPending || updateDebtMutation.isPending;

  const resetToCreateMode = () => {
    setEditingDebt(null);
    reset(getDefaultFormValues());
  };

  const startEdit = (debt: Debt) => {
    setEditingDebt(debt);
    reset(mapDebtToFormValues(debt));
  };

  const onSubmit = (values: DebtFormValues) => {
    const payload = {
      name: values.name.trim(),
      debt_type: values.debt_type.trim(),
      principal_balance: values.principal_balance,
      annual_interest_rate: values.annual_interest_rate,
      minimum_monthly_payment: values.minimum_monthly_payment,
      due_day: values.due_day,
      early_repayment_allowed: values.early_repayment_allowed,
      payoff_priority: values.payoff_priority,
      is_active: values.is_active,
      comment: values.comment?.trim() ? values.comment.trim() : null,
    };

    if (editingDebt) {
      updateDebtMutation.mutate(
        {
          debtId: editingDebt.id,
          payload,
        },
        {
          onSuccess: () => {
            resetToCreateMode();
          },
        },
      );

      return;
    }

    createDebtMutation.mutate(payload, {
      onSuccess: () => {
        reset(getDefaultFormValues());
      },
    });
  };

  if (debtsQuery.isLoading) {
    return (
      <PageState
        title="Загружаем долги"
        description="Получаем список долгов из backend..."
      />
    );
  }

  if (debtsQuery.isError) {
    return (
      <PageState
        title="Не удалось загрузить долги"
        description="Проверь backend и авторизацию."
      />
    );
  }

  const debts = debtsQuery.data ?? [];
  const activeDebts = debts.filter((debt) => debt.is_active);

  const totalActiveBalance = activeDebts.reduce(
    (sum, debt) => sum + Number(debt.principal_balance),
    0,
  );

  const totalMinimumPayments = activeDebts.reduce(
    (sum, debt) => sum + Number(debt.minimum_monthly_payment),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Долги</h2>
          <p className="text-slate-500">
            Управляй кредитами, займами и кредитными картами.
          </p>
        </div>

        <div className="rounded-xl bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
          Активный долг:{" "}
          <span className="font-semibold text-slate-950">
            {formatMoney(totalActiveBalance)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-slate-500">Активные долги</div>
          <div className="mt-2 text-2xl font-bold text-slate-950">
            {activeDebts.length}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Общий остаток</div>
          <div className="mt-2 text-2xl font-bold text-slate-950">
            {formatMoney(totalActiveBalance)}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Мин. платежи в месяц</div>
          <div className="mt-2 text-2xl font-bold text-slate-950">
            {formatMoney(totalMinimumPayments)}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                {isEditMode ? "Редактирование долга" : "Новый долг"}
              </h3>
              <p className="text-sm text-slate-500">
                {isEditMode
                  ? "Измени поля и сохрани запись."
                  : "Долг попадёт в расчёты стратегий и Dashboard."}
              </p>
            </div>

            {isEditMode ? (
              <Button
                variant="secondary"
                className="h-9 px-3"
                onClick={resetToCreateMode}
                disabled={isSubmitting}
                title="Отменить редактирование"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          {isEditMode && editingDebt ? (
            <div className="mb-4 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
              Редактируется:{" "}
              <span className="font-medium text-slate-950">
                {editingDebt.name} ·{" "}
                {formatMoney(editingDebt.principal_balance)}
              </span>
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Название"
              placeholder="Credit Card, Consumer Loan..."
              error={errors.name?.message}
              {...register("name")}
            />

            <Select
              label="Тип долга"
              options={DEBT_TYPE_OPTIONS}
              error={errors.debt_type?.message}
              {...register("debt_type")}
            />

            <Input
              label="Текущий остаток"
              type="number"
              min="0"
              step="0.01"
              error={errors.principal_balance?.message}
              {...register("principal_balance")}
            />

            <Input
              label="Годовая ставка, %"
              type="number"
              min="0"
              step="0.01"
              error={errors.annual_interest_rate?.message}
              {...register("annual_interest_rate")}
            />

            <Input
              label="Минимальный платёж"
              type="number"
              min="0"
              step="0.01"
              error={errors.minimum_monthly_payment?.message}
              {...register("minimum_monthly_payment")}
            />

            <Input
              label="День платежа"
              type="number"
              min="1"
              max="31"
              step="1"
              error={errors.due_day?.message}
              {...register("due_day")}
            />

            <Input
              label="Приоритет погашения"
              type="number"
              min="1"
              max="1000"
              step="1"
              error={errors.payoff_priority?.message}
              {...register("payoff_priority")}
            />

            <Checkbox
              label="Досрочное погашение разрешено"
              description="Этот флаг позже будет учитываться в стратегиях погашения."
              {...register("early_repayment_allowed")}
            />

            <Checkbox
              label="Активный долг"
              description="Только активные долги участвуют в расчётах и прогнозах."
              {...register("is_active")}
            />

            <Input
              label="Комментарий"
              placeholder="Опционально"
              error={errors.comment?.message}
              {...register("comment")}
            />

            {createDebtMutation.isError ? (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                Не удалось создать долг
              </div>
            ) : null}

            {updateDebtMutation.isError ? (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                Не удалось обновить долг
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={isSubmitting || (isEditMode && !isDirty)}
              >
                {isEditMode ? (
                  <>
                    <Save className="h-4 w-4" />
                    {updateDebtMutation.isPending
                      ? "Сохраняем..."
                      : "Сохранить"}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    {createDebtMutation.isPending ? "Добавляем..." : "Добавить"}
                  </>
                )}
              </Button>

              {isEditMode ? (
                <Button
                  variant="secondary"
                  className="gap-2"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (editingDebt) {
                      reset(mapDebtToFormValues(editingDebt));
                    }
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Список долгов
              </h3>
              <p className="text-sm text-slate-500">
                Активные и неактивные обязательства.
              </p>
            </div>

            <div className="rounded-xl bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {debts.length} записей
            </div>
          </div>

          {debts.length === 0 ? (
            <EmptyState
              title="Долгов пока нет"
              description="Добавь первый долг, чтобы увидеть стратегии погашения."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Долг
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Тип
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Остаток
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ставка
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Мин. платёж
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      День
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Статус
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Действия
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {debts.map((debt) => {
                    const isCurrentlyEditing = editingDebt?.id === debt.id;

                    return (
                      <tr
                        key={debt.id}
                        className={
                          isCurrentlyEditing ? "bg-slate-50" : undefined
                        }
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-slate-900">
                            {debt.name}
                          </div>
                          {debt.comment ? (
                            <div className="text-xs text-slate-500">
                              {debt.comment}
                            </div>
                          ) : null}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                          {debtTypeLabel(debt.debt_type)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-slate-950">
                          {formatMoney(debt.principal_balance)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-700">
                          {formatPercent(debt.annual_interest_rate)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-700">
                          {formatMoney(debt.minimum_monthly_payment)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-slate-700">
                          {debt.due_day}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <span
                            className={
                              debt.is_active
                                ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                                : "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                            }
                          >
                            {debt.is_active ? "Активен" : "Неактивен"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              className="h-9 px-3"
                              disabled={isSubmitting}
                              onClick={() => startEdit(debt)}
                              title="Редактировать"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="secondary"
                              className="h-9 px-3"
                              disabled={deleteDebtMutation.isPending}
                              onClick={() => {
                                const confirmed =
                                  window.confirm("Удалить этот долг?");

                                if (confirmed) {
                                  deleteDebtMutation.mutate(debt.id, {
                                    onSuccess: () => {
                                      if (editingDebt?.id === debt.id) {
                                        resetToCreateMode();
                                      }
                                    },
                                  });
                                }
                              }}
                              title="Удалить"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {deleteDebtMutation.isError ? (
            <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              Не удалось удалить долг
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
