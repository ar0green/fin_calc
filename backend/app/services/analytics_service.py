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
from app.db.models.debt_payment import DebtPayment

from app.services.recurring_expense_service import (
    expand_expenses_by_month,
    iter_month_starts,
    month_start,
)

from app.services.recurring_expense_service import calculate_expense_categories_for_period
from app.services.recurring_income_service import expand_incomes_by_month

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

    top_expense_categories = calculate_expense_categories_for_period(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )[:5]

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
    months = iter_month_starts(date_from, date_to)

    income_by_month = expand_incomes_by_month(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    expenses_by_month = expand_expenses_by_month(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    items = []

    for month in months:
        month_income = money(income_by_month.get(month, Decimal("0")))
        month_expenses = money(
            expenses_by_month.get(month, {}).get("total_expenses", Decimal("0"))
        )

        items.append(
            {
                "month": month,
                "income": month_income,
                "expenses": month_expenses,
                "cashflow": money(month_income - month_expenses),
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
    
    
def build_debt_payments_summary(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> dict:
    statement = (
        select(DebtPayment, Debt)
        .join(Debt, Debt.id == DebtPayment.debt_id)
        .where(
            DebtPayment.user_id == user_id,
            DebtPayment.payment_date >= date_from,
            DebtPayment.payment_date <= date_to,
        )
        .order_by(DebtPayment.payment_date.asc(), DebtPayment.id.asc())
    )

    rows = db.execute(statement).all()

    total_paid = Decimal("0")
    principal_paid = Decimal("0")
    interest_paid = Decimal("0")

    monthly_totals: dict[date, dict[str, Decimal]] = defaultdict(
        lambda: {
            "total_paid": Decimal("0"),
            "principal_paid": Decimal("0"),
            "interest_paid": Decimal("0"),
        }
    )

    by_debt_totals: dict[int, dict] = {}

    for payment, debt in rows:
        payment_total = money(payment.amount)
        payment_principal = money(payment.principal_amount)
        payment_interest = money(payment.interest_amount)

        total_paid = money(total_paid + payment_total)
        principal_paid = money(principal_paid + payment_principal)
        interest_paid = money(interest_paid + payment_interest)

        month = _month_start(payment.payment_date)
        monthly_totals[month]["total_paid"] = money(
            monthly_totals[month]["total_paid"] + payment_total
        )
        monthly_totals[month]["principal_paid"] = money(
            monthly_totals[month]["principal_paid"] + payment_principal
        )
        monthly_totals[month]["interest_paid"] = money(
            monthly_totals[month]["interest_paid"] + payment_interest
        )

        if debt.id not in by_debt_totals:
            by_debt_totals[debt.id] = {
                "debt_id": debt.id,
                "debt_name": debt.name,
                "debt_type": debt.debt_type,
                "total_paid": Decimal("0"),
                "principal_paid": Decimal("0"),
                "interest_paid": Decimal("0"),
            }

        by_debt_totals[debt.id]["total_paid"] = money(
            by_debt_totals[debt.id]["total_paid"] + payment_total
        )
        by_debt_totals[debt.id]["principal_paid"] = money(
            by_debt_totals[debt.id]["principal_paid"] + payment_principal
        )
        by_debt_totals[debt.id]["interest_paid"] = money(
            by_debt_totals[debt.id]["interest_paid"] + payment_interest
        )

    monthly_items = [
        {
            "month": month,
            "total_paid": money(values["total_paid"]),
            "principal_paid": money(values["principal_paid"]),
            "interest_paid": money(values["interest_paid"]),
        }
        for month, values in sorted(monthly_totals.items(), key=lambda item: item[0])
    ]

    by_debt_items = [
        {
            "debt_id": item["debt_id"],
            "debt_name": item["debt_name"],
            "debt_type": item["debt_type"],
            "total_paid": money(item["total_paid"]),
            "principal_paid": money(item["principal_paid"]),
            "interest_paid": money(item["interest_paid"]),
        }
        for item in sorted(
            by_debt_totals.values(),
            key=lambda value: value["total_paid"],
            reverse=True,
        )
    ]

    return {
        "date_from": date_from,
        "date_to": date_to,
        "total_paid": money(total_paid),
        "principal_paid": money(principal_paid),
        "interest_paid": money(interest_paid),
        "interest_share_percent": _percent(interest_paid, total_paid),
        "monthly_items": monthly_items,
        "by_debt_items": by_debt_items,
    }