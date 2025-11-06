"""
NeuroBridge - Stripe Subscription Service
Handles subscription creation, management, and webhooks
"""

import os
import stripe
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from supabase import create_client, Client

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)


class StripeSubscriptionService:
    """Manages Stripe subscriptions and payments"""

    def __init__(self):
        self.stripe = stripe

    async def get_subscription_tiers(self) -> List[Dict]:
        """Get all subscription tiers from database"""
        try:
            result = supabase.table("subscription_tier").select("*").execute()
            return result.data
        except Exception as e:
            print(f"Error fetching subscription tiers: {e}")
            return []

    async def create_customer(self, user_id: str, email: str, full_name: str) -> Optional[str]:
        """Create a Stripe customer for the user"""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=full_name,
                metadata={"user_id": user_id}
            )

            # Update user profile with Stripe customer ID
            supabase.table("profiles").update({
                "stripe_customer_id": customer.id
            }).eq("id", user_id).execute()

            return customer.id
        except Exception as e:
            print(f"Error creating Stripe customer: {e}")
            return None

    async def verify_payment_method(self, user_id: str, payment_method_id: str) -> bool:
        """
        Verify payment method with $1 authorization (then refund)
        Required before trial activation
        """
        try:
            # Get or create Stripe customer
            profile = supabase.table("profiles").select("stripe_customer_id, email, full_name").eq("id", user_id).single().execute()

            stripe_customer_id = profile.data.get("stripe_customer_id")
            if not stripe_customer_id:
                stripe_customer_id = await self.create_customer(
                    user_id,
                    profile.data["email"],
                    profile.data["full_name"]
                )

            # Attach payment method to customer
            stripe.PaymentMethod.attach(
                payment_method_id,
                customer=stripe_customer_id
            )

            # Set as default payment method
            stripe.Customer.modify(
                stripe_customer_id,
                invoice_settings={"default_payment_method": payment_method_id}
            )

            # Create $1 authorization (will be released automatically)
            payment_intent = stripe.PaymentIntent.create(
                amount=100,  # $1.00 in cents
                currency="usd",
                customer=stripe_customer_id,
                payment_method=payment_method_id,
                confirm=True,
                capture_method="manual",  # Authorize only, don't capture
                description="Card verification for NeuroBridge trial"
            )

            # Get card details
            payment_method = stripe.PaymentMethod.retrieve(payment_method_id)
            card = payment_method.card

            # Store payment method in database
            supabase.table("payment_method").insert({
                "user_id": user_id,
                "stripe_payment_method_id": payment_method_id,
                "card_brand": card.brand,
                "card_last4": card.last4,
                "card_exp_month": card.exp_month,
                "card_exp_year": card.exp_year,
                "is_default": True,
                "verified_at": datetime.utcnow().isoformat()
            }).execute()

            return True
        except Exception as e:
            print(f"Error verifying payment method: {e}")
            return False

    async def start_trial(self, user_id: str, tier_name: str) -> Optional[Dict]:
        """
        Start a trial subscription
        Requires payment method to be verified first
        """
        try:
            # Get tier details
            tier = supabase.table("subscription_tier").select("*").eq("name", tier_name).single().execute()
            if not tier.data:
                return None

            tier_data = tier.data
            trial_days = tier_data.get("trial_days", 0)

            if trial_days == 0:
                return {"error": "This tier does not offer a trial"}

            # Check if payment method is verified
            payment_method = supabase.table("payment_method").select("*").eq("user_id", user_id).eq("is_default", True).single().execute()
            if not payment_method.data:
                return {"error": "Please add a payment method before starting trial"}

            # Get Stripe customer
            profile = supabase.table("profiles").select("stripe_customer_id").eq("id", user_id).single().execute()
            stripe_customer_id = profile.data.get("stripe_customer_id")

            # Create Stripe subscription with trial
            subscription = stripe.Subscription.create(
                customer=stripe_customer_id,
                items=[{"price": tier_data["stripe_price_id_monthly"]}],
                trial_period_days=trial_days,
                metadata={"user_id": user_id}
            )

            # Store subscription in database
            trial_end = datetime.utcnow() + timedelta(days=trial_days)

            supabase.table("subscription").upsert({
                "user_id": user_id,
                "tier_id": tier_data["id"],
                "status": "trial",
                "billing_cycle": "monthly",
                "stripe_customer_id": stripe_customer_id,
                "stripe_subscription_id": subscription.id,
                "trial_start_date": datetime.utcnow().isoformat(),
                "trial_end_date": trial_end.isoformat(),
                "current_period_start": datetime.fromtimestamp(subscription.current_period_start).isoformat(),
                "current_period_end": datetime.fromtimestamp(subscription.current_period_end).isoformat()
            }).execute()

            return {
                "subscription_id": subscription.id,
                "status": "trial",
                "trial_end": trial_end.isoformat()
            }
        except Exception as e:
            print(f"Error starting trial: {e}")
            return {"error": str(e)}

    async def upgrade_subscription(self, user_id: str, tier_name: str, billing_cycle: str = "monthly") -> Optional[Dict]:
        """Upgrade user's subscription to a new tier"""
        try:
            # Get current subscription
            current_sub = supabase.table("subscription").select("*").eq("user_id", user_id).single().execute()

            # Get new tier details
            tier = supabase.table("subscription_tier").select("*").eq("name", tier_name).single().execute()
            tier_data = tier.data

            price_id = tier_data.get(f"stripe_price_id_{billing_cycle}")

            if current_sub.data and current_sub.data.get("stripe_subscription_id"):
                # Modify existing subscription
                subscription = stripe.Subscription.modify(
                    current_sub.data["stripe_subscription_id"],
                    items=[{
                        "id": stripe.Subscription.retrieve(current_sub.data["stripe_subscription_id"]).items.data[0].id,
                        "price": price_id
                    }],
                    proration_behavior="always_invoice"
                )
            else:
                # Create new subscription
                profile = supabase.table("profiles").select("stripe_customer_id").eq("id", user_id).single().execute()
                stripe_customer_id = profile.data.get("stripe_customer_id")

                subscription = stripe.Subscription.create(
                    customer=stripe_customer_id,
                    items=[{"price": price_id}],
                    metadata={"user_id": user_id}
                )

            # Update database
            supabase.table("subscription").upsert({
                "user_id": user_id,
                "tier_id": tier_data["id"],
                "status": "active",
                "billing_cycle": billing_cycle,
                "stripe_subscription_id": subscription.id,
                "current_period_start": datetime.fromtimestamp(subscription.current_period_start).isoformat(),
                "current_period_end": datetime.fromtimestamp(subscription.current_period_end).isoformat()
            }).execute()

            return {
                "subscription_id": subscription.id,
                "status": "active",
                "tier": tier_name
            }
        except Exception as e:
            print(f"Error upgrading subscription: {e}")
            return {"error": str(e)}

    async def cancel_subscription(self, user_id: str, immediate: bool = False) -> bool:
        """Cancel user's subscription"""
        try:
            # Get current subscription
            current_sub = supabase.table("subscription").select("*").eq("user_id", user_id).single().execute()

            if not current_sub.data or not current_sub.data.get("stripe_subscription_id"):
                return False

            if immediate:
                # Cancel immediately
                stripe.Subscription.delete(current_sub.data["stripe_subscription_id"])

                supabase.table("subscription").update({
                    "status": "canceled",
                    "canceled_at": datetime.utcnow().isoformat()
                }).eq("user_id", user_id).execute()
            else:
                # Cancel at period end
                stripe.Subscription.modify(
                    current_sub.data["stripe_subscription_id"],
                    cancel_at_period_end=True
                )

                supabase.table("subscription").update({
                    "cancel_at_period_end": True,
                    "canceled_at": datetime.utcnow().isoformat()
                }).eq("user_id", user_id).execute()

            return True
        except Exception as e:
            print(f"Error canceling subscription: {e}")
            return False

    async def check_feature_access(self, user_id: str, feature_name: str) -> Dict:
        """
        Check if user has access to a premium feature
        Returns: {"access": bool, "reason": str}
        """
        try:
            # Get user's subscription
            result = supabase.table("subscription") \
                .select("*, subscription_tier(*)") \
                .eq("user_id", user_id) \
                .single() \
                .execute()

            if not result.data:
                # User has no subscription (Basic tier)
                access = feature_name in ["core_features", "basic_gamification"]
                return {
                    "access": access,
                    "reason": "basic_tier" if access else "requires_subscription"
                }

            subscription = result.data
            status = subscription["status"]
            tier_features = subscription["subscription_tier"]["features"]

            # Check if feature is included in tier
            has_feature = feature_name in tier_features

            # Check subscription status
            if status == "trial":
                # Check if trial is still active
                trial_end = datetime.fromisoformat(subscription["trial_end_date"])
                if datetime.utcnow() < trial_end:
                    access = has_feature
                    reason = "trial_active" if access else "not_in_tier"
                else:
                    access = False
                    reason = "trial_expired"

            elif status == "active":
                access = has_feature
                reason = "subscription_active" if access else "not_in_tier"

            elif status == "past_due":
                # Grace period - check if still within grace period
                grace_end = subscription.get("grace_period_end")
                if grace_end:
                    grace_end_dt = datetime.fromisoformat(grace_end)
                    if datetime.utcnow() < grace_end_dt:
                        access = has_feature
                        reason = "grace_period"
                    else:
                        access = False
                        reason = "payment_failed"
                else:
                    access = False
                    reason = "payment_failed"

            else:  # canceled, expired
                access = False
                reason = "subscription_expired"

            # Log access attempt
            supabase.table("feature_access_log").insert({
                "user_id": user_id,
                "feature_name": feature_name,
                "access_granted": access,
                "reason": reason
            }).execute()

            return {"access": access, "reason": reason}

        except Exception as e:
            print(f"Error checking feature access: {e}")
            return {"access": False, "reason": "error"}

    async def handle_webhook(self, payload: bytes, signature: str) -> Dict:
        """
        Handle Stripe webhook events
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            return {"error": "Invalid payload"}
        except stripe.error.SignatureVerificationError as e:
            return {"error": "Invalid signature"}

        # Handle the event
        if event.type == "customer.subscription.created":
            await self._handle_subscription_created(event.data.object)

        elif event.type == "customer.subscription.updated":
            await self._handle_subscription_updated(event.data.object)

        elif event.type == "customer.subscription.deleted":
            await self._handle_subscription_deleted(event.data.object)

        elif event.type == "invoice.payment_succeeded":
            await self._handle_payment_succeeded(event.data.object)

        elif event.type == "invoice.payment_failed":
            await self._handle_payment_failed(event.data.object)

        return {"status": "success"}

    async def _handle_subscription_created(self, subscription):
        """Handle subscription.created webhook"""
        user_id = subscription.metadata.get("user_id")
        if not user_id:
            return

        # Subscription is already created in start_trial or upgrade_subscription
        print(f"Subscription created for user {user_id}: {subscription.id}")

    async def _handle_subscription_updated(self, subscription):
        """Handle subscription.updated webhook"""
        user_id = subscription.metadata.get("user_id")
        if not user_id:
            return

        # Update subscription status
        status_map = {
            "active": "active",
            "trialing": "trial",
            "past_due": "past_due",
            "canceled": "canceled",
            "unpaid": "expired"
        }

        new_status = status_map.get(subscription.status, subscription.status)

        supabase.table("subscription").update({
            "status": new_status,
            "current_period_start": datetime.fromtimestamp(subscription.current_period_start).isoformat(),
            "current_period_end": datetime.fromtimestamp(subscription.current_period_end).isoformat(),
            "cancel_at_period_end": subscription.cancel_at_period_end
        }).eq("stripe_subscription_id", subscription.id).execute()

    async def _handle_subscription_deleted(self, subscription):
        """Handle subscription.deleted webhook"""
        supabase.table("subscription").update({
            "status": "canceled",
            "canceled_at": datetime.utcnow().isoformat()
        }).eq("stripe_subscription_id", subscription.id).execute()

    async def _handle_payment_succeeded(self, invoice):
        """Handle invoice.payment_succeeded webhook"""
        subscription_id = invoice.subscription
        if not subscription_id:
            return

        # Mark subscription as active
        supabase.table("subscription").update({
            "status": "active",
            "grace_period_end": None
        }).eq("stripe_subscription_id", subscription_id).execute()

    async def _handle_payment_failed(self, invoice):
        """Handle invoice.payment_failed webhook"""
        subscription_id = invoice.subscription
        if not subscription_id:
            return

        # Set grace period (7 days)
        grace_period_end = datetime.utcnow() + timedelta(days=7)

        supabase.table("subscription").update({
            "status": "past_due",
            "grace_period_end": grace_period_end.isoformat()
        }).eq("stripe_subscription_id", subscription_id).execute()

        # TODO: Send email notification to user


# Singleton instance
stripe_service = StripeSubscriptionService()
