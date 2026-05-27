from decimal import Decimal, ROUND_HALF_UP

MONEY_QUANT = Decimal("0.01")


def money(value: Decimal | int | float | str) -> Decimal:
    return Decimal(str(value)).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


def calculate_summary(
    *,
    total_income: Decimal,
    mandatory_expenses: Decimal,
    variable_expenses: Decimal,
    minimum_debt_payments: Decimal,
    active_debt_balance: Decimal,
) -> dict[str, Decimal]:
    total_income = money(total_income)
    mandatory_expenses = money(mandatory_expenses)
    variable_expenses = money(variable_expenses)
    minimum_debt_payments = money(minimum_debt_payments)
    active_debt_balance = money(active_debt_balance)

    total_expenses = money(mandatory_expenses + variable_expenses)
    free_cash = money(total_income - total_expenses - minimum_debt_payments)
    debt_payoff_capacity = money(total_income - mandatory_expenses - minimum_debt_payments)

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "mandatory_expenses": mandatory_expenses,
        "variable_expenses": variable_expenses,
        "minimum_debt_payments": minimum_debt_payments,
        "free_cash": free_cash,
        "debt_payoff_capacity": debt_payoff_capacity,
        "active_debt_balance": active_debt_balance,
    }


def calculate_cashflow(
    *,
    total_income: Decimal,
    mandatory_expenses: Decimal,
    variable_expenses: Decimal,
    minimum_debt_payments: Decimal,
) -> dict[str, Decimal]:
    total_income = money(total_income)
    mandatory_expenses = money(mandatory_expenses)
    variable_expenses = money(variable_expenses)
    minimum_debt_payments = money(minimum_debt_payments)

    total_outflow = money(mandatory_expenses + variable_expenses + minimum_debt_payments)
    net_cashflow = money(total_income - total_outflow)
    free_cash = money(total_income - mandatory_expenses - variable_expenses - minimum_debt_payments)
    debt_payoff_capacity = money(total_income - mandatory_expenses - minimum_debt_payments)

    return {
        "total_income": total_income,
        "mandatory_expenses": mandatory_expenses,
        "variable_expenses": variable_expenses,
        "minimum_debt_payments": minimum_debt_payments,
        "total_outflow": total_outflow,
        "net_cashflow": net_cashflow,
        "free_cash": free_cash,
        "debt_payoff_capacity": debt_payoff_capacity,
    }