// src/services/govFilingService.ts
import fs from 'fs';
import path from 'path';
import { GovtFilingRecord, GovtReturnType, GovtFilingStatus, GovtValidationResult } from '../types/index.ts';
import {
  generateOfficialGstr1Json,
  generateOfficialGstr3bJson,
  Gstr1InputInvoice,
} from './gstReturnGenerator.ts';
import {
  generateOfficialItr1Json,
  generateOfficialItr4Json,
  Itr1InputData,
  Itr4InputData,
} from './itrReturnGenerator.ts';
import {
  validateGstr1Preflight,
  validateGstr3bPreflight,
  validateItrPreflight,
} from './govSchemaValidator.ts';
import { db } from '../db/index.ts';
import { govtFilings } from '../db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { googleDriveStorage } from './googleDriveStorage.ts';

const STORAGE_ROOT = path.resolve(process.cwd(), 'local_storage');
const RETURNS_DIR = path.join(STORAGE_ROOT, 'gov_returns');
const FILINGS_STORE_FILE = path.join(STORAGE_ROOT, 'gov_filings_registry.json');

fs.mkdirSync(RETURNS_DIR, { recursive: true });

// Local cache store
let filingsRegistry: Map<string, GovtFilingRecord> = new Map();

function loadLocalRegistry() {
  try {
    if (fs.existsSync(FILINGS_STORE_FILE)) {
      const data = fs.readFileSync(FILINGS_STORE_FILE, 'utf-8');
      const list: GovtFilingRecord[] = JSON.parse(data);
      filingsRegistry.clear();
      list.forEach(r => filingsRegistry.set(r.id, r));
    }
  } catch (err: any) {
    console.warn('[GovFilingService] Error reading local registry:', err?.message || err);
  }
}

function saveLocalRegistry() {
  try {
    const list = Array.from(filingsRegistry.values());
    fs.writeFileSync(FILINGS_STORE_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err: any) {
    console.error('[GovFilingService] Error writing local registry:', err?.message || err);
  }
}

// Initial load of local cache
loadLocalRegistry();

/**
 * Persists filing record to Neon Cloud PostgreSQL and local cache
 */
async function syncFilingToCloud(record: GovtFilingRecord, filePath?: string): Promise<void> {
  // 1. Update in-memory & local disk cache
  filingsRegistry.set(record.id, record);
  saveLocalRegistry();

  // 2. Google Drive Cloud Sync
  if (filePath && fs.existsSync(filePath) && googleDriveStorage.isEnabled()) {
    try {
      const buffer = fs.readFileSync(filePath);
      const driveRes = await googleDriveStorage.uploadDocument({
        fileName: path.basename(filePath),
        mimeType: 'application/json',
        buffer,
        clientName: record.clientName,
        clientGstin: record.identifier,
        reportingPeriod: record.returnPeriod,
        localTempPath: filePath,
      });

      if (driveRes.isGoogleDrive) {
        record.driveFileId = driveRes.fileId;
        record.driveWebViewLink = driveRes.webViewLink;
        console.log(`[GovFilingService] Synced "${record.jsonFileName}" to Google Drive folder.`);
      }
    } catch (driveErr: any) {
      console.warn('[GovFilingService] Google Drive sync note:', driveErr?.message || driveErr);
    }
  }

  // 3. Neon Cloud PostgreSQL Sync
  try {
    const existing = await db
      .select()
      .from(govtFilings)
      .where(eq(govtFilings.id, record.id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(govtFilings).values({
        id: record.id,
        clientId: record.clientId,
        clientName: record.clientName,
        identifier: record.identifier,
        returnType: record.returnType,
        financialYear: record.financialYear,
        returnPeriod: record.returnPeriod,
        status: record.status,
        arnNumber: record.arnNumber || null,
        filingDate: record.filingDate || null,
        filedBy: record.filedBy || null,
        totalTaxableValue: String(record.totalTaxableValue || 0),
        totalTaxLiability: String(record.totalTaxLiability || 0),
        totalItcClaimed: String(record.totalItcClaimed || 0),
        jsonFileName: record.jsonFileName || null,
        jsonPayload: record.jsonPayload || {},
        driveFileId: record.driveFileId || null,
        driveWebViewLink: record.driveWebViewLink || null,
        notes: record.notes || null,
      });
      console.log(`[GovFilingService] Created and permanently saved return ${record.id} in Neon Cloud PostgreSQL.`);
    } else {
      await db
        .update(govtFilings)
        .set({
          status: record.status,
          arnNumber: record.arnNumber || null,
          filingDate: record.filingDate || null,
          filedBy: record.filedBy || null,
          totalTaxableValue: String(record.totalTaxableValue || 0),
          totalTaxLiability: String(record.totalTaxLiability || 0),
          totalItcClaimed: String(record.totalItcClaimed || 0),
          jsonFileName: record.jsonFileName || null,
          jsonPayload: record.jsonPayload || {},
          driveFileId: record.driveFileId || null,
          driveWebViewLink: record.driveWebViewLink || null,
          notes: record.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(govtFilings.id, record.id));
      console.log(`[GovFilingService] Updated return ${record.id} in Neon Cloud PostgreSQL.`);
    }
  } catch (dbErr: any) {
    console.warn('[GovFilingService] Neon Cloud DB sync notice:', dbErr?.message || dbErr);
  }
}

export class GovFilingService {
  /**
   * Returns all filing records sorted newest first (Reads from Neon Cloud PostgreSQL first)
   */
  static async getAllFilings(): Promise<GovtFilingRecord[]> {
    try {
      const rows = await db
        .select()
        .from(govtFilings)
        .orderBy(desc(govtFilings.updatedAt));

      if (rows.length > 0) {
        const cloudFilings: GovtFilingRecord[] = rows.map(r => ({
          id: r.id,
          clientId: r.clientId,
          clientName: r.clientName,
          identifier: r.identifier,
          returnType: r.returnType as GovtReturnType,
          financialYear: r.financialYear,
          returnPeriod: r.returnPeriod,
          status: r.status as GovtFilingStatus,
          arnNumber: r.arnNumber || undefined,
          filingDate: r.filingDate || undefined,
          filedBy: r.filedBy || undefined,
          totalTaxableValue: Number(r.totalTaxableValue || 0),
          totalTaxLiability: Number(r.totalTaxLiability || 0),
          totalItcClaimed: Number(r.totalItcClaimed || 0),
          jsonFileName: r.jsonFileName || undefined,
          jsonPayload: r.jsonPayload,
          driveFileId: r.driveFileId || undefined,
          driveWebViewLink: r.driveWebViewLink || undefined,
          notes: r.notes || undefined,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }));

        // Keep local registry in sync with Cloud
        cloudFilings.forEach(f => filingsRegistry.set(f.id, f));
        return cloudFilings;
      }
    } catch (err: any) {
      console.warn('[GovFilingService] Reading from local cache fallback:', err?.message || err);
    }

    return Array.from(filingsRegistry.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Retrieves single filing record
   */
  static async getFilingById(id: string): Promise<GovtFilingRecord | undefined> {
    try {
      const rows = await db.select().from(govtFilings).where(eq(govtFilings.id, id)).limit(1);
      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          clientId: r.clientId,
          clientName: r.clientName,
          identifier: r.identifier,
          returnType: r.returnType as GovtReturnType,
          financialYear: r.financialYear,
          returnPeriod: r.returnPeriod,
          status: r.status as GovtFilingStatus,
          arnNumber: r.arnNumber || undefined,
          filingDate: r.filingDate || undefined,
          filedBy: r.filedBy || undefined,
          totalTaxableValue: Number(r.totalTaxableValue || 0),
          totalTaxLiability: Number(r.totalTaxLiability || 0),
          totalItcClaimed: Number(r.totalItcClaimed || 0),
          jsonFileName: r.jsonFileName || undefined,
          jsonPayload: r.jsonPayload,
          driveFileId: r.driveFileId || undefined,
          driveWebViewLink: r.driveWebViewLink || undefined,
          notes: r.notes || undefined,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        };
      }
    } catch {}

    return filingsRegistry.get(id);
  }

  /**
   * Validates GSTR-1 parameters
   */
  static validateGstr1(data: {
    gstin: string;
    returnPeriod: string;
    invoices: Gstr1InputInvoice[];
    lineItems?: any[];
  }): GovtValidationResult {
    return validateGstr1Preflight(data);
  }

  /**
   * Generates official GSTR-1 JSON and saves to storage & Neon Cloud DB
   */
  static async generateGstr1(params: {
    clientId: string;
    clientName: string;
    gstin: string;
    reportingMonth: string;
    monthNumber: number;
    year: number;
    invoices: Gstr1InputInvoice[];
    grossTurnoverPrevYear?: number;
  }): Promise<{ record: GovtFilingRecord; jsonPayload: any; validation: GovtValidationResult }> {
    const validation = validateGstr1Preflight({
      gstin: params.gstin,
      returnPeriod: params.reportingMonth,
      invoices: params.invoices,
    });

    const { payload, filename, summary } = generateOfficialGstr1Json({
      client: {
        id: params.clientId,
        businessName: params.clientName,
        gstin: params.gstin,
      },
      period: {
        reportingMonth: params.reportingMonth,
        monthNumber: params.monthNumber,
        year: params.year,
      },
      invoices: params.invoices,
      grossTurnoverPrevYear: params.grossTurnoverPrevYear,
    });

    // Write JSON file to disk
    const filePath = path.join(RETURNS_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');

    const id = `filing_g1_${params.gstin.toLowerCase()}_${params.monthNumber < 10 ? '0' + params.monthNumber : params.monthNumber}${params.year}`;
    const record: GovtFilingRecord = {
      id,
      clientId: params.clientId,
      clientName: params.clientName,
      identifier: params.gstin.toUpperCase(),
      returnType: 'GSTR-1',
      financialYear: `${params.year}-${String(params.year + 1).slice(-2)}`,
      returnPeriod: params.reportingMonth,
      status: 'JSON Generated',
      totalTaxableValue: summary.totalTaxableValue,
      totalTaxLiability: summary.totalTaxLiability,
      totalItcClaimed: 0,
      jsonFileName: filename,
      jsonPayload: payload,
      notes: `Generated ${summary.totalB2bCount} B2B + ${summary.totalB2csCount} B2CS entries and ${summary.totalHsnCount} HSN classifications. Ready for official portal upload.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto-sync with Neon Cloud PostgreSQL & Google Drive
    await syncFilingToCloud(record, filePath);

    return { record, jsonPayload: payload, validation };
  }

  /**
   * Generates official GSTR-3B JSON and saves to storage & Neon Cloud DB
   */
  static async generateGstr3b(params: {
    clientId: string;
    clientName: string;
    gstin: string;
    reportingMonth: string;
    monthNumber: number;
    year: number;
    outwardTaxable: number;
    outwardIgst: number;
    outwardCgst: number;
    outwardSgst: number;
    itcIgst: number;
    itcCgst: number;
    itcSgst: number;
  }): Promise<{ record: GovtFilingRecord; jsonPayload: any; validation: GovtValidationResult }> {
    const validation = validateGstr3bPreflight({
      gstin: params.gstin,
      returnPeriod: params.reportingMonth,
      outwardTaxable: params.outwardTaxable,
      outwardIgst: params.outwardIgst,
      outwardCgst: params.outwardCgst,
      outwardSgst: params.outwardSgst,
      itcIgst: params.itcIgst,
      itcCgst: params.itcCgst,
      itcSgst: params.itcSgst,
    });

    const { payload, filename, summary } = generateOfficialGstr3bJson({
      client: {
        id: params.clientId,
        businessName: params.clientName,
        gstin: params.gstin,
      },
      period: {
        reportingMonth: params.reportingMonth,
        monthNumber: params.monthNumber,
        year: params.year,
      },
      outwardSupplies: {
        taxableAmount: params.outwardTaxable,
        igstAmount: params.outwardIgst,
        cgstAmount: params.outwardCgst,
        sgstAmount: params.outwardSgst,
      },
      eligibleItc: {
        allOtherItcIgst: params.itcIgst,
        allOtherItcCgst: params.itcCgst,
        allOtherItcSgst: params.itcSgst,
      },
    });

    const filePath = path.join(RETURNS_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');

    const id = `filing_g3b_${params.gstin.toLowerCase()}_${params.monthNumber < 10 ? '0' + params.monthNumber : params.monthNumber}${params.year}`;
    const record: GovtFilingRecord = {
      id,
      clientId: params.clientId,
      clientName: params.clientName,
      identifier: params.gstin.toUpperCase(),
      returnType: 'GSTR-3B',
      financialYear: `${params.year}-${String(params.year + 1).slice(-2)}`,
      returnPeriod: params.reportingMonth,
      status: 'JSON Generated',
      totalTaxableValue: summary.outwardTaxable,
      totalTaxLiability: summary.outwardTaxTotal,
      totalItcClaimed: summary.itcClaimedTotal,
      jsonFileName: filename,
      jsonPayload: payload,
      notes: `Net Cash Payable: ₹${summary.netCashPayable.toLocaleString('en-IN')}. Eligible ITC of ₹${summary.itcClaimedTotal.toLocaleString('en-IN')} claimed.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto-sync with Neon Cloud PostgreSQL & Google Drive
    await syncFilingToCloud(record, filePath);

    return { record, jsonPayload: payload, validation };
  }

  /**
   * Generates official ITR-1 JSON
   */
  static async generateItr1(params: {
    clientId: string;
    clientName: string;
    itrData: Itr1InputData;
  }): Promise<{ record: GovtFilingRecord; jsonPayload: any; validation: GovtValidationResult }> {
    const validation = validateItrPreflight({
      pan: params.itrData.assessee.pan,
      name: `${params.itrData.assessee.firstName} ${params.itrData.assessee.surName}`,
      assessmentYear: params.itrData.assessmentYear,
      totalIncome: params.itrData.incomeDetails.grossSalary,
      returnType: 'ITR-1',
      bankAccountNo: params.itrData.bankDetails.accountNumber,
      ifscCode: params.itrData.bankDetails.ifsc,
    });

    const { payload, filename, summary } = generateOfficialItr1Json(params.itrData);

    const filePath = path.join(RETURNS_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');

    const pan = params.itrData.assessee.pan.toUpperCase();
    const id = `filing_itr1_${pan.toLowerCase()}_ay${params.itrData.assessmentYear}`;
    const record: GovtFilingRecord = {
      id,
      clientId: params.clientId,
      clientName: params.clientName,
      identifier: pan,
      returnType: 'ITR-1',
      financialYear: params.itrData.financialYear,
      returnPeriod: `AY ${params.itrData.assessmentYear}-${String(Number(params.itrData.assessmentYear) + 1).slice(-2)}`,
      status: 'JSON Generated',
      totalTaxableValue: summary.netTaxableIncome,
      totalTaxLiability: summary.taxLiability,
      jsonFileName: filename,
      jsonPayload: payload,
      notes: `Tax Liability: ₹${summary.taxLiability.toLocaleString('en-IN')}. TDS Paid: ₹${summary.totalTdsPaid.toLocaleString('en-IN')}. ${summary.refundOrPayable > 0 ? `Refund Due: ₹${summary.refundOrPayable.toLocaleString('en-IN')}` : `Balance Payable: ₹${Math.abs(summary.refundOrPayable).toLocaleString('en-IN')}`}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto-sync with Neon Cloud PostgreSQL & Google Drive
    await syncFilingToCloud(record, filePath);

    return { record, jsonPayload: payload, validation };
  }

  /**
   * Generates official ITR-4 JSON
   */
  static async generateItr4(params: {
    clientId: string;
    clientName: string;
    itrData: Itr4InputData;
  }): Promise<{ record: GovtFilingRecord; jsonPayload: any; validation: GovtValidationResult }> {
    const validation = validateItrPreflight({
      pan: params.itrData.assessee.pan,
      name: `${params.itrData.assessee.firstName} ${params.itrData.assessee.surName}`,
      assessmentYear: params.itrData.assessmentYear,
      totalIncome: params.itrData.businessParticulars.presumptiveIncomeDeclared,
      returnType: 'ITR-4',
      bankAccountNo: params.itrData.bankDetails.accountNumber,
      ifscCode: params.itrData.bankDetails.ifsc,
    });

    const { payload, filename, summary } = generateOfficialItr4Json(params.itrData);

    const filePath = path.join(RETURNS_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');

    const pan = params.itrData.assessee.pan.toUpperCase();
    const id = `filing_itr4_${pan.toLowerCase()}_ay${params.itrData.assessmentYear}`;
    const record: GovtFilingRecord = {
      id,
      clientId: params.clientId,
      clientName: params.clientName,
      identifier: pan,
      returnType: 'ITR-4',
      financialYear: `${Number(params.itrData.assessmentYear) - 1}-${String(params.itrData.assessmentYear).slice(-2)}`,
      returnPeriod: `AY ${params.itrData.assessmentYear}-${String(Number(params.itrData.assessmentYear) + 1).slice(-2)}`,
      status: 'JSON Generated',
      totalTaxableValue: summary.presumptiveIncome,
      totalTaxLiability: summary.taxLiability,
      jsonFileName: filename,
      jsonPayload: payload,
      notes: `Gross Turnover: ₹${summary.grossTurnover.toLocaleString('en-IN')}. Presumptive Income: ₹${summary.presumptiveIncome.toLocaleString('en-IN')} declared.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto-sync with Neon Cloud PostgreSQL & Google Drive
    await syncFilingToCloud(record, filePath);

    return { record, jsonPayload: payload, validation };
  }

  /**
   * Records filing details (ARN / Ack No, Filing Date, DSC status) & syncs to Cloud
   */
  static async recordFilingStatus(id: string, update: {
    status: GovtFilingStatus;
    arnNumber?: string;
    filingDate?: string;
    filedBy?: string;
    notes?: string;
  }): Promise<GovtFilingRecord | null> {
    let existing = filingsRegistry.get(id);

    // If not in memory, check Cloud DB
    if (!existing) {
      existing = await this.getFilingById(id);
    }
    if (!existing) return null;

    const updated: GovtFilingRecord = {
      ...existing,
      status: update.status,
      arnNumber: update.arnNumber !== undefined ? update.arnNumber : existing.arnNumber,
      filingDate: update.filingDate || existing.filingDate || new Date().toISOString().split('T')[0],
      filedBy: update.filedBy || existing.filedBy || 'CA Practice Admin',
      notes: update.notes !== undefined ? update.notes : existing.notes,
      updatedAt: new Date().toISOString(),
    };

    // Sync to Neon Cloud PostgreSQL and local cache
    await syncFilingToCloud(updated);
    return updated;
  }

  /**
   * Retrieves file path for download
   */
  static getReturnFilePath(filename: string): string | null {
    const safeFilename = path.basename(filename);
    const p = path.join(RETURNS_DIR, safeFilename);
    if (fs.existsSync(p)) return p;
    return null;
  }
}
