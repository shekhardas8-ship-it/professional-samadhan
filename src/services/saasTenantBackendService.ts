// src/services/saasTenantBackendService.ts
import fs from 'fs';
import path from 'path';

const STORAGE_ROOT = path.resolve(process.cwd(), 'local_storage');
const TENANTS_STORAGE_DIR = path.join(STORAGE_ROOT, 'tenants');

// Ensure root tenants storage directory exists
try {
  fs.mkdirSync(TENANTS_STORAGE_DIR, { recursive: true });
} catch (_) {}

/**
 * Ensures a physical isolated directory exists for the specific tenant
 */
export function getOrCreateTenantIsolatedStorage(tenantId: string): string {
  const safeId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const tenantDir = path.join(TENANTS_STORAGE_DIR, safeId);
  const uploadsDir = path.join(tenantDir, 'uploads');
  const workbooksDir = path.join(tenantDir, 'workbooks');

  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(workbooksDir, { recursive: true });

  return tenantDir;
}

/**
 * Computes exact disk bytes consumed by a specific tenant in their isolated directory
 */
export function computeTenantStorageUsage(tenantId: string): { usedBytes: number; usedMb: number; fileCount: number } {
  try {
    const safeId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const tenantDir = path.join(TENANTS_STORAGE_DIR, safeId);
    if (!fs.existsSync(tenantDir)) {
      return { usedBytes: 0, usedMb: 0, fileCount: 0 };
    }

    let totalBytes = 0;
    let fileCount = 0;

    function walkDir(dir: string) {
      const list = fs.readdirSync(dir);
      for (const item of list) {
        const full = path.join(dir, item);
        const st = fs.statSync(full);
        if (st.isDirectory()) {
          walkDir(full);
        } else {
          totalBytes += st.size;
          fileCount++;
        }
      }
    }

    walkDir(tenantDir);
    return {
      usedBytes: totalBytes,
      usedMb: Number((totalBytes / (1024 * 1024)).toFixed(2)),
      fileCount,
    };
  } catch (err) {
    return { usedBytes: 0, usedMb: 0, fileCount: 0 };
  }
}
