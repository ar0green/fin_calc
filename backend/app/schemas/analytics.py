from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


DebtStrategyType = Literal["snowball", "avalanche"]


class AnalyticsPeriod(BaseModel):
    date_from: date
    date_to: date


class TopExpenseCategoryItem(BaseModel):
    category: str
    amount: Decimal
    percent: Decimal


class AnalyticsOverviewResponse(BaseModel):
    period: AnalyticsPeriod

    total_income: Decimal
    total_expenses: Decimal
    mandatory_expenses: Decimal
    variable_expenses: Decimal
    minimum_debt_payments: Decimal

    free_cash: Decimal
    debt_payoff_capacity: Decimal

    active_debt_balance: Decimal
    active_debt_count: int
    debt_to_income_ratio_percent: Decimal | None

    top_expense_categories: list[TopExpenseCategoryItem]


class IncomeExpenseByMonthItem(BaseModel):
    month: date
    income: Decimal
    expenses: Decimal
    cashflow: Decimal


class IncomeExpenseByMonthResponse(BaseModel):
    period: AnalyticsPeriod
    items: list[IncomeExpenseByMonthItem]


class ExpenseStructureItem(BaseModel):
    category: str
    amount: Decimal
    percent: Decimal


class ExpenseStructureResponse(BaseModel):
    period: AnalyticsPeriod
    total_expenses: Decimal
    items: list[ExpenseStructureItem]


class DebtDynamicsRequestParams(BaseModel):
    strategy_type: DebtStrategyType = "avalanche"
    start_date: date
    extra_monthly_payment: Decimal = Field(default=0, ge=0)
    max_months: int = Field(default=120, ge=1, le=1200)


class DebtDynamicsMonthItem(BaseModel):
    month_index: int
    month_date: date
    total_balance_start: Decimal
    total_interest_accrued: Decimal
    total_paid: Decimal
    total_balance_end: Decimal
    closed_debt_ids: list[int]


class DebtDynamicsResponse(BaseModel):
    strategy_type: DebtStrategyType
    start_date: date
    extra_monthly_payment: Decimal
    paid_off: bool
    payoff_date: date | None
    months_simulated: int
    initial_total_balance: Decimal
    final_total_balance: Decimal
    total_paid: Decimal
    total_interest_paid: Decimal
    items: list[DebtDynamicsMonthItem]

class DebtPaymentMonthlyItem(BaseModel):
    month: date
    total_paid: Decimal
    principal_paid: Decimal
    interest_paid: Decimal


class DebtPaymentByDebtItem(BaseModel):
    debt_id: int
    debt_name: str
    debt_type: str
    total_paid: Decimal
    principal_paid: Decimal
    interest_paid: Decimal


class DebtPaymentsSummaryResponse(BaseModel):
    date_from: date
    date_to: date

    total_paid: Decimal
    principal_paid: Decimal
    interest_paid: Decimal
    interest_share_percent: Decimal

    monthly_items: list[DebtPaymentMonthlyItem]
    by_debt_items: list[DebtPaymentByDebtItem]