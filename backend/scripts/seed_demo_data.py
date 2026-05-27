from datetime import date
from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_password_hash
from app.db.models.debt import Debt
from app.db.models.expense import Expense
from app.db.models.income import Income
from app.db.models.user import User
from app.db.session import engine

settings = get_settings()


def get_or_create_user(db: Session) -> User:
    user = db.scalar(select(User).where(User.email == settings.first_superuser_email))
    if user:
        return user

    user = User(
        email=settings.first_superuser_email,
        password_hash=get_password_hash(settings.first_superuser_password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def clear_user_financial_data(db: Session, user_id: int) -> None:
    db.execute(delete(Income).where(Income.user_id == user_id))
    db.execute(delete(Expense).where(Expense.user_id == user_id))
    db.execute(delete(Debt).where(Debt.user_id == user_id))
    db.commit()


def create_demo_incomes(db: Session, user_id: int) -> None:
    incomes = [
        Income(
            user_id=user_id,
            amount=Decimal("250000.00"),
            date=date(2026, 1, 5),
            category="Salary",
            type="regular",
            comment="Monthly salary",
        ),
        Income(
            user_id=user_id,
            amount=Decimal("250000.00"),
            date=date(2026, 2, 5),
            category="Salary",
            type="regular",
            comment="Monthly salary",
        ),
        Income(
            user_id=user_id,
            amount=Decimal("250000.00"),
            date=date(2026, 3, 5),
            category="Salary",
            type="regular",
            comment="Monthly salary",
        ),
        Income(
            user_id=user_id,
            amount=Decimal("270000.00"),
            date=date(2026, 4, 5),
            category="Salary",
            type="regular",
            comment="Monthly salary with bonus",
        ),
        Income(
            user_id=user_id,
            amount=Decimal("35000.00"),
            date=date(2026, 4, 18),
            category="Freelance",
            type="irregular",
            comment="Side project",
        ),
    ]
    db.add_all(incomes)


def create_demo_expenses(db: Session, user_id: int) -> None:
    expenses = [
        Expense(
            user_id=user_id,
            amount=Decimal("65000.00"),
            date=date(2026, 1, 1),
            category="Rent",
            type="mandatory",
            recurrence_type="monthly",
            comment="Apartment rent",
        ),
        Expense(
            user_id=user_id,
            amount=Decimal("65000.00"),
            date=date(2026, 2, 1),
            category="Rent",
            type="mandatory",
            recurrence_type="monthly",
            comment="Apartment rent",
        ),
        Expense(
            user_id=user_id,
            amount=Decimal("65000.00"),
            date=date(2026, 3, 1),
            category="Rent",
            type="mandatory",
            recurrence_type="monthly",
            comment="Apartment rent",
        ),
        Expense(
            user_id=user_id,
            amount=Decimal("65000.00"),
            date=date(2026, 4, 1),
            category="Rent",
            type="mandatory",
            recurrence_type="monthly",
            comment="Apartment rent",
        ),
        Expense(
            user_id=user_id,
            amount=Decimal("18000.00"),
            date=date(2026, 4, 3),
            category="Utilities",
            type="mandatory",
            recurrence_type="monthly",
            comment="Electricity, internet, phone",
        ),
        Expense(
            user_id=user_id,
            amount=Decimal("42000.00"),
            date=date(2026, 4, 10),
            category="Food",
            type="variable",
            recurrence_type="none",
            comment="Groceries and cafes",
        ),
        Expense(
            user_id=user_id,
            amount=Decimal("12000.00"),
            date=date(2026, 4, 12),
            category="Transport",
            type="variable",
            recurrence_type="none",
            comment="Taxi and public transport",
        ),
        Expense(
            user_id=user_id,
            amount=Decimal("15000.00"),
            date=date(2026, 4, 20),
            category="Entertainment",
            type="variable",
            recurrence_type="none",
            comment="Cinema, games, subscriptions",
        ),
    ]
    db.add_all(expenses)


def create_demo_debts(db: Session, user_id: int) -> None:
    debts = [
        Debt(
            user_id=user_id,
            name="Credit Card",
            debt_type="credit_card",
            principal_balance=Decimal("120000.00"),
            annual_interest_rate=Decimal("29.90"),
            minimum_monthly_payment=Decimal("9000.00"),
            due_day=10,
            early_repayment_allowed=True,
            payoff_priority=1,
            is_active=True,
            comment="High interest debt",
        ),
        Debt(
            user_id=user_id,
            name="Consumer Loan",
            debt_type="loan",
            principal_balance=Decimal("350000.00"),
            annual_interest_rate=Decimal("17.50"),
            minimum_monthly_payment=Decimal("18000.00"),
            due_day=15,
            early_repayment_allowed=True,
            payoff_priority=2,
            is_active=True,
            comment="Bank consumer loan",
        ),
        Debt(
            user_id=user_id,
            name="Personal Loan",
            debt_type="personal_loan",
            principal_balance=Decimal("220000.00"),
            annual_interest_rate=Decimal("12.00"),
            minimum_monthly_payment=Decimal("11000.00"),
            due_day=20,
            early_repayment_allowed=True,
            payoff_priority=3,
            is_active=True,
            comment="Loan from relative",
        ),
    ]
    db.add_all(debts)


def seed() -> None:
    with Session(engine) as db:
        user = get_or_create_user(db)
        clear_user_financial_data(db, user.id)

        create_demo_incomes(db, user.id)
        create_demo_expenses(db, user.id)
        create_demo_debts(db, user.id)

        db.commit()

        print("Demo data has been seeded successfully.")
        print(f"User email: {settings.first_superuser_email}")
        print(f"User password: {settings.first_superuser_password}")


if __name__ == "__main__":
    seed()