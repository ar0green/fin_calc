import calendar
from collections import defaultdict
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.calculators.cashflow import money
from app.db.models.expense import Expense


def month_start(value: date) -> date:
    return date(value.year, value.month, 1)


def month_end(value: date) -> date:
    last_day = calendar.monthrange(value.year, value.month)[1]
    return date(value.year, value.month, last_day)


def iter_month_starts(date_from: date, date_to: date) -> list[date]:
    current = month_start(date_from)
    end = month_start(date_to)

    result: list[date] = []

    while current <= end:
        result.append(current)

        if current.month == 12:
            current = date(current.year + 1, 1, 1)
        else:
            current = date(current.year, current.month + 1, 1)

    return result


def monthly_expense_applies_to_month(expense: Expense, target_month: date) -> bool:
    expense_start_month = month_start(expense.date)
    return expense_start_month <= target_month


def get_effective_expenses_for_period(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> list[Expense]:
    """
    Returns physical one-time expenses inside the period plus monthly recurring
    expense definitions that may apply to at least one month inside the period.

    This returns Expense objects, not expanded virtual rows.
    Use expand_expenses_by_month() when monthly distribution is needed.
    """

    period_start_month = month_start(date_from)

    return list(
        db.scalars(
            select(Expense).where(
                Expense.user_id == user_id,
                or_(
                    and_(
                        Expense.recurrence_type == "none",
                        Expense.date >= date_from,
                        Expense.date <= date_to,
                    ),
                    and_(
                        Expense.recurrence_type == "monthly",
                        Expense.date <= month_end(date_to),
                    ),
                ),
            )
        ).all()
    )


def calculate_expense_totals_for_period(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> dict[str, Decimal]:
    """
    Calculates effective expenses for a period.

    Monthly recurring expenses are counted once for every month in the period
    where the recurring expense is active.
    """

    months = iter_month_starts(date_from, date_to)
    expenses = get_effective_expenses_for_period(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    mandatory_expenses = Decimal("0")
    variable_expenses = Decimal("0")

    for expense in expenses:
        if expense.recurrence_type == "none":
            amount = money(expense.amount)

            if expense.type == "mandatory":
                mandatory_expenses = money(mandatory_expenses + amount)
            else:
                variable_expenses = money(variable_expenses + amount)

            continue

        if expense.recurrence_type == "monthly":
            applicable_months = [
                month for month in months if monthly_expense_applies_to_month(expense, month)
            ]

            total_amount = money(expense.amount * len(applicable_months))

            if expense.type == "mandatory":
                mandatory_expenses = money(mandatory_expenses + total_amount)
            else:
                variable_expenses = money(variable_expenses + total_amount)

    total_expenses = money(mandatory_expenses + variable_expenses)

    return {
        "mandatory_expenses": mandatory_expenses,
        "variable_expenses": variable_expenses,
        "total_expenses": total_expenses,
    }


def calculate_expense_categories_for_period(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> list[dict]:
    months = iter_month_starts(date_from, date_to)
    expenses = get_effective_expenses_for_period(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    category_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))

    for expense in expenses:
        if expense.recurrence_type == "none":
            category_totals[expense.category] = money(
                category_totals[expense.category] + expense.amount
            )
            continue

        if expense.recurrence_type == "monthly":
            applicable_months = [
                month for month in months if monthly_expense_applies_to_month(expense, month)
            ]

            category_totals[expense.category] = money(
                category_totals[expense.category]
                + money(expense.amount * len(applicable_months))
            )

    total_expenses = money(sum(category_totals.values(), Decimal("0")))

    result = []
    for category, amount in sorted(
        category_totals.items(),
        key=lambda item: item[1],
        reverse=True,
    ):
        percent = Decimal("0")
        if total_expenses > 0:
            percent = money(amount / total_expenses * Decimal("100"))

        result.append(
            {
                "category": category,
                "amount": money(amount),
                "percent": percent,
            }
        )

    return result


def expand_expenses_by_month(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> dict[date, dict[str, Decimal]]:
    """
    Returns monthly expense totals.

    Example output:
    {
        date(2026, 1, 1): {
            "mandatory_expenses": Decimal("65000.00"),
            "variable_expenses": Decimal("20000.00"),
            "total_expenses": Decimal("85000.00"),
        }
    }
    """

    months = iter_month_starts(date_from, date_to)
    expenses = get_effective_expenses_for_period(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    result: dict[date, dict[str, Decimal]] = {
        month: {
            "mandatory_expenses": Decimal("0"),
            "variable_expenses": Decimal("0"),
            "total_expenses": Decimal("0"),
        }
        for month in months
    }

    for expense in expenses:
        if expense.recurrence_type == "none":
            target_month = month_start(expense.date)

            if target_month not in result:
                continue

            key = "mandatory_expenses" if expense.type == "mandatory" else "variable_expenses"
            result[target_month][key] = money(result[target_month][key] + expense.amount)
            result[target_month]["total_expenses"] = money(
                result[target_month]["total_expenses"] + expense.amount
            )
            continue

        if expense.recurrence_type == "monthly":
            for target_month in months:
                if not monthly_expense_applies_to_month(expense, target_month):
                    continue

                key = (
                    "mandatory_expenses"
                    if expense.type == "mandatory"
                    else "variable_expenses"
                )
                result[target_month][key] = money(
                    result[target_month][key] + expense.amount
                )
                result[target_month]["total_expenses"] = money(
                    result[target_month]["total_expenses"] + expense.amount
                )

    return result