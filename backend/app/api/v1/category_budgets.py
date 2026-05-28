from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.category_budget import (
    BudgetCategorySummaryItem,
    CategoryBudgetCreate,
    CategoryBudgetRead,
    CategoryBudgetUpdate,
    MonthlyBudgetSummaryResponse,
)
from app.services.category_budget_service import (
    CategoryBudgetError,
    build_monthly_budget_summary,
    create_category_budget,
    delete_category_budget,
    get_category_budget,
    list_category_budgets,
    update_category_budget,
)

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("/category-budgets", response_model=list[CategoryBudgetRead])
def read_category_budgets(
    is_active: bool | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CategoryBudgetRead]:
    return list_category_budgets(
        db,
        current_user.id,
        is_active=is_active,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/category-budgets",
    response_model=CategoryBudgetRead,
    status_code=status.HTTP_201_CREATED,
)
def create_budget(
    payload: CategoryBudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryBudgetRead:
    return create_category_budget(db, current_user.id, payload)


@router.get("/category-budgets/{budget_id}", response_model=CategoryBudgetRead)
def read_category_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryBudgetRead:
    try:
        return get_category_budget(db, current_user.id, budget_id)
    except CategoryBudgetError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.put("/category-budgets/{budget_id}", response_model=CategoryBudgetRead)
def update_budget(
    budget_id: int,
    payload: CategoryBudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryBudgetRead:
    try:
        return update_category_budget(db, current_user.id, budget_id, payload)
    except CategoryBudgetError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.delete("/category-budgets/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    try:
        delete_category_budget(db, current_user.id, budget_id)
    except CategoryBudgetError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get("/monthly-summary", response_model=MonthlyBudgetSummaryResponse)
def read_monthly_budget_summary(
    month: str = Query(..., description="Month in YYYY-MM format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonthlyBudgetSummaryResponse:
    try:
        result = build_monthly_budget_summary(
            db,
            current_user.id,
            month=month,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return MonthlyBudgetSummaryResponse.model_validate(result)