from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.db.session import get_db
from app.models.user import User
from app.models.provider import Provider
from app.models.patient import Patient
from app.models.enums import UserRole
from app.schemas.auth import (
    RegisterPatientRequest,
    RegisterProviderRequest,
    LoginRequest,
    TokenResponse,
)
from app.schemas.user import UserResponse
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
)
from app.core.config import settings
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/register/patient", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_patient(request: RegisterPatientRequest, db: Session = Depends(get_db)):
    """
    Register new patient account
    FIX #5, #6 APPLIED: Password and phone validation in schema
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user
    user = User(
        email=request.email,
        hashed_password=get_password_hash(request.password),
        name=request.name,
        phone=request.phone,
        role=UserRole.PATIENT,
        is_active=1,
    )
    db.add(user)
    db.flush()  # Get user.id before creating patient profile

    # Create patient profile
    patient = Patient(user_id=user.id)
    db.add(patient)
    db.commit()
    db.refresh(user)

    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        role=user.role.value,
    )


@router.post("/register/provider", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_provider(request: RegisterProviderRequest, db: Session = Depends(get_db)):
    """
    Register new provider account
    FIX #5, #6 APPLIED: Password and phone validation in schema
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user
    user = User(
        email=request.email,
        hashed_password=get_password_hash(request.password),
        name=request.name,
        phone=request.phone,
        role=UserRole.PROVIDER,
        is_active=1,
    )
    db.add(user)
    db.flush()

    # Create provider profile
    provider = Provider(
        user_id=user.id,
        provider_type=request.provider_type,
        specialty=request.specialty,
        license_number=request.license_number,
        state=request.state,
        hourly_rate_cents=request.hourly_rate_cents,
    )
    db.add(provider)
    db.commit()
    db.refresh(user)

    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        role=user.role.value,
    )


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password"""
    # Find user
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Verify password
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Check if active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        role=user.role.value,
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get current authenticated user information"""
    return current_user
