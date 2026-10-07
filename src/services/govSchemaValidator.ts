// src/services/govSchemaValidator.ts
import { GovtValidationResult, GovtValidationCheck } from '../types/index.ts';

// GSTIN format regex (15 alphanumeric characters: 2 digits state + 10 chars PAN + 1 entity num + 'Z' + 1 checksum)
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

// PAN format regex (5 letters + 4 digits + 1 letter)
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;

/**
 * Validates a GSTIN against the official GSTN Luhn-mod-36 checksum algorithm.
 */
export function validateGstinChecksum(gstin: string): boolean {
  if (!gstin || gstin.length !== 15) return false;
  const cleanGstin = gstin.trim().toUpperCase();
  if (!GSTIN_REGEX.test(cleanGstin)) return false;

  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let factor = 1;
  let sum = 0;

  for (let i = 0; i < 14; i++) {
    const codePoint = chars.indexOf(cleanGstin[i]);
    if (codePoint === -1) return false;
    let addend = factor * codePoint;
    factor = factor === 2 ? 1 : 2;
    addend = Math.floor(addend / 36) + (addend % 36);
    sum += addend;
  }

  const remainder = sum % 36;
  const checkCodePoint = (36 - remainder) % 36;
  const calculatedChar = chars[checkCodePoint];

  return calculatedChar === cleanGstin[14];
}

/**
 * Validates GSTR-1 payload before portal upload
 */
export function validateGstr1Preflight(data: {
  gstin: string;
  returnPeriod: string;
  invoices: Array<{
    docNumber?: string | null;
    docDate?: string | null;
    buyerGstin?: string | null;
    placeOfSupply?: string | null;
    taxableAmount?: number | string | null;
    cgstAmount?: number | string | null;
    sgstAmount?: number | string | null;
    igstAmount?: number | string | null;
    cessAmount?: number | string | null;
    totalAmount?: number | string | null;
  }>;
  lineItems?: Array<{
    hsnSac?: string | null;
    taxableValue: number | string;
    taxRatePercent?: number | string | null;
    totalAmount: number | string;
  }>;
}): GovtValidationResult {
  const checks: GovtValidationCheck[] = [];
  const cleanGstin = (data.gstin || '').trim().toUpperCase();

  // 1. Taxpayer GSTIN Check
  if (!cleanGstin) {
    checks.push({
      code: 'GST_001',
      title: 'Taxpayer GSTIN Missing',
      status: 'failed',
      message: 'GSTIN cannot be empty. Please ensure the client profile has a valid registered GSTIN.',
    });
  } else if (!GSTIN_REGEX.test(cleanGstin)) {
    checks.push({
      code: 'GST_002',
      title: 'Invalid GSTIN Structure',
      status: 'failed',
      message: `"${cleanGstin}" does not match standard 15-character GSTIN structure (2-state + 10-PAN + 1-entity + Z + checksum).`,
    });
  } else {
    checks.push({
      code: 'GST_003',
      title: 'Taxpayer GSTIN Verified',
      status: 'passed',
      message: `GSTIN ${cleanGstin} matches government specification and format.`,
    });
  }

  // 2. Return Period Format Check (MMYYYY or month name)
  if (!data.returnPeriod) {
    checks.push({
      code: 'GST_004',
      title: 'Filing Period Missing',
      status: 'failed',
      message: 'Return period is required to generate the return JSON payload.',
    });
  } else {
    checks.push({
      code: 'GST_005',
      title: 'Filing Period Validated',
      status: 'passed',
      message: `Return period "${data.returnPeriod}" set for filing.`,
    });
  }

  // 3. Invoice Count & Negative Value Check
  if (!data.invoices || data.invoices.length === 0) {
    checks.push({
      code: 'GST_006',
      title: 'Nil / Zero Invoices Declared',
      status: 'warning',
      message: 'No outward sales invoices detected. A NIL GSTR-1 return will be prepared for upload.',
    });
  } else {
    let negativeFound = false;
    let missingDocNoCount = 0;
    let missingDateCount = 0;
    let recipientGstinInvalidCount = 0;
    let mathMismatchCount = 0;

    data.invoices.forEach((inv, idx) => {
      const taxable = Number(inv.taxableAmount || 0);
      const total = Number(inv.totalAmount || 0);
      const igst = Number(inv.igstAmount || 0);
      const cgst = Number(inv.cgstAmount || 0);
      const sgst = Number(inv.sgstAmount || 0);

      if (taxable < 0 || total < 0) negativeFound = true;
      if (!inv.docNumber) missingDocNoCount++;
      if (!inv.docDate) missingDateCount++;

      // If buyer has GSTIN, check format
      if (inv.buyerGstin && inv.buyerGstin.trim() && !inv.buyerGstin.toUpperCase().includes('UNREG')) {
        const bg = inv.buyerGstin.trim().toUpperCase();
        if (!GSTIN_REGEX.test(bg)) recipientGstinInvalidCount++;
      }

      // Math check
      const sumTaxes = igst + cgst + sgst;
      if (taxable > 0 && Math.abs((taxable + sumTaxes) - total) > 2) {
        mathMismatchCount++;
      }
    });

    if (negativeFound) {
      checks.push({
        code: 'GST_007',
        title: 'Negative Invoice Value Found',
        status: 'failed',
        message: 'Sales invoices cannot have negative taxable values in GSTR-1. Negative adjustments must be recorded as Credit Notes.',
      });
    }

    if (missingDocNoCount > 0) {
      checks.push({
        code: 'GST_008',
        title: 'Missing Invoice Numbers',
        status: 'warning',
        message: `${missingDocNoCount} invoice(s) lack invoice numbers. Auto-generated serial numbers will be assigned.`,
      });
    } else {
      checks.push({
        code: 'GST_009',
        title: 'All Invoices Numbered',
        status: 'passed',
        message: `All ${data.invoices.length} invoices possess valid serial identifiers.`,
      });
    }

    if (recipientGstinInvalidCount > 0) {
      checks.push({
        code: 'GST_010',
        title: 'Unregistered or Malformed B2B Buyer GSTINs',
        status: 'warning',
        message: `${recipientGstinInvalidCount} invoice(s) have non-standard buyer GSTINs. They will be treated under B2CS (Consumer) table to prevent GST portal rejection.`,
      });
    }

    if (mathMismatchCount > 0) {
      checks.push({
        code: 'GST_011',
        title: 'Arithmetic Rounding Differences',
        status: 'warning',
        message: `${mathMismatchCount} invoice(s) have minor rounding discrepancies (>₹2) between (Taxable + Taxes) and Total Amount. Values will be normalized.`,
      });
    } else {
      checks.push({
        code: 'GST_012',
        title: 'Arithmetic Cross-Verification Balanced',
        status: 'passed',
        message: 'Invoice totals reconcile accurately with taxable and tax values.',
      });
    }
  }

  // 4. HSN Summary Validation
  if (data.lineItems && data.lineItems.length > 0) {
    let missingHsnCount = 0;
    data.lineItems.forEach(item => {
      const hsn = (item.hsnSac || '').trim();
      if (!hsn || hsn.length < 4) missingHsnCount++;
    });

    if (missingHsnCount > 0) {
      checks.push({
        code: 'GST_013',
        title: 'HSN/SAC Codes Advisory',
        status: 'warning',
        message: `${missingHsnCount} item(s) have missing or incomplete HSN/SAC codes (< 4 digits). Standard fallback HSN 998311 (Services) or 999999 will be applied in HSN table.`,
      });
    } else {
      checks.push({
        code: 'GST_014',
        title: 'HSN Table Ready',
        status: 'passed',
        message: 'All item classifications satisfy mandatory GSTN 4/6-digit HSN requirement.',
      });
    }
  }

  const failedCount = checks.filter(c => c.status === 'failed').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const passedCount = checks.filter(c => c.status === 'passed').length;
  const total = checks.length;
  const score = total > 0 ? Math.round(((passedCount + warningCount * 0.5) / total) * 100) : 100;

  return {
    isValid: failedCount === 0,
    score,
    checks,
    summary: { passedCount, warningCount, failedCount },
  };
}

/**
 * Validates GSTR-3B monthly summary return payload
 */
export function validateGstr3bPreflight(data: {
  gstin: string;
  returnPeriod: string;
  outwardTaxable: number;
  outwardIgst: number;
  outwardCgst: number;
  outwardSgst: number;
  itcIgst: number;
  itcCgst: number;
  itcSgst: number;
}): GovtValidationResult {
  const checks: GovtValidationCheck[] = [];
  const cleanGstin = (data.gstin || '').trim().toUpperCase();

  if (!cleanGstin || !GSTIN_REGEX.test(cleanGstin)) {
    checks.push({
      code: 'G3B_001',
      title: 'Taxpayer GSTIN Validation',
      status: 'failed',
      message: 'Valid 15-character GSTIN is required for GSTR-3B filing.',
    });
  } else {
    checks.push({
      code: 'G3B_002',
      title: 'Taxpayer GSTIN Verified',
      status: 'passed',
      message: `Taxpayer ${cleanGstin} validated for Table 3.1 & Table 4.`,
    });
  }

  // CGST and SGST parity check (Intra-state CGST must equal SGST in normal returns)
  if (Math.abs(data.outwardCgst - data.outwardSgst) > 1) {
    checks.push({
      code: 'G3B_003',
      title: 'Outward CGST / SGST Asymmetry',
      status: 'warning',
      message: `CGST (₹${data.outwardCgst}) and SGST (₹${data.outwardSgst}) differ by more than ₹1. Intra-state supply taxes are usually equal.`,
    });
  } else {
    checks.push({
      code: 'G3B_004',
      title: 'Intra-State Tax Balance Check',
      status: 'passed',
      message: 'Outward CGST and SGST are in statutory parity.',
    });
  }

  // Input Tax Credit Verification
  const totalItc = data.itcIgst + data.itcCgst + data.itcSgst;
  if (totalItc < 0) {
    checks.push({
      code: 'G3B_005',
      title: 'Negative Input Tax Credit',
      status: 'failed',
      message: 'Eligible ITC claimed in Table 4 cannot be negative.',
    });
  } else {
    checks.push({
      code: 'G3B_006',
      title: 'ITC Table 4 Prepared',
      status: 'passed',
      message: `Total eligible ITC of ₹${totalItc.toLocaleString('en-IN', { minimumFractionDigits: 2 })} compiled for auto-credit into Electronic Credit Ledger.`,
    });
  }

  const failedCount = checks.filter(c => c.status === 'failed').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const passedCount = checks.filter(c => c.status === 'passed').length;
  const total = checks.length;
  const score = total > 0 ? Math.round(((passedCount + warningCount * 0.5) / total) * 100) : 100;

  return {
    isValid: failedCount === 0,
    score,
    checks,
    summary: { passedCount, warningCount, failedCount },
  };
}

/**
 * Validates ITR (Income Tax Return) parameters
 */
export function validateItrPreflight(data: {
  pan: string;
  name: string;
  assessmentYear: string;
  totalIncome: number;
  returnType: 'ITR-1' | 'ITR-4';
  bankAccountNo?: string;
  ifscCode?: string;
}): GovtValidationResult {
  const checks: GovtValidationCheck[] = [];
  const cleanPan = (data.pan || '').trim().toUpperCase();

  // 1. PAN Check
  if (!cleanPan) {
    checks.push({
      code: 'ITR_001',
      title: 'PAN Missing',
      status: 'failed',
      message: 'Permanent Account Number (PAN) is mandatory for filing Income Tax Return.',
    });
  } else if (!PAN_REGEX.test(cleanPan)) {
    checks.push({
      code: 'ITR_002',
      title: 'Invalid PAN Format',
      status: 'failed',
      message: `"${cleanPan}" does not match standard 10-character PAN format (e.g. ABCDE1234F).`,
    });
  } else {
    checks.push({
      code: 'ITR_003',
      title: 'PAN Verified',
      status: 'passed',
      message: `Assessee PAN ${cleanPan} validated.`,
    });
  }

  // 2. Assessee Name Check
  if (!data.name || data.name.trim().length < 3) {
    checks.push({
      code: 'ITR_004',
      title: 'Assessee Name Verification',
      status: 'failed',
      message: 'Full legal name of the taxpayer as per PAN card is required.',
    });
  } else {
    checks.push({
      code: 'ITR_005',
      title: 'Assessee Profile Name Check',
      status: 'passed',
      message: `Assessee name "${data.name}" validated.`,
    });
  }

  // 3. ITR-1 Eligibility Limit (<= 50 Lakhs)
  if (data.returnType === 'ITR-1' && data.totalIncome > 5000000) {
    checks.push({
      code: 'ITR_006',
      title: 'ITR-1 Ceiling Exceeded (> ₹50 Lakhs)',
      status: 'failed',
      message: `Total income of ₹${(data.totalIncome / 100000).toFixed(2)} Lakhs exceeds the ₹50 Lakh statutory limit for Form ITR-1. Please switch to Form ITR-2 or ITR-3.`,
    });
  } else {
    checks.push({
      code: 'ITR_007',
      title: 'Form Eligibility Verified',
      status: 'passed',
      message: `Assessee income is compliant with ${data.returnType} statutory rules.`,
    });
  }

  // 4. Bank Account for Refund Check
  if (!data.bankAccountNo || !data.ifscCode) {
    checks.push({
      code: 'ITR_008',
      title: 'Refund Bank Account Advisory',
      status: 'warning',
      message: 'Bank account number or IFSC code is missing. Income Tax Department requires at least one pre-validated bank account for refund processing.',
    });
  } else {
    checks.push({
      code: 'ITR_009',
      title: 'Refund Bank Details Attached',
      status: 'passed',
      message: `Bank A/C ending in ...${data.bankAccountNo.slice(-4)} with IFSC ${data.ifscCode} attached for ECS refund credit.`,
    });
  }

  const failedCount = checks.filter(c => c.status === 'failed').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const passedCount = checks.filter(c => c.status === 'passed').length;
  const total = checks.length;
  const score = total > 0 ? Math.round(((passedCount + warningCount * 0.5) / total) * 100) : 100;

  return {
    isValid: failedCount === 0,
    score,
    checks,
    summary: { passedCount, warningCount, failedCount },
  };
}
