import calendar
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculators.cashflow import money
from app.db.models.category_budget import CategoryBudget
from app.schemas.category_budget import CategoryBudgetCreate, CategoryBudgetUpdate
from app.services.recurring_expense_service import calculate_expense_categories_for_period


class CategoryBudgetError(ValueError):
    pass


def parse_month(month: str) -> tuple[date, date]:
    try:
        year_raw, month_raw = month.split("-")
        year = int(year_raw)
        month_number = int(month_raw)
    except ValueError as exc:
        raise ValueError("month must be in YYYY-MM format") from exc

    if month_number < 1 or month_number > 12:
        raise ValueError("month must be in YYYY-MM format")

    last_day = calendar.monthrange(year, month_number)[1]

    return date(year, month_number, 1), date(year, month_number, last_day)


def _percent(part: Decimal, total: Decimal) -> Decimal:
    total = money(total)

    if total <= 0:
        return money("0")

    return money(money(part) / total * Decimal("100"))


def list_category_budgets(
    db: Session,
    user_id: int,
    *,
    is_active: bool | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[CategoryBudget]:
    statement = select(CategoryBudget).where(CategoryBudget.user_id == user_id)

    if is_active is not None:
        statement = statement.where(CategoryBudget.is_active.is_(is_active))

    statement = (
        statement.order_by(
            CategoryBudget.is_active.desc(),
            CategoryBudget.category.asc(),
            CategoryBudget.start_month.desc(),
        )
        .limit(limit)
        .offset(offset)
    )

    return list(db.scalars(statement).all())


def get_category_budget(
    db: Session,
    user_id: int,
    budget_id: int,
) -> CategoryBudget:
    budget = db.scalar(
        select(CategoryBudget).where(
            CategoryBudget.id == budget_id,
            CategoryBudget.user_id == user_id,
        )
    )

    if not budget:
        raise CategoryBudgetError("Category budget not found")

    return budget


def create_category_budget(
    db: Session,
    user_id: int,
    payload: CategoryBudgetCreate,
) -> CategoryBudget:
    budget = CategoryBudget(
        user_id=user_id,
        category=payload.category,
        monthly_limit=money(payload.monthly_limit),
        start_month=payload.start_month,
        is_active=payload.is_active,
        comment=payload.comment,
    )

    db.add(budget)
    db.commit()
    db.refresh(budget)

    return budget


def update_category_budget(
    db: Session,
    user_id: int,
    budget_id: int,
    payload: CategoryBudgetUpdate,
) -> CategoryBudget:
    budget = get_category_budget(db, user_id, budget_id)

    if payload.category is not None:
        budget.category = payload.category

    if payload.monthly_limit is not None:
        budget.monthly_limit = money(payload.monthly_limit)

    if payload.start_month is not None:
        budget.start_month = payload.start_month

    if payload.is_active is not None:
        budget.is_active = payload.is_active

    if payload.comment is not None:
        budget.comment = payload.comment

    db.add(budget)
    db.commit()
    db.refresh(budget)

    return budget


def delete_category_budget(
    db: Session,
    user_id: int,
    budget_id: int,
) -> None:
    budget = get_category_budget(db, user_id, budget_id)

    db.delete(budget)
    db.commit()


def _load_active_budgets_for_month(
    db: Session,
    user_id: int,
    *,
    month_start: date,
) -> list[CategoryBudget]:
    return list(
        db.scalars(
            select(CategoryBudget)
            .where(
                CategoryBudget.user_id == user_id,
                CategoryBudget.is_active.is_(True),
                CategoryBudget.start_month <= month_start,
            )
            .order_by(CategoryBudget.category.asc(), CategoryBudget.start_month.desc())
        ).all()
    )


def build_monthly_budget_summary(
    db: Session,
    user_id: int,
    *,
    month: str,
) -> dict:
    date_from, date_to = parse_month(month)

    budgets = _load_active_budgets_for_month(
        db,
        user_id,
        month_start=date_from,
    )

    expense_categories = calculate_expense_categories_for_period(
        db,
        user_id,
        date_from=date_from,
        date_to=date_to,
    )

    actual_by_category = {
        item["category"]: money(item["amount"])
        for item in expense_categories
    }

    # Если по одной категории несколько активных budget-записей,
    # берём самую свежую по start_month, потому что query отсортирован desc.
    latest_budget_by_category: dict[str, CategoryBudget] = {}

    for budget in budgets:
        if budget.category not in latest_budget_by_category:
            latest_budget_by_category[budget.category] = budget

    items = []

    total_budget_limit = Decimal("0")
    total_actual_amount = Decimal("0")

    for category, budget in sorted(latest_budget_by_category.items()):
        budget_limit = money(budget.monthly_limit)
        actual_amount = money(actual_by_category.get(category, Decimal("0")))
        remaining_amount = money(budget_limit - actual_amount)

        total_budget_limit = money(total_budget_limit + budget_limit)
        total_actual_amount = money(total_actual_amount + actual_amount)

        items.append(
            {
                "category": category,
                "budget_limit": budget_limit,
                "actual_amount": actual_amount,
                "remaining_amount": remaining_amount,
                "usage_percent": _percent(actual_amount, budget_limit),
                "is_over_budget": actual_amount > budget_limit,
            }
        )

    total_remaining_amount = money(total_budget_limit - total_actual_amount)

    return {
        "month": month,
        "date_from": date_from,
        "date_to": date_to,
        "total_budget_limit": money(total_budget_limit),
        "total_actual_amount": money(total_actual_amount),
        "total_remaining_amount": total_remaining_amount,
        "total_usage_percent": _percent(total_actual_amount, total_budget_limit),
        "items": items,
    }