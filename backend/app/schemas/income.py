from datetime import date as Date
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


IncomeType = Literal["regular", "irregular"]


class IncomeBase(BaseModel):
    amount: Decimal = Field(gt=0)
    date: Date
    category: str = Field(min_length=1, max_length=100)
    type: IncomeType
    comment: str | None = None


class IncomeCreate(IncomeBase):
    pass


class IncomeUpdate(BaseModel):
    amount: Decimal | None = Field(default=None, gt=0)
    date: Date | None = None
    category: str | None = Field(default=None, min_length=1, max_length=100)
    type: IncomeType | None = None
    comment: str | None = None


class IncomeRead(IncomeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}