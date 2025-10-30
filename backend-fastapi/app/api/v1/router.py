from fastapi import APIRouter
from app.api.v1 import auth, appointments, earnings, payments, pre_session, medication, referrals

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
api_router.include_router(earnings.router, prefix="/earnings", tags=["Earnings"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(pre_session.router, prefix="/pre-session", tags=["Pre-Session Tasks"])
api_router.include_router(medication.router, prefix="/medication", tags=["Medication Education"])
api_router.include_router(referrals.router, prefix="/referrals", tags=["Referrals"])
