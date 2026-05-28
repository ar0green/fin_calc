from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.db.models.debt import Debt
from app.db.models.user import User
from app.schemas.debt_payment import DebtPaymentCreate
from app.services.analytics_service import build_debt_payments_summary
from app.services.debt_payment_service import create_debt_payment


def test_debt_payments_summary_calculates_totals(
    db_session: Session,
    financial_dataset: User,
) -> None:
    credit_card = (
        db_session.query(Debt)
        .filter(Debt.user_id == financial_dataset.id, Debt.name == "Credit Card")
        .one()
    )

    consumer_loan = (
        db_session.query(Debt)
        .filter(Debt.user_id == financial_dataset.id, Debt.name == "Consumer Loan")
        .one()
    )

    create_debt_payment(
        db_session,
        financial_dataset.id,
        DebtPaymentCreate(
            debt_id=credit_card.id,
            payment_date=date(2026, 4, 10),
            amount=Decimal("10000.00"),
            principal_amount=Decimal("8000.00"),
            interest_amount=Decimal("2000.00"),
            comment=None,
        ),
    )

    create_debt_payment(
        db_session,
        financial_dataset.id,
        DebtPaymentCreate(
            debt_id=consumer_loan.id,
            payment_date=date(2026, 4, 15),
            amount=Decimal("20000.00"),
            principal_amount=Decimal("15000.00"),
            interest_amount=Decimal("5000.00"),
            comment=None,
        ),
    )

    result = build_debt_payments_summary(
        db_session,
        financial_dataset.id,
        date_from=date(2026, 4, 1),
        date_to=date(2026, 4, 30),
    )

    assert result["total_paid"] == Decimal("30000.00")
    assert result["principal_paid"] == Decimal("23000.00")
    assert result["interest_paid"] == Decimal("7000.00")
    assert result["interest_share_percent"] == Decimal("23.33")

    assert len(result["monthly_items"]) == 1
    assert result["monthly_items"][0]["month"] == date(2026, 4, 1)
    assert result["monthly_items"][0]["total_paid"] == Decimal("30000.00")

    assert len(result["by_debt_items"]) == 2
    assert result["by_debt_items"][0]["total_paid"] == Decimal("20000.00")
    assert result["by_debt_items"][1]["total_paid"] == Decimal("10000.00")


def test_debt_payments_summary_returns_zeroes_without_payments(
    db_session: Session,
    financial_dataset: User,
) -> None:
    result = build_debt_payments_summary(
        db_session,
        financial_dataset.id,
        date_from=date(2026, 5, 1),
        date_to=date(2026, 5, 31),
    )

    assert result["total_paid"] == Decimal("0.00")
    assert result["principal_paid"] == Decimal("0.00")
    assert result["interest_paid"] == Decimal("0.00")
    assert result["interest_share_percent"] == Decimal("0.00")
    assert result["monthly_items"] == []
    assert result["by_debt_items"] == []