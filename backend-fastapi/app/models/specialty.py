from sqlalchemy import Column, Integer, String, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.db.base import Base


class Specialty(Base):
    """
    Mental health provider specialties
    e.g., Adult Psychiatry, Child Psychology, PTSD, etc.
    """
    __tablename__ = "specialties"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)  # Clinical, Age Group, Condition, etc.

    # Search optimization
    keywords = Column(Text, nullable=True)  # Comma-separated keywords for search

    # Display
    icon = Column(String(100), nullable=True)  # Icon identifier for UI
    display_order = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<Specialty(id={self.id}, name={self.name})>"


class InsurancePlan(Base):
    """
    Insurance plans accepted by providers
    """
    __tablename__ = "insurance_plans"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False, index=True)
    payer_id = Column(String(50), nullable=True, unique=True, index=True)  # For billing
    payer_name = Column(String(255), nullable=True)

    # Plan details
    plan_type = Column(String(50), nullable=True)  # HMO, PPO, EPO, POS, Medicare, Medicaid
    state_coverage = Column(String(500), nullable=True)  # Comma-separated state codes

    # Billing information
    clearinghouse = Column(String(100), nullable=True)  # Availity, Change Healthcare, etc.
    requires_auth = Column(Boolean, default=False)  # Requires prior authorization

    # Display
    logo_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    def __repr__(self):
        return f"<InsurancePlan(id={self.id}, name={self.name})>"
