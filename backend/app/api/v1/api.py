from fastapi import APIRouter

from app.api.v1.analytics import router as analytics_router
from app.api.v1.auth import router as auth_router
from app.api.v1.calculations import router as calculations_router
from app.api.v1.depts import router as debts_router
from app.api.v1.expenses import router as expenses_router
from app.api.v1.incomes import router as incomes_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(incomes_router)
api_router.include_router(expenses_router)
api_router.include_router(debts_router)
api_router.include_router(calculations_router)
api_router.include_router(analytics_router)