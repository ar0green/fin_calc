import { zodResolver } from "@hookform/resolvers/zod";
import {
  BarChart3,
  Edit2,
  FolderTree,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Wallet,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { DateInput } from "@/components/ui/DateInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageState } from "@/components/ui/PageState";
import { Select } from "@/components/ui/Select";
import {
  useCategoryBudgets,
  useCreateCategoryBudget,
  useDeleteCategoryBudget,
  useMonthlyBudgetSummary,
  useUpdateCategoryBudget
} from "@/features/budgets/budgets.queries";
import type { CategoryBudget } from "@/features/budgets/budgets.types";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory
} from "@/features/categories/categories.queries";
import type { Category, CategoryType } from "@/features/categories/categories.types";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { buildMonthOptions, getCurrentMonthValue } from "@/lib/month";

const CATEGORY_TYPE_OPTIONS = [
  { label: "Доход", value: "income" },
  { label: "Расход", value: "expense" },
  { label: "Доход и расход", value: "both" }
];

const categorySchema = z.object({
  name: z.string().min(1, "Укажи название категории").max(100),
  type: z.enum(["income", "expense", "both"]),
  is_active: z.boolean(),
  comment: z.string().optional()
});

const budgetSchema = z.object({
  category: z.string().min(1, "Выбери категорию"),
  monthly_limit: z.coerce.number().positive("Лимит должен быть больше 0"),
  start_month: z.string().min(1, "Укажи месяц старта"),
  is_active: z.boolean(),
  comment: z.string().optional()
});

type CategoryFormValues = z.infer<typeof categorySchema>;
type BudgetFormValues = z.infer<typeof budgetSchema>;

function getDefaultCategoryFormValues(): CategoryFormValues {
  return {
    name: "",
    type: "expense",
    is_active: true,
    comment: ""
  };
}

function getDefaultBudgetFormValues(defaultCategory: string): BudgetFormValues {
  return {
    category: defaultCategory,
    monthly_limit: 0,
    start_month: `${getCurrentMonthValue()}-01`,
    is_active: true,
    comment: ""
  };
}

function mapCategoryToFormValues(category: Category): CategoryFormValues {
  return {
    name: category.name,
    type: category.type,
    is_active: category.is_active,
    comment: category.comment ?? ""
  };
}

function mapBudgetToFormValues(budget: CategoryBudget): BudgetFormValues {
  return {
    category: budget.category,
    monthly_limit: Number(budget.monthly_limit),
    start_month: budget.start_month,
    is_active: budget.is_active,
    comment: budget.comment ?? ""
  };
}

function categoryTypeLabel(type: CategoryType): string {
  const labels: Record<CategoryType, string> = {
    income: "Доход",
    expense: "Расход",
    both: "Доход и расход"
  };

  return labels[type];
}

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
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

export function BudgetsPage() {
  const [month, setMonth] = useState(getCurrentMonthValue());
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingBudget, setEditingBudget] = useState<CategoryBudget | null>(null);

  const monthOptions = useMemo(
    () =>
      buildMonthOptions({
        monthsBack: 6,
        monthsForward: 18,
        includeDemoMonths: true
      }),
    []
  );

  const categoriesQuery = useCategories({
    limit: 100,
    offset: 0
  });

  const categoryBudgetsQuery = useCategoryBudgets({
    limit: 100,
    offset: 0
  });

  const budgetSummaryQuery = useMonthlyBudgetSummary(month);

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const createBudgetMutation = useCreateCategoryBudget();
  const updateBudgetMutation = useUpdateCategoryBudget();
  const deleteBudgetMutation = useDeleteCategoryBudget();

  const categories = categoriesQuery.data ?? [];
  const expenseCategories = categories.filter(
    (category) =>
      category.is_active && (category.type === "expense" || category.type === "both")
  );

  const categoryOptions = useMemo(() => {
    if (expenseCategories.length === 0) {
      return [{ label: "Нет категорий расходов", value: "" }];
    }

    return expenseCategories.map((category) => ({
      label: category.name,
      value: category.name
    }));
  }, [expenseCategories]);

  const defaultBudgetCategory = expenseCategories[0]?.name ?? "";

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: getDefaultCategoryFormValues()
  });

  const budgetForm = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: getDefaultBudgetFormValues(defaultBudgetCategory)
  });

  const isCategoryEditMode = Boolean(editingCategory);
  const isBudgetEditMode = Boolean(editingBudget);

  const isLoading =
    categoriesQuery.isLoading ||
    categoryBudgetsQuery.isLoading ||
    budgetSummaryQuery.isLoading;

  const isError =
    categoriesQuery.isError ||
    categoryBudgetsQuery.isError ||
    budgetSummaryQuery.isError;

  const resetCategoryForm = () => {
    setEditingCategory(null);
    categoryForm.reset(getDefaultCategoryFormValues());
  };

  const resetBudgetForm = () => {
    setEditingBudget(null);
    budgetForm.reset(getDefaultBudgetFormValues(defaultBudgetCategory));
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    categoryForm.reset(mapCategoryToFormValues(category));
  };

  const startEditBudget = (budget: CategoryBudget) => {
    setEditingBudget(budget);
    budgetForm.reset(mapBudgetToFormValues(budget));
  };

  const onCategorySubmit = (values: CategoryFormValues) => {
    const payload = {
      name: values.name.trim(),
      type: values.type,
      is_active: values.is_active,
      comment: values.comment?.trim() ? values.comment.trim() : null
    };

    if (editingCategory) {
      updateCategoryMutation.mutate(
        {
          categoryId: editingCategory.id,
          payload
        },
        {
          onSuccess: resetCategoryForm
        }
      );

      return;
    }

    createCategoryMutation.mutate(payload, {
      onSuccess: resetCategoryForm
    });
  };

  const onBudgetSubmit = (values: BudgetFormValues) => {
    const payload = {
      category: values.category,
      monthly_limit: values.monthly_limit,
      start_month: values.start_month,
      is_active: values.is_active,
      comment: values.comment?.trim() ? values.comment.trim() : null
    };

    if (editingBudget) {
      updateBudgetMutation.mutate(
        {
          budgetId: editingBudget.id,
          payload
        },
        {
          onSuccess: resetBudgetForm
        }
      );

      return;
    }

    createBudgetMutation.mutate(payload, {
      onSuccess: resetBudgetForm
    });
  };

  if (isLoading) {
    return (
      <PageState
        title="Загружаем бюджеты"
        description="Получаем категории, лимиты и месячную сводку из backend..."
      />
    );
  }

  if (isError) {
    return (
      <PageState
        title="Не удалось загрузить бюджеты"
        description="Проверь backend, авторизацию, миграции и budgets/categories API."
      />
    );
  }

  const budgets = categoryBudgetsQuery.data ?? [];
  const summary = budgetSummaryQuery.data;

  if (!summary) {
    return (
      <PageState
        title="Нет данных"
        description="Backend ответил, но summary бюджета отсутствует."
      />
    );
  }

  const categorySubmitting =
    createCategoryMutation.isPending || updateCategoryMutation.isPending;

  const budgetSubmitting =
    createBudgetMutation.isPending || updateBudgetMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Бюджеты</h2>
          <p className="text-slate-500">
            Управление категориями и лимитами расходов по месяцам.
          </p>
        </div>

        <div className="w-full md:w-72">
          <Select
            label="Месяц анализа"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            options={monthOptions}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Лимит месяца"
          value={formatMoney(summary.total_budget_limit)}
          description="Сумма активных бюджетов"
          icon={Wallet}
        />

        <MetricCard
          title="Факт расходов"
          value={formatMoney(summary.total_actual_amount)}
          description="Расходы по бюджетируемым категориям"
          icon={BarChart3}
        />

        <MetricCard
          title="Остаток бюджета"
          value={formatMoney(summary.total_remaining_amount)}
          description="Может быть отрицательным при превышении"
          icon={Wallet}
        />

        <MetricCard
          title="Использовано"
          value={formatPercent(summary.total_usage_percent)}
          description="Факт / лимит"
          icon={BarChart3}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                {isCategoryEditMode ? "Редактирование категории" : "Новая категория"}
              </h3>
              <p className="text-sm text-slate-500">
                Категории используются в доходах, расходах и бюджетах.
              </p>
            </div>

            {isCategoryEditMode ? (
              <Button
                variant="secondary"
                className="h-9 px-3"
                onClick={resetCategoryForm}
                disabled={categorySubmitting}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <form
            className="space-y-4"
            onSubmit={categoryForm.handleSubmit(onCategorySubmit)}
          >
            <Input
              label="Название"
              placeholder="Например: Food, Rent, Salary"
              error={categoryForm.formState.errors.name?.message}
              {...categoryForm.register("name")}
            />

            <Select
              label="Тип"
              options={CATEGORY_TYPE_OPTIONS}
              error={categoryForm.formState.errors.type?.message}
              {...categoryForm.register("type")}
            />

            <Checkbox
              label="Активная категория"
              description="Неактивные категории можно оставить для истории."
              {...categoryForm.register("is_active")}
            />

            <Input
              label="Комментарий"
              placeholder="Опционально"
              error={categoryForm.formState.errors.comment?.message}
              {...categoryForm.register("comment")}
            />

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={
                  categorySubmitting ||
                  (isCategoryEditMode && !categoryForm.formState.isDirty)
                }
              >
                {isCategoryEditMode ? (
                  <>
                    <Save className="h-4 w-4" />
                    {updateCategoryMutation.isPending ? "Сохраняем..." : "Сохранить"}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    {createCategoryMutation.isPending ? "Добавляем..." : "Добавить"}
                  </>
                )}
              </Button>

              {isCategoryEditMode ? (
                <Button
                  variant="secondary"
                  className="gap-2"
                  disabled={categorySubmitting}
                  onClick={() => {
                    if (editingCategory) {
                      categoryForm.reset(mapCategoryToFormValues(editingCategory));
                    }
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        <Card>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Категории
              </h3>
              <p className="text-sm text-slate-500">
                Справочник категорий для доходов, расходов и бюджетов.
              </p>
            </div>

            <div className="rounded-xl bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {categories.length} записей
            </div>
          </div>

          {categories.length === 0 ? (
            <EmptyState
              title="Категорий пока нет"
              description="Создай первую категорию, чтобы использовать её в бюджетах."
            />
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">
                        {category.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {categoryTypeLabel(category.type)}
                        {" · "}
                        {category.is_active ? "активна" : "неактивна"}
                      </div>

                      {category.comment ? (
                        <div className="mt-1 text-xs text-slate-500">
                          {category.comment}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="h-9 px-3"
                        onClick={() => startEditCategory(category)}
                        disabled={categorySubmitting}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="secondary"
                        className="h-9 px-3"
                        disabled={deleteCategoryMutation.isPending}
                        onClick={() => {
                          const confirmed = window.confirm(
                            "Удалить категорию? Существующие доходы и расходы со строкой этой категории не изменятся."
                          );

                          if (confirmed) {
                            deleteCategoryMutation.mutate(category.id, {
                              onSuccess: () => {
                                if (editingCategory?.id === category.id) {
                                  resetCategoryForm();
                                }
                              }
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                {isBudgetEditMode
                  ? "Редактирование бюджета"
                  : "Новый бюджет категории"}
              </h3>
              <p className="text-sm text-slate-500">
                Бюджет сравнивает лимит категории с фактическими расходами месяца.
              </p>
            </div>

            {isBudgetEditMode ? (
              <Button
                variant="secondary"
                className="h-9 px-3"
                onClick={resetBudgetForm}
                disabled={budgetSubmitting}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          {expenseCategories.length === 0 ? (
            <EmptyState
              title="Нет категорий расходов"
              description="Создай категорию типа Расход или Доход и расход."
            />
          ) : (
            <form
              className="space-y-4"
              onSubmit={budgetForm.handleSubmit(onBudgetSubmit)}
            >
              <Select
                label="Категория"
                options={categoryOptions}
                error={budgetForm.formState.errors.category?.message}
                {...budgetForm.register("category")}
              />

              <Input
                label="Месячный лимит"
                type="number"
                min="0"
                step="0.01"
                error={budgetForm.formState.errors.monthly_limit?.message}
                {...budgetForm.register("monthly_limit")}
              />

              <Controller
                name="start_month"
                control={budgetForm.control}
                render={({ field }) => (
                  <DateInput
                    label="Месяц старта"
                    value={field.value}
                    onChange={field.onChange}
                    error={budgetForm.formState.errors.start_month?.message}
                  />
                )}
              />

              <Checkbox
                label="Активный бюджет"
                description="Только активные бюджеты участвуют в месячной сводке."
                {...budgetForm.register("is_active")}
              />

              <Input
                label="Комментарий"
                placeholder="Опционально"
                error={budgetForm.formState.errors.comment?.message}
                {...budgetForm.register("comment")}
              />

              <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Категория бюджета должна совпадать с категорией расхода. Позже мы
                свяжем расходы с категориями через справочник, а пока используется
                строковое совпадение.
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 gap-2"
                  disabled={
                    budgetSubmitting ||
                    (isBudgetEditMode && !budgetForm.formState.isDirty)
                  }
                >
                  {isBudgetEditMode ? (
                    <>
                      <Save className="h-4 w-4" />
                      {updateBudgetMutation.isPending
                        ? "Сохраняем..."
                        : "Сохранить"}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {createBudgetMutation.isPending
                        ? "Добавляем..."
                        : "Добавить"}
                    </>
                  )}
                </Button>

                {isBudgetEditMode ? (
                  <Button
                    variant="secondary"
                    className="gap-2"
                    disabled={budgetSubmitting}
                    onClick={() => {
                      if (editingBudget) {
                        budgetForm.reset(mapBudgetToFormValues(editingBudget));
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

        <Card>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Бюджеты категорий
              </h3>
              <p className="text-sm text-slate-500">
                Активные и исторические лимиты по категориям.
              </p>
            </div>

            <div className="rounded-xl bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {budgets.length} записей
            </div>
          </div>

          {budgets.length === 0 ? (
            <EmptyState
              title="Бюджетов пока нет"
              description="Создай лимит для категории расходов."
            />
          ) : (
            <div className="space-y-3">
              {budgets.map((budget) => (
                <div
                  key={budget.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">
                        {budget.category}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        С {formatDate(budget.start_month)}
                        {" · "}
                        {budget.is_active ? "активен" : "неактивен"}
                      </div>

                      {budget.comment ? (
                        <div className="mt-1 text-xs text-slate-500">
                          {budget.comment}
                        </div>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-950">
                        {formatMoney(budget.monthly_limit)}
                      </div>

                      <div className="mt-2 flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          className="h-9 px-3"
                          onClick={() => startEditBudget(budget)}
                          disabled={budgetSubmitting}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="secondary"
                          className="h-9 px-3"
                          disabled={deleteBudgetMutation.isPending}
                          onClick={() => {
                            const confirmed = window.confirm(
                              "Удалить бюджет категории?"
                            );

                            if (confirmed) {
                              deleteBudgetMutation.mutate(budget.id, {
                                onSuccess: () => {
                                  if (editingBudget?.id === budget.id) {
                                    resetBudgetForm();
                                  }
                                }
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-start">
          <div>
            <h3 className="text-base font-semibold text-slate-950">
              Исполнение бюджета за месяц
            </h3>
            <p className="text-sm text-slate-500">
              Период: {formatDate(summary.date_from)} — {formatDate(summary.date_to)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-100 px-3 py-1 text-sm text-slate-700">
            Использовано:{" "}
            <span className="font-semibold text-slate-950">
              {formatPercent(summary.total_usage_percent)}
            </span>
          </div>
        </div>

        {summary.items.length === 0 ? (
          <EmptyState
            title="Нет активных бюджетов"
            description="Создай бюджет категории, чтобы увидеть исполнение лимитов."
          />
        ) : (
          <div className="space-y-4">
            {summary.items.map((item) => {
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
                        width: `${usage}%`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}