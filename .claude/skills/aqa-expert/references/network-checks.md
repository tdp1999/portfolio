# Network Verification Patterns

## Request Loop Detection

Common loop patterns in SPAs:
- Interceptor chains: request fails -> interceptor retries -> retry fails -> interceptor retries
- Polling gone wrong: component mounts -> fetches data -> error triggers re-mount -> re-fetches
- Reactive cascades: state change -> triggers API call -> response updates state -> triggers API call
- Redirect loops: route guard redirects -> new route triggers guard -> redirects again

### Identifying Loops
- Same endpoint called >3 times without user action = loop
- Two endpoints alternating repeatedly = interceptor chain loop
- Request count growing linearly over time = polling/reactive loop

### How to Audit
Run the network audit script on any user flow:
```bash
node .claude/skills/aqa-expert/scripts/network-audit.mjs <url> --actions '<json>'
```

Thresholds (per single user action):
- **PASS**: <10 API requests
- **WARN**: 10-20 API requests (investigate)
- **FAIL**: >20 API requests (definite loop or inefficiency)

## Cookie Verification

```typescript
// Path-scoped cookies require matching URL to be visible
const cookies = await context.cookies('http://localhost:PORT/api/path');
const cookie = cookies.find(c => c.name === 'cookie_name');

// Session cookie: expires === -1
expect(cookie.expires).toBe(-1);

// Persistent cookie: expires in the future
expect(cookie.expires).toBeGreaterThan(Date.now() / 1000 + 86400);
```

Key attributes to verify per cookie:
- `httpOnly` -- true for server-only tokens, false for JS-readable tokens
- `path` -- scoped to the correct API path
- `expires` -- session vs persistent as expected by the feature
- `sameSite` -- lax or strict for CSRF protection
- `secure` -- true in production environments

## API Contract Validation

Intercept and assert on any API response during a user action:
```typescript
const [response] = await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/endpoint')),
  page.locator('button').click(),
]);
expect(response.status()).toBe(200);

// Optionally validate response body shape
const body = await response.json();
expect(body).toHaveProperty('id');
```

### Patterns by Flow Type
- **CRUD forms**: Verify POST/PUT returns created/updated entity, list refreshes
- **Search/filter**: Verify query params sent correctly, debounce prevents rapid-fire
- **Pagination**: Verify offset/limit params, no duplicate page fetches
- **File upload**: Verify multipart request, progress events if applicable
- **Realtime**: Verify WebSocket connects once, reconnects on drop (not loop)

## Console Error Monitoring

Capture and assert on console output during any flow:
```typescript
const errors: string[] = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});

// ... perform actions ...

// Soft assert: warn but don't block for known noise (favicon, dev warnings)
expect.soft(errors.filter(e => !isKnownNoise(e))).toHaveLength(0);
```

Common noise to filter:
- `favicon.ico` 404s
- Framework dev-mode warnings
- Third-party script errors (analytics, fonts)

## Request Deduplication

Watch for these inefficiency patterns:
- Same GET endpoint called multiple times on a single page load
- List endpoint re-fetched after creating/updating when optimistic update would suffice
- Large payload fetched when only a subset of fields is needed
- Redundant preflight (OPTIONS) requests from misconfigured CORS
