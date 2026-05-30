from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.db.models.category_budget import CategoryBudget
from app.db.models.expense import Expense
from app.db.models.income import Income
from app.db.models.user import User
from app.services.planning_service import build_monthly_plan


def test_monthly_plan_reduces_recommended_extra_by_budget_overrun(
    db_session: Session,
    test_user: User,
) -> None:
    db_session.add_all(
        [
            Income(
                user_id=test_user.id,
                amount=Decimal("300000.00"),
                date=date(2026, 4, 1),
                category="Salary",
                type="regular",
                comment=None,
            ),
            Expense(
                user_id=test_user.id,
                amount=Decimal("70000.00"),
                date=date(2026, 4, 10),
                category="Food",
                type="variable",
                recurrence_type="none",
                comment=None,
            ),
            CategoryBudget(
                user_id=test_user.id,
                category="Food",
                monthly_limit=Decimal("50000.00"),
                start_month=date(2026, 1, 1),
                is_active=True,
                comment=None,
            ),
        ]
    )
    db_session.commit()

    result = build_monthly_plan(
        db_session,
        test_user.id,
        month="2026-04",
        safety_buffer_type="percent",
        safety_buffer_value=Decimal("10"),
        strategy_type="avalanche",
        max_months=240,
    )

    # income 300000 - expenses 70000 = free_cash 230000
    # safety buffer 10% = 30000
    # before budget adjustment = 200000
    # budget overrun = 70000 - 50000 = 20000
    # final recommended extra = 180000

    assert result["free_cash"] == Decimal("230000.00")
    assert result["safety_buffer"] == Decimal("30000.00")
    assert result["budget_overrun_total"] == Decimal("20000.00")
    assert (
        result["recommended_extra_payment_before_budget_adjustment"]
        == Decimal("200000.00")
    )
    assert result["recommended_extra_payment"] == Decimal("180000.00")
    assert result["budget_adjustment_applied"] is True
    assert result["remaining_after_recommended_extra_payment"] == Decimal("50000.00")


def test_monthly_plan_does_not_adjust_extra_without_budget_overrun(
    db_session: Session,
    test_user: User,
) -> None:
    db_session.add_all(
        [
            Income(
                user_id=test_user.id,
                amount=Decimal("300000.00"),
                date=date(2026, 4, 1),
                category="Salary",
                type="regular",
                comment=None,
            ),
            Expense(
                user_id=test_user.id,
                amount=Decimal("40000.00"),
                date=date(2026, 4, 10),
                category="Food",
                type="variable",
                recurrence_type="none",
                comment=None,
            ),
            CategoryBudget(
                user_id=test_user.id,
                category="Food",
                monthly_limit=Decimal("50000.00"),
                start_month=date(2026, 1, 1),
                is_active=True,
                comment=None,
            ),
        ]
    )
    db_session.commit()

    result = build_monthly_plan(
        db_session,
        test_user.id,
        month="2026-04",
        safety_buffer_type="percent",
        safety_buffer_value=Decimal("10"),
        strategy_type="avalanche",
        max_months=240,
    )

    assert result["budget_overrun_total"] == Decimal("0.00")
    assert result["budget_adjustment_applied"] is False
    assert (
        result["recommended_extra_payment"]
        == result["recommended_extra_payment_before_budget_adjustment"]
    )