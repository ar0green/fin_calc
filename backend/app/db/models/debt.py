from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Debt(Base):
    __tablename__ = "debts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    debt_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    principal_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    annual_interest_rate: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    minimum_monthly_payment: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    due_day: Mapped[int] = mapped_column(Integer, nullable=False)
    early_repayment_allowed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    payoff_priority: Mapped[int] = mapped_column(Integer, default=100, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", back_populates="debts")