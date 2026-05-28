from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.db.models.expense import Expense
from app.db.models.user import User
from app.schemas.category_budget import CategoryBudgetCreate, CategoryBudgetUpdate
from app.services.category_budget_service import (
    build_monthly_budget_summary,
    create_category_budget,
    delete_category_budget,
    list_category_budgets,
    update_category_budget,
)


def test_create_category_budget(
    db_session: Session,
    test_user: User,
) -> None:
    budget = create_category_budget(
        db_session,
        test_user.id,
        CategoryBudgetCreate(
            category="Food",
            monthly_limit=Decimal("50000.00"),
            start_month=date(2026, 1, 1),
            is_active=True,
            comment="Food budget",
        ),
    )

    assert budget.id is not None
    assert budget.category == "Food"
    assert budget.monthly_limit == Decimal("50000.00")
    assert budget.is_active is True


def test_update_category_budget(
    db_session: Session,
    test_user: User,
) -> None:
    budget = create_category_budget(
        db_session,
        test_user.id,
        CategoryBudgetCreate(
            category="Food",
            monthly_limit=Decimal("50000.00"),
            start_month=date(2026, 1, 1),
            is_active=True,
            comment=None,
        ),
    )

    updated = update_category_budget(
        db_session,
        test_user.id,
        budget.id,
        CategoryBudgetUpdate(
            monthly_limit=Decimal("60000.00"),
            comment="Updated",
        ),
    )

    assert updated.monthly_limit == Decimal("60000.00")
    assert updated.comment == "Updated"


def test_delete_category_budget(
    db_session: Session,
    test_user: User,
) -> None:
    budget = create_category_budget(
        db_session,
        test_user.id,
        CategoryBudgetCreate(
            category="Food",
            monthly_limit=Decimal("50000.00"),
            start_month=date(2026, 1, 1),
            is_active=True,
            comment=None,
        ),
    )

    delete_category_budget(db_session, test_user.id, budget.id)

    budgets = list_category_budgets(db_session, test_user.id)

    assert budgets == []


def test_monthly_budget_summary_compares_budget_with_actual_expenses(
    db_session: Session,
    test_user: User,
) -> None:
    create_category_budget(
        db_session,
        test_user.id,
        CategoryBudgetCreate(
            category="Food",
            monthly_limit=Decimal("50000.00"),
            start_month=date(2026, 1, 1),
            is_active=True,
            comment=None,
        ),
    )

    db_session.add(
        Expense(
            user_id=test_user.id,
            amount=Decimal("42000.00"),
            date=date(2026, 4, 10),
            category="Food",
            type="variable",
            recurrence_type="none",
            comment=None,
        )
    )
    db_session.commit()

    result = build_monthly_budget_summary(
        db_session,
        test_user.id,
        month="2026-04",
    )

    assert result["total_budget_limit"] == Decimal("50000.00")
    assert result["total_actual_amount"] == Decimal("42000.00")
    assert result["total_remaining_amount"] == Decimal("8000.00")
    assert result["total_usage_percent"] == Decimal("84.00")

    assert len(result["items"]) == 1
    assert result["items"][0]["category"] == "Food"
    assert result["items"][0]["budget_limit"] == Decimal("50000.00")
    assert result["items"][0]["actual_amount"] == Decimal("42000.00")
    assert result["items"][0]["remaining_amount"] == Decimal("8000.00")
    assert result["items"][0]["usage_percent"] == Decimal("84.00")
    assert result["items"][0]["is_over_budget"] is False


def test_monthly_budget_summary_detects_over_budget(
    db_session: Session,
    test_user: User,
) -> None:
    create_category_budget(
        db_session,
        test_user.id,
        CategoryBudgetCreate(
            category="Entertainment",
            monthly_limit=Decimal("10000.00"),
            start_month=date(2026, 1, 1),
            is_active=True,
            comment=None,
        ),
    )

    db_session.add(
        Expense(
            user_id=test_user.id,
            amount=Decimal("15000.00"),
            date=date(2026, 4, 10),
            category="Entertainment",
            type="variable",
            recurrence_type="none",
            comment=None,
        )
    )
    db_session.commit()

    result = build_monthly_budget_summary(
        db_session,
        test_user.id,
        month="2026-04",
    )

    assert result["items"][0]["category"] == "Entertainment"
    assert result["items"][0]["remaining_amount"] == Decimal("-5000.00")
    assert result["items"][0]["usage_percent"] == Decimal("150.00")
    assert result["items"][0]["is_over_budget"] is True


def test_monthly_budget_summary_uses_latest_budget_for_category(
    db_session: Session,
    test_user: User,
) -> None:
    create_category_budget(
        db_session,
        test_user.id,
        CategoryBudgetCreate(
            category="Food",
            monthly_limit=Decimal("40000.00"),
            start_month=date(2026, 1, 1),
            is_active=True,
            comment=None,
        ),
    )

    create_category_budget(
        db_session,
        test_user.id,
        CategoryBudgetCreate(
            category="Food",
            monthly_limit=Decimal("60000.00"),
            start_month=date(2026, 4, 1),
            is_active=True,
            comment=None,
        ),
    )

    result = build_monthly_budget_summary(
        db_session,
        test_user.id,
        month="2026-04",
    )

    assert result["items"][0]["budget_limit"] == Decimal("60000.00")