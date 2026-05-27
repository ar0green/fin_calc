from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class CalculationPeriod(BaseModel):
    date_from: date
    date_to: date


class SummaryResponse(BaseModel):
    period: CalculationPeriod
    total_income: Decimal
    total_expenses: Decimal
    mandatory_expenses: Decimal
    variable_expenses: Decimal
    minimum_debt_payments: Decimal
    free_cash: Decimal
    debt_payoff_capacity: Decimal
    active_debt_balance: Decimal


class CashflowResponse(BaseModel):
    period: CalculationPeriod
    total_income: Decimal
    mandatory_expenses: Decimal
    variable_expenses: Decimal
    minimum_debt_payments: Decimal
    total_outflow: Decimal
    net_cashflow: Decimal
    free_cash: Decimal
    debt_payoff_capacity: Decimal


DebtStrategyType = Literal["snowball", "avalanche"]


class DebtStrategyRequest(BaseModel):
    strategy_type: DebtStrategyType
    start_date: date
    extra_monthly_payment: Decimal = Field(default=0, ge=0)
    max_months: int = Field(default=240, ge=1, le=1200)


class DebtProjectionDebtResult(BaseModel):
    debt_id: int
    debt_name: str
    debt_type: str
    initial_balance: Decimal
    payoff_month: int | None
    payoff_date: date | None
    total_paid: Decimal
    total_interest_paid: Decimal


class DebtProjectionMonthItem(BaseModel):
    month_index: int
    month_date: date
    total_balance_start: Decimal
    total_interest_accrued: Decimal
    total_paid: Decimal
    total_balance_end: Decimal
    closed_debt_ids: list[int]


class DebtStrategyResponse(BaseModel):
    strategy_type: DebtStrategyType
    start_date: date
    extra_monthly_payment: Decimal
    months_simulated: int
    paid_off: bool
    payoff_date: date | None
    total_paid: Decimal
    total_interest_paid: Decimal
    total_overpayment: Decimal
    initial_total_balance: Decimal
    final_total_balance: Decimal
    debts: list[DebtProjectionDebtResult]
    projection: list[DebtProjectionMonthItem]


class ScenarioCompareItem(BaseModel):
    strategy_type: DebtStrategyType
    extra_monthly_payment: Decimal = Field(default=0, ge=0)


class ScenarioCompareRequest(BaseModel):
    start_date: date
    max_months: int = Field(default=240, ge=1, le=1200)
    scenarios: list[ScenarioCompareItem] = Field(min_length=2, max_length=10)


class ScenarioCompareResult(BaseModel):
    label: str
    strategy_type: DebtStrategyType
    extra_monthly_payment: Decimal
    months_simulated: int
    paid_off: bool
    payoff_date: date | None
    total_paid: Decimal
    total_interest_paid: Decimal
    total_overpayment: Decimal
    initial_total_balance: Decimal
    final_total_balance: Decimal


class ScenarioCompareDelta(BaseModel):
    base_label: str
    compared_label: str
    months_saved: int | None
    interest_saved: Decimal | None
    total_paid_saved: Decimal | None


class ScenarioCompareResponse(BaseModel):
    start_date: date
    max_months: int
    baseline: ScenarioCompareResult
    scenarios: list[ScenarioCompareResult]
    deltas_vs_baseline: list[ScenarioCompareDelta]