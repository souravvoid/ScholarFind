"""Reusable DRF throttle classes for expensive endpoints."""

from rest_framework.throttling import SimpleRateThrottle


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
