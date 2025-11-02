from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SpecialtyResponse(BaseModel):
    """Specialty response"""
    id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    keywords: Optional[str]
    icon: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class InsurancePlanResponse(BaseModel):
    """Insurance plan response"""
    id: int
    name: str
    payer_id: Optional[str]
    payer_name: Optional[str]
    plan_type: Optional[str]
    state_coverage: Optional[str]
    clearinghouse: Optional[str]
    requires_auth: bool
    logo_url: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True
