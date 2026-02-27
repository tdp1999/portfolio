# On-Demand Audit Checklist

Run these checks only when explicitly requested via `/aqa-audit` or when suspicious behavior detected.

## Performance Audit

### Navigation Speed
- Page transitions complete within 3s
- No full-page reloads during SPA navigation
- Lazy-loaded routes resolve within 2s

### Layout Stability
- No visible layout shifts after initial render
- Images/async content have reserved space
- Skeleton loaders used for async data

### Excessive Re-renders
- Network tab: same API called multiple times without user action = re-render bug
- Use `scripts/network-audit.mjs --full` to detect duplicate requests

## Security Audit

### Token/Secret Exposure
Check these locations for leaked sensitive data:
- URL query params (never put tokens, IDs with PII, or secrets in URLs)
- localStorage (short-lived tokens OK, long-lived secrets NEVER)
- sessionStorage (same rules as localStorage)
- Console output (no tokens or secrets logged in production)

### Cookie Security
Verify cookie attributes match their purpose:
- Server-only tokens: `httpOnly: true`, scoped `path`
- Client-readable tokens: `httpOnly: false`, `sameSite: lax`
- All sensitive cookies: `secure: true` in production (OK to skip in dev)

### Unauthorized Access
- Protected routes redirect appropriately when unauthenticated
- Role-restricted routes show 403 or redirect for wrong roles
- Direct URL access to protected API resources returns 401/403
- No sensitive data in initial HTML/JS bundles

### Error Response Leakage
- Error messages are generic -- no internal details exposed to users
- API errors: no stack traces, SQL fragments, or internal paths in response body
- Distinct error causes produce the same user-facing message (prevent enumeration)

## Network Efficiency Audit

### Request Deduplication
- Same data fetched once, cached/shared across components
- No polling without user action or explicit interval
- WebSocket preferred over polling for real-time features

### Payload Size
- API responses don't include unnecessary fields
- Images optimized and appropriately sized
- No large JSON payloads for simple UI data

## Running the Audit

```bash
# Quick audit: specific page
node .claude/skills/aqa-expert/scripts/network-audit.mjs http://localhost:PORT/page

# Full audit: captures network, console, cookies, localStorage
node .claude/skills/aqa-expert/scripts/network-audit.mjs http://localhost:PORT/page --full

# With actions (JSON array of Playwright actions)
node .claude/skills/aqa-expert/scripts/network-audit.mjs http://localhost:PORT/page \
  --actions '[{"fill":"input[name=search]","value":"test"},{"click":"button[type=submit]"}]'
```
