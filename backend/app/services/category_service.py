from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryError(ValueError):
    pass


def list_categories(
    db: Session,
    user_id: int,
    *,
    type: str | None = None,
    is_active: bool | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[Category]:
    statement = select(Category).where(Category.user_id == user_id)

    if type is not None:
        statement = statement.where(Category.type == type)

    if is_active is not None:
        statement = statement.where(Category.is_active.is_(is_active))

    statement = (
        statement.order_by(Category.type.asc(), Category.name.asc())
        .limit(limit)
        .offset(offset)
    )

    return list(db.scalars(statement).all())


def get_category(
    db: Session,
    user_id: int,
    category_id: int,
) -> Category:
    category = db.scalar(
        select(Category).where(
            Category.id == category_id,
            Category.user_id == user_id,
        )
    )

    if not category:
        raise CategoryError("Category not found")

    return category


def create_category(
    db: Session,
    user_id: int,
    payload: CategoryCreate,
) -> Category:
    category = Category(
        user_id=user_id,
        name=payload.name,
        type=payload.type,
        is_active=payload.is_active,
        comment=payload.comment,
    )

    db.add(category)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise CategoryError("Category with this name and type already exists") from exc

    db.refresh(category)

    return category


def update_category(
    db: Session,
    user_id: int,
    category_id: int,
    payload: CategoryUpdate,
) -> Category:
    category = get_category(db, user_id, category_id)

    if payload.name is not None:
        category.name = payload.name

    if payload.type is not None:
        category.type = payload.type

    if payload.is_active is not None:
        category.is_active = payload.is_active

    if payload.comment is not None:
        category.comment = payload.comment

    db.add(category)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise CategoryError("Category with this name and type already exists") from exc

    db.refresh(category)

    return category


def delete_category(
    db: Session,
    user_id: int,
    category_id: int,
) -> None:
    category = get_category(db, user_id, category_id)

    db.delete(category)
    db.commit()