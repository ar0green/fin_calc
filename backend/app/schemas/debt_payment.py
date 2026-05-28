from datetime import date as Date
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator


class DebtPaymentBase(BaseModel):
    debt_id: int
    payment_date: Date

    amount: Decimal = Field(gt=0)
    principal_amount: Decimal = Field(ge=0)
    interest_amount: Decimal = Field(ge=0)

    comment: str | None = None

    @model_validator(mode="after")
    def validate_amount_parts(self) -> "DebtPaymentBase":
        if self.principal_amount + self.interest_amount != self.amount:
            raise ValueError("principal_amount + interest_amount must equal amount")

        return self


class DebtPaymentCreate(DebtPaymentBase):
    pass


class DebtPaymentUpdate(BaseModel):
    debt_id: int | None = None
    payment_date: Date | None = None

    amount: Decimal | None = Field(default=None, gt=0)
    principal_amount: Decimal | None = Field(default=None, ge=0)
    interest_amount: Decimal | None = Field(default=None, ge=0)

    comment: str | None = None

    @model_validator(mode="after")
    def validate_amount_parts(self) -> "DebtPaymentUpdate":
        values = [self.amount, self.principal_amount, self.interest_amount]

        if all(value is None for value in values):
            return self

        if any(value is None for value in values):
            raise ValueError(
                "amount, principal_amount and interest_amount must be provided together"
            )

        if self.principal_amount + self.interest_amount != self.amount:
            raise ValueError("principal_amount + interest_amount must equal amount")

        return self


class DebtPaymentRead(BaseModel):
    id: int
    debt_id: int
    payment_date: Date

    amount: Decimal
    principal_amount: Decimal
    interest_amount: Decimal

    comment: str | None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}