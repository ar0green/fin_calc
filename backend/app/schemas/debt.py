from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class DebtBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    debt_type: str = Field(min_length=1, max_length=50)
    principal_balance: Decimal = Field(gt=0)
    annual_interest_rate: Decimal = Field(ge=0, le=1000)
    minimum_monthly_payment: Decimal = Field(gt=0)
    due_day: int = Field(ge=1, le=31)
    early_repayment_allowed: bool = True
    payoff_priority: int = Field(default=100, ge=1, le=1000)
    is_active: bool = True
    comment: str | None = None


class DebtCreate(DebtBase):
    pass


class DebtUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    debt_type: str | None = Field(default=None, min_length=1, max_length=50)
    principal_balance: Decimal | None = Field(default=None, gt=0)
    annual_interest_rate: Decimal | None = Field(default=None, ge=0, le=1000)
    minimum_monthly_payment: Decimal | None = Field(default=None, gt=0)
    due_day: int | None = Field(default=None, ge=1, le=31)
    early_repayment_allowed: bool | None = None
    payoff_priority: int | None = Field(default=None, ge=1, le=1000)
    is_active: bool | None = None
    comment: str | None = None


class DebtRead(DebtBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}