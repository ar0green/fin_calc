from collections.abc import Generator
from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
import app.db.models  # noqa: F401
from app.db.models.debt import Debt
from app.db.models.expense import Expense
from app.db.models.income import Income
from app.db.models.user import User


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    Base.metadata.create_all(bind=engine)

    TestingSessionLocal = sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
    )

    with TestingSessionLocal() as session:
        yield session

    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def test_user(db_session: Session) -> User:
    user = User(
        email="test@example.com",
        password_hash="fake-hash",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    return user


@pytest.fixture()
def financial_dataset(db_session: Session, test_user: User) -> User:
    incomes = [
        Income(
            user_id=test_user.id,
            amount=Decimal("250000.00"),
            date=date(2026, 4, 5),
            category="Salary",
            type="regular",
            comment="Monthly salary",
        ),
        Income(
            user_id=test_user.id,
            amount=Decimal("50000.00"),
            date=date(2026, 4, 20),
            category="Freelance",
            type="irregular",
            comment="Side project",
        ),
    ]

    expenses = [
        Expense(
            user_id=test_user.id,
            amount=Decimal("65000.00"),
            date=date(2026, 4, 1),
            category="Rent",
            type="mandatory",
            recurrence_type="monthly",
            comment="Apartment rent",
        ),
        Expense(
            user_id=test_user.id,
            amount=Decimal("15000.00"),
            date=date(2026, 4, 3),
            category="Utilities",
            type="mandatory",
            recurrence_type="monthly",
            comment="Utilities",
        ),
        Expense(
            user_id=test_user.id,
            amount=Decimal("40000.00"),
            date=date(2026, 4, 10),
            category="Food",
            type="variable",
            recurrence_type="none",
            comment="Groceries",
        ),
        Expense(
            user_id=test_user.id,
            amount=Decimal("10000.00"),
            date=date(2026, 4, 12),
            category="Transport",
            type="variable",
            recurrence_type="none",
            comment="Taxi",
        ),
    ]

    debts = [
        Debt(
            user_id=test_user.id,
            name="Credit Card",
            debt_type="credit_card",
            principal_balance=Decimal("120000.00"),
            annual_interest_rate=Decimal("30.00"),
            minimum_monthly_payment=Decimal("10000.00"),
            due_day=10,
            early_repayment_allowed=True,
            payoff_priority=1,
            is_active=True,
            comment="High interest debt",
        ),
        Debt(
            user_id=test_user.id,
            name="Consumer Loan",
            debt_type="loan",
            principal_balance=Decimal("300000.00"),
            annual_interest_rate=Decimal("15.00"),
            minimum_monthly_payment=Decimal("20000.00"),
            due_day=15,
            early_repayment_allowed=True,
            payoff_priority=2,
            is_active=True,
            comment="Bank loan",
        ),
    ]

    db_session.add_all(incomes)
    db_session.add_all(expenses)
    db_session.add_all(debts)
    db_session.commit()

    return test_user