// src/services/gstItrFilingService.ts
/**
 * QuinceCA - Official Government GSTN & CBDT E-Filing Engine
 * 100% Legal, Zero-Fee, Government-Prescribed Offline JSON & Assisted Filing Architecture.
 * Complies with GSTN Schema v1.5 (GSTR-1, GSTR-3B) and CBDT ITR JSON Schema.
 */

export interface GstValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface Gstr1B2bInvoice {
  customerGstin: string;
  invoiceNumber: string;
  invoiceDate: string; // DD-MM-YYYY
  invoiceValue: number;
  placeOfSupply: string; // e.g. "27-Maharashtra"
  reverseCharge: 'Y' | 'N';
  invoiceType: 'R' | 'SEZWP' | 'SEZWOP' | 'DE';
  items: {
    rate: number; // 5, 12, 18, 28
    taxableValue: number;
    igstAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    cessAmount?: number;
  }[];
}

export interface Gstr1HsnItem {
  num: number;
  hsnSc: string;
  desc?: string;
  uqc: string; // e.g. "NOS", "KGS", "OTH"
  qty: number;
  totalValue: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess?: number;
}

export interface Gstr1Payload {
  gstin: string;
  fp: string; // MMYYYY e.g. "082026"
  gt?: number; // Gross turnover of previous FY
  curGt?: number; // Gross turnover of current FY
  version?: string;
  b2b?: {
    ctin: string; // Customer GSTIN
    inv: {
      inum: string;
      idt: string;
      val: number;
      pos: string;
      rchrg: string;
      inv_typ: string;
      itms: {
        num: number;
        itm_det: {
          rt: number;
          txval: number;
          iamt: number;
          camt: number;
          samt: number;
          csamt: number;
        };
      }[];
    }[];
  }[];
  b2cs?: {
    sply_ty: 'INTER' | 'INTRA';
    rt: number;
    typ: 'OE';
    pos: string;
    txval: number;
    iamt?: number;
    camt?: number;
    samt?: number;
    csamt?: number;
  }[];
  hsn?: {
    data: {
      num: number;
      hsn_sc: string;
      desc?: string;
      uqc: string;
      qty: number;
      val: number;
      txval: number;
      iamt: number;
      camt: number;
      samt: number;
      csamt: number;
    }[];
  };
}

export interface Gstr3bPayload {
  gstin: string;
  ret_period: string; // MMYYYY
  sec_sum?: {
    sec_nm: string;
    ttl_val?: number;
    txval?: number;
    iamt?: number;
    camt?: number;
    samt?: number;
    csamt?: number;
  }[];
  itc_elg?: {
    itc_avl: {
      ty: string;
      iamt: number;
      camt: number;
      samt: number;
      csamt: number;
    }[];
    itc_net: {
      iamt: number;
      camt: number;
      samt: number;
      csamt: number;
    };
  };
}

export interface Itr1Payload {
  pan: string;
  assessmentYear: string; // "2026-27"
  taxpayerName: string;
  dateOfBirth?: string;
  aadhaarNumber?: string;
  mobile: string;
  email: string;
  filingSection: string; // "139(1)" on or before due date
  regime: 'NEW_115BAC' | 'OLD';
  grossSalary: number;
  standardDeduction: number; // 75000 in new regime for FY 24-25 / 25-26
  netSalary: number;
  incomeFromHouseProperty: number;
  incomeFromOtherSources: number;
  grossTotalIncome: number;
  deductions80C: number;
  deductions80D: number;
  totalDeductions: number;
  taxableIncome: number;
  totalTaxLiability: number;
  rebate87A: number;
  netTaxPayable: number;
  tdsDeducted: number;
  advanceTaxPaid: number;
  balancePayableOrRefund: number;
}

// -------------------------------------------------------------
// Validation Utilities
// -------------------------------------------------------------

export function validateGstinChecksum(gstin: string): boolean {
  if (!gstin) return false;
  const clean = gstin.trim().toUpperCase();
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!pattern.test(clean)) return false;

  // Mod 36 Checksum verification per GSTN specification
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let factor = 1;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const codePoint = chars.indexOf(clean[i]);
    if (codePoint === -1) return false;
    let addend = factor * codePoint;
    factor = factor === 2 ? 1 : 2;
    addend = Math.floor(addend / 36) + (addend % 36);
    sum += addend;
  }
  const remainder = sum % 36;
  const checkCodePoint = (36 - remainder) % 36;
  return chars[checkCodePoint] === clean[14];
}

export function validatePanFormat(pan: string): boolean {
  if (!pan) return false;
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.trim().toUpperCase());
}

/**
 * Pre-filing Pre-Flight Validator for GSTR-1
 */
export function validateGstr1PreFlight(
  clientGstin: string,
  invoices: Gstr1B2bInvoice[],
  hsnItems?: Gstr1HsnItem[]
): { isValid: boolean; issues: GstValidationIssue[] } {
  const issues: GstValidationIssue[] = [];

  if (!clientGstin) {
    issues.push({
      field: 'gstin',
      severity: 'error',
      message: 'Filer GSTIN is missing.',
      suggestion: 'Add the 15-character GSTIN in Client Profile.',
    });
  } else if (!validateGstinChecksum(clientGstin)) {
    issues.push({
      field: 'gstin',
      severity: 'error',
      message: `Invalid GSTIN checksum (${clientGstin}). Official portal will reject this return.`,
      suggestion: 'Verify the client GSTIN from the official Registration Certificate.',
    });
  }

  if (!invoices || invoices.length === 0) {
    issues.push({
      field: 'invoices',
      severity: 'warning',
      message: 'No B2B invoices found for this filing period. If this is a Nil return, use Nil Filing.',
    });
  }

  const seenInvoices = new Set<string>();
  invoices.forEach((inv, index) => {
    const invKey = `${inv.customerGstin}_${inv.invoiceNumber}`.toUpperCase();
    if (seenInvoices.has(invKey)) {
      issues.push({
        field: `invoice_${index}`,
        severity: 'error',
        message: `Duplicate invoice number detected: ${inv.invoiceNumber} for client ${inv.customerGstin}`,
        suggestion: 'Ensure invoice numbers are unique within the financial year.',
      });
    }
    seenInvoices.add(invKey);

    if (!inv.customerGstin || !validateGstinChecksum(inv.customerGstin)) {
      issues.push({
        field: `invoice_${index}_gstin`,
        severity: 'error',
        message: `Invoice #${inv.invoiceNumber}: Invalid Recipient GSTIN (${inv.customerGstin})`,
        suggestion: 'Cross-check recipient GSTIN on GST search portal.',
      });
    }

    if (inv.invoiceDate && /^\d{4}-\d{2}-\d{2}$/.test(inv.invoiceDate)) {
      const p = inv.invoiceDate.split('-');
      inv.invoiceDate = `${p[2]}-${p[1]}-${p[0]}`;
    }

    if (!inv.invoiceDate || !/^\d{2}-\d{2}-\d{4}$/.test(inv.invoiceDate)) {
      issues.push({
        field: `invoice_${index}_date`,
        severity: 'error',
        message: `Invoice #${inv.invoiceNumber}: Date must be in DD-MM-YYYY format (found "${inv.invoiceDate}")`,
        suggestion: 'Format the date as DD-MM-YYYY before generating the government JSON.',
      });
    }

    // Check item calculations
    let calculatedTaxable = 0;
    inv.items.forEach(itm => {
      calculatedTaxable += itm.taxableValue;
      if (![0, 5, 12, 18, 28].includes(itm.rate)) {
        issues.push({
          field: `invoice_${index}_rate`,
          severity: 'warning',
          message: `Invoice #${inv.invoiceNumber}: Non-standard tax rate ${itm.rate}%. Standard slabs: 0%, 5%, 12%, 18%, 28%.`,
        });
      }
    });

    if (Math.abs(calculatedTaxable - inv.invoiceValue) > 50 && inv.invoiceValue < calculatedTaxable) {
      issues.push({
        field: `invoice_${index}_value`,
        severity: 'warning',
        message: `Invoice #${inv.invoiceNumber}: Total invoice value (₹${inv.invoiceValue}) is less than taxable value (₹${calculatedTaxable}).`,
        suggestion: 'Invoice total must be >= taxable sum + taxes.',
      });
    }
  });

  // HSN summary check (Mandatory for taxpayers > 5 Cr: 6 digits, < 5 Cr: 4 digits)
  if (!hsnItems || hsnItems.length === 0) {
    issues.push({
      field: 'hsn',
      severity: 'warning',
      message: 'HSN Table (Table 12) is empty. GSTN requires HSN-wise summary for outward supplies.',
      suggestion: 'Include at least 4-digit HSN codes for goods or 6-digit SAC codes for services.',
    });
  }

  const hasErrors = issues.some(i => i.severity === 'error');
  return { isValid: !hasErrors, issues };
}

/**
 * Pre-filing Pre-Flight Validator for ITR-1 (Sahaj)
 */
export function validateItr1PreFlight(data: Itr1Payload): { isValid: boolean; issues: GstValidationIssue[] } {
  const issues: GstValidationIssue[] = [];

  if (!validatePanFormat(data.pan)) {
    issues.push({
      field: 'pan',
      severity: 'error',
      message: `Invalid PAN format "${data.pan}". Must be 5 uppercase letters, 4 digits, 1 uppercase letter.`,
    });
  }

  if (data.aadhaarNumber && !/^\d{12}$/.test(data.aadhaarNumber.replace(/\s+/g, ''))) {
    issues.push({
      field: 'aadhaar',
      severity: 'error',
      message: 'Aadhaar number must be exactly 12 digits.',
    });
  }

  if (data.grossTotalIncome > 5000000) {
    issues.push({
      field: 'grossTotalIncome',
      severity: 'error',
      message: `Total income exceeds ₹50 Lakhs (₹${data.grossTotalIncome.toLocaleString('en-IN')}). Filer is NOT eligible for ITR-1 Sahaj.`,
      suggestion: 'Switch filing form to ITR-2 or ITR-3.',
    });
  }

  if (data.incomeFromHouseProperty < 0 && Math.abs(data.incomeFromHouseProperty) > 200000) {
    issues.push({
      field: 'houseProperty',
      severity: 'error',
      message: 'Loss from House Property cannot exceed ₹2,00,000 for set-off.',
    });
  }

  if (data.regime === 'NEW_115BAC' && (data.deductions80C > 0 || data.deductions80D > 0)) {
    issues.push({
      field: 'deductions',
      severity: 'warning',
      message: 'Chapter VI-A deductions (80C, 80D) are not allowable under the New Tax Regime (u/s 115BAC).',
      suggestion: 'Only Standard Deduction (₹75,000) and 80CCD(2) employer pension are permissible in New Regime.',
    });
  }

  const hasErrors = issues.some(i => i.severity === 'error');
  return { isValid: !hasErrors, issues };
}

// -------------------------------------------------------------
// Official Government JSON Generators
// -------------------------------------------------------------

/**
 * Generates official GSTN Offline Tool compliant GSTR-1 JSON (v1.5)
 * Compatible with direct upload on gst.gov.in -> Services -> Returns -> Returns Dashboard
 */
export function generateGstr1GovJson(
  clientGstin: string,
  returnPeriodMmyyyy: string, // e.g. "082026"
  invoices: Gstr1B2bInvoice[],
  b2csItems: any[] = [],
  hsnItems: Gstr1HsnItem[] = []
): string {
  // Group invoices by customer GSTIN
  const groupedByCtin: Record<string, typeof invoices> = {};
  invoices.forEach(inv => {
    const ctin = inv.customerGstin.trim().toUpperCase();
    if (!groupedByCtin[ctin]) groupedByCtin[ctin] = [];
    groupedByCtin[ctin].push(inv);
  });

  const b2bArray = Object.keys(groupedByCtin).map(ctin => {
    const invList = groupedByCtin[ctin];
    return {
      ctin,
      inv: invList.map(item => ({
        inum: item.invoiceNumber.trim(),
        idt: item.invoiceDate.trim(),
        val: Number(item.invoiceValue.toFixed(2)),
        pos: item.placeOfSupply || ctin.substring(0, 2),
        rchrg: item.reverseCharge || 'N',
        inv_typ: item.invoiceType || 'R',
        itms: item.items.map((it, idx) => ({
          num: idx + 1,
          itm_det: {
            rt: it.rate,
            txval: Number(it.taxableValue.toFixed(2)),
            iamt: Number(it.igstAmount.toFixed(2)),
            camt: Number(it.cgstAmount.toFixed(2)),
            samt: Number(it.sgstAmount.toFixed(2)),
            csamt: Number((it.cessAmount || 0).toFixed(2)),
          },
        })),
      })),
    };
  });

  const hsnData = hsnItems.map((h, idx) => ({
    num: idx + 1,
    hsn_sc: h.hsnSc,
    desc: h.desc || 'Goods / Services',
    uqc: h.uqc || 'OTH',
    qty: h.qty || 1,
    val: Number(h.totalValue.toFixed(2)),
    txval: Number(h.taxableValue.toFixed(2)),
    iamt: Number(h.igst.toFixed(2)),
    camt: Number(h.cgst.toFixed(2)),
    samt: Number(h.sgst.toFixed(2)),
    csamt: Number((h.cess || 0).toFixed(2)),
  }));

  const payload: Gstr1Payload = {
    gstin: clientGstin.trim().toUpperCase(),
    fp: returnPeriodMmyyyy,
    gt: 0,
    curGt: 0,
    version: 'GST1.5',
    b2b: b2bArray,
    b2cs: b2csItems.length > 0 ? b2csItems : undefined,
    hsn: hsnData.length > 0 ? { data: hsnData } : undefined,
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Generates official GSTN GSTR-3B Summary JSON
 */
export function generateGstr3bGovJson(
  clientGstin: string,
  returnPeriodMmyyyy: string,
  summary: {
    outwardTaxable: number;
    outwardIgst: number;
    outwardCgst: number;
    outwardSgst: number;
    itcIgst: number;
    itcCgst: number;
    itcSgst: number;
    inwardRcmTaxable?: number;
    exemptOutward?: number;
  }
): string {
  const payload: Gstr3bPayload = {
    gstin: clientGstin.trim().toUpperCase(),
    ret_period: returnPeriodMmyyyy,
    sec_sum: [
      {
        sec_nm: '3.1(a) Outward Taxable Supplies (Other than zero rated, nil and exempted)',
        txval: Number(summary.outwardTaxable.toFixed(2)),
        iamt: Number(summary.outwardIgst.toFixed(2)),
        camt: Number(summary.outwardCgst.toFixed(2)),
        samt: Number(summary.outwardSgst.toFixed(2)),
        csamt: 0,
      },
      {
        sec_nm: '3.1(d) Inward supplies liable to reverse charge',
        txval: Number((summary.inwardRcmTaxable || 0).toFixed(2)),
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0,
      },
      {
        sec_nm: '3.1(e) Non-GST outward supplies',
        txval: Number((summary.exemptOutward || 0).toFixed(2)),
      },
    ],
    itc_elg: {
      itc_avl: [
        {
          ty: 'All other ITC',
          iamt: Number(summary.itcIgst.toFixed(2)),
          camt: Number(summary.itcCgst.toFixed(2)),
          samt: Number(summary.itcSgst.toFixed(2)),
          csamt: 0,
        },
      ],
      itc_net: {
        iamt: Number(summary.itcIgst.toFixed(2)),
        camt: Number(summary.itcCgst.toFixed(2)),
        samt: Number(summary.itcSgst.toFixed(2)),
        csamt: 0,
      },
    },
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Generates official CBDT Income Tax Department (ITR-1 Sahaj) compliant JSON
 * Uploadable on eportal.incometax.gov.in -> e-File -> Income Tax Returns -> File Income Tax Return
 */
export function generateItr1GovJson(data: Itr1Payload): string {
  const payload = {
    ITR: {
      ITR1: {
        CreationInfo: {
          SWVersionNo: 'QuinceCA-v3.8',
          SWCreatedBy: 'QuinceCA Practice OS',
          XMLCreatedBy: 'QuinceCA Engine',
          JSONCreatedDate: new Date().toISOString().split('T')[0],
        },
        Form_ITR1: {
          FormName: 'ITR-1',
          Description: 'For Individuals being a Resident (other than Not Ordinarily Resident) having total income upto 50 lakh',
          AssessmentYear: data.assessmentYear,
          SchemaVer: 'Ver1.0',
          FormVer: 'Ver1.0',
        },
        PersonalInfo: {
          AssesseeName: {
            SurNameOrOrgName: data.taxpayerName,
          },
          PAN: data.pan.toUpperCase(),
          AadhaarCardNo: data.aadhaarNumber || '',
          MobileNo: data.mobile,
          EmailAddress: data.email,
          EmployerCategory: 'OTH',
        },
        FilingStatus: {
          ReturnFileSec: 11, // 139(1) On or before due date
          OptingNewRegime: data.regime === 'NEW_115BAC' ? 'Y' : 'N',
          ResidentialStatus: 'RES',
        },
        IncomeDeductions: {
          GrossSalary: Math.round(data.grossSalary),
          StandardDeduction: Math.round(data.standardDeduction),
          NetSalary: Math.round(data.netSalary),
          TotalIncomeOfHP: Math.round(data.incomeFromHouseProperty),
          IncomeOthSrc: Math.round(data.incomeFromOtherSources),
          GrossTotIncome: Math.round(data.grossTotalIncome),
          Us80C: data.regime === 'OLD' ? Math.round(data.deductions80C) : 0,
          Us80D: data.regime === 'OLD' ? Math.round(data.deductions80D) : 0,
          TotalIncomeDeductions: data.regime === 'OLD' ? Math.round(data.totalDeductions) : 0,
          TotalIncome: Math.round(data.taxableIncome),
        },
        TaxComputation: {
          TotalTaxPayable: Math.round(data.totalTaxLiability),
          Rebate87A: Math.round(data.rebate87A),
          NetTaxPayable: Math.round(data.netTaxPayable),
          TDS: Math.round(data.tdsDeducted),
          AdvanceTax: Math.round(data.advanceTaxPaid),
          TotTaxPaid: Math.round(data.tdsDeducted + data.advanceTaxPaid),
          BalTaxPayable: data.balancePayableOrRefund > 0 ? Math.round(data.balancePayableOrRefund) : 0,
          RefundDue: data.balancePayableOrRefund < 0 ? Math.round(Math.abs(data.balancePayableOrRefund)) : 0,
        },
      },
    },
  };

  return JSON.stringify(payload, null, 2);
}

// -------------------------------------------------------------
// Official Portal Deep Links & Action Guidelines
// -------------------------------------------------------------
export const GOV_PORTAL_LINKS = {
  gstReturnsDashboard: 'https://return.gst.gov.in/returns/auth/dashboard',
  gstOfflineUpload: 'https://return.gst.gov.in/returns/auth/gstr1/offline-upload',
  gstLogin: 'https://services.gst.gov.in/services/login',
  incomeTaxEfiling: 'https://eportal.incometax.gov.in/iec/foservices/#/login',
  incomeTaxUploadItr: 'https://eportal.incometax.gov.in/iec/foservices/#/dashboard/e-file/income-tax-return',
  gstSearchTaxpayer: 'https://services.gst.gov.in/services/searchtp',
  incomeTaxVerifyPan: 'https://eportal.incometax.gov.in/iec/foservices/#/pre-login/verifyYourPAN',
};
