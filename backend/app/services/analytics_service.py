from collections import defaultdict
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculators.cashflow import money
from app.calculators.debt_strategy import simulate_debt_strategy
from app.db.models.debt import Debt
from app.db.models.expense import Expense
from app.db.models.income import Income
from app.services.calculation_service import build_summary


def _month_start(value: date) -> date:
    return date(value.year, value.month, 1)


def _next_month(value: date) -> date:
    if value.month == 12:
        return date(value.year + 1, 1, 1)
    return date(value.year, value.month + 1, 1)


def _iter_month_starts(date_from: date, date_to: date) -> list[date]:
    current = _month_start(date_from)
    end = _month_start(date_to)

    months: list[date] = []
    while current <= end:
        months.append(current)
        current = _next_month(current)

    return months


def _percent(part: Decimal, total: Decimal) -> Decimal:
    total = money(total)
    if total <= 0:
        return money("0")
    return money((money(part) / total) * Decimal("100"))


def _load_expenses(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> list[Expense]:
    return list(
        db.scalars(
            select(Expense).where(
                Expense.user_id == user_id,
                Expense.date >= date_from,
                Expense.date <= date_to,
            )
        ).all()
    )


def _load_incomes(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> list[Income]:
    return list(
        db.scalars(
            select(Income).where(
                Income.user_id == user_id,
                Income.date >= date_from,
                Income.date <= date_to,
            )
        ).all()
    )


def _load_active_debts(db: Session, user_id: int) -> list[Debt]:
    return list(
        db.scalars(
            select(Debt).where(
                Debt.user_id == user_id,
                Debt.is_active.is_(True),
                Debt.principal_balance > 0,
            )
        ).all()
    )


def _load_active_debts_input(db: Session, user_id: int) -> list[dict]:
    debts = _load_active_debts(db, user_id)

    return [
        {
            "debt_id": debt.id,
            "debt_name": debt.name,
            "debt_type": debt.debt_type,
            "balance": debt.principal_balance,
            "annual_interest_rate": debt.annual_interest_rate,
            "minimum_monthly_payment": debt.minimum_monthly_payment,
            "payoff_priority": debt.payoff_priority,
        }
        for debt in debts
    ]


def build_analytics_overview(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> dict:
    summary = build_summary(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    expenses = _load_expenses(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    category_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for expense in expenses:
        category_totals[expense.category] = money(category_totals[expense.category] + expense.amount)

    total_expenses = money(summary["total_expenses"])

    top_expense_categories = [
        {
            "category": category,
            "amount": money(amount),
            "percent": _percent(amount, total_expenses),
        }
        for category, amount in sorted(
            category_totals.items(),
            key=lambda item: item[1],
            reverse=True,
        )[:5]
    ]

    active_debts = _load_active_debts(db, user_id)
    active_debt_count = len(active_debts)

    total_income = money(summary["total_income"])
    active_debt_balance = money(summary["active_debt_balance"])

    debt_to_income_ratio_percent = None
    if total_income > 0:
        debt_to_income_ratio_percent = _percent(active_debt_balance, total_income)

    return {
        **summary,
        "active_debt_count": active_debt_count,
        "debt_to_income_ratio_percent": debt_to_income_ratio_percent,
        "top_expense_categories": top_expense_categories,
    }


def build_income_expense_by_month(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> dict:
    months = _iter_month_starts(date_from, date_to)

    income_by_month: dict[date, Decimal] = {
        month: Decimal("0") for month in months
    }
    expenses_by_month: dict[date, Decimal] = {
        month: Decimal("0") for month in months
    }

    incomes = _load_incomes(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )
    expenses = _load_expenses(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    for income in incomes:
        month = _month_start(income.date)
        income_by_month[month] = money(income_by_month[month] + income.amount)

    for expense in expenses:
        month = _month_start(expense.date)
        expenses_by_month[month] = money(expenses_by_month[month] + expense.amount)

    items = []
    for month in months:
        income_amount = money(income_by_month[month])
        expense_amount = money(expenses_by_month[month])
        items.append(
            {
                "month": month,
                "income": income_amount,
                "expenses": expense_amount,
                "cashflow": money(income_amount - expense_amount),
            }
        )

    return {
        "period": {
            "date_from": date_from,
            "date_to": date_to,
        },
        "items": items,
    }


def build_expense_structure(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> dict:
    expenses = _load_expenses(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    category_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for expense in expenses:
        category_totals[expense.category] = money(category_totals[expense.category] + expense.amount)

    total_expenses = money(sum(category_totals.values(), Decimal("0")))

    items = [
        {
            "category": category,
            "amount": money(amount),
            "percent": _percent(amount, total_expenses),
        }
        for category, amount in sorted(
            category_totals.items(),
            key=lambda item: item[1],
            reverse=True,
        )
    ]

    return {
        "period": {
            "date_from": date_from,
            "date_to": date_to,
        },
        "total_expenses": total_expenses,
        "items": items,
    }


def build_debt_dynamics(
    db: Session,
    user_id: int,
    *,
    strategy_type: str,
    start_date: date,
    extra_monthly_payment: Decimal,
    max_months: int,
) -> dict:
    debts_input = _load_active_debts_input(db, user_id)

    simulation = simulate_debt_strategy(
        debts_input=debts_input,
        strategy_type=strategy_type,
        start_date=start_date,
        extra_monthly_payment=extra_monthly_payment,
        max_months=max_months,
    )

    return {
        "strategy_type": simulation["strategy_type"],
        "start_date": simulation["start_date"],
        "extra_monthly_payment": simulation["extra_monthly_payment"],
        "paid_off": simulation["paid_off"],
        "payoff_date": simulation["payoff_date"],
        "months_simulated": simulation["months_simulated"],
        "initial_total_balance": simulation["initial_total_balance"],
        "final_total_balance": simulation["final_total_balance"],
        "total_paid": simulation["total_paid"],
        "total_interest_paid": simulation["total_interest_paid"],
        "items": simulation["projection"],
    }