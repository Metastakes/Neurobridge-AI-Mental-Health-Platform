from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class ProviderLicense(Base):
    """
    State medical licenses for providers
    Each provider can have multiple licenses for different states
    """
    __tablename__ = "provider_licenses"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False, index=True)

    # License information
    license_type = Column(String(50), nullable=False)  # MD, DO, LCSW, LPC, etc.
    license_number = Column(String(50), nullable=False)
    state = Column(String(2), nullable=False, index=True)
    issue_date = Column(DateTime, nullable=False)
    expiration_date = Column(DateTime, nullable=False, index=True)

    # Verification
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime, nullable=True)
    verification_source = Column(String(255), nullable=True)  # State board URL, etc.

    # Status
    is_active = Column(Boolean, default=True)
    is_primary = Column(Boolean, default=False)  # Primary practicing state

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationship
    provider = relationship("Provider", backref="licenses")

    def __repr__(self):
        return f"<ProviderLicense(id={self.id}, provider_id={self.provider_id}, state={self.state})>"
