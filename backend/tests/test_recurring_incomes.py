from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.db.models.income import Income
from app.db.models.user import User
from app.services.recurring_income_service import (
    calculate_income_categories_for_period,
    calculate_income_total_for_period,
    expand_incomes_by_month,
)


def test_regular_income_applies_to_each_month_after_start(
    db_session: Session,
    test_user: User,
) -> None:
    salary = Income(
        user_id=test_user.id,
        amount=Decimal("250000.00"),
        date=date(2026, 1, 5),
        category="Salary",
        type="regular",
        comment=None,
    )

    db_session.add(salary)
    db_session.commit()

    result = calculate_income_total_for_period(
        db_session,
        test_user.id,
        date_from=date(2026, 1, 1),
        date_to=date(2026, 4, 30),
    )

    assert result == Decimal("1000000.00")


def test_regular_income_does_not_apply_before_start_month(
    db_session: Session,
    test_user: User,
) -> None:
    salary = Income(
        user_id=test_user.id,
        amount=Decimal("250000.00"),
        date=date(2026, 3, 5),
        category="Salary",
        type="regular",
        comment=None,
    )

    db_session.add(salary)
    db_session.commit()

    result = calculate_income_total_for_period(
        db_session,
        test_user.id,
        date_from=date(2026, 1, 1),
        date_to=date(2026, 4, 30),
    )

    assert result == Decimal("500000.00")


def test_irregular_income_applies_only_once(
    db_session: Session,
    test_user: User,
) -> None:
    bonus = Income(
        user_id=test_user.id,
        amount=Decimal("50000.00"),
        date=date(2026, 2, 10),
        category="Bonus",
        type="irregular",
        comment=None,
    )

    db_session.add(bonus)
    db_session.commit()

    result = calculate_income_total_for_period(
        db_session,
        test_user.id,
        date_from=date(2026, 1, 1),
        date_to=date(2026, 4, 30),
    )

    assert result == Decimal("50000.00")


def test_expand_incomes_by_month_returns_monthly_totals(
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
                comment=None,
            ),
            Income(
                user_id=test_user.id,
                amount=Decimal("50000.00"),
                date=date(2026, 2, 10),
                category="Bonus",
                type="irregular",
                comment=None,
            ),
        ]
    )
    db_session.commit()

    result = expand_incomes_by_month(
        db_session,
        test_user.id,
        date_from=date(2026, 1, 1),
        date_to=date(2026, 3, 31),
    )

    assert result[date(2026, 1, 1)] == Decimal("250000.00")
    assert result[date(2026, 2, 1)] == Decimal("300000.00")
    assert result[date(2026, 3, 1)] == Decimal("250000.00")


def test_income_categories_include_regular_income_multiple_months(
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
                comment=None,
            ),
            Income(
                user_id=test_user.id,
                amount=Decimal("50000.00"),
                date=date(2026, 2, 10),
                category="Bonus",
                type="irregular",
                comment=None,
            ),
        ]
    )
    db_session.commit()

    result = calculate_income_categories_for_period(
        db_session,
        test_user.id,
        date_from=date(2026, 1, 1),
        date_to=date(2026, 2, 28),
    )

    assert result[0]["category"] == "Salary"
    assert result[0]["amount"] == Decimal("500000.00")

    assert result[1]["category"] == "Bonus"
    assert result[1]["amount"] == Decimal("50000.00")