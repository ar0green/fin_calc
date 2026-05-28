from datetime import date
from decimal import Decimal

from app.calculators.debt_strategy import simulate_debt_strategy


def make_debts_input() -> list[dict]:
    return [
        {
            "debt_id": 1,
            "debt_name": "Credit Card",
            "debt_type": "credit_card",
            "balance": Decimal("120000.00"),
            "annual_interest_rate": Decimal("30.00"),
            "minimum_monthly_payment": Decimal("10000.00"),
            "payoff_priority": 1,
        },
        {
            "debt_id": 2,
            "debt_name": "Consumer Loan",
            "debt_type": "loan",
            "balance": Decimal("300000.00"),
            "annual_interest_rate": Decimal("15.00"),
            "minimum_monthly_payment": Decimal("20000.00"),
            "payoff_priority": 2,
        },
    ]


def test_debt_strategy_returns_valid_projection() -> None:
    result = simulate_debt_strategy(
        debts_input=make_debts_input(),
        strategy_type="avalanche",
        start_date=date(2026, 4, 1),
        extra_monthly_payment=Decimal("0"),
        max_months=240,
    )

    assert result["strategy_type"] == "avalanche"
    assert result["start_date"] == date(2026, 4, 1)
    assert result["initial_total_balance"] == Decimal("420000.00")
    assert result["months_simulated"] > 0
    assert result["total_paid"] > Decimal("0")
    assert result["total_interest_paid"] >= Decimal("0")
    assert len(result["projection"]) > 0
    assert len(result["debts"]) == 2


def test_extra_payment_reduces_months_and_interest() -> None:
    baseline = simulate_debt_strategy(
        debts_input=make_debts_input(),
        strategy_type="avalanche",
        start_date=date(2026, 4, 1),
        extra_monthly_payment=Decimal("0"),
        max_months=240,
    )

    accelerated = simulate_debt_strategy(
        debts_input=make_debts_input(),
        strategy_type="avalanche",
        start_date=date(2026, 4, 1),
        extra_monthly_payment=Decimal("50000.00"),
        max_months=240,
    )

    assert baseline["paid_off"] is True
    assert accelerated["paid_off"] is True

    assert accelerated["months_simulated"] < baseline["months_simulated"]
    assert accelerated["total_interest_paid"] < baseline["total_interest_paid"]
    assert accelerated["final_total_balance"] == Decimal("0.00")


def test_snowball_strategy_works() -> None:
    result = simulate_debt_strategy(
        debts_input=make_debts_input(),
        strategy_type="snowball",
        start_date=date(2026, 4, 1),
        extra_monthly_payment=Decimal("10000.00"),
        max_months=240,
    )

    assert result["strategy_type"] == "snowball"
    assert result["paid_off"] is True
    assert result["final_total_balance"] == Decimal("0.00")
    assert result["payoff_date"] is not None


def test_empty_debt_list_returns_zero_projection() -> None:
    result = simulate_debt_strategy(
        debts_input=[],
        strategy_type="avalanche",
        start_date=date(2026, 4, 1),
        extra_monthly_payment=Decimal("10000.00"),
        max_months=240,
    )

    assert result["initial_total_balance"] == Decimal("0.00")
    assert result["final_total_balance"] == Decimal("0.00")
    assert result["total_paid"] == Decimal("0.00")
    assert result["total_interest_paid"] == Decimal("0.00")
    assert result["months_simulated"] == 0
    assert result["projection"] == []
    assert result["debts"] == []