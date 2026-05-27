from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.api import api_router
from app.core.config import get_settings
from app.core.security import get_password_hash
from app.db.models.user import User
from app.db.session import engine

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def create_initial_user() -> None:
    with Session(engine) as db:
        existing_user = db.scalar(select(User).where(User.email == settings.first_superuser_email))
        if existing_user:
            return

        user = User(
            email=settings.first_superuser_email,
            password_hash=get_password_hash(settings.first_superuser_password),
            is_active=True,
        )
        db.add(user)
        db.commit()


@app.on_event("startup")
def on_startup() -> None:
    create_initial_user()


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router, prefix=settings.api_v1_prefix)