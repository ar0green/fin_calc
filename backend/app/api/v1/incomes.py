from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, pagination_params
from app.db.models.user import User
from app.schemas.income import IncomeCreate, IncomeRead, IncomeUpdate
from app.services.income_service import (
    create_income,
    delete_income,
    get_income_or_404,
    list_incomes,
    update_income,
)

router = APIRouter(prefix="/incomes", tags=["incomes"])


@router.get("", response_model=list[IncomeRead])
def get_incomes(
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    category: str | None = Query(default=None),
    type: Literal["regular", "irregular"] | None = Query(default=None),
    pagination: tuple[int, int] = Depends(pagination_params),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[IncomeRead]:
    limit, offset = pagination
    items = list_incomes(
        db,
        current_user.id,
        date_from=date_from,
        date_to=date_to,
        category=category,
        income_type=type,
        limit=limit,
        offset=offset,
    )
    return [IncomeRead.model_validate(item) for item in items]


@router.post("", response_model=IncomeRead, status_code=status.HTTP_201_CREATED)
def create_income_endpoint(
    payload: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IncomeRead:
    item = create_income(db, current_user.id, payload)
    return IncomeRead.model_validate(item)


@router.get("/{income_id}", response_model=IncomeRead)
def get_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IncomeRead:
    item = get_income_or_404(db, current_user.id, income_id)
    return IncomeRead.model_validate(item)


@router.put("/{income_id}", response_model=IncomeRead)
def update_income_endpoint(
    income_id: int,
    payload: IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IncomeRead:
    item = get_income_or_404(db, current_user.id, income_id)
    updated = update_income(db, item, payload)
    return IncomeRead.model_validate(updated)


@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income_endpoint(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    item = get_income_or_404(db, current_user.id, income_id)
    delete_income(db, item)
    return Response(status_code=status.HTTP_204_NO_CONTENT)