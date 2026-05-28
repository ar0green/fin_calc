from datetime import date as Date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculators.cashflow import money
from app.db.models.debt import Debt
from app.db.models.debt_payment import DebtPayment
from app.schemas.debt_payment import DebtPaymentCreate, DebtPaymentUpdate


class DebtPaymentError(ValueError):
    pass


def _get_user_debt(db: Session, user_id: int, debt_id: int) -> Debt:
    debt = db.scalar(
        select(Debt).where(
            Debt.id == debt_id,
            Debt.user_id == user_id,
        )
    )

    if not debt:
        raise DebtPaymentError("Debt not found")

    return debt


def get_debt_payment(
    db: Session,
    user_id: int,
    payment_id: int,
) -> DebtPayment:
    payment = db.scalar(
        select(DebtPayment).where(
            DebtPayment.id == payment_id,
            DebtPayment.user_id == user_id,
        )
    )

    if not payment:
        raise DebtPaymentError("Debt payment not found")

    return payment


def list_debt_payments(
    db: Session,
    user_id: int,
    *,
    debt_id: int | None = None,
    date_from: Date | None = None,
    date_to: Date | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[DebtPayment]:
    statement = select(DebtPayment).where(DebtPayment.user_id == user_id)

    if debt_id is not None:
        statement = statement.where(DebtPayment.debt_id == debt_id)

    if date_from is not None:
        statement = statement.where(DebtPayment.payment_date >= date_from)

    if date_to is not None:
        statement = statement.where(DebtPayment.payment_date <= date_to)

    statement = (
        statement.order_by(DebtPayment.payment_date.desc(), DebtPayment.id.desc())
        .limit(limit)
        .offset(offset)
    )

    return list(db.scalars(statement).all())


def create_debt_payment(
    db: Session,
    user_id: int,
    payload: DebtPaymentCreate,
) -> DebtPayment:
    debt = _get_user_debt(db, user_id, payload.debt_id)

    principal_amount = money(payload.principal_amount)

    if principal_amount > money(debt.principal_balance):
        raise DebtPaymentError("Principal amount cannot exceed current debt balance")

    payment = DebtPayment(
        user_id=user_id,
        debt_id=payload.debt_id,
        payment_date=payload.payment_date,
        amount=money(payload.amount),
        principal_amount=principal_amount,
        interest_amount=money(payload.interest_amount),
        comment=payload.comment,
    )

    debt.principal_balance = money(debt.principal_balance - principal_amount)

    db.add(payment)
    db.add(debt)
    db.commit()
    db.refresh(payment)

    return payment


def update_debt_payment(
    db: Session,
    user_id: int,
    payment_id: int,
    payload: DebtPaymentUpdate,
) -> DebtPayment:
    payment = get_debt_payment(db, user_id, payment_id)

    old_debt = _get_user_debt(db, user_id, payment.debt_id)

    new_debt_id = payload.debt_id if payload.debt_id is not None else payment.debt_id
    new_debt = _get_user_debt(db, user_id, new_debt_id)

    old_principal_amount = money(payment.principal_amount)

    new_principal_amount = (
        money(payload.principal_amount)
        if payload.principal_amount is not None
        else old_principal_amount
    )

    # Сначала возвращаем старый principal в старый долг.
    old_debt.principal_balance = money(old_debt.principal_balance + old_principal_amount)

    # Потом проверяем, можем ли списать новый principal с нового долга.
    if new_principal_amount > money(new_debt.principal_balance):
        raise DebtPaymentError("Principal amount cannot exceed current debt balance")

    new_debt.principal_balance = money(new_debt.principal_balance - new_principal_amount)

    if payload.debt_id is not None:
        payment.debt_id = payload.debt_id

    if payload.payment_date is not None:
        payment.payment_date = payload.payment_date

    if payload.amount is not None:
        payment.amount = money(payload.amount)

    if payload.principal_amount is not None:
        payment.principal_amount = new_principal_amount

    if payload.interest_amount is not None:
        payment.interest_amount = money(payload.interest_amount)

    if payload.comment is not None:
        payment.comment = payload.comment

    db.add(payment)
    db.add(old_debt)
    db.add(new_debt)
    db.commit()
    db.refresh(payment)

    return payment


def delete_debt_payment(
    db: Session,
    user_id: int,
    payment_id: int,
) -> None:
    payment = get_debt_payment(db, user_id, payment_id)
    debt = _get_user_debt(db, user_id, payment.debt_id)

    debt.principal_balance = money(debt.principal_balance + payment.principal_amount)

    db.delete(payment)
    db.add(debt)
    db.commit()