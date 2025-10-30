from sqlalchemy.orm import Session
from app.models.appointment import Appointment
from app.models.provider import Provider
from app.models.patient import Patient
from app.models.earnings_ledger import EarningsLedger
from app.models.enums import AppointmentStatus, EarningsEntryType
from app.services.billing.rules_engine import BillingRulesEngine
from app.services.payment import PaymentService
from app.services.hipaa_logger import HIPAALogger
import logging

logger = logging.getLogger(__name__)


class NoShowHandler:
    """
    GUARANTEE: No-show/late cancel fees ≥ $50
    Processes no-show appointments and charges appropriate fees
    """

    def __init__(self, db: Session):
        self.db = db
        self.rules_engine = BillingRulesEngine(db)
        self.payment_service = PaymentService(db)

    def process_no_show(self, appointment: Appointment) -> bool:
        """
        Process no-show appointment and charge fee
        GUARANTEE: Fee ≥ $50 enforced
        Returns True if successful, False otherwise
        """
        try:
            # Get provider settings
            provider = self.db.query(Provider).filter(Provider.user_id == appointment.provider_id).first()
            if not provider:
                logger.error(f"Provider not found for appointment {appointment.id}")
                return False

            provider_settings = {
                "no_show_min_fee_cents": provider.no_show_min_fee_cents,
                "insurance_no_show_fee_cents": provider.insurance_no_show_fee_cents,
            }

            # Get fee from rules engine (GUARANTEE: ≥ $50)
            fee_cents = self.rules_engine.get_no_show_fee(
                appointment.payment_type.value, provider_settings
            )

            logger.info(f"Processing no-show for appointment {appointment.id}, fee: ${fee_cents/100:.2f}")

            # Get patient
            patient = self.db.query(Patient).filter(Patient.user_id == appointment.patient_id).first()
            if not patient:
                logger.error(f"Patient not found for appointment {appointment.id}")
                return False

            # GUARANTEE: Payment method required
            if not patient.default_payment_method_id:
                logger.error(f"Patient {patient.user_id} has no payment method - cannot charge no-show fee")
                return False

            # Charge no-show fee
            try:
                payment_intent = self.payment_service.create_payment_intent(
                    patient_id=patient.user_id,
                    amount_cents=fee_cents,
                    description=f"No-show fee for appointment {appointment.id}",
                    appointment_id=appointment.id,
                )

                if payment_intent.status != "succeeded":
                    logger.error(f"Payment failed for no-show fee: {payment_intent.status}")
                    return False

            except ValueError as e:
                logger.error(f"Failed to charge no-show fee: {str(e)}")
                return False

            # Update appointment
            appointment.status = AppointmentStatus.NO_SHOW
            appointment.no_show_fee_charged_cents = fee_cents

            # Record in earnings ledger
            earnings_entry = EarningsLedger(
                provider_id=provider.id,
                appointment_id=appointment.id,
                entry_type=EarningsEntryType.NO_SHOW_FEE,
                amount_cents=fee_cents,
                payment_type=appointment.payment_type.value,
                description=f"No-show fee for appointment {appointment.id}",
            )
            self.db.add(earnings_entry)

            # HIPAA audit log
            HIPAALogger.log_phi_access(
                db=self.db,
                user_id=provider.user_id,
                action="CHARGE_NO_SHOW_FEE",
                resource_type="Appointment",
                resource_id=appointment.id,
                reason=f"Patient no-show, charged ${fee_cents/100:.2f}",
            )

            self.db.commit()

            logger.info(f"No-show processed successfully: appointment {appointment.id}, fee ${fee_cents/100:.2f}")
            return True

        except Exception as e:
            logger.error(f"Error processing no-show for appointment {appointment.id}: {str(e)}")
            self.db.rollback()
            return False

    def process_late_cancellation(self, appointment: Appointment) -> bool:
        """
        Process late cancellation (similar to no-show)
        Charges late cancellation fee if within window
        """
        try:
            provider = self.db.query(Provider).filter(Provider.user_id == appointment.provider_id).first()
            if not provider:
                return False

            provider_settings = {
                "no_show_min_fee_cents": provider.no_show_min_fee_cents,
                "insurance_no_show_fee_cents": provider.insurance_no_show_fee_cents,
                "late_cancel_window_hours": provider.late_cancel_window_hours,
            }

            # Check if cancellation is late
            from datetime import datetime
            cancel_time = datetime.utcnow()
            is_late = self.rules_engine.is_late_cancellation(
                cancel_time, appointment.starts_at, provider_settings
            )

            if not is_late:
                logger.info(f"Cancellation is not late, no fee charged")
                return True

            # Charge late cancellation fee (same as no-show)
            fee_cents = self.rules_engine.get_no_show_fee(
                appointment.payment_type.value, provider_settings
            )

            patient = self.db.query(Patient).filter(Patient.user_id == appointment.patient_id).first()
            if not patient or not patient.default_payment_method_id:
                return False

            # Charge fee
            payment_intent = self.payment_service.create_payment_intent(
                patient_id=patient.user_id,
                amount_cents=fee_cents,
                description=f"Late cancellation fee for appointment {appointment.id}",
                appointment_id=appointment.id,
            )

            if payment_intent.status != "succeeded":
                return False

            # Update appointment
            appointment.status = AppointmentStatus.CANCELLED
            appointment.no_show_fee_charged_cents = fee_cents

            # Record in earnings ledger
            earnings_entry = EarningsLedger(
                provider_id=provider.id,
                appointment_id=appointment.id,
                entry_type=EarningsEntryType.LATE_CANCEL_FEE,
                amount_cents=fee_cents,
                payment_type=appointment.payment_type.value,
                description=f"Late cancellation fee for appointment {appointment.id}",
            )
            self.db.add(earnings_entry)

            self.db.commit()

            logger.info(f"Late cancellation processed: appointment {appointment.id}, fee ${fee_cents/100:.2f}")
            return True

        except Exception as e:
            logger.error(f"Error processing late cancellation: {str(e)}")
            self.db.rollback()
            return False
