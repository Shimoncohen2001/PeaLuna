# ADR 002: Hybrid JWT + HttpOnly Refresh Cookies

## Status

Accepted

## Context

Web clients benefit from HttpOnly cookies for refresh tokens (XSS mitigation). Mobile apps need header-based auth without relying on cookies.

## Decision

| Token | Delivery | Storage |
|-------|----------|---------|
| Access JWT (15m) | JSON body + `Authorization: Bearer` | Memory (web) / secure storage (mobile) |
| Refresh JWT (7d) | `Set-Cookie` HttpOnly, `Path=/api/v1/auth` | Not accessible to JS |

- Refresh tokens stored **hashed** in PostgreSQL with rotation family ID.
  Reuse of a revoked token revokes the entire family (theft detection).
  `/auth/refresh` accepts HttpOnly cookie (web) or `{ refreshToken }` body (mobile).
- Access token claims include `homeRegion` for future multi-region routing.

## Consequences

- CORS must use `credentials: true` for web.
- Mobile clients call `/auth/refresh` with refresh token in body (Sprint 1) instead of cookie.
