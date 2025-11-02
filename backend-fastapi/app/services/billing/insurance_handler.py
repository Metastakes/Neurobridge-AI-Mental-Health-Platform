from sqlalchemy.orm import Session
from app.models.appointment import Appointment
from app.models.provider import Provider
from app.models.earnings_ledger import EarningsLedger
from app.models.enums import EarningsEntryType
import logging

logger = logging.getLogger(__name__)


class InsuranceHandler:
    """
    Handles insurance payment processing and top-ups
    Tracks cash vs insurance revenue for provider earnings dashboard
    """

    def __init__(self, db: Session):
        self.db = db

    def process_insurance_payment(
        self,
        appointment: Appointment,
        provider: Provider,
        insurance_payment_cents: int,
    ) -> bool:
        """
        Process insurance payment and calculate top-up if needed
        Insurance often pays less than provider's full rate
        """
        try:
            # Provider's full rate for session duration
            session_duration_hours = (appointment.ends_at - appointment.starts_at).total_seconds() / 3600
            full_rate_cents = int(provider.hourly_rate_cents * session_duration_hours)

            # Record insurance payment
            insurance_entry = EarningsLedger(
                provider_id=provider.id,
                appointment_id=appointment.id,
                entry_type=EarningsEntryType.SESSION_REVENUE,
                amount_cents=insurance_payment_cents,
                payment_type="INSURANCE",
                description=f"Insurance payment for appointment {appointment.id}",
            )
            self.db.add(insurance_entry)

            # Calculate top-up if insurance paid less than full rate
            if insurance_payment_cents < full_rate_cents:
                topup_cents = full_rate_cents - insurance_payment_cents

                topup_entry = EarningsLedger(
                    provider_id=provider.id,
                    appointment_id=appointment.id,
                    entry_type=EarningsEntryType.INSURANCE_TOPUP,
                    amount_cents=topup_cents,
                    payment_type="INSURANCE",
                    description=f"Insurance top-up for appointment {appointment.id} (difference between insurance payment and full rate)",
                )
                self.db.add(topup_entry)

                logger.info(
                    f"Insurance top-up: ${topup_cents/100:.2f} (insurance paid ${insurance_payment_cents/100:.2f}, full rate ${full_rate_cents/100:.2f})"
                )

            self.db.commit()
            return True

        except Exception as e:
            logger.error(f"Error processing insurance payment: {str(e)}")
            self.db.rollback()
            return False

    def process_cash_payment(
        self, appointment: Appointment, provider: Provider, amount_cents: int
    ) -> bool:
        """
        Process cash payment (patient paid directly)
        """
        try:
            cash_entry = EarningsLedger(
                provider_id=provider.id,
                appointment_id=appointment.id,
                entry_type=EarningsEntryType.SESSION_REVENUE,
                amount_cents=amount_cents,
                payment_type="CASH",
                description=f"Cash payment for appointment {appointment.id}",
            )
            self.db.add(cash_entry)
            self.db.commit()

            logger.info(f"Cash payment recorded: ${amount_cents/100:.2f}")
            return True

        except Exception as e:
            logger.error(f"Error processing cash payment: {str(e)}")
            self.db.rollback()
            return False
