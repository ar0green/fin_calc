from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.planning import MonthlyPlanResponse
from app.services.planning_service import build_monthly_plan

router = APIRouter(prefix="/planning", tags=["planning"])


@router.get("/monthly-plan", response_model=MonthlyPlanResponse)
def get_monthly_plan(
    month: str = Query(..., description="Month in YYYY-MM format"),
    safety_buffer_type: Literal["percent", "fixed"] = Query(default="percent"),
    safety_buffer_value: Decimal = Query(default=Decimal("10"), ge=0),
    strategy_type: Literal["snowball", "avalanche"] = Query(default="avalanche"),
    max_months: int = Query(default=240, ge=1, le=1200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonthlyPlanResponse:
    try:
        result = build_monthly_plan(
            db,
            current_user.id,
            month=month,
            safety_buffer_type=safety_buffer_type,
            safety_buffer_value=safety_buffer_value,
            strategy_type=strategy_type,
            max_months=max_months,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return MonthlyPlanResponse.model_validate(result)