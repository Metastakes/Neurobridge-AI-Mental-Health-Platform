from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, HTTPException, status
import redis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FIX #10 APPLIED: Rate limiting middleware
    Prevents API abuse with 100 requests/minute per IP
    """

    def __init__(self, app, redis_client: redis.Redis = None):
        super().__init__(app)
        # Connect to Redis for rate limiting
        if redis_client:
            self.redis_client = redis_client
        else:
            try:
                self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            except Exception as e:
                logger.error(f"Failed to connect to Redis for rate limiting: {str(e)}")
                self.redis_client = None

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting if Redis unavailable
        if not self.redis_client:
            logger.warning("Redis unavailable - rate limiting disabled")
            return await call_next(request)

        # Get client IP
        client_ip = request.client.host if request.client else "unknown"

        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/docs"]:
            return await call_next(request)

        # Rate limit key
        rate_limit_key = f"rate_limit:{client_ip}"

        try:
            # Increment request count
            count = self.redis_client.incr(rate_limit_key)

            # Set expiry on first request
            if count == 1:
                self.redis_client.expire(rate_limit_key, 60)  # 60 seconds

            # Check if over limit
            if count > 100:  # 100 requests per minute
                logger.warning(f"Rate limit exceeded for IP: {client_ip}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please try again later.",
                )

            # Process request
            response = await call_next(request)

            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = "100"
            response.headers["X-RateLimit-Remaining"] = str(max(0, 100 - count))

            return response

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Rate limiting error: {str(e)}")
            # Don't block request on rate limiting failure
            return await call_next(request)
