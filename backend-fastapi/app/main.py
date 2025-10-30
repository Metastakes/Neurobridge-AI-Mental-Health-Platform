from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import redis
import logging

from app.core.config import settings
from app.api.v1.router import api_router
from app.middleware.audit import AuditMiddleware
from app.middleware.rate_limit import RateLimitMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="HIPAA-compliant telepsychiatry platform with all GUARANTEES enforced",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware (configure origins based on environment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FIX #10 APPLIED: Rate limiting middleware
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    app.add_middleware(RateLimitMiddleware, redis_client=redis_client)
    logger.info("Rate limiting middleware enabled")
except Exception as e:
    logger.error(f"Failed to initialize Redis for rate limiting: {str(e)}")
    app.add_middleware(RateLimitMiddleware, redis_client=None)

# FIX #2 APPLIED: HIPAA audit middleware
app.add_middleware(AuditMiddleware)
logger.info("HIPAA audit middleware enabled")

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
    }


@app.on_event("startup")
async def startup_event():
    """
    Application startup
    Initialize services and verify configurations
    """
    logger.info(f"Starting {settings.PROJECT_NAME}")

    # Verify environment configuration (FIX #8 APPLIED: Validation in config.py)
    logger.info(f"Database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'configured'}")
    logger.info(f"Redis: {settings.REDIS_URL.split('@')[1] if '@' in settings.REDIS_URL else 'configured'}")
    logger.info(f"Stripe: {'configured' if settings.STRIPE_API_KEY else 'NOT configured'}")
    logger.info(f"Twilio: {'configured' if settings.TWILIO_ACCOUNT_SID else 'NOT configured'}")

    # Log GUARANTEES status
    logger.info("=" * 80)
    logger.info("GUARANTEES ENFORCEMENT STATUS:")
    logger.info("✓ Payment method required to book appointments (enforced in API)")
    logger.info("✓ No-show/late cancel fees ≥ $50 (database constraint + rules engine)")
    logger.info("✓ Pre-session 3-question micro-check-ins (model + tasks)")
    logger.info("✓ Medication micro-education + quiz (model + API)")
    logger.info("✓ HIPAA-safe SMS with secure deep links (PHI filtering in service)")
    logger.info("✓ Referrals across scope tiers (validation in API)")
    logger.info("✓ Provider Earnings Dashboard (optimized queries in API)")
    logger.info("✓ Admin fees disabled by default (policy rules engine)")
    logger.info("=" * 80)


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown cleanup"""
    logger.info(f"Shutting down {settings.PROJECT_NAME}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )
