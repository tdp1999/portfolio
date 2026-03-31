# Epic: Account Lockout Notification Emails

## Summary

Send email notifications when a user's account is locked due to failed login attempts, and optionally when unlocked.

## Why

Users should know if someone is trying to brute-force their account. Also helps legitimate users who accidentally locked themselves out.

## Scope Notes

- Email on lockout (include: time locked, unlock time, IP if available)
- Optional: email on unlock
- Rate-limit the notification itself (don't spam on repeated lock/unlock cycles)

## Status
placeholder

## Created
2026-03-03
