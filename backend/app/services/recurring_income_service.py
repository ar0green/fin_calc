from collections import defaultdict
from datetime import date
from decimal import Decimal

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.calculators.cashflow import money
from app.db.models.income import Income
from app.services.recurring_expense_service import (
    iter_month_starts,
    month_end,
    month_start,
)


def regular_income_applies_to_month(income: Income, target_month: date) -> bool:
    income_start_month = month_start(income.date)
    return income_start_month <= target_month


def get_effective_incomes_for_period(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> list[Income]:
    """
    Returns physical irregular incomes inside the period plus regular income
    definitions that may apply to at least one month inside the period.

    This returns Income objects, not expanded virtual rows.
    """

    return list(
        db.scalars(
            select(Income).where(
                Income.user_id == user_id,
                or_(
                    and_(
                        Income.type == "irregular",
                        Income.date >= date_from,
                        Income.date <= date_to,
                    ),
                    and_(
                        Income.type == "regular",
                        Income.date <= month_end(date_to),
                    ),
                ),
            )
        ).all()
    )


def calculate_income_total_for_period(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> Decimal:
    months = iter_month_starts(date_from, date_to)

    incomes = get_effective_incomes_for_period(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    total_income = Decimal("0")

    for income in incomes:
        if income.type == "irregular":
            total_income = money(total_income + income.amount)
            continue

        if income.type == "regular":
            applicable_months = [
                month for month in months if regular_income_applies_to_month(income, month)
            ]

            total_income = money(total_income + money(income.amount * len(applicable_months)))

    return money(total_income)


def expand_incomes_by_month(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> dict[date, Decimal]:
    """
    Returns monthly income totals.

    Example:
    {
        date(2026, 1, 1): Decimal("250000.00"),
        date(2026, 2, 1): Decimal("250000.00"),
    }
    """

    months = iter_month_starts(date_from, date_to)

    result: dict[date, Decimal] = {
        month: Decimal("0")
        for month in months
    }

    incomes = get_effective_incomes_for_period(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    for income in incomes:
        if income.type == "irregular":
            target_month = month_start(income.date)

            if target_month in result:
                result[target_month] = money(result[target_month] + income.amount)

            continue

        if income.type == "regular":
            for target_month in months:
                if not regular_income_applies_to_month(income, target_month):
                    continue

                result[target_month] = money(result[target_month] + income.amount)

    return result


def calculate_income_categories_for_period(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> list[dict]:
    months = iter_month_starts(date_from, date_to)

    incomes = get_effective_incomes_for_period(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    category_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))

    for income in incomes:
        if income.type == "irregular":
            category_totals[income.category] = money(
                category_totals[income.category] + income.amount
            )
            continue

        if income.type == "regular":
            applicable_months = [
                month for month in months if regular_income_applies_to_month(income, month)
            ]

            category_totals[income.category] = money(
                category_totals[income.category]
                + money(income.amount * len(applicable_months))
            )

    total_income = money(sum(category_totals.values(), Decimal("0")))

    result = []

    for category, amount in sorted(
        category_totals.items(),
        key=lambda item: item[1],
        reverse=True,
    ):
        percent = Decimal("0")

        if total_income > 0:
            percent = money(amount / total_income * Decimal("100"))

        result.append(
            {
                "category": category,
                "amount": money(amount),
                "percent": percent,
            }
        )

    return result

def build_income_plan_items_for_period(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> dict:
    months = iter_month_starts(date_from, date_to)

    incomes = get_effective_incomes_for_period(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    regular_total = Decimal("0")
    irregular_total = Decimal("0")
    items: list[dict] = []

    for income in incomes:
        if income.type == "irregular":
            amount = money(income.amount)
            irregular_total = money(irregular_total + amount)

            items.append(
                {
                    "income_id": income.id,
                    "category": income.category,
                    "amount": amount,
                    "source_type": "irregular",
                    "original_date": income.date,
                    "comment": income.comment,
                }
            )

            continue

        if income.type == "regular":
            applicable_months = [
                month for month in months if regular_income_applies_to_month(income, month)
            ]

            if not applicable_months:
                continue

            amount = money(income.amount * len(applicable_months))
            regular_total = money(regular_total + amount)

            items.append(
                {
                    "income_id": income.id,
                    "category": income.category,
                    "amount": amount,
                    "source_type": "regular",
                    "original_date": income.date,
                    "comment": income.comment,
                }
            )

    return {
        "income_regular": money(regular_total),
        "income_irregular": money(irregular_total),
        "income_items": sorted(
            items,
            key=lambda item: (item["source_type"], item["category"]),
        ),
    }