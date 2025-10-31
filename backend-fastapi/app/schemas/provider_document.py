from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.provider_document import DocumentType, DocumentStatus


class DocumentUploadResponse(BaseModel):
    """Response after uploading a document"""
    document_id: int
    document_type: DocumentType
    file_name: str
    file_size: int
    s3_key: str
    status: DocumentStatus
    uploaded_at: datetime


class ProviderDocumentResponse(BaseModel):
    """Provider document details"""
    id: int
    provider_id: int
    document_type: DocumentType
    document_name: str
    description: Optional[str]
    file_size: Optional[int]
    file_type: Optional[str]
    status: DocumentStatus
    expiration_date: Optional[datetime]
    requires_renewal: int
    uploaded_at: datetime
    reviewed_at: Optional[datetime]
    rejection_reason: Optional[str]

    class Config:
        from_attributes = True
