from datetime import date
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    DebtDynamicsResponse,
    ExpenseStructureResponse,
    IncomeExpenseByMonthResponse,
)
from app.services.analytics_service import (
    build_analytics_overview,
    build_debt_dynamics,
    build_expense_structure,
    build_income_expense_by_month,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


def validate_period(date_from: date, date_to: date) -> None:
    if date_from > date_to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="date_from must be less than or equal to date_to",
        )


@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(
    date_from: date = Query(...),
    date_to: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnalyticsOverviewResponse:
    validate_period(date_from, date_to)

    result = build_analytics_overview(
        db,
        current_user.id,
        date_from=date_from,
        date_to=date_to,
    )
    return AnalyticsOverviewResponse.model_validate(result)


@router.get("/income-expense-by-month", response_model=IncomeExpenseByMonthResponse)
def get_income_expense_by_month(
    date_from: date = Query(...),
    date_to: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IncomeExpenseByMonthResponse:
    validate_period(date_from, date_to)

    result = build_income_expense_by_month(
        db,
        current_user.id,
        date_from=date_from,
        date_to=date_to,
    )
    return IncomeExpenseByMonthResponse.model_validate(result)


@router.get("/expense-structure", response_model=ExpenseStructureResponse)
def get_expense_structure(
    date_from: date = Query(...),
    date_to: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseStructureResponse:
    validate_period(date_from, date_to)

    result = build_expense_structure(
        db,
        current_user.id,
        date_from=date_from,
        date_to=date_to,
    )
    return ExpenseStructureResponse.model_validate(result)


@router.get("/debt-dynamics", response_model=DebtDynamicsResponse)
def get_debt_dynamics(
    start_date: date = Query(...),
    strategy_type: Literal["snowball", "avalanche"] = Query(default="avalanche"),
    extra_monthly_payment: Decimal = Query(default=Decimal("0"), ge=0),
    max_months: int = Query(default=120, ge=1, le=1200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DebtDynamicsResponse:
    result = build_debt_dynamics(
        db,
        current_user.id,
        strategy_type=strategy_type,
        start_date=start_date,
        extra_monthly_payment=extra_monthly_payment,
        max_months=max_months,
    )
    return DebtDynamicsResponse.model_validate(result)