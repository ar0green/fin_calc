from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.debt import Debt
from app.db.models.user import User
from app.schemas.debt_payment import DebtPaymentCreate, DebtPaymentUpdate
from app.services.debt_payment_service import (
    DebtPaymentError,
    create_debt_payment,
    delete_debt_payment,
    list_debt_payments,
    update_debt_payment,
)


def get_credit_card(db_session: Session, user_id: int) -> Debt:
    debt = db_session.scalar(
        select(Debt).where(
            Debt.user_id == user_id,
            Debt.name == "Credit Card",
        )
    )
    assert debt is not None
    return debt


def test_create_debt_payment_decreases_debt_balance(
    db_session: Session,
    financial_dataset: User,
) -> None:
    debt = get_credit_card(db_session, financial_dataset.id)

    payment = create_debt_payment(
        db_session,
        financial_dataset.id,
        DebtPaymentCreate(
            debt_id=debt.id,
            payment_date=date(2026, 4, 15),
            amount=Decimal("10000.00"),
            principal_amount=Decimal("8000.00"),
            interest_amount=Decimal("2000.00"),
            comment="April payment",
        ),
    )

    db_session.refresh(debt)

    assert payment.id is not None
    assert payment.amount == Decimal("10000.00")
    assert payment.principal_amount == Decimal("8000.00")
    assert payment.interest_amount == Decimal("2000.00")

    assert debt.principal_balance == Decimal("112000.00")


def test_create_debt_payment_rejects_too_large_principal(
    db_session: Session,
    financial_dataset: User,
) -> None:
    debt = get_credit_card(db_session, financial_dataset.id)

    with pytest.raises(DebtPaymentError):
        create_debt_payment(
            db_session,
            financial_dataset.id,
            DebtPaymentCreate(
                debt_id=debt.id,
                payment_date=date(2026, 4, 15),
                amount=Decimal("150000.00"),
                principal_amount=Decimal("130000.00"),
                interest_amount=Decimal("20000.00"),
                comment=None,
            ),
        )


def test_list_debt_payments_filters_by_debt_id(
    db_session: Session,
    financial_dataset: User,
) -> None:
    debt = get_credit_card(db_session, financial_dataset.id)

    create_debt_payment(
        db_session,
        financial_dataset.id,
        DebtPaymentCreate(
            debt_id=debt.id,
            payment_date=date(2026, 4, 15),
            amount=Decimal("10000.00"),
            principal_amount=Decimal("8000.00"),
            interest_amount=Decimal("2000.00"),
            comment=None,
        ),
    )

    payments = list_debt_payments(
        db_session,
        financial_dataset.id,
        debt_id=debt.id,
    )

    assert len(payments) == 1
    assert payments[0].debt_id == debt.id


def test_update_debt_payment_recalculates_debt_balance(
    db_session: Session,
    financial_dataset: User,
) -> None:
    debt = get_credit_card(db_session, financial_dataset.id)

    payment = create_debt_payment(
        db_session,
        financial_dataset.id,
        DebtPaymentCreate(
            debt_id=debt.id,
            payment_date=date(2026, 4, 15),
            amount=Decimal("10000.00"),
            principal_amount=Decimal("8000.00"),
            interest_amount=Decimal("2000.00"),
            comment=None,
        ),
    )

    db_session.refresh(debt)
    assert debt.principal_balance == Decimal("112000.00")

    updated = update_debt_payment(
        db_session,
        financial_dataset.id,
        payment.id,
        DebtPaymentUpdate(
            amount=Decimal("15000.00"),
            principal_amount=Decimal("12000.00"),
            interest_amount=Decimal("3000.00"),
            comment="Updated payment",
        ),
    )

    db_session.refresh(debt)

    assert updated.amount == Decimal("15000.00")
    assert updated.principal_amount == Decimal("12000.00")
    assert updated.interest_amount == Decimal("3000.00")
    assert updated.comment == "Updated payment"

    assert debt.principal_balance == Decimal("108000.00")


def test_delete_debt_payment_restores_debt_balance(
    db_session: Session,
    financial_dataset: User,
) -> None:
    debt = get_credit_card(db_session, financial_dataset.id)

    payment = create_debt_payment(
        db_session,
        financial_dataset.id,
        DebtPaymentCreate(
            debt_id=debt.id,
            payment_date=date(2026, 4, 15),
            amount=Decimal("10000.00"),
            principal_amount=Decimal("8000.00"),
            interest_amount=Decimal("2000.00"),
            comment=None,
        ),
    )

    db_session.refresh(debt)
    assert debt.principal_balance == Decimal("112000.00")

    delete_debt_payment(db_session, financial_dataset.id, payment.id)

    db_session.refresh(debt)
    assert debt.principal_balance == Decimal("120000.00")

    payments = list_debt_payments(db_session, financial_dataset.id)
    assert payments == []