"""init tables

Revision ID: 0001_init_tables
Revises: None
Create Date: 2026-03-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001_init_tables"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "incomes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_incomes_id", "incomes", ["id"])
    op.create_index("ix_incomes_user_id", "incomes", ["user_id"])
    op.create_index("ix_incomes_date", "incomes", ["date"])
    op.create_index("ix_incomes_category", "incomes", ["category"])
    op.create_index("ix_incomes_type", "incomes", ["type"])

    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("recurrence_type", sa.String(length=50), nullable=False, server_default="none"),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_expenses_id", "expenses", ["id"])
    op.create_index("ix_expenses_user_id", "expenses", ["user_id"])
    op.create_index("ix_expenses_date", "expenses", ["date"])
    op.create_index("ix_expenses_category", "expenses", ["category"])
    op.create_index("ix_expenses_type", "expenses", ["type"])
    op.create_index("ix_expenses_recurrence_type", "expenses", ["recurrence_type"])

    op.create_table(
        "debts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("debt_type", sa.String(length=50), nullable=False),
        sa.Column("principal_balance", sa.Numeric(12, 2), nullable=False),
        sa.Column("annual_interest_rate", sa.Numeric(6, 2), nullable=False),
        sa.Column("minimum_monthly_payment", sa.Numeric(12, 2), nullable=False),
        sa.Column("due_day", sa.Integer(), nullable=False),
        sa.Column("early_repayment_allowed", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("payoff_priority", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_debts_id", "debts", ["id"])
    op.create_index("ix_debts_user_id", "debts", ["user_id"])
    op.create_index("ix_debts_name", "debts", ["name"])
    op.create_index("ix_debts_debt_type", "debts", ["debt_type"])
    op.create_index("ix_debts_payoff_priority", "debts", ["payoff_priority"])
    op.create_index("ix_debts_is_active", "debts", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_debts_is_active", table_name="debts")
    op.drop_index("ix_debts_payoff_priority", table_name="debts")
    op.drop_index("ix_debts_debt_type", table_name="debts")
    op.drop_index("ix_debts_name", table_name="debts")
    op.drop_index("ix_debts_user_id", table_name="debts")
    op.drop_index("ix_debts_id", table_name="debts")
    op.drop_table("debts")

    op.drop_index("ix_expenses_recurrence_type", table_name="expenses")
    op.drop_index("ix_expenses_type", table_name="expenses")
    op.drop_index("ix_expenses_category", table_name="expenses")
    op.drop_index("ix_expenses_date", table_name="expenses")
    op.drop_index("ix_expenses_user_id", table_name="expenses")
    op.drop_index("ix_expenses_id", table_name="expenses")
    op.drop_table("expenses")

    op.drop_index("ix_incomes_type", table_name="incomes")
    op.drop_index("ix_incomes_category", table_name="incomes")
    op.drop_index("ix_incomes_date", table_name="incomes")
    op.drop_index("ix_incomes_user_id", table_name="incomes")
    op.drop_index("ix_incomes_id", table_name="incomes")
    op.drop_table("incomes")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")