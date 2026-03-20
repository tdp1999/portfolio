export interface ScanResult {
  safe: boolean;
  detectedMimeType: string;
  threats: string[];
  sanitizedBuffer: Buffer;
}

export interface ISecurityScanner {
  validate(file: Buffer, declaredMimeType: string): Promise<ScanResult>;
  sanitizeFilename(filename: string): string;
}
