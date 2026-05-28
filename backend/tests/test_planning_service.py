from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.db.models.user import User
from app.services.planning_service import build_monthly_plan, parse_month


def test_parse_month_returns_first_and_last_day() -> None:
    date_from, date_to = parse_month("2026-04")

    assert date_from == date(2026, 4, 1)
    assert date_to == date(2026, 4, 30)


def test_parse_month_handles_february_leap_year() -> None:
    date_from, date_to = parse_month("2024-02")

    assert date_from == date(2024, 2, 1)
    assert date_to == date(2024, 2, 29)


def test_parse_month_rejects_invalid_format() -> None:
    with pytest.raises(ValueError):
        parse_month("2026/04")

    with pytest.raises(ValueError):
        parse_month("2026-13")


def test_monthly_plan_with_percent_safety_buffer(
    db_session: Session,
    financial_dataset: User,
) -> None:
    result = build_monthly_plan(
        db_session,
        financial_dataset.id,
        month="2026-04",
        safety_buffer_type="percent",
        safety_buffer_value=Decimal("10"),
        strategy_type="avalanche",
        max_months=240,
    )

    assert result["period"]["month"] == "2026-04"
    assert result["total_income"] == Decimal("300000.00")
    assert result["total_expenses"] == Decimal("130000.00")
    assert result["minimum_debt_payments"] == Decimal("30000.00")
    assert result["free_cash"] == Decimal("140000.00")

    assert result["safety_buffer_type"] == "percent"
    assert result["safety_buffer_value"] == Decimal("10.00")
    assert result["safety_buffer"] == Decimal("30000.00")

    assert result["recommended_extra_payment"] == Decimal("110000.00")
    assert result["remaining_after_recommended_extra_payment"] == Decimal("30000.00")

    assert result["active_debt_balance"] == Decimal("420000.00")
    assert result["active_debt_count"] == 2

    assert result["recommended_debt_target_name"] == "Credit Card"

    assert result["scenario_impact"] is not None
    assert result["scenario_impact"]["strategy_type"] == "avalanche"
    assert result["scenario_impact"]["recommended_months_simulated"] <= result["scenario_impact"]["baseline_months_simulated"]

    assert len(result["expense_categories"]) == 4
    assert len(result["active_debts"]) == 2


def test_monthly_plan_with_fixed_safety_buffer(
    db_session: Session,
    financial_dataset: User,
) -> None:
    result = build_monthly_plan(
        db_session,
        financial_dataset.id,
        month="2026-04",
        safety_buffer_type="fixed",
        safety_buffer_value=Decimal("50000"),
        strategy_type="avalanche",
        max_months=240,
    )

    assert result["safety_buffer_type"] == "fixed"
    assert result["safety_buffer_value"] == Decimal("50000.00")
    assert result["safety_buffer"] == Decimal("50000.00")

    assert result["recommended_extra_payment"] == Decimal("90000.00")
    assert result["remaining_after_recommended_extra_payment"] == Decimal("50000.00")


def test_monthly_plan_snowball_target_is_smallest_balance(
    db_session: Session,
    financial_dataset: User,
) -> None:
    result = build_monthly_plan(
        db_session,
        financial_dataset.id,
        month="2026-04",
        safety_buffer_type="percent",
        safety_buffer_value=Decimal("10"),
        strategy_type="snowball",
        max_months=240,
    )

    assert result["recommended_debt_target_name"] == "Credit Card"


def test_monthly_plan_rejects_invalid_safety_buffer_type(
    db_session: Session,
    financial_dataset: User,
) -> None:
    with pytest.raises(ValueError):
        build_monthly_plan(
            db_session,
            financial_dataset.id,
            month="2026-04",
            safety_buffer_type="unknown",
            safety_buffer_value=Decimal("10"),
            strategy_type="avalanche",
            max_months=240,
        )


def test_monthly_plan_rejects_invalid_strategy_type(
    db_session: Session,
    financial_dataset: User,
) -> None:
    with pytest.raises(ValueError):
        build_monthly_plan(
            db_session,
            financial_dataset.id,
            month="2026-04",
            safety_buffer_type="percent",
            safety_buffer_value=Decimal("10"),
            strategy_type="invalid",
            max_months=240,
        )