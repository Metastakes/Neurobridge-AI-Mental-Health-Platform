import stripe
from stripe.error import StripeError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.payment_intent import PaymentIntent
from app.models.patient import Patient
import logging

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = settings.STRIPE_API_KEY


class PaymentService:
    """
    GUARANTEE: Payment method required to book appointments
    Handles Stripe payment processing with error handling
    """

    def __init__(self, db: Session):
        self.db = db

    def create_payment_intent(
        self,
        patient_id: int,
        amount_cents: int,
        description: str,
        appointment_id: int | None = None,
    ) -> PaymentIntent:
        """
        Create Stripe payment intent and store in database
        FIX #9 APPLIED: Comprehensive error handling for Stripe operations
        """
        # Get patient's default payment method
        patient = self.db.query(Patient).filter(Patient.user_id == patient_id).first()
        if not patient or not patient.default_payment_method_id:
            raise ValueError("Patient must have a payment method on file")

        try:
            # Create Stripe payment intent
            stripe_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency="usd",
                payment_method=patient.default_payment_method_id,
                confirm=True,
                automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
                description=description,
                metadata={
                    "patient_id": patient_id,
                    "appointment_id": appointment_id or "",
                },
            )

            # Store payment intent in database
            payment_intent = PaymentIntent(
                stripe_payment_intent_id=stripe_intent.id,
                patient_id=patient_id,
                appointment_id=appointment_id,
                amount_cents=amount_cents,
                currency="usd",
                status=stripe_intent.status,
                payment_method_id=patient.default_payment_method_id,
                description=description,
            )
            self.db.add(payment_intent)
            self.db.commit()
            self.db.refresh(payment_intent)

            logger.info(
                f"Payment intent created: {stripe_intent.id} for patient {patient_id}, amount ${amount_cents/100:.2f}"
            )

            return payment_intent

        except StripeError as e:
            # FIX #9 APPLIED: Proper error handling with user-friendly messages
            logger.error(f"Stripe payment failed for patient {patient_id}: {str(e)}")

            # Store failed payment intent
            payment_intent = PaymentIntent(
                stripe_payment_intent_id=getattr(e, "payment_intent_id", ""),
                patient_id=patient_id,
                appointment_id=appointment_id,
                amount_cents=amount_cents,
                currency="usd",
                status="failed",
                payment_method_id=patient.default_payment_method_id,
                description=description,
                failure_message=str(e),
            )
            self.db.add(payment_intent)
            self.db.commit()

            # Return user-friendly error message
            user_message = getattr(e, "user_message", None) or "Payment failed. Please try again or use a different payment method."
            raise ValueError(user_message)

    def update_payment_method(self, patient_id: int, payment_method_id: str) -> bool:
        """
        Update patient's default payment method
        Verifies payment method with Stripe first
        """
        try:
            # Verify payment method exists in Stripe
            stripe.PaymentMethod.retrieve(payment_method_id)

            # Update patient record
            patient = self.db.query(Patient).filter(Patient.user_id == patient_id).first()
            if not patient:
                raise ValueError("Patient not found")

            patient.default_payment_method_id = payment_method_id
            self.db.commit()

            logger.info(f"Payment method updated for patient {patient_id}")
            return True

        except StripeError as e:
            logger.error(f"Invalid payment method {payment_method_id}: {str(e)}")
            raise ValueError("Invalid payment method. Please try again.")
