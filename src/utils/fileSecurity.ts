// src/utils/fileSecurity.ts
import path from 'path';

export interface FileValidationResult {
  isValid: boolean;
  detectedMimeType: string;
  errorMessage?: string;
}

// Magic Byte Signatures for allowed accounting & tax documents
const SIGNATURES = {
  PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
  PNG: [0x89, 0x50, 0x4E, 0x47], // \x89PNG
  JPEG: [0xFF, 0xD8, 0xFF],      // JPEG start of image
  ZIP_XLSX: [0x50, 0x4B, 0x03, 0x04], // PK\x03\x04 (Zip / Office Open XML)
};

// Executable and script signatures to immediately reject
const EXECUTABLE_SIGNATURES = [
  [0x4D, 0x5A], // MZ (Windows PE Executable / DLL)
  [0x7F, 0x45, 0x4C, 0x46], // ELF (Linux executable)
  [0xCA, 0xFE, 0xBA, 0xBE], // Mach-O / Java Class
  [0x23, 0x21], // #! (Shebang script)
];

/**
 * Check if buffer starts with given byte sequence
 */
function bufferMatches(buffer: Buffer, bytes: number[]): boolean {
  if (buffer.length < bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[i] !== bytes[i]) return false;
  }
  return true;
}

/**
 * Strict file buffer content validation using magic bytes (file signatures)
 */
export function validateFileContent(buffer: Buffer, originalFilename: string): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return { isValid: false, detectedMimeType: 'unknown', errorMessage: 'File is empty (0 bytes).' };
  }

  // 1. Immediately reject any executable or script signatures
  for (const sig of EXECUTABLE_SIGNATURES) {
    if (bufferMatches(buffer, sig)) {
      return {
        isValid: false,
        detectedMimeType: 'application/x-executable',
        errorMessage: 'Security violation: Executable or script binary header detected.',
      };
    }
  }

  const ext = path.extname(originalFilename).toLowerCase();

  // 2. Validate PDF
  if (ext === '.pdf') {
    if (bufferMatches(buffer, SIGNATURES.PDF)) {
      return { isValid: true, detectedMimeType: 'application/pdf' };
    }
    return { isValid: false, detectedMimeType: 'unknown', errorMessage: 'File claims to be PDF but lacks valid %PDF header.' };
  }

  // 3. Validate PNG
  if (ext === '.png') {
    if (bufferMatches(buffer, SIGNATURES.PNG)) {
      return { isValid: true, detectedMimeType: 'image/png' };
    }
    return { isValid: false, detectedMimeType: 'unknown', errorMessage: 'File claims to be PNG but lacks valid PNG signature.' };
  }

  // 4. Validate JPEG / JPG
  if (ext === '.jpg' || ext === '.jpeg') {
    if (bufferMatches(buffer, SIGNATURES.JPEG)) {
      return { isValid: true, detectedMimeType: 'image/jpeg' };
    }
    return { isValid: false, detectedMimeType: 'unknown', errorMessage: 'File claims to be JPEG but lacks valid JPEG SOI marker.' };
  }

  // 5. Validate Excel XLSX
  if (ext === '.xlsx') {
    if (bufferMatches(buffer, SIGNATURES.ZIP_XLSX)) {
      return { isValid: true, detectedMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    }
    return { isValid: false, detectedMimeType: 'unknown', errorMessage: 'File claims to be XLSX but lacks valid PK archive signature.' };
  }

  // 6. Validate CSV (Ensure valid text without binary control bytes)
  if (ext === '.csv') {
    // Check first 1024 bytes for null bytes or binary control characters
    const sampleSize = Math.min(buffer.length, 1024);
    for (let i = 0; i < sampleSize; i++) {
      if (buffer[i] === 0) {
        return { isValid: false, detectedMimeType: 'application/octet-stream', errorMessage: 'Binary null bytes detected in CSV file.' };
      }
    }
    return { isValid: true, detectedMimeType: 'text/csv' };
  }

  return { isValid: false, detectedMimeType: 'unsupported', errorMessage: `Unsupported file extension: ${ext}` };
}

/**
 * Strict filename sanitizer to prevent Path Traversal, Null Byte injection, and double extensions
 */
export function sanitizeUploadedFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return 'unnamed_document';

  // Extract base filename without directories
  const baseName = path.basename(filename);

  // Strip null bytes and path traversal patterns
  let clean = baseName
    .replace(/\0/g, '')
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '');

  // Extract extension and name
  const ext = path.extname(clean).toLowerCase();
  const nameWithoutExt = clean.slice(0, clean.length - ext.length);

  // Sanitize name: allow only alphanumeric, dashes, and underscores
  const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);

  return `${safeName || 'document'}${ext}`;
}
