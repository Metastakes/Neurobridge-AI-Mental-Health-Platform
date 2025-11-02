from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserResponse(BaseModel):
    """User response schema"""

    id: int
    email: EmailStr
    name: str
    phone: Optional[str]
    role: str
    is_active: int
    created_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2 (was orm_mode in v1)
