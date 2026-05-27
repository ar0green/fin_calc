from datetime import date as Date
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


ExpenseType = Literal["mandatory", "variable"]
RecurrenceType = Literal["none", "monthly"]


class ExpenseBase(BaseModel):
    amount: Decimal = Field(gt=0)
    date: Date
    category: str = Field(min_length=1, max_length=100)
    type: ExpenseType
    recurrence_type: RecurrenceType = "none"
    comment: str | None = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    amount: Decimal | None = Field(default=None, gt=0)
    date: Date | None = None
    category: str | None = Field(default=None, min_length=1, max_length=100)
    type: ExpenseType | None = None
    recurrence_type: RecurrenceType | None = None
    comment: str | None = None


class ExpenseRead(ExpenseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}