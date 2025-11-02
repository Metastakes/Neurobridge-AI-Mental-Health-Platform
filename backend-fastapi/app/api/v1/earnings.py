from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.db.session import get_db
from app.api.deps import get_current_provider
from app.models.provider import Provider
from app.models.earnings_ledger import EarningsLedger
from app.models.appointment import Appointment
from app.models.enums import EarningsEntryType, AppointmentStatus
from app.schemas.earnings import (
    EarningsDashboardResponse,
    EarningsBreakdown,
    PaymentTypeBreakdown,
)

router = APIRouter()


@router.get("/dashboard", response_model=EarningsDashboardResponse)
def get_earnings_dashboard(
    period_days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    provider: Provider = Depends(get_current_provider),
):
    """
    GUARANTEE: Provider Earnings Dashboard
    Complete earnings breakdown with cash vs insurance tracking
    FIX #3 APPLIED: N+1 query optimization - single query with aggregation
    """
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=period_days)

    # FIX #3: Single query to fetch all earnings (instead of 100+ separate queries)
    earnings = (
        db.query(EarningsLedger)
        .filter(
            EarningsLedger.provider_id == provider.id,
            EarningsLedger.created_at >= start_date,
            EarningsLedger.created_at <= end_date,
        )
        .all()
    )

    # Aggregate in Python (more efficient than multiple DB queries)
    earnings_breakdown = {
        "session_revenue_cents": 0,
        "no_show_fees_cents": 0,
        "insurance_topup_cents": 0,
        "admin_fees_cents": 0,
        "late_cancel_fees_cents": 0,
    }

    payment_type_breakdown = {
        "cash_revenue_cents": 0,
        "insurance_revenue_cents": 0,
    }

    total_earnings_cents = 0

    for entry in earnings:
        # Aggregate by entry type
        if entry.entry_type == EarningsEntryType.SESSION_REVENUE:
            earnings_breakdown["session_revenue_cents"] += entry.amount_cents
        elif entry.entry_type == EarningsEntryType.NO_SHOW_FEE:
            earnings_breakdown["no_show_fees_cents"] += entry.amount_cents
        elif entry.entry_type == EarningsEntryType.INSURANCE_TOPUP:
            earnings_breakdown["insurance_topup_cents"] += entry.amount_cents
        elif entry.entry_type == EarningsEntryType.ADMIN_FEE:
            earnings_breakdown["admin_fees_cents"] += entry.amount_cents  # Negative value
        elif entry.entry_type == EarningsEntryType.LATE_CANCEL_FEE:
            earnings_breakdown["late_cancel_fees_cents"] += entry.amount_cents

        # Aggregate by payment type
        if entry.payment_type == "CASH":
            payment_type_breakdown["cash_revenue_cents"] += entry.amount_cents
        elif entry.payment_type == "INSURANCE":
            payment_type_breakdown["insurance_revenue_cents"] += entry.amount_cents

        # Total
        total_earnings_cents += entry.amount_cents

    # FIX #3: Single query for appointment counts (instead of 4+ separate queries)
    appointment_counts = (
        db.query(
            func.count(Appointment.id).label("total"),
            func.sum(
                func.case((Appointment.status == AppointmentStatus.COMPLETED, 1), else_=0)
            ).label("completed"),
            func.sum(
                func.case((Appointment.status == AppointmentStatus.NO_SHOW, 1), else_=0)
            ).label("no_show"),
            func.sum(
                func.case((Appointment.status == AppointmentStatus.CANCELLED, 1), else_=0)
            ).label("cancelled"),
        )
        .filter(
            Appointment.provider_id == provider.user_id,
            Appointment.created_at >= start_date,
            Appointment.created_at <= end_date,
        )
        .first()
    )

    return EarningsDashboardResponse(
        provider_id=provider.id,
        period_start=start_date.isoformat(),
        period_end=end_date.isoformat(),
        total_earnings_cents=total_earnings_cents,
        earnings_breakdown=EarningsBreakdown(**earnings_breakdown),
        payment_type_breakdown=PaymentTypeBreakdown(**payment_type_breakdown),
        total_appointments=appointment_counts.total or 0,
        completed_appointments=appointment_counts.completed or 0,
        no_show_count=appointment_counts.no_show or 0,
        cancelled_count=appointment_counts.cancelled or 0,
    )
