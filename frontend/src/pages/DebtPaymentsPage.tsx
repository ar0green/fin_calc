import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DateInput } from "@/components/ui/DateInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageState } from "@/components/ui/PageState";
import { Select } from "@/components/ui/Select";
import {
  useCreateDebtPayment,
  useDebtPayments,
  useDeleteDebtPayment,
  useUpdateDebtPayment
} from "@/features/debt-payments/debt-payments.queries";
import type { DebtPayment } from "@/features/debt-payments/debt-payments.types";
import { useDebts } from "@/features/debts/debts.queries";
import type { Debt } from "@/features/debts/debts.types";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";

const debtPaymentSchema = z
  .object({
    debt_id: z.coerce.number().int().positive("Выбери долг"),
    payment_date: z.string().min(1, "Укажи дату платежа"),
    amount: z.coerce.number().positive("Сумма платежа должна быть больше 0"),
    principal_amount: z.coerce
      .number()
      .min(0, "Сумма в тело долга не может быть отрицательной"),
    interest_amount: z.coerce
      .number()
      .min(0, "Сумма процентов не может быть отрицательной"),
    comment: z.string().optional()
  })
  .refine(
    (values) => {
      const total = Number(
        (values.principal_amount + values.interest_amount).toFixed(2)
      );

      return total === Number(values.amount.toFixed(2));
    },
    {
      message: "Тело долга + проценты должны быть равны сумме платежа",
      path: ["amount"]
    }
  );

type DebtPaymentFormValues = z.infer<typeof debtPaymentSchema>;

function getTodayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultFormValues(defaultDebtId: number | null): DebtPaymentFormValues {
  return {
    debt_id: defaultDebtId ?? 0,
    payment_date: getTodayInputValue(),
    amount: 0,
    principal_amount: 0,
    interest_amount: 0,
    comment: ""
  };
}

function mapPaymentToFormValues(payment: DebtPayment): DebtPaymentFormValues {
  return {
    debt_id: payment.debt_id,
    payment_date: payment.payment_date,
    amount: Number(payment.amount),
    principal_amount: Number(payment.principal_amount),
    interest_amount: Number(payment.interest_amount),
    comment: payment.comment ?? ""
  };
}

function debtTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    loan: "Кредит",
    credit_card: "Кредитная карта",
    personal_loan: "Личный займ",
    mortgage: "Ипотека",
    car_loan: "Автокредит"
  };

  return labels[type] ?? type;
}

function getDebtById(debts: Debt[], debtId: number): Debt | undefined {
  return debts.find((debt) => debt.id === debtId);
}

export function DebtPaymentsPage() {
  const [editingPayment, setEditingPayment] = useState<DebtPayment | null>(null);

  const debtsQuery = useDebts({
    limit: 100,
    offset: 0
  });

  const debtPaymentsQuery = useDebtPayments({
    limit: 100,
    offset: 0
  });

  const createDebtPaymentMutation = useCreateDebtPayment();
  const updateDebtPaymentMutation = useUpdateDebtPayment();
  const deleteDebtPaymentMutation = useDeleteDebtPayment();

  const debts = debtsQuery.data ?? [];
  const activeDebts = debts.filter((debt) => debt.is_active);
  const defaultDebtId = activeDebts[0]?.id ?? debts[0]?.id ?? null;

  const debtOptions = useMemo(
    () =>
      debts.map((debt) => ({
        label: `${debt.name} · ${formatMoney(debt.principal_balance)}`,
        value: String(debt.id)
      })),
    [debts]
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<DebtPaymentFormValues>({
    resolver: zodResolver(debtPaymentSchema),
    defaultValues: getDefaultFormValues(defaultDebtId)
  });

  const watchedDebtId = watch("debt_id");
  const watchedAmount = watch("amount");
  const watchedPrincipalAmount = watch("principal_amount");

  const selectedDebt = getDebtById(debts, Number(watchedDebtId));

  const isEditMode = Boolean(editingPayment);
  const isSubmitting =
    createDebtPaymentMutation.isPending || updateDebtPaymentMutation.isPending;

  const resetToCreateMode = () => {
    setEditingPayment(null);
    reset(getDefaultFormValues(defaultDebtId));
  };

  const startEdit = (payment: DebtPayment) => {
    setEditingPayment(payment);
    reset(mapPaymentToFormValues(payment));
  };

  const fillInterestFromAmount = () => {
    const amount = Number(watchedAmount) || 0;
    const principal = Number(watchedPrincipalAmount) || 0;
    const interest = Math.max(amount - principal, 0);

    setValue("interest_amount", Number(interest.toFixed(2)), {
      shouldDirty: true,
      shouldValidate: true
    });
  };

  const onSubmit = (values: DebtPaymentFormValues) => {
    const payload = {
      debt_id: values.debt_id,
      payment_date: values.payment_date,
      amount: values.amount,
      principal_amount: values.principal_amount,
      interest_amount: values.interest_amount,
      comment: values.comment?.trim() ? values.comment.trim() : null
    };

    if (editingPayment) {
      updateDebtPaymentMutation.mutate(
        {
          paymentId: editingPayment.id,
          payload
        },
        {
          onSuccess: () => {
            resetToCreateMode();
          }
        }
      );

      return;
    }

    createDebtPaymentMutation.mutate(payload, {
      onSuccess: () => {
        reset(getDefaultFormValues(defaultDebtId));
      }
    });
  };

  if (debtsQuery.isLoading || debtPaymentsQuery.isLoading) {
    return (
      <PageState
        title="Загружаем платежи"
        description="Получаем долги и историю платежей из backend..."
      />
    );
  }

  if (debtsQuery.isError || debtPaymentsQuery.isError) {
    return (
      <PageState
        title="Не удалось загрузить платежи"
        description="Проверь backend, авторизацию и API платежей."
      />
    );
  }

  const payments = debtPaymentsQuery.data ?? [];

  const totalPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const totalPrincipalPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.principal_amount),
    0
  );

  const totalInterestPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.interest_amount),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Платежи по долгам</h2>
          <p className="text-slate-500">
            Фиксируй реальные платежи и обновляй остатки долгов.
          </p>
        </div>

        <div className="rounded-xl bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
          Всего платежей:{" "}
          <span className="font-semibold text-slate-950">
            {formatMoney(totalPaid)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-slate-500">Всего выплачено</div>
          <div className="mt-2 text-2xl font-bold text-slate-950">
            {formatMoney(totalPaid)}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">В тело долга</div>
          <div className="mt-2 text-2xl font-bold text-slate-950">
            {formatMoney(totalPrincipalPaid)}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Проценты</div>
          <div className="mt-2 text-2xl font-bold text-slate-950">
            {formatMoney(totalInterestPaid)}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                {isEditMode ? "Редактирование платежа" : "Новый платёж"}
              </h3>
              <p className="text-sm text-slate-500">
                {isEditMode
                  ? "Измени платёж и сохрани запись."
                  : "Principal уменьшит текущий остаток выбранного долга."}
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

          {selectedDebt ? (
            <div className="mb-4 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
              Выбран долг:{" "}
              <span className="font-medium text-slate-950">
                {selectedDebt.name} · остаток {formatMoney(selectedDebt.principal_balance)}
              </span>
            </div>
          ) : null}

          {debts.length === 0 ? (
            <EmptyState
              title="Нет долгов"
              description="Сначала добавь долг на странице Долги."
            />
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <Select
                label="Долг"
                options={debtOptions}
                error={errors.debt_id?.message}
                {...register("debt_id")}
              />

              <Controller
                name="payment_date"
                control={control}
                render={({ field }) => (
                  <DateInput
                    label="Дата платежа"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.payment_date?.message}
                  />
                )}
              />

              <Input
                label="Сумма платежа"
                type="number"
                min="0"
                step="0.01"
                error={errors.amount?.message}
                {...register("amount")}
              />

              <Input
                label="В тело долга"
                type="number"
                min="0"
                step="0.01"
                error={errors.principal_amount?.message}
                {...register("principal_amount")}
              />

              <div>
                <Input
                  label="Проценты"
                  type="number"
                  min="0"
                  step="0.01"
                  error={errors.interest_amount?.message}
                  {...register("interest_amount")}
                />

                <Button
                  variant="secondary"
                  className="mt-2 w-full"
                  onClick={fillInterestFromAmount}
                >
                  Рассчитать проценты как остаток суммы
                </Button>
              </div>

              <Input
                label="Комментарий"
                placeholder="Опционально"
                error={errors.comment?.message}
                {...register("comment")}
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 gap-2"
                  disabled={isSubmitting || (isEditMode && !isDirty)}
                >
                  {isEditMode ? (
                    <>
                      <Save className="h-4 w-4" />
                      {updateDebtPaymentMutation.isPending
                        ? "Сохраняем..."
                        : "Сохранить"}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {createDebtPaymentMutation.isPending
                        ? "Добавляем..."
                        : "Добавить"}
                    </>
                  )}
                </Button>

                {isEditMode ? (
                  <Button
                    variant="secondary"
                    className="gap-2"
                    disabled={isSubmitting}
                    onClick={() => {
                      if (editingPayment) {
                        reset(mapPaymentToFormValues(editingPayment));
                      }
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </form>
          )}
        </Card>

        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                История платежей
              </h3>
              <p className="text-sm text-slate-500">
                Последние платежи по всем долгам.
              </p>
            </div>

            <div className="rounded-xl bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {payments.length} записей
            </div>
          </div>

          {payments.length === 0 ? (
            <EmptyState
              title="Платежей пока нет"
              description="Добавь первый платёж, чтобы начать вести историю."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Дата
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Долг
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Сумма
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Тело
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Проценты
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Действия
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {payments.map((payment) => {
                    const debt = getDebtById(debts, payment.debt_id);
                    const isCurrentlyEditing = editingPayment?.id === payment.id;

                    return (
                      <tr
                        key={payment.id}
                        className={isCurrentlyEditing ? "bg-slate-50" : undefined}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                          {formatDate(payment.payment_date)}
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-slate-900">
                            {debt?.name ?? `Debt #${payment.debt_id}`}
                          </div>

                          {debt ? (
                            <div className="text-xs text-slate-500">
                              {debtTypeLabel(debt.debt_type)} ·{" "}
                              {formatPercent(debt.annual_interest_rate)}
                            </div>
                          ) : null}

                          {payment.comment ? (
                            <div className="text-xs text-slate-500">
                              {payment.comment}
                            </div>
                          ) : null}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-slate-950">
                          {formatMoney(payment.amount)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-700">
                          {formatMoney(payment.principal_amount)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-700">
                          {formatMoney(payment.interest_amount)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              className="h-9 px-3"
                              disabled={isSubmitting}
                              onClick={() => startEdit(payment)}
                              title="Редактировать"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="secondary"
                              className="h-9 px-3"
                              disabled={deleteDebtPaymentMutation.isPending}
                              onClick={() => {
                                const confirmed = window.confirm(
                                  "Удалить этот платёж? Остаток долга будет восстановлен."
                                );

                                if (confirmed) {
                                  deleteDebtPaymentMutation.mutate(payment.id, {
                                    onSuccess: () => {
                                      if (editingPayment?.id === payment.id) {
                                        resetToCreateMode();
                                      }
                                    }
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
        </Card>
      </div>
    </div>
  );
}