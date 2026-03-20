import { FileSecurityScanner } from './file-security-scanner.service';

// Mock sharp
jest.mock('sharp', () => {
  const mockSharp = jest.fn(() => ({
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('stripped')),
  }));
  return { __esModule: true, default: mockSharp };
});

describe('FileSecurityScanner', () => {
  let scanner: FileSecurityScanner;

  beforeEach(() => {
    scanner = new FileSecurityScanner();
  });

  describe('sanitizeFilename()', () => {
    it('should strip path traversal sequences', () => {
      expect(scanner.sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
    });

    it('should strip special characters', () => {
      expect(scanner.sanitizeFilename('file<name>:test?.png')).toBe('filenametest.png');
    });

    it('should normalize unicode', () => {
      const result = scanner.sanitizeFilename('café.png');
      expect(result).toBe('café.png');
    });

    it('should replace spaces with underscores', () => {
      expect(scanner.sanitizeFilename('my file  name.png')).toBe('my_file_name.png');
    });

    it('should handle backslash path traversal', () => {
      expect(scanner.sanitizeFilename('..\\..\\file.txt')).toBe('file.txt');
    });

    it('should handle nested traversal like ....// resolving to ../', () => {
      expect(scanner.sanitizeFilename('....//file.txt')).toBe('file.txt');
    });
  });

  describe('validate() — magic bytes', () => {
    it('should accept valid PNG', async () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array(100).fill(0)]);

      const result = await scanner.validate(pngBuffer, 'image/png');

      expect(result.safe).toBe(true);
      expect(result.detectedMimeType).toBe('image/png');
      expect(result.threats).toHaveLength(0);
    });

    it('should accept valid JPEG', async () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Array(100).fill(0)]);

      const result = await scanner.validate(jpegBuffer, 'image/jpeg');

      expect(result.safe).toBe(true);
      expect(result.detectedMimeType).toBe('image/jpeg');
    });

    it('should accept valid PDF', async () => {
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, ...Array(100).fill(0)]);

      const result = await scanner.validate(pdfBuffer, 'application/pdf');

      expect(result.safe).toBe(true);
      expect(result.detectedMimeType).toBe('application/pdf');
    });

    it('should accept valid WebM', async () => {
      const webmBuffer = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, ...Array(100).fill(0)]);

      const result = await scanner.validate(webmBuffer, 'video/webm');

      expect(result.safe).toBe(true);
      expect(result.detectedMimeType).toBe('video/webm');
    });

    it('should reject MIME mismatch (PNG header declared as JPEG)', async () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, ...Array(100).fill(0)]);

      const result = await scanner.validate(pngBuffer, 'image/jpeg');

      expect(result.safe).toBe(false);
      expect(result.threats[0]).toContain('MIME mismatch');
    });

    it('should reject unknown file type', async () => {
      const randomBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, ...Array(100).fill(0)]);

      const result = await scanner.validate(randomBuffer, 'image/png');

      expect(result.safe).toBe(false);
      expect(result.threats[0]).toContain('MIME mismatch');
    });
  });

  describe('validate() — SVG scanning', () => {
    it('should accept safe SVG', async () => {
      const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>');

      const result = await scanner.validate(svg, 'image/svg+xml');

      expect(result.safe).toBe(true);
    });

    it('should reject SVG with <script> tag', async () => {
      const svg = Buffer.from('<svg><script>alert("xss")</script></svg>');

      const result = await scanner.validate(svg, 'image/svg+xml');

      expect(result.safe).toBe(false);
      expect(result.threats.some((t) => t.includes('script'))).toBe(true);
    });

    it('should reject SVG with onclick handler', async () => {
      const svg = Buffer.from('<svg><rect onclick="alert(1)" width="100" height="100"/></svg>');

      const result = await scanner.validate(svg, 'image/svg+xml');

      expect(result.safe).toBe(false);
      expect(result.threats.some((t) => t.includes('on\\w+'))).toBe(true);
    });

    it('should reject SVG with javascript: URI', async () => {
      const svg = Buffer.from('<svg><a xlink:href="javascript:alert(1)"><text>Click</text></a></svg>');

      const result = await scanner.validate(svg, 'image/svg+xml');

      expect(result.safe).toBe(false);
    });

    it('should reject SVG that is not actually SVG', async () => {
      const fakeSvg = Buffer.from('This is not an SVG file at all');

      const result = await scanner.validate(fakeSvg, 'image/svg+xml');

      expect(result.safe).toBe(false);
      expect(result.threats[0]).toContain('MIME mismatch');
    });
  });

  describe('validate() — DOCX macro detection', () => {
    it('should accept DOCX without macros', async () => {
      // Valid ZIP header + innocuous content
      const docx = Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Buffer.from('word/document.xml')]);

      const result = await scanner.validate(
        docx,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      expect(result.safe).toBe(true);
    });

    it('should reject DOCX with VBA macros', async () => {
      const docxWithMacro = Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Buffer.from('word/vbaProject.bin')]);

      const result = await scanner.validate(
        docxWithMacro,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      expect(result.safe).toBe(false);
      expect(result.threats[0]).toContain('VBA macros');
    });
  });

  describe('validate() — EXIF stripping', () => {
    it('should return sanitized buffer for safe images', async () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, ...Array(100).fill(0)]);

      const result = await scanner.validate(pngBuffer, 'image/png');

      expect(result.safe).toBe(true);
      expect(result.sanitizedBuffer.toString()).toBe('stripped');
    });

    it('should not strip EXIF for non-image files', async () => {
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, ...Array(100).fill(0)]);

      const result = await scanner.validate(pdfBuffer, 'application/pdf');

      expect(result.sanitizedBuffer).toBe(pdfBuffer);
    });

    it('should not strip EXIF for SVG', async () => {
      const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>');

      const result = await scanner.validate(svg, 'image/svg+xml');

      expect(result.sanitizedBuffer).toBe(svg);
    });
  });
});
