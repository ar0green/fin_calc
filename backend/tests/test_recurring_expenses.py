from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.db.models.expense import Expense
from app.db.models.user import User
from app.services.recurring_expense_service import (
    calculate_expense_categories_for_period,
    calculate_expense_totals_for_period,
    expand_expenses_by_month,
)


def test_monthly_expense_applies_to_each_month_after_start(
    db_session: Session,
    test_user: User,
) -> None:
    rent = Expense(
        user_id=test_user.id,
        amount=Decimal("65000.00"),
        date=date(2026, 1, 10),
        category="Rent",
        type="mandatory",
        recurrence_type="monthly",
        comment=None,
    )

    db_session.add(rent)
    db_session.commit()

    result = calculate_expense_totals_for_period(
        db_session,
        test_user.id,
        date_from=date(2026, 1, 1),
        date_to=date(2026, 4, 30),
    )

    assert result["mandatory_expenses"] == Decimal("260000.00")
    assert result["variable_expenses"] == Decimal("0.00")
    assert result["total_expenses"] == Decimal("260000.00")


def test_monthly_expense_does_not_apply_before_start_month(
    db_session: Session,
    test_user: User,
) -> None:
    subscription = Expense(
        user_id=test_user.id,
        amount=Decimal("5000.00"),
        date=date(2026, 3, 15),
        category="Subscription",
        type="variable",
        recurrence_type="monthly",
        comment=None,
    )

    db_session.add(subscription)
    db_session.commit()

    result = calculate_expense_totals_for_period(
        db_session,
        test_user.id,
        date_from=date(2026, 1, 1),
        date_to=date(2026, 4, 30),
    )

    assert result["mandatory_expenses"] == Decimal("0.00")
    assert result["variable_expenses"] == Decimal("10000.00")
    assert result["total_expenses"] == Decimal("10000.00")


def test_one_time_expense_applies_only_once(
    db_session: Session,
    test_user: User,
) -> None:
    expense = Expense(
        user_id=test_user.id,
        amount=Decimal("12000.00"),
        date=date(2026, 2, 10),
        category="Medicine",
        type="variable",
        recurrence_type="none",
        comment=None,
    )

    db_session.add(expense)
    db_session.commit()

    result = calculate_expense_totals_for_period(
        db_session,
        test_user.id,
        date_from=date(2026, 1, 1),
        date_to=date(2026, 4, 30),
    )

    assert result["variable_expenses"] == Decimal("12000.00")
    assert result["total_expenses"] == Decimal("12000.00")


def test_expense_categories_include_recurring_expenses(
    db_session: Session,
    test_user: User,
) -> None:
    db_session.add_all(
        [
            Expense(
                user_id=test_user.id,
                amount=Decimal("65000.00"),
                date=date(2026, 1, 1),
                category="Rent",
                type="mandatory",
                recurrence_type="monthly",
                comment=None,
            ),
            Expense(
                user_id=test_user.id,
                amount=Decimal("10000.00"),
                date=date(2026, 2, 1),
                category="Food",
                type="variable",
                recurrence_type="none",
                comment=None,
            ),
        ]
    )
    db_session.commit()

    result = calculate_expense_categories_for_period(
        db_session,
        test_user.id,
        date_from=date(2026, 1, 1),
        date_to=date(2026, 2, 28),
    )

    assert result[0]["category"] == "Rent"
    assert result[0]["amount"] == Decimal("130000.00")

    assert result[1]["category"] == "Food"
    assert result[1]["amount"] == Decimal("10000.00")


def test_expand_expenses_by_month_returns_monthly_totals(
    db_session: Session,
    test_user: User,
) -> None:
    db_session.add_all(
        [
            Expense(
                user_id=test_user.id,
                amount=Decimal("65000.00"),
                date=date(2026, 1, 1),
                category="Rent",
                type="mandatory",
                recurrence_type="monthly",
                comment=None,
            ),
            Expense(
                user_id=test_user.id,
                amount=Decimal("10000.00"),
                date=date(2026, 2, 10),
                category="Food",
                type="variable",
                recurrence_type="none",
                comment=None,
            ),
        ]
    )
    db_session.commit()

    result = expand_expenses_by_month(
        db_session,
        test_user.id,
        date_from=date(2026, 1, 1),
        date_to=date(2026, 3, 31),
    )

    assert result[date(2026, 1, 1)]["total_expenses"] == Decimal("65000.00")
    assert result[date(2026, 2, 1)]["total_expenses"] == Decimal("75000.00")
    assert result[date(2026, 3, 1)]["total_expenses"] == Decimal("65000.00")