# Task: Generate API Client Shared Library

## Status: completed

## Goal

Create a shared Angular library for HTTP client services that communicate with the NestJS API.

## Context

The api-client library contains Angular services using HttpClient to call the NestJS API. It provides a centralized place for all API calls, used by landing and future dashboard. This is an Angular-specific library.

## Acceptance Criteria

- [ ] Library generated in `libs/api-client/`
- [ ] Importable as `@portfolio/api-client`
- [ ] Library is buildable
- [ ] `nx build api-client` succeeds
- [ ] Contains HttpClient-based service structure

## Technical Notes

```bash
nx g @nx/angular:lib api-client --buildable --directory=libs/api-client --standalone
```

Add placeholder API client:

```typescript
// libs/api-client/src/lib/api-client.service.ts
@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`);
  }
}
```

## Files to Touch

- libs/api-client/\*
- tsconfig.base.json (path mapping added)

## Dependencies

- 001-init-nx-workspace
- 002-generate-angular-landing (ensures @nx/angular is installed)

## Complexity: S
