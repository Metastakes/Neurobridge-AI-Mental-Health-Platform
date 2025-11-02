from sqlalchemy.orm import Session
from app.models.provider import Provider
from app.models.earnings_ledger import EarningsLedger
from app.models.enums import EarningsEntryType
from app.services.billing.rules_engine import BillingRulesEngine
import logging

logger = logging.getLogger(__name__)


class AdminFeeCalculator:
    """
    GUARANTEE: Admin fees disabled by default, state-specific legality enforcement
    Calculates and applies admin fees only where legal and enabled
    """

    def __init__(self, db: Session):
        self.db = db
        self.rules_engine = BillingRulesEngine(db)

    def calculate_admin_fee(self, provider_id: int, transaction_amount_cents: int) -> int:
        """
        Calculate admin fee for a transaction
        GUARANTEE: Returns 0 unless explicitly enabled and legal in provider's state
        """
        # Get provider state
        provider = self.db.query(Provider).filter(Provider.id == provider_id).first()
        if not provider or not provider.state:
            logger.info(f"Provider {provider_id} has no state - admin fee disabled")
            return 0

        # Check if admin fees are enabled for this state
        if not self.rules_engine.is_admin_fee_enabled(provider.state):
            logger.info(f"Admin fees disabled for state {provider.state}")
            return 0

        # Get fee percentage
        percentage = self.rules_engine.get_admin_fee_percentage(provider.state)
        if percentage <= 0:
            return 0

        # Calculate fee
        fee_cents = int(transaction_amount_cents * (percentage / 100))
        logger.info(
            f"Admin fee calculated for provider {provider_id}: ${fee_cents/100:.2f} ({percentage}% of ${transaction_amount_cents/100:.2f})"
        )

        return fee_cents

    def apply_admin_fee(
        self, provider_id: int, appointment_id: int, transaction_amount_cents: int
    ) -> bool:
        """
        Apply admin fee to provider's earnings ledger
        GUARANTEE: Only applied if enabled and legal
        """
        try:
            fee_cents = self.calculate_admin_fee(provider_id, transaction_amount_cents)

            if fee_cents <= 0:
                logger.info("No admin fee to apply")
                return True

            # Record admin fee in earnings ledger (negative amount - deduction)
            earnings_entry = EarningsLedger(
                provider_id=provider_id,
                appointment_id=appointment_id,
                entry_type=EarningsEntryType.ADMIN_FEE,
                amount_cents=-fee_cents,  # Negative for deduction
                description=f"Admin fee for appointment {appointment_id}",
            )
            self.db.add(earnings_entry)
            self.db.commit()

            logger.info(f"Admin fee applied: ${fee_cents/100:.2f} deducted from provider {provider_id}")
            return True

        except Exception as e:
            logger.error(f"Error applying admin fee: {str(e)}")
            self.db.rollback()
            return False
