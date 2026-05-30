import calendar
from collections import defaultdict
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculators.cashflow import money
from app.calculators.debt_strategy import simulate_debt_strategy
from app.db.models.debt import Debt
from app.db.models.expense import Expense
from app.services.calculation_service import build_summary
from app.services.recurring_income_service import build_income_plan_items_for_period
from app.services.recurring_expense_service import (
    build_expense_plan_items_for_period,
    calculate_expense_categories_for_period,
)
from app.services.category_budget_service import build_monthly_budget_summary


DEFAULT_SAFETY_BUFFER_RATIO = Decimal("10")


def parse_month(month: str) -> tuple[date, date]:
    try:
        year_raw, month_raw = month.split("-")
        year = int(year_raw)
        month_number = int(month_raw)
    except ValueError as exc:
        raise ValueError("month must be in YYYY-MM format") from exc

    if month_number < 1 or month_number > 12:
        raise ValueError("month must be in YYYY-MM format")

    last_day = calendar.monthrange(year, month_number)[1]

    return date(year, month_number, 1), date(year, month_number, last_day)


def _percent(part: Decimal, total: Decimal) -> Decimal:
    total = money(total)
    if total <= 0:
        return money("0")

    return money((money(part) / total) * Decimal("100"))


def _calculate_budget_overrun_total(monthly_budget_summary: dict) -> Decimal:
    total = Decimal("0")

    for item in monthly_budget_summary["items"]:
        if not item["is_over_budget"]:
            continue

        total = money(total + abs(item["remaining_amount"]))

    return money(total)

def _calculate_safety_buffer(
    *,
    total_income: Decimal,
    safety_buffer_type: str,
    safety_buffer_value: Decimal,
) -> Decimal:
    value = money(safety_buffer_value)

    if safety_buffer_type == "percent":
        return money(total_income * value / Decimal("100"))

    if safety_buffer_type == "fixed":
        return money(value)

    raise ValueError("safety_buffer_type must be percent or fixed")


def _load_month_expenses(
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


def _load_active_debts(db: Session, user_id: int) -> list[Debt]:
    return list(
        db.scalars(
            select(Debt)
            .where(
                Debt.user_id == user_id,
                Debt.is_active.is_(True),
                Debt.principal_balance > 0,
            )
            .order_by(Debt.payoff_priority.asc(), Debt.id.asc())
        ).all()
    )


def _build_debts_input(debts: list[Debt]) -> list[dict]:
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


def _select_recommended_target(
    debts: list[Debt],
    *,
    strategy_type: str,
) -> Debt | None:
    if not debts:
        return None

    if strategy_type == "avalanche":
        return sorted(
            debts,
            key=lambda debt: (
                -money(debt.annual_interest_rate),
                money(debt.principal_balance),
                debt.payoff_priority,
                debt.id,
            ),
        )[0]

    if strategy_type == "snowball":
        return sorted(
            debts,
            key=lambda debt: (
                money(debt.principal_balance),
                -money(debt.annual_interest_rate),
                debt.payoff_priority,
                debt.id,
            ),
        )[0]

    raise ValueError("strategy_type must be snowball or avalanche")


def _build_scenario_impact(
    *,
    debts: list[Debt],
    strategy_type: str,
    start_date: date,
    recommended_extra_payment: Decimal,
    max_months: int,
) -> dict | None:
    if not debts:
        return None

    debts_input = _build_debts_input(debts)

    baseline = simulate_debt_strategy(
        debts_input=debts_input,
        strategy_type=strategy_type,
        start_date=start_date,
        extra_monthly_payment=Decimal("0"),
        max_months=max_months,
    )

    recommended = simulate_debt_strategy(
        debts_input=debts_input,
        strategy_type=strategy_type,
        start_date=start_date,
        extra_monthly_payment=recommended_extra_payment,
        max_months=max_months,
    )

    months_saved = None
    interest_saved = None
    total_paid_saved = None

    if baseline["paid_off"] and recommended["paid_off"]:
        months_saved = baseline["months_simulated"] - recommended["months_simulated"]
        interest_saved = money(
            baseline["total_interest_paid"] - recommended["total_interest_paid"]
        )
        total_paid_saved = money(baseline["total_paid"] - recommended["total_paid"])

    return {
        "strategy_type": strategy_type,
        "max_months": max_months,
        "baseline_months_simulated": baseline["months_simulated"],
        "baseline_paid_off": baseline["paid_off"],
        "baseline_payoff_date": baseline["payoff_date"],
        "baseline_total_interest_paid": baseline["total_interest_paid"],
        "baseline_total_paid": baseline["total_paid"],
        "recommended_months_simulated": recommended["months_simulated"],
        "recommended_paid_off": recommended["paid_off"],
        "recommended_payoff_date": recommended["payoff_date"],
        "recommended_total_interest_paid": recommended["total_interest_paid"],
        "recommended_total_paid": recommended["total_paid"],
        "months_saved": months_saved,
        "interest_saved": interest_saved,
        "total_paid_saved": total_paid_saved,
    }


def build_monthly_plan(
    db: Session,
    user_id: int,
    *,
    month: str,
    safety_buffer_type: str = "percent",
    safety_buffer_value: Decimal = DEFAULT_SAFETY_BUFFER_RATIO,
    strategy_type: str = "avalanche",
    max_months: int = 240,
) -> dict:
    date_from, date_to = parse_month(month)

    summary = build_summary(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )
    
    income_plan = build_income_plan_items_for_period(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    expense_plan = build_expense_plan_items_for_period(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    total_income = money(summary["total_income"])
    mandatory_expenses = money(summary["mandatory_expenses"])
    variable_expenses = money(summary["variable_expenses"])
    total_expenses = money(summary["total_expenses"])
    minimum_debt_payments = money(summary["minimum_debt_payments"])
    free_cash = money(summary["free_cash"])
    debt_payoff_capacity = money(summary["debt_payoff_capacity"])
    active_debt_balance = money(summary["active_debt_balance"])

    safety_buffer = _calculate_safety_buffer(
        total_income=total_income,
        safety_buffer_type=safety_buffer_type,
        safety_buffer_value=safety_buffer_value,
    )

    monthly_budget_summary = build_monthly_budget_summary(
        db,
        user_id,
        month=month,
    )

    budget_overrun_total = _calculate_budget_overrun_total(monthly_budget_summary)

    recommended_extra_payment_before_budget_adjustment = money(
        max(free_cash - safety_buffer, Decimal("0"))
    )

    recommended_extra_payment = money(
        max(
            recommended_extra_payment_before_budget_adjustment - budget_overrun_total,
            Decimal("0"),
        )
    )

    budget_adjustment_applied = (
        budget_overrun_total > 0
        and recommended_extra_payment < recommended_extra_payment_before_budget_adjustment
    )

    remaining_after_recommended_extra_payment = money(
        free_cash - recommended_extra_payment
    )

    expenses = _load_month_expenses(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    category_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for expense in expenses:
        category_totals[expense.category] = money(
            category_totals[expense.category] + expense.amount
        )

    expense_categories = [
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

    active_debts = _load_active_debts(db, user_id)

    recommended_target = _select_recommended_target(
        active_debts,
        strategy_type=strategy_type,
    )

    scenario_impact = _build_scenario_impact(
        debts=active_debts,
        strategy_type=strategy_type,
        start_date=date_from,
        recommended_extra_payment=recommended_extra_payment,
        max_months=max_months,
    )

    return {
        "period": {
            "month": month,
            "date_from": date_from,
            "date_to": date_to,
        },
        "total_income": total_income,
        "income_regular": income_plan["income_regular"],
        "income_irregular": income_plan["income_irregular"],
        "mandatory_expenses": mandatory_expenses,
        "variable_expenses": variable_expenses,
        "total_expenses": total_expenses,
        "expenses_recurring": expense_plan["expenses_recurring"],
        "expenses_one_time": expense_plan["expenses_one_time"],
        "minimum_debt_payments": minimum_debt_payments,
        "free_cash": free_cash,
        "debt_payoff_capacity": debt_payoff_capacity,
        "safety_buffer_type": safety_buffer_type,
        "safety_buffer_value": money(safety_buffer_value),
        "safety_buffer": safety_buffer,
        "budget_overrun_total": budget_overrun_total,
        "recommended_extra_payment_before_budget_adjustment": recommended_extra_payment_before_budget_adjustment,
        "budget_adjustment_applied": budget_adjustment_applied,
        "recommended_extra_payment": recommended_extra_payment,
        "remaining_after_recommended_extra_payment": remaining_after_recommended_extra_payment,
        "active_debt_balance": active_debt_balance,
        "active_debt_count": len(active_debts),
        "recommended_debt_target_id": recommended_target.id if recommended_target else None,
        "recommended_debt_target_name": recommended_target.name if recommended_target else None,
        "scenario_impact": scenario_impact,
        "expense_categories": expense_categories,
        "active_debts": [
                {
                    "debt_id": debt.id,
                    "name": debt.name,
                    "debt_type": debt.debt_type,
                    "principal_balance": money(debt.principal_balance),
                    "annual_interest_rate": money(debt.annual_interest_rate),
                    "minimum_monthly_payment": money(debt.minimum_monthly_payment),
                    "due_day": debt.due_day,
                    "payoff_priority": debt.payoff_priority,
                }
                for debt in active_debts
            ],
        "income_items": income_plan["income_items"],
        "expense_items": expense_plan["expense_items"],
    }