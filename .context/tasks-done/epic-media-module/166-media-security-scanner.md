# Task: Security Scanner Port + Implementation

## Status: done

## Goal
Define the ISecurityScanner port and implement the FileSecurityScanner with magic bytes, SVG/DOCX detection, and EXIF stripping.

## Context
All uploads pass through security scanning before reaching Cloudinary. Defense in depth against malicious files.

## Acceptance Criteria
- [x] `ISecurityScanner` port interface: `validate(file: Buffer, declaredMimeType: string): Promise<ScanResult>`
- [x] `ScanResult` type: `{ safe: boolean, detectedMimeType: string, threats: string[] }`
- [x] `SECURITY_SCANNER` injection token
- [x] `FileSecurityScanner` implements `ISecurityScanner`
- [x] Filename sanitization: strip `../`, special chars, normalize unicode
- [x] Magic bytes validation: verify actual file type matches declared MIME
- [x] SVG script detection: scan for `<script>`, `onclick`, `javascript:` URIs
- [x] DOCX macro detection: check for VBA macros
- [x] EXIF stripping: re-encode images via Sharp to remove metadata
- [x] Returns `{ safe: false, threats: [...] }` when threats detected
- [x] Unit tests for each scanning step (safe files, malicious files, edge cases)
- [x] Install `sharp` npm package

## Technical Notes
- Magic bytes: use file header signatures (e.g., `89 50 4E 47` for PNG, `FF D8 FF` for JPEG)
- SVG: parse as text, regex scan for dangerous patterns
- DOCX: zip file containing `word/vbaProject.bin` indicates macros
- Sharp: `sharp(buffer).toBuffer()` strips EXIF by default during re-encoding
- Filename sanitization is a utility function, not async

## Files to Touch
- apps/api/src/modules/media/application/ports/security-scanner.port.ts
- apps/api/src/modules/media/infrastructure/adapters/file-security-scanner.service.ts
- apps/api/src/modules/media/infrastructure/adapters/file-security-scanner.service.spec.ts
- apps/api/src/modules/media/application/media.token.ts

## Dependencies
- None (independent of schema/entity)

## Complexity: L

## Progress Log
- [2026-03-20] Started. TDD approach.
- [2026-03-20] Done — all ACs satisfied. 20 tests passing.
