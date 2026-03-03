# Epic: Request / Correlation ID Tracing

## Summary

Add correlation IDs to all API requests for end-to-end tracing through logs, error reports, and external service calls.

## Why

Debugging production issues without correlation IDs is guesswork. Essential for any system that handles concurrent users.

## Scope Notes

- Middleware generates `X-Request-Id` (UUID v7) if not present in incoming request
- ID propagated through NestJS execution context (AsyncLocalStorage or cls-hooked)
- Included in all log entries, error responses, and outbound service calls
- Returned in response header for client-side correlation

## Status
placeholder

## Created
2026-03-03
