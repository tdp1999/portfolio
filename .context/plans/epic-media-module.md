# Epic: Media Module

## Summary

Full vertical slice for the Media entity (centralized file/image storage metadata) with Cloudinary integration. Backend handles single and bulk file upload/delete via Cloudinary SDK with security scanning, stores metadata in PostgreSQL, exposes CRUD API. Frontend admin UI provides media library with upload dropzone, grid/list browser, metadata editing, storage dashboard, and trash management. E2E tests cover all flows. Architecture uses Strategy + Port/Adapter pattern for provider-agnostic storage, enabling future migration to S3 or other providers with zero domain/application changes.

## Why

- Media is a dependency for Profile (avatar), Project (screenshots), BlogPost (featured image), Experience (company logo)
- Cloudinary offloads file storage, CDN delivery, and on-the-fly image transformations
- Centralized media management avoids duplicated upload logic across modules
- Security scanning prevents malicious file uploads

## Scope

### In Scope

- **BE:** Prisma schema + migration, domain entity, repository, mapper, DTOs (Zod v4), CQRS commands/queries, controller with single + bulk upload endpoints, module wiring
- **BE — Storage:** Port/Adapter for storage provider, Cloudinary implementation (upload, bulk upload, delete, URL generation)
- **BE — Security:** Port/Adapter for file security scanner (magic bytes validation, SVG/DOCX script detection, EXIF stripping via Sharp, filename sanitization)
- **BE — Scheduled Jobs:** Daily cleanup of soft-deleted files > 30 days (hard-delete from DB + Cloudinary), orphan detection
- **FE:** Admin media library page — grid/list toggle, multi-file upload dropzone (drag & drop, per-file progress), metadata edit (altText, caption), delete/restore, bulk actions, search/filter by type, storage usage widget, trash view
- **E2E:** Playwright tests covering single upload, bulk upload, metadata update, soft delete, restore, permanent delete, file type validation, size limit, security rejection

### Out of Scope

- On-the-fly image transformations (use Cloudinary URL params directly when needed)
- Media picker component for other modules (shared component, built when first consumer needs it)
- Video streaming / transcoding
- Chunked upload for very large files (future enhancement if needed)

## Schema

| Field              | Type               | Constraints          | Notes                 |
| ------------------ | ------------------ | -------------------- | --------------------- |
| `id`               | `String` (UUID v7) | PK                   |                       |
| `originalFilename` | `String`           | Not Null             | What user uploaded    |
| `mimeType`         | `String`           | Not Null             | Verified by scanner   |
| `publicId`         | `String`           | Unique, Not Null     | Cloudinary's ID       |
| `url`              | `String`           | Not Null             | Cloudinary secure URL |
| `format`           | `String`           | Not Null             | e.g., "png", "pdf"   |
| `bytes`            | `Int`              | Not Null             | File size in bytes    |
| `width`            | `Int`              | Nullable             | Pixels (images only)  |
| `height`           | `Int`              | Nullable             | Pixels (images only)  |
| `altText`          | `String`           | Nullable             | Accessibility         |
| `caption`          | `String`           | Nullable             | Display caption       |
| `createdAt`        | `DateTime`         | Not Null             |                       |
| `updatedAt`        | `DateTime`         | Not Null             |                       |
| `createdById`      | `String`           | FK -> User, Not Null |                       |
| `updatedById`      | `String`           | FK -> User, Not Null |                       |
| `deletedAt`        | `DateTime`         | Nullable             | Soft delete           |
| `deletedById`      | `String`           | FK -> User, Nullable |                       |

## Architecture — Strategy + Port/Adapter

```
                    ┌─────────────────────────────┐
                    │     Application Layer        │
                    │                              │
                    │  IStorageService (Port)       │ ← interface, provider-agnostic
                    │  ISecurityScanner (Port)      │ ← interface, scanner-agnostic
                    └────────┬──────────┬──────────┘
                             │          │
              ┌──────────────┘          └──────────────┐
              ▼                                        ▼
┌───────────────────────┐               ┌───────────────────────┐
│  CloudinaryStorage    │               │  FileSecurityScanner  │
│  (implements Port)    │               │  (implements Port)    │
└───────────────────────┘               └───────────────────────┘
       future swap ↓
┌───────────────────────┐
│  S3Storage            │
│  (implements Port)    │
└───────────────────────┘
```

### Port Interfaces

```typescript
// application/ports/storage.service.port.ts
interface IStorageService {
  upload(file: Buffer, options: UploadOptions): Promise<StorageResult>;
  uploadBulk(files: FileInput[], options: UploadOptions): Promise<BulkUploadResult>;
  delete(externalId: string): Promise<void>;
  generateUrl(externalId: string, transforms?: TransformOptions): string;
}

// StorageResult: { externalId, url, format, bytes, width?, height? }
// BulkUploadResult: { succeeded: StorageResult[], failed: { filename, error }[] }

// application/ports/security-scanner.port.ts
interface ISecurityScanner {
  validate(file: Buffer, declaredMimeType: string): Promise<ScanResult>;
}

// ScanResult: { safe: boolean, detectedMimeType: string, threats: string[] }
```

### DI Wiring

```typescript
providers: [
  { provide: STORAGE_SERVICE, useClass: CloudinaryStorageService },
  { provide: SECURITY_SCANNER, useClass: FileSecurityScanner },
]
// To swap provider: change useClass to S3StorageService — zero other changes
```

### Future Extensibility

| Feature               | How to plug in                                                     |
| --------------------- | ------------------------------------------------------------------ |
| Change provider (S3)  | New `S3StorageService implements IStorageService`, swap `useClass`  |
| Preview generation    | New port `IPreviewGenerator`, inject into command handler           |
| Zip download          | New query handler + `IStorageService.download()` method on port    |
| Chunked upload        | Add `uploadChunked()` to `IStorageService` port                    |
| Image resize on upload| Pipeline step before `IStorageService.upload()` in command handler  |

## Cloudinary Integration

### Why Cloudinary

- On-the-fly transforms via URL params (resize, crop, auto-format WebP/AVIF)
- Free tier: 25 credits/month (~25GB bandwidth + 25K transforms) — sufficient for portfolio
- Excellent Node.js SDK
- Scale path: Plus plan $89/mo (225 credits), or migrate to S3 + CloudFront for high volume

### Configuration

- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` env vars
- Folder structure: `portfolio/{avatars,projects,posts,logos,resumes,general}`
- Validate env vars presence at module init

## Security Scanning

### Pipeline (runs before upload to Cloudinary)

1. **Filename sanitization** — strip path traversal (`../`), special chars, normalize unicode
2. **Magic bytes validation** — read file header to verify actual type matches declared MIME type
3. **SVG script detection** — scan for `<script>`, `onclick`, `javascript:` in SVG files
4. **DOCX macro detection** — check for VBA macros in Office documents
5. **EXIF stripping** — re-encode images via Sharp to remove metadata + embedded payloads
6. **Result:** `{ safe: boolean, detectedMimeType: string, threats: string[] }`

If `safe: false`, reject upload with `MEDIA_SECURITY_THREAT` error code.

## Allowed File Types

| Category      | MIME Types                                          | Max Size | Use Case                        |
| ------------- | --------------------------------------------------- | -------- | ------------------------------- |
| **Images**    | jpeg, png, gif, webp, svg+xml, avif                | 5 MB     | Screenshots, avatars, logos     |
| **Documents** | pdf, docx, xlsx, md, txt                            | 10 MB    | Resume, project docs            |
| **Video**     | mp4, webm                                           | 50 MB    | Project demo recordings         |
| **Archives**  | zip                                                 | 20 MB    | Project source download         |

Default max: 5MB. Per-type overrides configurable via `MEDIA_CONFIG`.

## Upload Flows

### Single Upload

1. Client sends `multipart/form-data` with file + optional `altText`, `caption`, `folder`
2. Controller extracts file via `@UseInterceptors(FileInterceptor)`
3. Command handler: validate size/type → security scan → upload to Cloudinary → create domain entity → persist to DB
4. Returns media record with URL

### Bulk Upload

1. Client sends `multipart/form-data` with multiple files via `@UseInterceptors(FilesInterceptor)`
2. Command handler: validate each → security scan each → `IStorageService.uploadBulk()` (parallel via `Promise.allSettled`)
3. Partial success allowed: returns `{ succeeded: MediaResponseDto[], failed: { filename, error }[] }`
4. Each succeeded file persisted as separate Media record

### Soft Delete

1. Set `deletedAt`/`deletedById` in DB — file stays on Cloudinary (allows restore)
2. Restore: clear `deletedAt`/`deletedById`

### Hard Delete (Scheduled Cleanup)

1. Daily `@Cron` job finds soft-deleted records older than 30 days
2. Delete from Cloudinary via `IStorageService.delete(publicId)`
3. Hard-delete record from DB
4. Log results

## File Management & Retention

### Policies

| Rule                   | Logic                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| **Soft-deleted files** | Auto hard-delete from DB + Cloudinary after 30 days                |
| **Orphaned files**     | Weekly scan: files not referenced by any entity → flag for review  |
| **Storage quota**      | Configurable max (e.g., 1GB) → warn in admin dashboard at 80%     |

### Admin Dashboard Features

- **Storage usage widget:** total files, total size, breakdown by type (chart)
- **Filter:** by MIME type prefix, date range, usage status (used/unused/soft-deleted)
- **Bulk actions:** multi-select → bulk delete, bulk restore
- **Trash view:** soft-deleted files with restore or permanent delete options
- **Orphan list:** files not referenced by any entity → review and clean up

## Technical Notes

- **Skills:** Use `prisma-migrate` for schema/migration tasks, `aqa-expert` for E2E tests, `ng-lib` for FE library creation
- Uses `multer` via NestJS `FileInterceptor`/`FilesInterceptor` for multipart parsing
- File validation at interceptor level (size limit) AND command handler level (type + security scan) — defense in depth
- Cloudinary SDK: `cloudinary` npm package (v2)
- Sharp: `sharp` npm package for EXIF stripping and image re-encoding
- Entity extends `BaseCrudEntity`, domain methods: `create()`, `load()`, `updateMetadata()`, `softDelete()`, `restore()`
- `updateMetadata()` only allows changing `altText` and `caption` — file itself is immutable after upload
- Repository port extends `ICrudRepository` with: `findByPublicId()`, `findByMimeTypePrefix()`, `findOrphans()`, `findExpiredSoftDeleted(olderThan: Date)`
- Query support: filter by `mimeType` prefix (e.g., "image/", "application/"), search by `originalFilename`, filter by usage status
- Error codes: `MEDIA_NOT_FOUND`, `MEDIA_INVALID_INPUT`, `MEDIA_ALREADY_DELETED`, `MEDIA_FILE_TOO_LARGE`, `MEDIA_UNSUPPORTED_TYPE`, `MEDIA_UPLOAD_FAILED`, `MEDIA_SECURITY_THREAT`

## Dependencies

- `cloudinary` npm package (Cloudinary Node.js SDK v2)
- `sharp` npm package (image processing, EXIF stripping)
- `multer` (included with `@nestjs/platform-express`)
- Cloudinary account + API credentials

## Risks & Mitigations

- **Cloudinary API downtime:** try/catch, return `MEDIA_UPLOAD_FAILED`. No retry needed at portfolio scale.
- **Large file uploads:** Per-type size limits enforced at interceptor + handler. NestJS body size limit config.
- **Orphaned Cloudinary files:** Weekly orphan scan + 30-day soft-delete cleanup handles this.
- **Credentials management:** Env vars only, never committed. Validate at module init.
- **Bulk upload memory:** Stream files or limit batch size (max 10 files per request) to avoid memory spikes.
- **Sharp processing time:** Re-encoding adds latency. Acceptable for admin uploads, not user-facing.

## Status

broken-down

Broken down into tasks 163-177 on 2026-03-20

## Created

2026-03-17
