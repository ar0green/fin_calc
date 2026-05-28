"""add category budgets

Revision ID: 04e22bb2431c
Revises: c0af82185a18
Create Date: 2026-05-28 21:38:31.488862

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '04e22bb2431c'
down_revision: Union[str, None] = 'c0af82185a18'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "category_budgets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("monthly_limit", sa.Numeric(14, 2), nullable=False),
        sa.Column("start_month", sa.Date(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("comment", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_category_budgets_id"),
        "category_budgets",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_category_budgets_user_id"),
        "category_budgets",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_category_budgets_category"),
        "category_budgets",
        ["category"],
        unique=False,
    )
    op.create_index(
        op.f("ix_category_budgets_start_month"),
        "category_budgets",
        ["start_month"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_category_budgets_start_month"), table_name="category_budgets")
    op.drop_index(op.f("ix_category_budgets_category"), table_name="category_budgets")
    op.drop_index(op.f("ix_category_budgets_user_id"), table_name="category_budgets")
    op.drop_index(op.f("ix_category_budgets_id"), table_name="category_budgets")
    op.drop_table("category_budgets")