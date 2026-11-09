"""Reusable DRF throttle classes for expensive endpoints."""

from rest_framework.throttling import SimpleRateThrottle


class AuthRateThrottle(SimpleRateThrottle):
    """Tighter rate limit for login and registration.

    Keyed by client IP, not by the submitted identity, so an attacker cannot
    bypass the limit by rotating the email/username in the request body.
    """

    scope = 'auth'

    def get_cache_key(self, request, view):
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request),
        }


class EvaluationRateThrottle(SimpleRateThrottle):
    """Tighter rate limit for eligibility evaluation.

    The rate is read from ``REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']['evaluate']``
    and keyed per authenticated user, falling back to client IP.
    """

    scope = 'evaluate'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}
