from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.enums import ReferralStatus


class Referral(Base):
    """
    GUARANTEE: Referrals across scope tiers
    Therapist → PMHNP/Psychiatrist (medication needs)
    PMHNP/Psychiatrist → FNP (medical needs outside scope)
    """
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True, index=True)

    # Referral parties
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    referring_provider_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    referred_to_provider_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # Null if unassigned

    # Referral details
    reason = Column(Text, nullable=False)
    clinical_notes = Column(Text, nullable=True)  # Encrypted PHI
    status = Column(Enum(ReferralStatus), nullable=False, default=ReferralStatus.PENDING, index=True)

    # Scope tracking
    from_provider_type = Column(String(50), nullable=False)  # e.g., THERAPIST
    to_provider_type = Column(String(50), nullable=False)  # e.g., PMHNP

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    patient = relationship("User", foreign_keys=[patient_id], backref="referrals_received")
    referring_provider = relationship("User", foreign_keys=[referring_provider_id], backref="referrals_made")
    referred_to_provider = relationship("User", foreign_keys=[referred_to_provider_id], backref="referrals_accepted")

    def __repr__(self):
        return f"<Referral(id={self.id}, patient_id={self.patient_id}, status={self.status})>"
