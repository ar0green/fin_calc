from datetime import date as Date
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class CategoryBudgetBase(BaseModel):
    category: str = Field(min_length=1, max_length=100)
    monthly_limit: Decimal = Field(gt=0)
    start_month: Date
    is_active: bool = True
    comment: str | None = None

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str) -> str:
        return value.strip()


class CategoryBudgetCreate(CategoryBudgetBase):
    pass


class CategoryBudgetUpdate(BaseModel):
    category: str | None = Field(default=None, min_length=1, max_length=100)
    monthly_limit: Decimal | None = Field(default=None, gt=0)
    start_month: Date | None = None
    is_active: bool | None = None
    comment: str | None = None

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str | None) -> str | None:
        if value is None:
            return None

        return value.strip()


class CategoryBudgetRead(BaseModel):
    id: int
    category: str
    monthly_limit: Decimal
    start_month: Date
    is_active: bool
    comment: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BudgetCategorySummaryItem(BaseModel):
    category: str
    budget_limit: Decimal
    actual_amount: Decimal
    remaining_amount: Decimal
    usage_percent: Decimal
    is_over_budget: bool


class MonthlyBudgetSummaryResponse(BaseModel):
    month: str
    date_from: Date
    date_to: Date

    total_budget_limit: Decimal
    total_actual_amount: Decimal
    total_remaining_amount: Decimal
    total_usage_percent: Decimal

    items: list[BudgetCategorySummaryItem]