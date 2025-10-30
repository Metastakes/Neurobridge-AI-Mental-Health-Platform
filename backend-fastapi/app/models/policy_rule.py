from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.db.base import Base


class PolicyRule(Base):
    """
    GUARANTEE: Policy Rules engine for admin-fee legality (disabled by default)
    State-specific rules for billing policies
    """
    __tablename__ = "policy_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_key = Column(String(255), unique=True, nullable=False, index=True)
    """
    Examples:
    - admin_fee_legal_ca
    - admin_fee_legal_tx
    - admin_fee_legal_fl
    """

    rule_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Rule configuration (JSON)
    rule_json = Column(JSON, nullable=False)
    """
    Example for admin fees:
    {
        "legal": false,  # Whether admin fees are legal in this state
        "max_percentage": 0,  # Maximum allowed percentage (if legal)
        "notes": "Admin fees prohibited in California"
    }
    """

    # GUARANTEE: Admin fees disabled by default
    is_enabled = Column(Integer, nullable=False, default=0)  # 0 = disabled, 1 = enabled

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    def __repr__(self):
        return f"<PolicyRule(id={self.id}, key={self.rule_key}, enabled={self.is_enabled})>"
