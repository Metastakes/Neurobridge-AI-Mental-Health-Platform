from pydantic import BaseModel
from datetime import datetime


class PaymentMethodRequest(BaseModel):
    """Request to add/update payment method"""

    payment_method_id: str  # Stripe payment method ID


class PaymentIntentResponse(BaseModel):
    """Payment intent response"""

    id: int
    stripe_payment_intent_id: str
    amount_cents: int
    currency: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
