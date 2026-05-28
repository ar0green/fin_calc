from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


CategoryType = Literal["income", "expense", "both"]


class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    type: CategoryType
    is_active: bool = True
    comment: str | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return value.strip()


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    type: CategoryType | None = None
    is_active: bool | None = None
    comment: str | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return None

        return value.strip()


class CategoryRead(BaseModel):
    id: int
    name: str
    type: CategoryType
    is_active: bool
    comment: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}