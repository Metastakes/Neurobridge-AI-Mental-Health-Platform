from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from enum import Enum as PyEnum


class DocumentType(str, PyEnum):
    DEA_CERTIFICATE = "DEA_CERTIFICATE"
    STATE_LICENSE = "STATE_LICENSE"
    BOARD_CERTIFICATION = "BOARD_CERTIFICATION"
    MALPRACTICE_INSURANCE = "MALPRACTICE_INSURANCE"
    CV_RESUME = "CV_RESUME"
    DIPLOMA = "DIPLOMA"
    PHOTO_ID = "PHOTO_ID"
    W9_TAX_FORM = "W9_TAX_FORM"
    CAQH_ATTESTATION = "CAQH_ATTESTATION"
    OTHER = "OTHER"


class DocumentStatus(str, PyEnum):
    PENDING = "PENDING"
    UPLOADED = "UPLOADED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class ProviderDocument(Base):
    """
    Documents uploaded by providers during credentialing
    Stored in S3, metadata in database
    """
    __tablename__ = "provider_documents"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False, index=True)

    # Document information
    document_type = Column(Enum(DocumentType), nullable=False, index=True)
    document_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # File storage
    file_path = Column(String(500), nullable=False)  # S3 path
    file_size = Column(Integer, nullable=True)  # bytes
    file_type = Column(String(50), nullable=True)  # MIME type
    s3_bucket = Column(String(100), nullable=True)
    s3_key = Column(String(500), nullable=True)

    # Status
    status = Column(Enum(DocumentStatus), nullable=False, default=DocumentStatus.UPLOADED, index=True)

    # Expiration (for licenses, insurance, etc.)
    expiration_date = Column(DateTime, nullable=True, index=True)
    requires_renewal = Column(Integer, default=0)  # 0=no, 1=yes

    # Review
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Timestamps
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    provider = relationship("Provider", backref="documents")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

    def __repr__(self):
        return f"<ProviderDocument(id={self.id}, type={self.document_type}, status={self.status})>"
