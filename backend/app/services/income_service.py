from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.income import Income
from app.schemas.income import IncomeCreate, IncomeUpdate


def list_incomes(
    db: Session,
    user_id: int,
    *,
    date_from: date | None = None,
    date_to: date | None = None,
    category: str | None = None,
    income_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Income]:
    stmt = select(Income).where(Income.user_id == user_id)

    if date_from:
        stmt = stmt.where(Income.date >= date_from)
    if date_to:
        stmt = stmt.where(Income.date <= date_to)
    if category:
        stmt = stmt.where(Income.category == category)
    if income_type:
        stmt = stmt.where(Income.type == income_type)

    stmt = stmt.order_by(Income.date.desc(), Income.id.desc()).limit(limit).offset(offset)
    return list(db.scalars(stmt).all())


def get_income_or_404(db: Session, user_id: int, income_id: int) -> Income:
    item = db.scalar(
        select(Income).where(
            Income.id == income_id,
            Income.user_id == user_id,
        )
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income not found")
    return item


def create_income(db: Session, user_id: int, payload: IncomeCreate) -> Income:
    item = Income(
        user_id=user_id,
        amount=payload.amount,
        date=payload.date,
        category=payload.category,
        type=payload.type,
        comment=payload.comment,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_income(db: Session, item: Income, payload: IncomeUpdate) -> Income:
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_income(db: Session, item: Income) -> None:
    db.delete(item)
    db.commit()