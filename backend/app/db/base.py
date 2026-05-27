from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from app.db.models.user import User  # noqa: E402,F401
from app.db.models.income import Income  # noqa: E402,F401
from app.db.models.expense import Expense  # noqa: E402,F401
from app.db.models.debt import Debt  # noqa: E402,F401