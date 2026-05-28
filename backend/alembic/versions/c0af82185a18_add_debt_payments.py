"""add debt payments

Revision ID: c0af82185a18
Revises: 0001_init_tables
Create Date: 2026-05-28 11:57:52.951346

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c0af82185a18'
down_revision: Union[str, None] = '0001_init_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "debt_payments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("debt_id", sa.Integer(), nullable=False),
        sa.Column("payment_date", sa.Date(), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("principal_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("interest_amount", sa.Numeric(14, 2), nullable=False),
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
        sa.ForeignKeyConstraint(["debt_id"], ["debts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_debt_payments_id"),
        "debt_payments",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_debt_payments_user_id"),
        "debt_payments",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_debt_payments_debt_id"),
        "debt_payments",
        ["debt_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_debt_payments_payment_date"),
        "debt_payments",
        ["payment_date"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_debt_payments_payment_date"), table_name="debt_payments")
    op.drop_index(op.f("ix_debt_payments_debt_id"), table_name="debt_payments")
    op.drop_index(op.f("ix_debt_payments_user_id"), table_name="debt_payments")
    op.drop_index(op.f("ix_debt_payments_id"), table_name="debt_payments")
    op.drop_table("debt_payments")