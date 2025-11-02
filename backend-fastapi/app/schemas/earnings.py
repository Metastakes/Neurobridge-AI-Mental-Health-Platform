from pydantic import BaseModel
from typing import Dict


class EarningsBreakdown(BaseModel):
    """Individual earnings category breakdown"""

    session_revenue_cents: int
    no_show_fees_cents: int
    insurance_topup_cents: int
    admin_fees_cents: int
    late_cancel_fees_cents: int


class PaymentTypeBreakdown(BaseModel):
    """Revenue breakdown by payment type"""

    cash_revenue_cents: int
    insurance_revenue_cents: int


class EarningsDashboardResponse(BaseModel):
    """
    GUARANTEE: Provider Earnings Dashboard
    Complete earnings breakdown with cash vs insurance tracking
    """

    provider_id: int
    period_start: str
    period_end: str

    # Total earnings
    total_earnings_cents: int

    # Earnings by type
    earnings_breakdown: EarningsBreakdown

    # Earnings by payment method
    payment_type_breakdown: PaymentTypeBreakdown

    # Appointment counts
    total_appointments: int
    completed_appointments: int
    no_show_count: int
    cancelled_count: int

    class Config:
        from_attributes = True
