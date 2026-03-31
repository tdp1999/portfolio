# Epic: CORS & Security Headers Audit

## Summary

Audit and harden CORS configuration and HTTP security headers (Helmet, CSP, HSTS, X-Frame-Options, etc.) across the API and SSR frontend.

## Why

Defense-in-depth. Prevents clickjacking, XSS via missing CSP, MIME sniffing, and cross-origin data leaks. Required for production deployment.

## Scope Notes

- Audit current CORS config (allowed origins, credentials, methods)
- Integrate/configure Helmet middleware on NestJS
- Content-Security-Policy for SSR pages
- HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- Verify cookie attributes (SameSite, Secure, HttpOnly) in production mode

## Status
placeholder

## Created
2026-03-03
