from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, pagination_params
from app.db.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseRead, ExpenseUpdate
from app.services.expense_service import (
    create_expense,
    delete_expense,
    get_expense_or_404,
    list_expenses,
    update_expense,
)

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseRead])
def get_expenses(
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    category: str | None = Query(default=None),
    type: Literal["mandatory", "variable"] | None = Query(default=None),
    recurrence_type: Literal["none", "monthly"] | None = Query(default=None),
    pagination: tuple[int, int] = Depends(pagination_params),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ExpenseRead]:
    limit, offset = pagination
    items = list_expenses(
        db,
        current_user.id,
        date_from=date_from,
        date_to=date_to,
        category=category,
        expense_type=type,
        recurrence_type=recurrence_type,
        limit=limit,
        offset=offset,
    )
    return [ExpenseRead.model_validate(item) for item in items]


@router.post("", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense_endpoint(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseRead:
    item = create_expense(db, current_user.id, payload)
    return ExpenseRead.model_validate(item)


@router.get("/{expense_id}", response_model=ExpenseRead)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseRead:
    item = get_expense_or_404(db, current_user.id, expense_id)
    return ExpenseRead.model_validate(item)


@router.put("/{expense_id}", response_model=ExpenseRead)
def update_expense_endpoint(
    expense_id: int,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseRead:
    item = get_expense_or_404(db, current_user.id, expense_id)
    updated = update_expense(db, item, payload)
    return ExpenseRead.model_validate(updated)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense_endpoint(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    item = get_expense_or_404(db, current_user.id, expense_id)
    delete_expense(db, item)
    return Response(status_code=status.HTTP_204_NO_CONTENT)