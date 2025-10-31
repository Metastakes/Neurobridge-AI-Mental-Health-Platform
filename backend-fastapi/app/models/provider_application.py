from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from enum import Enum as PyEnum


class ApplicationStatus(str, PyEnum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    DOCUMENTS_PENDING = "DOCUMENTS_PENDING"
    CAQH_VERIFICATION = "CAQH_VERIFICATION"
    BACKGROUND_CHECK = "BACKGROUND_CHECK"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ProviderApplication(Base):
    """
    Multi-step provider onboarding application
    Tracks the entire credentialing process
    """
    __tablename__ = "provider_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Application status
    status = Column(Enum(ApplicationStatus), nullable=False, default=ApplicationStatus.DRAFT, index=True)
    current_step = Column(Integer, nullable=False, default=1)  # 1-6 step wizard

    # Step 1: Basic Information
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    ssn_last_four = Column(String(4), nullable=True)  # Encrypted

    # Step 2: Professional Information
    npi_number = Column(String(10), nullable=True, index=True)
    dea_number = Column(String(9), nullable=True)
    provider_type = Column(String(50), nullable=True)
    specialties = Column(JSON, nullable=True)  # Array of specialty IDs
    years_experience = Column(Integer, nullable=True)

    # Step 3: Practice Address
    practice_name = Column(String(255), nullable=True)
    practice_address_line1 = Column(String(255), nullable=True)
    practice_address_line2 = Column(String(255), nullable=True)
    practice_city = Column(String(100), nullable=True)
    practice_state = Column(String(2), nullable=True)
    practice_zip = Column(String(10), nullable=True)
    practice_phone = Column(String(20), nullable=True)

    # Step 4: Licensure
    # (Stored in separate provider_licenses table)

    # Step 5: Insurance & Credentialing
    caqh_provider_id = Column(String(50), nullable=True)
    caqh_verified = Column(Boolean, default=False)
    caqh_verified_at = Column(DateTime, nullable=True)
    accepts_insurance = Column(Boolean, default=True)
    insurance_panels = Column(JSON, nullable=True)  # Array of insurance plan IDs

    # Step 6: Documents
    # (Stored in separate provider_documents table)
    documents_complete = Column(Boolean, default=False)

    # Background check
    background_check_consent = Column(Boolean, default=False)
    background_check_status = Column(String(50), nullable=True)
    background_check_completed_at = Column(DateTime, nullable=True)

    # Review & approval
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="provider_applications")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

    def __repr__(self):
        return f"<ProviderApplication(id={self.id}, user_id={self.user_id}, status={self.status})>"
