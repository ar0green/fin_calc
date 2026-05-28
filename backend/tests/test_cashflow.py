from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.services.calculation_service import build_summary
from app.db.models.user import User


def test_build_summary_calculates_month_totals(
    db_session: Session,
    financial_dataset: User,
) -> None:
    result = build_summary(
        db_session,
        financial_dataset.id,
        date_from=date(2026, 4, 1),
        date_to=date(2026, 4, 30),
    )

    assert result["total_income"] == Decimal("300000.00")
    assert result["mandatory_expenses"] == Decimal("80000.00")
    assert result["variable_expenses"] == Decimal("50000.00")
    assert result["total_expenses"] == Decimal("130000.00")
    assert result["minimum_debt_payments"] == Decimal("30000.00")

    assert result["free_cash"] == Decimal("140000.00")
    assert result["debt_payoff_capacity"] == Decimal("190000.00")
    assert result["active_debt_balance"] == Decimal("420000.00")


def test_build_summary_returns_zeroes_for_empty_period(
    db_session: Session,
    financial_dataset: User,
) -> None:
    result = build_summary(
        db_session,
        financial_dataset.id,
        date_from=date(2026, 5, 1),
        date_to=date(2026, 5, 31),
    )

    assert result["total_income"] == Decimal("0.00")
    assert result["mandatory_expenses"] == Decimal("80000.00")
    assert result["variable_expenses"] == Decimal("0.00")
    assert result["total_expenses"] == Decimal("80000.00")

    # Долги активны независимо от периода.
    assert result["minimum_debt_payments"] == Decimal("30000.00")
    assert result["active_debt_balance"] == Decimal("420000.00")

    # При нулевом доходе и активных долгах free_cash может быть отрицательным.
    assert result["free_cash"] == Decimal("-110000.00")