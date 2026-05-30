from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


SafetyBufferType = Literal["percent", "fixed"]
DebtStrategyType = Literal["snowball", "avalanche"]


class MonthlyPlanPeriod(BaseModel):
    month: str
    date_from: date
    date_to: date


class MonthlyPlanExpenseCategory(BaseModel):
    category: str
    amount: Decimal
    percent: Decimal


class MonthlyPlanDebtItem(BaseModel):
    debt_id: int
    name: str
    debt_type: str
    principal_balance: Decimal
    annual_interest_rate: Decimal
    minimum_monthly_payment: Decimal
    due_day: int
    payoff_priority: int


class MonthlyPlanScenarioImpact(BaseModel):
    strategy_type: DebtStrategyType
    max_months: int

    baseline_months_simulated: int
    baseline_paid_off: bool
    baseline_payoff_date: date | None
    baseline_total_interest_paid: Decimal
    baseline_total_paid: Decimal

    recommended_months_simulated: int
    recommended_paid_off: bool
    recommended_payoff_date: date | None
    recommended_total_interest_paid: Decimal
    recommended_total_paid: Decimal

    months_saved: int | None
    interest_saved: Decimal | None
    total_paid_saved: Decimal | None

class MonthlyPlanIncomeItem(BaseModel):
    income_id: int
    category: str
    amount: Decimal
    source_type: Literal["regular", "irregular"]
    original_date: date
    comment: str | None = None


class MonthlyPlanExpenseItem(BaseModel):
    expense_id: int
    category: str
    amount: Decimal
    expense_type: Literal["mandatory", "variable"]
    recurrence_type: Literal["none", "monthly"]
    original_date: date
    comment: str | None = None
    
class MonthlyPlanResponse(BaseModel):
    period: MonthlyPlanPeriod

    total_income: Decimal
    income_regular: Decimal
    income_irregular: Decimal

    mandatory_expenses: Decimal
    variable_expenses: Decimal
    total_expenses: Decimal
    expenses_recurring: Decimal
    expenses_one_time: Decimal

    minimum_debt_payments: Decimal

    free_cash: Decimal
    debt_payoff_capacity: Decimal

    safety_buffer_type: SafetyBufferType
    safety_buffer_value: Decimal
    safety_buffer: Decimal
    
    budget_overrun_total: Decimal
    recommended_extra_payment_before_budget_adjustment: Decimal
    budget_adjustment_applied: bool

    recommended_extra_payment: Decimal
    remaining_after_recommended_extra_payment: Decimal

    active_debt_balance: Decimal
    active_debt_count: int

    recommended_debt_target_id: int | None
    recommended_debt_target_name: str | None

    scenario_impact: MonthlyPlanScenarioImpact | None

    expense_categories: list[MonthlyPlanExpenseCategory]
    active_debts: list[MonthlyPlanDebtItem]

    income_items: list[MonthlyPlanIncomeItem]
    expense_items: list[MonthlyPlanExpenseItem]