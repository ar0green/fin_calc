from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
import calendar


MONEY_QUANT = Decimal("0.01")


def money(value: Decimal | int | float | str) -> Decimal:
    return Decimal(str(value)).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


def add_months(source_date: date, months: int) -> date:
    month = source_date.month - 1 + months
    year = source_date.year + month // 12
    month = month % 12 + 1
    day = min(source_date.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


@dataclass
class DebtState:
    debt_id: int
    debt_name: str
    debt_type: str
    balance: Decimal
    annual_interest_rate: Decimal
    minimum_monthly_payment: Decimal
    payoff_priority: int
    initial_balance: Decimal
    total_paid: Decimal = field(default_factory=lambda: Decimal("0"))
    total_interest_paid: Decimal = field(default_factory=lambda: Decimal("0"))
    payoff_month: int | None = None
    payoff_date: date | None = None

    @property
    def is_closed(self) -> bool:
        return self.balance <= Decimal("0.00")

    @property
    def monthly_rate(self) -> Decimal:
        return Decimal(self.annual_interest_rate) / Decimal("12") / Decimal("100")


def _sort_debts_for_strategy(debts: list[DebtState], strategy_type: str) -> list[DebtState]:
    active = [debt for debt in debts if not debt.is_closed]

    if strategy_type == "snowball":
        return sorted(
            active,
            key=lambda d: (
                money(d.balance),
                -money(d.annual_interest_rate),
                d.payoff_priority,
                d.debt_id,
            ),
        )

    if strategy_type == "avalanche":
        return sorted(
            active,
            key=lambda d: (
                -money(d.annual_interest_rate),
                money(d.balance),
                d.payoff_priority,
                d.debt_id,
            ),
        )

    raise ValueError(f"Unsupported strategy_type: {strategy_type}")


def _apply_payment(
    debt: DebtState,
    payment_amount: Decimal,
    month_index: int,
    month_date: date,
) -> Decimal:
    if debt.is_closed:
        return money(payment_amount)

    payment_amount = money(payment_amount)
    if payment_amount <= 0:
        return payment_amount

    actual_payment = min(payment_amount, money(debt.balance))
    debt.balance = money(debt.balance - actual_payment)
    debt.total_paid = money(debt.total_paid + actual_payment)

    if debt.is_closed and debt.payoff_month is None:
        debt.payoff_month = month_index
        debt.payoff_date = month_date

    return money(payment_amount - actual_payment)


def simulate_debt_strategy(
    *,
    debts_input: list[dict],
    strategy_type: str,
    start_date: date,
    extra_monthly_payment: Decimal,
    max_months: int,
) -> dict:
    debts: list[DebtState] = [
        DebtState(
            debt_id=item["debt_id"],
            debt_name=item["debt_name"],
            debt_type=item["debt_type"],
            balance=money(item["balance"]),
            annual_interest_rate=money(item["annual_interest_rate"]),
            minimum_monthly_payment=money(item["minimum_monthly_payment"]),
            payoff_priority=int(item["payoff_priority"]),
            initial_balance=money(item["balance"]),
        )
        for item in debts_input
        if money(item["balance"]) > Decimal("0.00")
    ]

    projection: list[dict] = []

    initial_total_balance = money(sum((d.balance for d in debts), Decimal("0")))
    total_interest_paid = Decimal("0")
    total_paid = Decimal("0")

    if not debts:
        return {
            "strategy_type": strategy_type,
            "start_date": start_date,
            "extra_monthly_payment": money(extra_monthly_payment),
            "months_simulated": 0,
            "paid_off": True,
            "payoff_date": start_date,
            "total_paid": money("0"),
            "total_interest_paid": money("0"),
            "total_overpayment": money("0"),
            "initial_total_balance": money("0"),
            "final_total_balance": money("0"),
            "debts": [],
            "projection": [],
        }

    extra_monthly_payment = money(extra_monthly_payment)

    for month_index in range(1, max_months + 1):
        month_date = add_months(start_date, month_index - 1)
        active_debts = [debt for debt in debts if not debt.is_closed]

        if not active_debts:
            break

        total_balance_start = money(sum((d.balance for d in active_debts), Decimal("0")))
        total_interest_accrued = Decimal("0")
        total_paid_this_month = Decimal("0")
        closed_debt_ids: list[int] = []

        # 1. Interest accrual
        for debt in active_debts:
            interest = money(debt.balance * debt.monthly_rate)
            if interest > 0:
                debt.balance = money(debt.balance + interest)
                debt.total_interest_paid = money(debt.total_interest_paid + interest)
                total_interest_paid = money(total_interest_paid + interest)
                total_interest_accrued = money(total_interest_accrued + interest)

        # 2. Minimum payments
        minimum_leftover_pool = Decimal("0")
        for debt in [d for d in debts if not d.is_closed]:
            planned_min_payment = money(debt.minimum_monthly_payment)
            before_balance = debt.balance
            leftover = _apply_payment(debt, planned_min_payment, month_index, month_date)
            paid_now = money(min(planned_min_payment, before_balance))
            total_paid_this_month = money(total_paid_this_month + paid_now)
            total_paid = money(total_paid + paid_now)
            minimum_leftover_pool = money(minimum_leftover_pool + leftover)

            if debt.is_closed and debt.debt_id not in closed_debt_ids:
                closed_debt_ids.append(debt.debt_id)

        # 3. Extra payment + leftovers from minimum payments
        extra_pool = money(extra_monthly_payment + minimum_leftover_pool)

        while extra_pool > Decimal("0.00"):
            targets = _sort_debts_for_strategy(debts, strategy_type)
            if not targets:
                break

            target = targets[0]
            before_balance = target.balance
            leftover = _apply_payment(target, extra_pool, month_index, month_date)
            paid_now = money(extra_pool - leftover)
            total_paid_this_month = money(total_paid_this_month + paid_now)
            total_paid = money(total_paid + paid_now)
            extra_pool = money(leftover)

            if target.is_closed and target.debt_id not in closed_debt_ids:
                closed_debt_ids.append(target.debt_id)

            if paid_now <= Decimal("0.00"):
                break

        total_balance_end = money(sum((d.balance for d in debts if not d.is_closed), Decimal("0")))

        projection.append(
            {
                "month_index": month_index,
                "month_date": month_date,
                "total_balance_start": total_balance_start,
                "total_interest_accrued": money(total_interest_accrued),
                "total_paid": money(total_paid_this_month),
                "total_balance_end": total_balance_end,
                "closed_debt_ids": sorted(closed_debt_ids),
            }
        )

    remaining_active = [debt for debt in debts if not debt.is_closed]
    paid_off = len(remaining_active) == 0
    payoff_date = max((debt.payoff_date for debt in debts if debt.payoff_date is not None), default=None)
    final_total_balance = money(sum((d.balance for d in debts if not d.is_closed), Decimal("0")))

    debt_results = [
        {
            "debt_id": debt.debt_id,
            "debt_name": debt.debt_name,
            "debt_type": debt.debt_type,
            "initial_balance": money(debt.initial_balance),
            "payoff_month": debt.payoff_month,
            "payoff_date": debt.payoff_date,
            "total_paid": money(debt.total_paid),
            "total_interest_paid": money(debt.total_interest_paid),
        }
        for debt in sorted(debts, key=lambda d: d.debt_id)
    ]

    return {
        "strategy_type": strategy_type,
        "start_date": start_date,
        "extra_monthly_payment": money(extra_monthly_payment),
        "months_simulated": len(projection),
        "paid_off": paid_off,
        "payoff_date": payoff_date,
        "total_paid": money(total_paid),
        "total_interest_paid": money(total_interest_paid),
        "total_overpayment": money(total_interest_paid),
        "initial_total_balance": money(initial_total_balance),
        "final_total_balance": money(final_total_balance),
        "debts": debt_results,
        "projection": projection,
    }