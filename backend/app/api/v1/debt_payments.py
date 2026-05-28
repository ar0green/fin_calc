from datetime import date as Date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.debt_payment import (
    DebtPaymentCreate,
    DebtPaymentRead,
    DebtPaymentUpdate,
)
from app.services.debt_payment_service import (
    DebtPaymentError,
    create_debt_payment,
    delete_debt_payment,
    get_debt_payment,
    list_debt_payments,
    update_debt_payment,
)

router = APIRouter(prefix="/debt-payments", tags=["debt-payments"])


@router.get("", response_model=list[DebtPaymentRead])
def read_debt_payments(
    debt_id: int | None = Query(default=None),
    date_from: Date | None = Query(default=None),
    date_to: Date | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DebtPaymentRead]:
    return list_debt_payments(
        db,
        current_user.id,
        debt_id=debt_id,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=DebtPaymentRead, status_code=status.HTTP_201_CREATED)
def create_payment(
    payload: DebtPaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DebtPaymentRead:
    try:
        return create_debt_payment(db, current_user.id, payload)
    except DebtPaymentError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get("/{payment_id}", response_model=DebtPaymentRead)
def read_debt_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DebtPaymentRead:
    try:
        return get_debt_payment(db, current_user.id, payment_id)
    except DebtPaymentError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.put("/{payment_id}", response_model=DebtPaymentRead)
def update_payment(
    payment_id: int,
    payload: DebtPaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DebtPaymentRead:
    try:
        return update_debt_payment(db, current_user.id, payment_id, payload)
    except DebtPaymentError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    try:
        delete_debt_payment(db, current_user.id, payment_id)
    except DebtPaymentError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc