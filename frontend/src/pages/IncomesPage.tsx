import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { DateInput } from "@/components/ui/DateInput";
import { Select } from "@/components/ui/Select";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageState } from "@/components/ui/PageState";
import {
  useCreateIncome,
  useDeleteIncome,
  useIncomes,
  useUpdateIncome,
} from "@/features/incomes/incomes.queries";
import type { Income, IncomeType } from "@/features/incomes/incomes.types";
import { formatDate, formatMoney } from "@/lib/format";

const incomeSchema = z.object({
  amount: z.coerce.number().positive("Сумма должна быть больше 0"),
  date: z.string().min(1, "Укажи дату"),
  category: z.string().min(1, "Укажи категорию"),
  type: z.enum(["regular", "irregular"]),
  comment: z.string().optional(),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

const DEFAULT_CATEGORY = "Salary";

function getTodayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultFormValues(): IncomeFormValues {
  return {
    amount: 0,
    date: getTodayInputValue(),
    category: DEFAULT_CATEGORY,
    type: "regular",
    comment: "",
  };
}

function incomeTypeLabel(type: IncomeType): string {
  if (type === "regular") {
    return "Регулярный";
  }

  return "Нерегулярный";
}

function mapIncomeToFormValues(income: Income): IncomeFormValues {
  return {
    amount: Number(income.amount),
    date: income.date,
    category: income.category,
    type: income.type,
    comment: income.comment ?? "",
  };
}

export function IncomesPage() {
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const incomesQuery = useIncomes({
    limit: 100,
    offset: 0,
  });

  const createIncomeMutation = useCreateIncome();
  const updateIncomeMutation = useUpdateIncome();
  const deleteIncomeMutation = useDeleteIncome();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: getDefaultFormValues(),
  });

  const INCOME_TYPE_OPTIONS = [
    {
      label: "Регулярный",
      value: "regular",
    },
    {
      label: "Нерегулярный",
      value: "irregular",
    },
  ];

  const isEditMode = Boolean(editingIncome);
  const isSubmitting =
    createIncomeMutation.isPending || updateIncomeMutation.isPending;

  const resetToCreateMode = () => {
    setEditingIncome(null);
    reset(getDefaultFormValues());
  };

  const startEdit = (income: Income) => {
    setEditingIncome(income);
    reset(mapIncomeToFormValues(income));
  };

  const onSubmit = (values: IncomeFormValues) => {
    const payload = {
      amount: values.amount,
      date: values.date,
      category: values.category.trim(),
      type: values.type,
      comment: values.comment?.trim() ? values.comment.trim() : null,
    };

    if (editingIncome) {
      updateIncomeMutation.mutate(
        {
          incomeId: editingIncome.id,
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

    createIncomeMutation.mutate(payload, {
      onSuccess: () => {
        reset(getDefaultFormValues());
      },
    });
  };

  if (incomesQuery.isLoading) {
    return (
      <PageState
        title="Загружаем доходы"
        description="Получаем список доходов из backend..."
      />
    );
  }

  if (incomesQuery.isError) {
    return (
      <PageState
        title="Не удалось загрузить доходы"
        description="Проверь backend и авторизацию."
      />
    );
  }

  const incomes = incomesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Доходы</h2>
          <p className="text-slate-500">
            Добавляй, редактируй и удаляй регулярные и нерегулярные поступления.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                {isEditMode ? "Редактирование дохода" : "Новый доход"}
              </h3>
              <p className="text-sm text-slate-500">
                {isEditMode
                  ? "Измени поля и сохрани запись."
                  : "Запись попадёт в расчёты Dashboard и аналитики."}
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

          {isEditMode && editingIncome ? (
            <div className="mb-4 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
              Редактируется:{" "}
              <span className="font-medium text-slate-950">
                {editingIncome.category} · {formatMoney(editingIncome.amount)}
              </span>
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Сумма"
              type="number"
              min="0"
              step="0.01"
              error={errors.amount?.message}
              {...register("amount")}
            />

            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DateInput
                  label="Дата"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.date?.message}
                />
              )}
            />

            <Input
              label="Категория"
              placeholder="Salary, Bonus, Freelance..."
              error={errors.category?.message}
              {...register("category")}
            />

            <Select
              label="Тип"
              options={INCOME_TYPE_OPTIONS}
              error={errors.type?.message}
              {...register("type")}
            />
            
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Регулярные доходы учитываются в расчётах каждого месяца, начиная с месяца даты дохода.
              Нерегулярные доходы учитываются только в месяце фактической даты.
            </div>

            <Input
              label="Комментарий"
              placeholder="Опционально"
              error={errors.comment?.message}
              {...register("comment")}
            />

            {createIncomeMutation.isError ? (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                Не удалось создать доход
              </div>
            ) : null}

            {updateIncomeMutation.isError ? (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                Не удалось обновить доход
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
                    {updateIncomeMutation.isPending
                      ? "Сохраняем..."
                      : "Сохранить"}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    {createIncomeMutation.isPending
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
                    if (editingIncome) {
                      reset(mapIncomeToFormValues(editingIncome));
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
                Список доходов
              </h3>
              <p className="text-sm text-slate-500">
                Последние записи, отсортированные по дате.
              </p>
            </div>

            <div className="rounded-xl bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {incomes.length} записей
            </div>
          </div>

          {incomes.length === 0 ? (
            <EmptyState
              title="Доходов пока нет"
              description="Добавь первую запись, чтобы увидеть её в Dashboard."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Дата
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Категория
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Тип
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Сумма
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Действия
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {incomes.map((income) => {
                    const isCurrentlyEditing = editingIncome?.id === income.id;

                    return (
                      <tr
                        key={income.id}
                        className={
                          isCurrentlyEditing ? "bg-slate-50" : undefined
                        }
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                          {formatDate(income.date)}
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-slate-900">
                            {income.category}
                          </div>
                          {income.comment ? (
                            <div className="text-xs text-slate-500">
                              {income.comment}
                            </div>
                          ) : null}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                          {incomeTypeLabel(income.type)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-slate-950">
                          {formatMoney(income.amount)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              className="h-9 px-3"
                              disabled={isSubmitting}
                              onClick={() => startEdit(income)}
                              title="Редактировать"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="secondary"
                              className="h-9 px-3"
                              disabled={deleteIncomeMutation.isPending}
                              onClick={() => {
                                const confirmed = window.confirm(
                                  "Удалить этот доход?",
                                );

                                if (confirmed) {
                                  deleteIncomeMutation.mutate(income.id, {
                                    onSuccess: () => {
                                      if (editingIncome?.id === income.id) {
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

          {deleteIncomeMutation.isError ? (
            <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              Не удалось удалить доход
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
