from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.hipaa_logger import HIPAALogger
import logging

logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    """
    HIPAA-compliant audit middleware
    Automatically logs all PHI access via API endpoints
    FIX #2 APPLIED: Uses request.state.user_id set by auth dependency
    """

    async def dispatch(self, request: Request, call_next):
        # Skip audit for non-PHI endpoints
        skip_paths = ["/docs", "/openapi.json", "/health", "/auth/login", "/auth/register"]
        if any(request.url.path.startswith(path) for path in skip_paths):
            return await call_next(request)

        # Process request
        response: Response = await call_next(request)

        # FIX #2: Get user_id from request state (set by auth dependency)
        user_id = getattr(request.state, "user_id", None)

        # Only audit authenticated requests
        if user_id and response.status_code < 400:
            try:
                db: Session = SessionLocal()

                # Determine resource type and action from request
                action = self._determine_action(request.method, request.url.path)
                resource_type = self._extract_resource_type(request.url.path)
                resource_id = self._extract_resource_id(request.url.path)

                if resource_type and action:
                    client_ip = request.client.host if request.client else None
                    user_agent = request.headers.get("user-agent")

                    HIPAALogger.log_phi_access(
                        db=db,
                        user_id=user_id,
                        action=action,
                        resource_type=resource_type,
                        resource_id=resource_id or 0,
                        ip_address=client_ip,
                        user_agent=user_agent,
                    )

                db.close()
            except Exception as e:
                logger.error(f"Audit logging failed: {str(e)}")
                # Don't block request on audit failure

        return response

    def _determine_action(self, method: str, path: str) -> str:
        """Map HTTP method and path to HIPAA action"""
        if method == "GET":
            return "VIEW"
        elif method == "POST":
            if "book" in path or "create" in path:
                return "CREATE"
            return "UPDATE"
        elif method == "PUT" or method == "PATCH":
            return "UPDATE"
        elif method == "DELETE":
            return "DELETE"
        return "ACCESS"

    def _extract_resource_type(self, path: str) -> str | None:
        """Extract resource type from URL path"""
        if "/appointments" in path:
            return "Appointment"
        elif "/patients" in path:
            return "Patient"
        elif "/providers" in path:
            return "Provider"
        elif "/medication" in path:
            return "MedicationEducation"
        elif "/referrals" in path:
            return "Referral"
        elif "/pre-session" in path:
            return "PreSessionTask"
        return None

    def _extract_resource_id(self, path: str) -> int | None:
        """Extract resource ID from URL path (e.g., /appointments/123 -> 123)"""
        parts = path.split("/")
        for part in parts:
            if part.isdigit():
                return int(part)
        return None
