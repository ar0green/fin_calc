from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.db.models.expense import Expense
from app.db.models.income import Income
from app.db.models.user import User
from app.services.planning_service import build_monthly_plan


def test_monthly_plan_contains_income_and_expense_breakdown(
    db_session: Session,
    test_user: User,
) -> None:
    db_session.add_all(
        [
            Income(
                user_id=test_user.id,
                amount=Decimal("250000.00"),
                date=date(2026, 1, 5),
                category="Salary",
                type="regular",
                comment="Monthly salary",
            ),
            Income(
                user_id=test_user.id,
                amount=Decimal("50000.00"),
                date=date(2026, 2, 10),
                category="Bonus",
                type="irregular",
                comment="One-time bonus",
            ),
            Expense(
                user_id=test_user.id,
                amount=Decimal("65000.00"),
                date=date(2026, 1, 1),
                category="Rent",
                type="mandatory",
                recurrence_type="monthly",
                comment="Apartment rent",
            ),
            Expense(
                user_id=test_user.id,
                amount=Decimal("10000.00"),
                date=date(2026, 2, 11),
                category="Medicine",
                type="variable",
                recurrence_type="none",
                comment="One-time expense",
            ),
        ]
    )
    db_session.commit()

    result = build_monthly_plan(
        db_session,
        test_user.id,
        month="2026-02",
        safety_buffer_type="percent",
        safety_buffer_value=Decimal("10"),
        strategy_type="avalanche",
        max_months=240,
    )

    assert result["total_income"] == Decimal("300000.00")
    assert result["income_regular"] == Decimal("250000.00")
    assert result["income_irregular"] == Decimal("50000.00")

    assert result["total_expenses"] == Decimal("75000.00")
    assert result["expenses_recurring"] == Decimal("65000.00")
    assert result["expenses_one_time"] == Decimal("10000.00")

    assert len(result["income_items"]) == 2
    assert len(result["expense_items"]) == 2