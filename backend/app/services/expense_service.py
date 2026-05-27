from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


def list_expenses(
    db: Session,
    user_id: int,
    *,
    date_from: date | None = None,
    date_to: date | None = None,
    category: str | None = None,
    expense_type: str | None = None,
    recurrence_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Expense]:
    stmt = select(Expense).where(Expense.user_id == user_id)

    if date_from:
        stmt = stmt.where(Expense.date >= date_from)
    if date_to:
        stmt = stmt.where(Expense.date <= date_to)
    if category:
        stmt = stmt.where(Expense.category == category)
    if expense_type:
        stmt = stmt.where(Expense.type == expense_type)
    if recurrence_type:
        stmt = stmt.where(Expense.recurrence_type == recurrence_type)

    stmt = stmt.order_by(Expense.date.desc(), Expense.id.desc()).limit(limit).offset(offset)
    return list(db.scalars(stmt).all())


def get_expense_or_404(db: Session, user_id: int, expense_id: int) -> Expense:
    item = db.scalar(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.user_id == user_id,
        )
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return item


def create_expense(db: Session, user_id: int, payload: ExpenseCreate) -> Expense:
    item = Expense(
        user_id=user_id,
        amount=payload.amount,
        date=payload.date,
        category=payload.category,
        type=payload.type,
        recurrence_type=payload.recurrence_type,
        comment=payload.comment,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_expense(db: Session, item: Expense, payload: ExpenseUpdate) -> Expense:
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_expense(db: Session, item: Expense) -> None:
    db.delete(item)
    db.commit()