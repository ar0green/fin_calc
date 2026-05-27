from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.calculation import (
    CashflowResponse,
    DebtStrategyRequest,
    DebtStrategyResponse,
    ScenarioCompareRequest,
    ScenarioCompareResponse,
    SummaryResponse,
)
from app.services.calculation_service import (
    build_cashflow,
    build_debt_strategy,
    build_scenario_compare,
    build_summary,
)

router = APIRouter(prefix="/calculations", tags=["calculations"])


def validate_period(date_from: date, date_to: date) -> None:
    if date_from > date_to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="date_from must be less than or equal to date_to",
        )


@router.get("/summary", response_model=SummaryResponse)
def get_summary(
    date_from: date = Query(...),
    date_to: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SummaryResponse:
    validate_period(date_from, date_to)
    result = build_summary(
        db,
        current_user.id,
        date_from=date_from,
        date_to=date_to,
    )
    return SummaryResponse.model_validate(result)


@router.get("/cashflow", response_model=CashflowResponse)
def get_cashflow(
    date_from: date = Query(...),
    date_to: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CashflowResponse:
    validate_period(date_from, date_to)
    result = build_cashflow(
        db,
        current_user.id,
        date_from=date_from,
        date_to=date_to,
    )
    return CashflowResponse.model_validate(result)


@router.post("/debt-strategy", response_model=DebtStrategyResponse)
def calculate_debt_strategy(
    payload: DebtStrategyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DebtStrategyResponse:
    result = build_debt_strategy(
        db,
        current_user.id,
        strategy_type=payload.strategy_type,
        start_date=payload.start_date,
        extra_monthly_payment=payload.extra_monthly_payment,
        max_months=payload.max_months,
    )
    return DebtStrategyResponse.model_validate(result)


@router.post("/scenario-compare", response_model=ScenarioCompareResponse)
def calculate_scenario_compare(
    payload: ScenarioCompareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScenarioCompareResponse:
    result = build_scenario_compare(
        db,
        current_user.id,
        start_date=payload.start_date,
        max_months=payload.max_months,
        scenarios=[item.model_dump() for item in payload.scenarios],
    )
    return ScenarioCompareResponse.model_validate(result)