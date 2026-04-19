import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { ISecurityScanner, ScanResult } from '../../application/ports/security-scanner.port';

const MAGIC_BYTES: Record<string, { bytes: number[]; offset?: number }[]> = {
  'image/jpeg': [{ bytes: [0xff, 0xd8, 0xff] }],
  'image/png': [{ bytes: [0x89, 0x50, 0x4e, 0x47] }],
  'image/gif': [{ bytes: [0x47, 0x49, 0x46, 0x38] }],
  'image/webp': [
    { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
    { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  ],
  'image/avif': [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }],
  'application/pdf': [{ bytes: [0x25, 0x50, 0x44, 0x46] }],
  'application/zip': [{ bytes: [0x50, 0x4b, 0x03, 0x04] }],
  'application/msword': [{ bytes: [0xd0, 0xcf, 0x11, 0xe0] }],
  'video/mp4': [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }],
  'video/webm': [{ bytes: [0x1a, 0x45, 0xdf, 0xa3] }],
};

// DOCX/XLSX are ZIP archives
const ZIP_BASED_MIMES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const SVG_DANGEROUS_PATTERNS = [
  /<script[\s>]/i,
  /on\w+\s*=/i,
  /javascript\s*:/i,
  /data\s*:\s*text\/html/i,
  /xlink:href\s*=\s*["']javascript/i,
];

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

@Injectable()
export class FileSecurityScanner implements ISecurityScanner {
  private readonly logger = new Logger(FileSecurityScanner.name);

  async validate(file: Buffer, declaredMimeType: string): Promise<ScanResult> {
    const threats: string[] = [];
    let sanitizedBuffer = file;

    // 1. Magic bytes validation
    const detectedMimeType = this.detectMimeType(file, declaredMimeType);
    if (detectedMimeType !== declaredMimeType && !this.isMimeCompatible(detectedMimeType, declaredMimeType)) {
      threats.push(`MIME mismatch: declared ${declaredMimeType}, detected ${detectedMimeType}`);
    }

    // 2. SVG script detection
    if (declaredMimeType === 'image/svg+xml') {
      const svgThreats = this.scanSvg(file);
      threats.push(...svgThreats);
    }

    // 3. DOCX macro detection
    if (ZIP_BASED_MIMES.includes(declaredMimeType)) {
      const macroThreats = this.scanDocxMacros(file);
      threats.push(...macroThreats);
    }

    // 4. EXIF stripping for images
    if (IMAGE_MIMES.includes(declaredMimeType) && threats.length === 0) {
      try {
        sanitizedBuffer = await sharp(file).toBuffer();
      } catch {
        this.logger.warn(`Sharp re-encoding failed for ${declaredMimeType}, using original buffer`);
      }
    }

    return {
      safe: threats.length === 0,
      detectedMimeType,
      threats,
      sanitizedBuffer,
    };
  }

  sanitizeFilename(filename: string): string {
    let sanitized = filename.normalize('NFC');
    // Loop to handle nested traversal like '....//'' → '../'
    while (sanitized.includes('../') || sanitized.includes('..\\')) {
      sanitized = sanitized.replace(/\.\.\//g, '').replace(/\.\.\\/g, '');
    }
    return (
      sanitized
        // eslint-disable-next-line no-control-regex
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
        .replace(/\s+/g, '_')
        .trim()
    );
  }

  private detectMimeType(file: Buffer, declaredMimeType: string): string {
    // SVG is text-based, no magic bytes
    if (declaredMimeType === 'image/svg+xml') {
      const rawText = file.subarray(0, 256).toString('utf-8');
      // Strip UTF-8 BOM and leading whitespace before checking SVG markers
      const cleanText = rawText
        .replace(/^\uFEFF/, '')
        .replace(/\0/g, '')
        .trimStart();
      if (cleanText.includes('<svg') || cleanText.includes('<?xml')) {
        return 'image/svg+xml';
      }
      return 'unknown';
    }

    // Text/markdown — no magic bytes
    if (declaredMimeType === 'text/plain' || declaredMimeType === 'text/markdown') {
      return declaredMimeType;
    }

    // ZIP-based documents must be checked before generic magic bytes — docx/xlsx are ZIPs
    if (this.isZip(file) && ZIP_BASED_MIMES.includes(declaredMimeType)) {
      return declaredMimeType;
    }

    for (const [mime, signatures] of Object.entries(MAGIC_BYTES)) {
      const matches = signatures.every((sig) => {
        const offset = sig.offset ?? 0;
        return sig.bytes.every((byte, i) => file[offset + i] === byte);
      });
      if (matches) {
        return mime;
      }
    }

    return 'unknown';
  }

  private isMimeCompatible(detected: string, declared: string): boolean {
    // ZIP detection for DOCX/XLSX is expected
    if (detected === 'application/zip' && ZIP_BASED_MIMES.includes(declared)) {
      return true;
    }
    // MP4 and AVIF share ftyp signature
    if (detected === 'video/mp4' && declared === 'image/avif') return true;
    if (detected === 'image/avif' && declared === 'video/mp4') return true;
    return false;
  }

  private isZip(file: Buffer): boolean {
    return file[0] === 0x50 && file[1] === 0x4b && file[2] === 0x03 && file[3] === 0x04;
  }

  private scanSvg(file: Buffer): string[] {
    const content = file.toString('utf-8');
    const threats: string[] = [];

    for (const pattern of SVG_DANGEROUS_PATTERNS) {
      if (pattern.test(content)) {
        threats.push(`SVG contains dangerous pattern: ${pattern.source}`);
      }
    }

    return threats;
  }

  private scanDocxMacros(file: Buffer): string[] {
    // DOCX files are ZIP archives. VBA macros are stored in vbaProject.bin
    const content = file.toString('binary');
    if (content.includes('vbaProject.bin')) {
      return ['Document contains VBA macros'];
    }
    return [];
  }
}
