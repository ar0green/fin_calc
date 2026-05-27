from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.debt import Debt
from app.schemas.debt import DebtCreate, DebtUpdate


def list_debts(
    db: Session,
    user_id: int,
    *,
    is_active: bool | None = None,
    debt_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Debt]:
    stmt = select(Debt).where(Debt.user_id == user_id)

    if is_active is not None:
        stmt = stmt.where(Debt.is_active == is_active)
    if debt_type:
        stmt = stmt.where(Debt.debt_type == debt_type)

    stmt = stmt.order_by(Debt.is_active.desc(), Debt.payoff_priority.asc(), Debt.id.desc()).limit(limit).offset(offset)
    return list(db.scalars(stmt).all())


def get_debt_or_404(db: Session, user_id: int, debt_id: int) -> Debt:
    item = db.scalar(
        select(Debt).where(
            Debt.id == debt_id,
            Debt.user_id == user_id,
        )
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debt not found")
    return item


def create_debt(db: Session, user_id: int, payload: DebtCreate) -> Debt:
    item = Debt(
        user_id=user_id,
        name=payload.name,
        debt_type=payload.debt_type,
        principal_balance=payload.principal_balance,
        annual_interest_rate=payload.annual_interest_rate,
        minimum_monthly_payment=payload.minimum_monthly_payment,
        due_day=payload.due_day,
        early_repayment_allowed=payload.early_repayment_allowed,
        payoff_priority=payload.payoff_priority,
        is_active=payload.is_active,
        comment=payload.comment,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_debt(db: Session, item: Debt, payload: DebtUpdate) -> Debt:
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_debt(db: Session, item: Debt) -> None:
    db.delete(item)
    db.commit()