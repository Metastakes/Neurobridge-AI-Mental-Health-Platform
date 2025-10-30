from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.enums import ProviderType


class Provider(Base):
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    provider_type = Column(Enum(ProviderType), nullable=False)
    specialty = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    license_number = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)  # Two-letter state code for admin fee policy

    # Billing settings - GUARANTEE: No-show fee minimum $50 (5000 cents)
    hourly_rate_cents = Column(Integer, nullable=False, default=15000)  # $150/hour default
    no_show_min_fee_cents = Column(Integer, nullable=False, default=5000)  # $50 minimum
    insurance_no_show_fee_cents = Column(Integer, nullable=False, default=12500)  # $125 for insurance
    late_cancel_window_hours = Column(Integer, nullable=False, default=24)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # GUARANTEE ENFORCEMENT: Database-level constraint for no-show fee minimum
    __table_args__ = (
        CheckConstraint('no_show_min_fee_cents >= 5000', name='check_no_show_min_fee'),
        CheckConstraint('insurance_no_show_fee_cents >= 5000', name='check_insurance_no_show_min_fee'),
    )

    # FIX #1 APPLIED: Correct relationship to User model
    user = relationship("User", backref="provider_profile", foreign_keys=[user_id])

    def __repr__(self):
        return f"<Provider(id={self.id}, user_id={self.user_id}, type={self.provider_type})>"
