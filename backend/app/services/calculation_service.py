from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.calculators.cashflow import calculate_cashflow, calculate_summary, money
from app.services.recurring_expense_service import calculate_expense_totals_for_period
from app.calculators.debt_strategy import simulate_debt_strategy
from app.db.models.debt import Debt
from app.db.models.expense import Expense
from app.db.models.income import Income
from app.services.recurring_income_service import calculate_income_total_for_period


def _scalar_decimal(value: Decimal | None) -> Decimal:
    return money(value or Decimal("0"))


def _build_scenario_label(strategy_type: str, extra_monthly_payment: Decimal) -> str:
    extra = money(extra_monthly_payment)
    return f"{strategy_type} | extra={extra}"


def get_total_income(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> Decimal:
    stmt = select(func.coalesce(func.sum(Income.amount), 0)).where(
        Income.user_id == user_id,
        Income.date >= date_from,
        Income.date <= date_to,
    )
    return _scalar_decimal(db.scalar(stmt))


def get_total_expenses_by_type(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
    expense_type: str,
) -> Decimal:
    stmt = select(func.coalesce(func.sum(Expense.amount), 0)).where(
        Expense.user_id == user_id,
        Expense.date >= date_from,
        Expense.date <= date_to,
        Expense.type == expense_type,
    )
    return _scalar_decimal(db.scalar(stmt))


def get_minimum_debt_payments(db: Session, user_id: int) -> Decimal:
    stmt = select(func.coalesce(func.sum(Debt.minimum_monthly_payment), 0)).where(
        Debt.user_id == user_id,
        Debt.is_active.is_(True),
    )
    return _scalar_decimal(db.scalar(stmt))


def get_active_debt_balance(db: Session, user_id: int) -> Decimal:
    stmt = select(func.coalesce(func.sum(Debt.principal_balance), 0)).where(
        Debt.user_id == user_id,
        Debt.is_active.is_(True),
    )
    return _scalar_decimal(db.scalar(stmt))


def _load_active_debts_input(db: Session, user_id: int) -> list[dict]:
    debts = list(
        db.scalars(
            select(Debt).where(
                Debt.user_id == user_id,
                Debt.is_active.is_(True),
                Debt.principal_balance > 0,
            )
        ).all()
    )

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


def build_summary(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> dict[str, Decimal | date]:
    total_income = calculate_income_total_for_period(
            db,
            user_id,
            date_from=date_from,
            date_to=date_to,
        )
    expense_totals = calculate_expense_totals_for_period(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
        )

    mandatory_expenses = money(expense_totals["mandatory_expenses"])
    variable_expenses = money(expense_totals["variable_expenses"])
    total_expenses = money(expense_totals["total_expenses"])
    minimum_debt_payments = get_minimum_debt_payments(db, user_id)
    active_debt_balance = get_active_debt_balance(db, user_id)

    calculated = calculate_summary(
        total_income=total_income,
        mandatory_expenses=mandatory_expenses,
        variable_expenses=variable_expenses,
        minimum_debt_payments=minimum_debt_payments,
        active_debt_balance=active_debt_balance,
    )

    return {
        "period": {
            "date_from": date_from,
            "date_to": date_to,
        },
        **calculated,
    }


def build_cashflow(
    db: Session,
    user_id: int,
    *,
    date_from: date,
    date_to: date,
) -> dict[str, Decimal | date]:
    total_income = get_total_income(db, user_id, date_from=date_from, date_to=date_to)
    mandatory_expenses = get_total_expenses_by_type(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
        expense_type="mandatory",
    )
    variable_expenses = get_total_expenses_by_type(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
        expense_type="variable",
    )
    minimum_debt_payments = get_minimum_debt_payments(db, user_id)

    calculated = calculate_cashflow(
        total_income=total_income,
        mandatory_expenses=mandatory_expenses,
        variable_expenses=variable_expenses,
        minimum_debt_payments=minimum_debt_payments,
    )

    return {
        "period": {
            "date_from": date_from,
            "date_to": date_to,
        },
        **calculated,
    }


def build_debt_strategy(
    db: Session,
    user_id: int,
    *,
    strategy_type: str,
    start_date: date,
    extra_monthly_payment: Decimal,
    max_months: int,
) -> dict:
    debts_input = _load_active_debts_input(db, user_id)

    return simulate_debt_strategy(
        debts_input=debts_input,
        strategy_type=strategy_type,
        start_date=start_date,
        extra_monthly_payment=extra_monthly_payment,
        max_months=max_months,
    )


def build_scenario_compare(
    db: Session,
    user_id: int,
    *,
    start_date: date,
    max_months: int,
    scenarios: list[dict],
) -> dict:
    debts_input = _load_active_debts_input(db, user_id)

    results: list[dict] = []
    for scenario in scenarios:
        strategy_type = scenario["strategy_type"]
        extra_monthly_payment = money(scenario["extra_monthly_payment"])

        simulation = simulate_debt_strategy(
            debts_input=debts_input,
            strategy_type=strategy_type,
            start_date=start_date,
            extra_monthly_payment=extra_monthly_payment,
            max_months=max_months,
        )

        results.append(
            {
                "label": _build_scenario_label(strategy_type, extra_monthly_payment),
                "strategy_type": simulation["strategy_type"],
                "extra_monthly_payment": simulation["extra_monthly_payment"],
                "months_simulated": simulation["months_simulated"],
                "paid_off": simulation["paid_off"],
                "payoff_date": simulation["payoff_date"],
                "total_paid": simulation["total_paid"],
                "total_interest_paid": simulation["total_interest_paid"],
                "total_overpayment": simulation["total_overpayment"],
                "initial_total_balance": simulation["initial_total_balance"],
                "final_total_balance": simulation["final_total_balance"],
            }
        )

    baseline = results[0]
    deltas_vs_baseline: list[dict] = []

    for compared in results[1:]:
        months_saved = None
        if baseline["paid_off"] and compared["paid_off"]:
            months_saved = baseline["months_simulated"] - compared["months_simulated"]

        interest_saved = None
        total_paid_saved = None
        if baseline["paid_off"] and compared["paid_off"]:
            interest_saved = money(baseline["total_interest_paid"] - compared["total_interest_paid"])
            total_paid_saved = money(baseline["total_paid"] - compared["total_paid"])

        deltas_vs_baseline.append(
            {
                "base_label": baseline["label"],
                "compared_label": compared["label"],
                "months_saved": months_saved,
                "interest_saved": interest_saved,
                "total_paid_saved": total_paid_saved,
            }
        )

    return {
        "start_date": start_date,
        "max_months": max_months,
        "baseline": baseline,
        "scenarios": results,
        "deltas_vs_baseline": deltas_vs_baseline,
    }