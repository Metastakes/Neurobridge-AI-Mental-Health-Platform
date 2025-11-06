"""
NeuroBridge - Subscription API Routes
"""

from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional
from pydantic import BaseModel
from ..services.stripe_service import stripe_service

router = APIRouter(prefix="/api/subscription", tags=["subscription"])


# Request models
class VerifyPaymentMethodRequest(BaseModel):
    payment_method_id: str


class StartTrialRequest(BaseModel):
    tier_name: str  # "Pro" or "Elite"


class UpgradeSubscriptionRequest(BaseModel):
    tier_name: str
    billing_cycle: str = "monthly"  # "monthly" or "yearly"


class CheckFeatureAccessRequest(BaseModel):
    feature_name: str


# Routes
@router.get("/tiers")
async def get_subscription_tiers():
    """Get all available subscription tiers"""
    tiers = await stripe_service.get_subscription_tiers()
    return {"tiers": tiers}


@router.post("/verify-payment-method")
async def verify_payment_method(
    request: VerifyPaymentMethodRequest,
    user_id: str = Header(..., alias="X-User-ID")
):
    """
    Verify payment method with $1 authorization
    Required before starting a trial
    """
    success = await stripe_service.verify_payment_method(
        user_id,
        request.payment_method_id
    )

    if not success:
        raise HTTPException(status_code=400, detail="Failed to verify payment method")

    return {"status": "verified"}


@router.post("/start-trial")
async def start_trial(
    request: StartTrialRequest,
    user_id: str = Header(..., alias="X-User-ID")
):
    """
    Start a trial subscription
    Requires payment method to be verified first
    """
    result = await stripe_service.start_trial(user_id, request.tier_name)

    if not result or "error" in result:
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Failed to start trial")
        )

    return result


@router.post("/upgrade")
async def upgrade_subscription(
    request: UpgradeSubscriptionRequest,
    user_id: str = Header(..., alias="X-User-ID")
):
    """Upgrade to a paid subscription"""
    result = await stripe_service.upgrade_subscription(
        user_id,
        request.tier_name,
        request.billing_cycle
    )

    if not result or "error" in result:
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Failed to upgrade subscription")
        )

    return result


@router.post("/cancel")
async def cancel_subscription(
    immediate: bool = False,
    user_id: str = Header(..., alias="X-User-ID")
):
    """Cancel subscription"""
    success = await stripe_service.cancel_subscription(user_id, immediate)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to cancel subscription")

    return {"status": "canceled"}


@router.post("/check-feature-access")
async def check_feature_access(
    request: CheckFeatureAccessRequest,
    user_id: str = Header(..., alias="X-User-ID")
):
    """Check if user has access to a premium feature"""
    result = await stripe_service.check_feature_access(user_id, request.feature_name)
    return result


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events
    """
    payload = await request.body()
    signature = request.headers.get("stripe-signature")

    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    result = await stripe_service.handle_webhook(payload, signature)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result
