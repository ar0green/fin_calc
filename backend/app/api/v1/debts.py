from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, pagination_params
from app.db.models.user import User
from app.schemas.debt import DebtCreate, DebtRead, DebtUpdate
from app.services.debt_service import (
    create_debt,
    delete_debt,
    get_debt_or_404,
    list_debts,
    update_debt,
)

router = APIRouter(prefix="/debts", tags=["debts"])


@router.get("", response_model=list[DebtRead])
def get_debts(
    is_active: bool | None = Query(default=None),
    debt_type: str | None = Query(default=None),
    pagination: tuple[int, int] = Depends(pagination_params),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DebtRead]:
    limit, offset = pagination
    items = list_debts(
        db,
        current_user.id,
        is_active=is_active,
        debt_type=debt_type,
        limit=limit,
        offset=offset,
    )
    return [DebtRead.model_validate(item) for item in items]


@router.post("", response_model=DebtRead, status_code=status.HTTP_201_CREATED)
def create_debt_endpoint(
    payload: DebtCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DebtRead:
    item = create_debt(db, current_user.id, payload)
    return DebtRead.model_validate(item)


@router.get("/{debt_id}", response_model=DebtRead)
def get_debt(
    debt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DebtRead:
    item = get_debt_or_404(db, current_user.id, debt_id)
    return DebtRead.model_validate(item)


@router.put("/{debt_id}", response_model=DebtRead)
def update_debt_endpoint(
    debt_id: int,
    payload: DebtUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DebtRead:
    item = get_debt_or_404(db, current_user.id, debt_id)
    updated = update_debt(db, item, payload)
    return DebtRead.model_validate(updated)


@router.delete("/{debt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_debt_endpoint(
    debt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    item = get_debt_or_404(db, current_user.id, debt_id)
    delete_debt(db, item)
    return Response(status_code=status.HTTP_204_NO_CONTENT)