from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import boto3
from botocore.exceptions import ClientError
import os
from datetime import datetime

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.provider import Provider
from app.models.provider_document import ProviderDocument, DocumentType, DocumentStatus
from app.schemas.provider_document import (
    ProviderDocumentResponse,
    DocumentUploadResponse,
)
from app.core.config import settings

router = APIRouter()

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_provider_document(
    document_type: DocumentType,
    file: UploadFile = File(...),
    description: str = "",
    expiration_date: datetime = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload provider document to S3
    Supports: DEA, licenses, insurance, CV, etc.
    """
    # Get provider
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found. Please complete your application first."
        )

    # Validate file type
    allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: PDF, JPEG, PNG. Got: {file.content_type}"
        )

    # Validate file size (max 10MB)
    file_content = await file.read()
    file_size = len(file_content)
    if file_size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10MB limit"
        )

    # Generate unique file path
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    file_extension = os.path.splitext(file.filename)[1]
    s3_key = f"provider-documents/{provider.id}/{document_type.value}/{timestamp}{file_extension}"

    # Upload to S3
    try:
        s3_client.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=s3_key,
            Body=file_content,
            ContentType=file.content_type,
            ServerSideEncryption='AES256',  # Encrypt at rest
            Metadata={
                'provider_id': str(provider.id),
                'document_type': document_type.value,
                'uploaded_by': str(current_user.id),
            }
        )
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload to S3: {str(e)}"
        )

    # Create database record
    document = ProviderDocument(
        provider_id=provider.id,
        document_type=document_type,
        document_name=file.filename,
        description=description,
        file_path=s3_key,
        file_size=file_size,
        file_type=file.content_type,
        s3_bucket=settings.AWS_S3_BUCKET,
        s3_key=s3_key,
        status=DocumentStatus.UPLOADED,
        expiration_date=expiration_date,
        requires_renewal=1 if expiration_date else 0,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "document_id": document.id,
        "document_type": document.document_type,
        "file_name": document.document_name,
        "file_size": document.file_size,
        "s3_key": s3_key,
        "status": document.status,
        "uploaded_at": document.uploaded_at,
    }


@router.get("/documents", response_model=List[ProviderDocumentResponse])
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all documents for current provider"""
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found"
        )

    documents = db.query(ProviderDocument).filter(
        ProviderDocument.provider_id == provider.id
    ).order_by(ProviderDocument.uploaded_at.desc()).all()

    return documents


@router.get("/documents/{document_id}/download")
def get_document_download_url(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate pre-signed URL for document download"""
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found"
        )

    document = db.query(ProviderDocument).filter(
        ProviderDocument.id == document_id,
        ProviderDocument.provider_id == provider.id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Generate pre-signed URL (valid for 1 hour)
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': document.s3_bucket,
                'Key': document.s3_key
            },
            ExpiresIn=3600  # 1 hour
        )

        return {
            "download_url": url,
            "expires_in": 3600,
            "document_name": document.document_name,
        }
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate download URL: {str(e)}"
        )


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete document from S3 and database"""
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found"
        )

    document = db.query(ProviderDocument).filter(
        ProviderDocument.id == document_id,
        ProviderDocument.provider_id == provider.id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Delete from S3
    try:
        s3_client.delete_object(
            Bucket=document.s3_bucket,
            Key=document.s3_key
        )
    except ClientError as e:
        # Log error but continue with database deletion
        print(f"Failed to delete from S3: {str(e)}")

    # Delete from database
    db.delete(document)
    db.commit()

    return None
