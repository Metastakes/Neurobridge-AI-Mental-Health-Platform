from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.enums import EarningsEntryType


class EarningsLedger(Base):
    """
    GUARANTEE: Provider Earnings Dashboard
    Tracks all provider earnings: session revenue, no-show fees, insurance top-ups, admin fees
    """
    __tablename__ = "earnings_ledger"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True, index=True)

    entry_type = Column(Enum(EarningsEntryType), nullable=False, index=True)
    amount_cents = Column(Integer, nullable=False)

    # Additional metadata
    payment_type = Column(String(50), nullable=True)  # CASH or INSURANCE
    description = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    provider = relationship("User", foreign_keys=[provider_id], backref="earnings")
    appointment = relationship("Appointment", backref="earnings_entries")

    def __repr__(self):
        return f"<EarningsLedger(id={self.id}, provider_id={self.provider_id}, type={self.entry_type}, amount_cents={self.amount_cents})>"
