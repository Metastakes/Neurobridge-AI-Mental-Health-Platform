from sqlalchemy.orm import Session
from app.models.policy_rule import PolicyRule
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class BillingRulesEngine:
    """
    GUARANTEE: Policy Rules engine for admin-fee legality (disabled by default)
    Centralized billing policy management with state-specific rules
    """

    def __init__(self, db: Session):
        self.db = db

    def get_rule(self, rule_key: str) -> Optional[PolicyRule]:
        """Get policy rule by key"""
        return self.db.query(PolicyRule).filter(PolicyRule.rule_key == rule_key).first()

    def is_admin_fee_enabled(self, state: str) -> bool:
        """
        Check if admin fees are legal and enabled for a state
        GUARANTEE: Admin fees disabled by default
        """
        rule_key = f"admin_fee_legal_{state.lower()}"
        rule = self.get_rule(rule_key)

        if not rule:
            # GUARANTEE: Default to disabled if no rule exists
            logger.info(f"No admin fee rule found for state {state} - defaulting to DISABLED")
            return False

        # Rule must be both enabled AND legal
        is_legal = rule.rule_json.get("legal", False)
        is_enabled = rule.is_enabled == 1

        return is_enabled and is_legal

    def get_admin_fee_percentage(self, state: str) -> float:
        """Get admin fee percentage for state (if enabled)"""
        if not self.is_admin_fee_enabled(state):
            return 0.0

        rule_key = f"admin_fee_legal_{state.lower()}"
        rule = self.get_rule(rule_key)

        if rule:
            return rule.rule_json.get("max_percentage", 0.0)

        return 0.0

    def get_no_show_fee(self, payment_type: str, provider_settings: Dict) -> int:
        """
        Get no-show fee with GUARANTEE enforcement
        GUARANTEE: No-show fee ≥ $50 (5000 cents)
        """
        if payment_type == "INSURANCE":
            fee = provider_settings.get("insurance_no_show_fee_cents", 12500)
        else:
            fee = provider_settings.get("no_show_min_fee_cents", 5000)

        # GUARANTEE: Enforce minimum $50
        return max(fee, 5000)

    def get_late_cancel_window(self, provider_settings: Dict) -> int:
        """Get late cancellation window in hours (default 24)"""
        return provider_settings.get("late_cancel_window_hours", 24)

    def is_late_cancellation(self, cancel_time, appointment_start_time, provider_settings: Dict) -> bool:
        """Check if cancellation is within late cancel window"""
        window_hours = self.get_late_cancel_window(provider_settings)
        hours_until_appointment = (appointment_start_time - cancel_time).total_seconds() / 3600
        return hours_until_appointment < window_hours

    def create_default_rules(self):
        """
        Create default policy rules for common states
        GUARANTEE: All rules created as DISABLED by default
        """
        default_rules = [
            {
                "rule_key": "admin_fee_legal_ca",
                "rule_name": "California Admin Fee Policy",
                "description": "Admin fees are illegal in California",
                "rule_json": {"legal": False, "max_percentage": 0, "notes": "Prohibited by state law"},
                "is_enabled": 0,  # DISABLED
            },
            {
                "rule_key": "admin_fee_legal_tx",
                "rule_name": "Texas Admin Fee Policy",
                "description": "Admin fees allowed in Texas up to 3.5%",
                "rule_json": {"legal": True, "max_percentage": 3.5, "notes": "Maximum 3.5% of transaction"},
                "is_enabled": 0,  # DISABLED by default
            },
            {
                "rule_key": "admin_fee_legal_fl",
                "rule_name": "Florida Admin Fee Policy",
                "description": "Admin fees allowed in Florida up to 4%",
                "rule_json": {"legal": True, "max_percentage": 4.0, "notes": "Maximum 4% of transaction"},
                "is_enabled": 0,  # DISABLED by default
            },
            {
                "rule_key": "admin_fee_legal_ny",
                "rule_name": "New York Admin Fee Policy",
                "description": "Admin fees are illegal in New York",
                "rule_json": {"legal": False, "max_percentage": 0, "notes": "Prohibited by state law"},
                "is_enabled": 0,  # DISABLED
            },
        ]

        for rule_data in default_rules:
            existing = self.get_rule(rule_data["rule_key"])
            if not existing:
                rule = PolicyRule(**rule_data)
                self.db.add(rule)
                logger.info(f"Created default rule: {rule_data['rule_key']}")

        self.db.commit()
