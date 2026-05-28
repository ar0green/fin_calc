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
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useUpdateExpense,
} from "@/features/expenses/expenses.queries";
import type {
  Expense,
  ExpenseType,
  RecurrenceType,
} from "@/features/expenses/expenses.types";
import { formatDate, formatMoney } from "@/lib/format";

const expenseSchema = z.object({
  amount: z.coerce.number().positive("Сумма должна быть больше 0"),
  date: z.string().min(1, "Укажи дату"),
  category: z.string().min(1, "Укажи категорию"),
  type: z.enum(["mandatory", "variable"]),
  recurrence_type: z.enum(["none", "monthly"]),
  comment: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const DEFAULT_CATEGORY = "Food";

function getTodayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultFormValues(): ExpenseFormValues {
  return {
    amount: 0,
    date: getTodayInputValue(),
    category: DEFAULT_CATEGORY,
    type: "variable",
    recurrence_type: "none",
    comment: "",
  };
}

function expenseTypeLabel(type: ExpenseType): string {
  if (type === "mandatory") {
    return "Обязательный";
  }

  return "Переменный";
}

function recurrenceTypeLabel(type: RecurrenceType): string {
  if (type === "monthly") {
    return "Ежемесячно";
  }

  return "Нет";
}

function mapExpenseToFormValues(expense: Expense): ExpenseFormValues {
  return {
    amount: Number(expense.amount),
    date: expense.date,
    category: expense.category,
    type: expense.type,
    recurrence_type: expense.recurrence_type,
    comment: expense.comment ?? "",
  };
}

export function ExpensesPage() {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const expensesQuery = useExpenses({
    limit: 100,
    offset: 0,
  });

  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: getDefaultFormValues(),
  });

  const EXPENSE_TYPE_OPTIONS = [
    {
      label: "Обязательный",
      value: "mandatory",
    },
    {
      label: "Переменный",
      value: "variable",
    },
  ];

  const RECURRENCE_TYPE_OPTIONS = [
    {
      label: "Нет",
      value: "none",
    },
    {
      label: "Ежемесячно",
      value: "monthly",
    },
  ];

  const isEditMode = Boolean(editingExpense);
  const isSubmitting =
    createExpenseMutation.isPending || updateExpenseMutation.isPending;

  const resetToCreateMode = () => {
    setEditingExpense(null);
    reset(getDefaultFormValues());
  };

  const startEdit = (expense: Expense) => {
    setEditingExpense(expense);
    reset(mapExpenseToFormValues(expense));
  };

  const onSubmit = (values: ExpenseFormValues) => {
    const payload = {
      amount: values.amount,
      date: values.date,
      category: values.category.trim(),
      type: values.type,
      recurrence_type: values.recurrence_type,
      comment: values.comment?.trim() ? values.comment.trim() : null,
    };

    if (editingExpense) {
      updateExpenseMutation.mutate(
        {
          expenseId: editingExpense.id,
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

    createExpenseMutation.mutate(payload, {
      onSuccess: () => {
        reset(getDefaultFormValues());
      },
    });
  };

  if (expensesQuery.isLoading) {
    return (
      <PageState
        title="Загружаем расходы"
        description="Получаем список расходов из backend..."
      />
    );
  }

  if (expensesQuery.isError) {
    return (
      <PageState
        title="Не удалось загрузить расходы"
        description="Проверь backend и авторизацию."
      />
    );
  }

  const expenses = expensesQuery.data ?? [];
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Расходы</h2>
          <p className="text-slate-500">
            Добавляй, редактируй и удаляй обязательные и переменные расходы.
          </p>
        </div>

        <div className="rounded-xl bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
          Всего в списке:{" "}
          <span className="font-semibold text-slate-950">
            {formatMoney(totalExpenses)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                {isEditMode ? "Редактирование расхода" : "Новый расход"}
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

          {isEditMode && editingExpense ? (
            <div className="mb-4 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
              Редактируется:{" "}
              <span className="font-medium text-slate-950">
                {editingExpense.category} · {formatMoney(editingExpense.amount)}
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
              placeholder="Rent, Food, Transport..."
              error={errors.category?.message}
              {...register("category")}
            />

            <Select
              label="Тип расхода"
              options={EXPENSE_TYPE_OPTIONS}
              error={errors.type?.message}
              {...register("type")}
            />

            <Select
              label="Повторяемость"
              options={RECURRENCE_TYPE_OPTIONS}
              error={errors.recurrence_type?.message}
              {...register("recurrence_type")}
            />

            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Ежемесячные расходы учитываются в расчётах каждого месяца, начиная с месяца даты расхода.
              Физические копии расходов в базе не создаются.
            </div>

            <Input
              label="Комментарий"
              placeholder="Опционально"
              error={errors.comment?.message}
              {...register("comment")}
            />

            {createExpenseMutation.isError ? (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                Не удалось создать расход
              </div>
            ) : null}

            {updateExpenseMutation.isError ? (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                Не удалось обновить расход
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
                    {updateExpenseMutation.isPending
                      ? "Сохраняем..."
                      : "Сохранить"}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    {createExpenseMutation.isPending
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
                    if (editingExpense) {
                      reset(mapExpenseToFormValues(editingExpense));
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
                Список расходов
              </h3>
              <p className="text-sm text-slate-500">
                Последние записи, отсортированные по дате.
              </p>
            </div>

            <div className="rounded-xl bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {expenses.length} записей
            </div>
          </div>

          {expenses.length === 0 ? (
            <EmptyState
              title="Расходов пока нет"
              description="Добавь первую запись, чтобы увидеть её в Dashboard."
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
                      Категория
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Тип
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Повтор
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
                  {expenses.map((expense) => {
                    const isCurrentlyEditing =
                      editingExpense?.id === expense.id;

                    return (
                      <tr
                        key={expense.id}
                        className={
                          isCurrentlyEditing ? "bg-slate-50" : undefined
                        }
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                          {formatDate(expense.date)}
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-slate-900">
                            {expense.category}
                          </div>
                          {expense.comment ? (
                            <div className="text-xs text-slate-500">
                              {expense.comment}
                            </div>
                          ) : null}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                          {expenseTypeLabel(expense.type)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                          {recurrenceTypeLabel(expense.recurrence_type)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-slate-950">
                          {formatMoney(expense.amount)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              className="h-9 px-3"
                              disabled={isSubmitting}
                              onClick={() => startEdit(expense)}
                              title="Редактировать"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="secondary"
                              className="h-9 px-3"
                              disabled={deleteExpenseMutation.isPending}
                              onClick={() => {
                                const confirmed = window.confirm(
                                  "Удалить этот расход?",
                                );

                                if (confirmed) {
                                  deleteExpenseMutation.mutate(expense.id, {
                                    onSuccess: () => {
                                      if (editingExpense?.id === expense.id) {
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

          {deleteExpenseMutation.isError ? (
            <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              Не удалось удалить расход
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
