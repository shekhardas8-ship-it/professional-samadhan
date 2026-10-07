// src/services/clientDataManagementService.ts

export interface ClientDataRecord {
  clientId: string;
  clientName: string;
  tradeName?: string;
  gstin: string;
  pan: string;
  financialYear: string;
  status: 'active' | 'archived' | 'near_limit' | 'maintenance';
  storageUsedBytes: number;
  storageLimitBytes: number;
  invoicesCount: number;
  workpapersCount: number;
  bankStatementsCount: number;
  noticesCount: number;
  lastBackupAt: string;
  retentionYears: number;
  retentionUntil: string;
  isEncryptionActive: boolean;
  syncStatus: 'synced' | 'pending' | 'in_progress';
  allowPortalExport: boolean;
}

export interface PracticeDataManagementConfig {
  autoBackupDaily: boolean;
  backupTime: string;
  cloudStorageProvider: 'neon_postgres' | 'aws_s3' | 'google_cloud' | 'local_nas';
  autoPurgeTempOcrDays: number;
  statutoryRetentionYears: number;
  enforceDpdpCompliance: boolean;
  totalStorageUsedBytes: number;
  totalStorageLimitBytes: number;
  clientsData: ClientDataRecord[];
}

const STORAGE_KEY = 'ps_client_data_management_config';

export const INITIAL_CLIENTS_DATA: ClientDataRecord[] = [
  {
    clientId: 'cli_01',
    clientName: 'Briopox Private Limited',
    tradeName: 'Briopox Tech',
    gstin: '27AABCB1234M1Z2',
    pan: 'AABCB1234M',
    financialYear: 'FY 2026-27',
    status: 'active',
    storageUsedBytes: 2450 * 1024 * 1024, // 2.45 GB
    storageLimitBytes: 10 * 1024 * 1024 * 1024, // 10 GB
    invoicesCount: 2840,
    workpapersCount: 24,
    bankStatementsCount: 16,
    noticesCount: 3,
    lastBackupAt: 'Today at 03:15 AM',
    retentionYears: 8,
    retentionUntil: 'March 31, 2035',
    isEncryptionActive: true,
    syncStatus: 'synced',
    allowPortalExport: true,
  },
  {
    clientId: 'cli_02',
    clientName: 'Aggarwal & Sons Trading Co.',
    tradeName: 'Aggarwal Traders',
    gstin: '07AAACA9876C1Z8',
    pan: 'AAACA9876C',
    financialYear: 'FY 2026-27',
    status: 'active',
    storageUsedBytes: 1820 * 1024 * 1024, // 1.82 GB
    storageLimitBytes: 5 * 1024 * 1024 * 1024, // 5 GB
    invoicesCount: 1940,
    workpapersCount: 18,
    bankStatementsCount: 12,
    noticesCount: 1,
    lastBackupAt: 'Yesterday at 02:00 AM',
    retentionYears: 8,
    retentionUntil: 'March 31, 2035',
    isEncryptionActive: true,
    syncStatus: 'synced',
    allowPortalExport: true,
  },
  {
    clientId: 'cli_03',
    clientName: 'Sharma Logistics Solutions',
    tradeName: 'Sharma Freightways',
    gstin: '06AAACS5432B1Z1',
    pan: 'AAACS5432B',
    financialYear: 'FY 2026-27',
    status: 'near_limit',
    storageUsedBytes: 4680 * 1024 * 1024, // 4.68 GB
    storageLimitBytes: 5 * 1024 * 1024 * 1024, // 5 GB
    invoicesCount: 3420,
    workpapersCount: 32,
    bankStatementsCount: 24,
    noticesCount: 5,
    lastBackupAt: 'Today at 05:40 AM',
    retentionYears: 8,
    retentionUntil: 'March 31, 2035',
    isEncryptionActive: true,
    syncStatus: 'synced',
    allowPortalExport: false,
  },
  {
    clientId: 'cli_04',
    clientName: 'Tata Tele-Services Franchisee',
    tradeName: 'TTSL Enterprise Hub',
    gstin: '27AAACT1122D1Z5',
    pan: 'AAACT1122D',
    financialYear: 'FY 2026-27',
    status: 'active',
    storageUsedBytes: 6120 * 1024 * 1024, // 6.12 GB
    storageLimitBytes: 25 * 1024 * 1024 * 1024, // 25 GB
    invoicesCount: 5210,
    workpapersCount: 48,
    bankStatementsCount: 36,
    noticesCount: 2,
    lastBackupAt: 'Today at 02:00 AM',
    retentionYears: 10,
    retentionUntil: 'March 31, 2037',
    isEncryptionActive: true,
    syncStatus: 'synced',
    allowPortalExport: true,
  },
  {
    clientId: 'cli_05',
    clientName: 'Mehta Textile Mills LLP',
    tradeName: 'Mehta Fabrics',
    gstin: '24AAACM4455E1ZX',
    pan: 'AAACM4455E',
    financialYear: 'FY 2026-27',
    status: 'active',
    storageUsedBytes: 3100 * 1024 * 1024, // 3.1 GB
    storageLimitBytes: 10 * 1024 * 1024 * 1024, // 10 GB
    invoicesCount: 2680,
    workpapersCount: 22,
    bankStatementsCount: 14,
    noticesCount: 0,
    lastBackupAt: 'Yesterday at 02:00 AM',
    retentionYears: 8,
    retentionUntil: 'March 31, 2035',
    isEncryptionActive: true,
    syncStatus: 'synced',
    allowPortalExport: true,
  },
];

export const DEFAULT_PRACTICE_DATA_CONFIG: PracticeDataManagementConfig = {
  autoBackupDaily: true,
  backupTime: '02:00 AM',
  cloudStorageProvider: 'neon_postgres',
  autoPurgeTempOcrDays: 30,
  statutoryRetentionYears: 8,
  enforceDpdpCompliance: true,
  totalStorageUsedBytes: 18170 * 1024 * 1024, // 18.17 GB
  totalStorageLimitBytes: 100 * 1024 * 1024 * 1024, // 100 GB
  clientsData: INITIAL_CLIENTS_DATA,
};

export function getStoredDataManagementConfig(): PracticeDataManagementConfig {
  if (typeof window === 'undefined') return DEFAULT_PRACTICE_DATA_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRACTICE_DATA_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PRACTICE_DATA_CONFIG,
      ...parsed,
      clientsData: parsed.clientsData || DEFAULT_PRACTICE_DATA_CONFIG.clientsData,
    };
  } catch {
    return DEFAULT_PRACTICE_DATA_CONFIG;
  }
}

export function saveStoredDataManagementConfig(config: PracticeDataManagementConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Could not save data management config to localStorage:', err);
  }
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
