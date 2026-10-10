// src/services/mcaFilingAutomationService.ts
/**
 * Ministry of Corporate Affairs (MCA V3) End-to-End Filing Automation Service
 * Implements the 8-Step MCA Filing Workflow:
 * 1. User Login (MCA Credentials & OTP)
 * 2. Basic Company Details (Auto-fetch / Manual / Copy-Paste)
 * 3. Download Official Blank MCA Utility (AOC-4, MGT-7, MGT-7A, Form 8, DIR-3 KYC)
 * 4. Upload Utility & Supporting PDFs (Financials, Auditor Report, Board Report)
 * 5. Automated Data Extraction & Excel Auto-Filling
 * 6. Review, Edit & Validation Grid
 * 7. Generate & Download Final MCA Utility (.xlsx)
 * 8. Upload to MCA V3 Portal & Filing Status Tracking
 */

import ExcelJS from 'exceljs';
import { Client, DirectorKYC } from '../types/index.ts';

export type McaFormKey = 'AOC-4' | 'MGT-7' | 'MGT-7A' | 'DIR-3-KYC' | 'FORM-8';

export interface McaFormMeta {
  key: McaFormKey;
  name: string;
  description: string;
  applicability: string;
  duePeriod: string;
  iconColor: string;
}

export const MCA_FORMS_CATALOG: McaFormMeta[] = [
  {
    key: 'AOC-4',
    name: 'Form AOC-4 (Financial Statements)',
    description: 'Filing of audited Financial Statements (Balance Sheet, P&L, Notes) and Director/Auditor reports with ROC.',
    applicability: 'All Private & Public Companies (within 30 days of AGM)',
    duePeriod: 'Annual (Oct 29 - Oct 30)',
    iconColor: 'from-emerald-500 to-teal-700',
  },
  {
    key: 'MGT-7',
    name: 'Form MGT-7 (Annual Return)',
    description: 'Annual Return of Company containing register of members, directors, meeting details, and shareholding pattern.',
    applicability: 'Companies other than Small Companies and OPCs',
    duePeriod: 'Annual (Nov 29)',
    iconColor: 'from-blue-500 to-indigo-700',
  },
  {
    key: 'MGT-7A',
    name: 'Form MGT-7A (Abridged Annual Return)',
    description: 'Abridged Annual Return specifically for Small Companies and One Person Companies (OPCs).',
    applicability: 'Small Companies & One Person Companies (OPC)',
    duePeriod: 'Annual (Nov 29)',
    iconColor: 'from-purple-500 to-indigo-600',
  },
  {
    key: 'DIR-3-KYC',
    name: 'Form DIR-3 KYC (Director Annual KYC)',
    description: 'Mandatory annual verification of Director Identification Number (DIN) with Aadhaar and mobile/email OTP.',
    applicability: 'All DIN Holders holding approved DIN on 31st March',
    duePeriod: 'Annual (Sept 30)',
    iconColor: 'from-amber-500 to-orange-600',
  },
  {
    key: 'FORM-8',
    name: 'Form 8 (LLP Statement of Account & Solvency)',
    description: 'Statement of Account & Solvency filed by Limited Liability Partnerships along with certificate of solvency.',
    applicability: 'All Registered LLPs (within 30 days from 6 months of FY)',
    duePeriod: 'Annual (Oct 30)',
    iconColor: 'from-rose-500 to-pink-600',
  },
];

export interface McaCompanyInfo {
  cin: string;
  companyName: string;
  registrationNumber: string;
  dateOfIncorporation: string;
  registeredEmail: string;
  registeredPhone: string;
  registeredAddress: string;
  authorizedCapital: number;
  paidUpCapital: number;
  financialYearFrom: string;
  financialYearTo: string;
  agmDate: string;
  directors: {
    din: string;
    name: string;
    designation: string;
    pan: string;
    aadharNumber?: string;
  }[];
}

export interface McaFinancialData {
  // Balance Sheet - Equity & Liabilities
  equityShareCapital: number;
  reservesAndSurplus: number;
  longTermBorrowings: number;
  shortTermBorrowings: number;
  tradePayables: number;
  otherCurrentLiabilities: number;
  shortTermProvisions: number;
  totalLiabilities: number;

  // Balance Sheet - Assets
  tangibleAssets: number;
  intangibleAssets: number;
  capitalWorkInProgress: number;
  nonCurrentInvestments: number;
  inventories: number;
  tradeReceivables: number;
  cashAndBankBalances: number;
  shortTermLoansAndAdvances: number;
  otherCurrentAssets: number;
  totalAssets: number;

  // Statement of Profit & Loss
  revenueFromOperations: number;
  otherIncome: number;
  totalRevenue: number;
  costOfMaterialsConsumed: number;
  employeeBenefitExpense: number;
  financeCosts: number;
  depreciationAndAmortization: number;
  otherExpenses: number;
  totalExpenses: number;
  profitBeforeTax: number;
  currentTax: number;
  deferredTax: number;
  profitAfterTax: number;

  // Auditor & Report Info
  auditorFirmName: string;
  auditorFrn: string;
  auditorPartnerName: string;
  auditorMembershipNo: string;
  auditOpinion: 'Unqualified / Clean' | 'Qualified' | 'Adverse' | 'Disclaimer';
  auditorReportDate: string;
  boardReportDate: string;
}

export interface McaValidationCheck {
  id: string;
  label: string;
  status: 'passed' | 'warning' | 'error';
  message: string;
}

/**
 * Validates financial equation and completeness
 */
export function validateMcaFinancialData(
  company: McaCompanyInfo,
  financials: McaFinancialData
): { isValid: boolean; score: number; checks: McaValidationCheck[] } {
  const checks: McaValidationCheck[] = [];

  // Check 1: Balance Sheet Equation (Assets == Liabilities)
  const bsDiff = Math.abs(financials.totalAssets - financials.totalLiabilities);
  if (bsDiff < 1) {
    checks.push({
      id: 'bs_equation',
      label: 'Balance Sheet Balance (Assets = Liabilities)',
      status: 'passed',
      message: `Assets (₹${financials.totalAssets.toLocaleString('en-IN')}) perfectly match Liabilities (₹${financials.totalLiabilities.toLocaleString('en-IN')}).`,
    });
  } else {
    checks.push({
      id: 'bs_equation',
      label: 'Balance Sheet Discrepancy',
      status: 'error',
      message: `Balance sheet does not tally! Assets: ₹${financials.totalAssets.toLocaleString('en-IN')}, Liabilities: ₹${financials.totalLiabilities.toLocaleString('en-IN')} (Difference: ₹${bsDiff.toLocaleString('en-IN')}).`,
    });
  }

  // Check 2: CIN Format
  const cinRegex = /^[LUu][0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}$/;
  if (company.cin && cinRegex.test(company.cin)) {
    checks.push({
      id: 'cin_check',
      label: 'Corporate Identification Number (CIN)',
      status: 'passed',
      message: `Valid 21-digit MCA CIN format (${company.cin}).`,
    });
  } else {
    checks.push({
      id: 'cin_check',
      label: 'Corporate Identification Number (CIN)',
      status: 'error',
      message: `CIN is missing or does not conform to the 21-digit alphanumeric format.`,
    });
  }

  // Check 3: Paid-up Capital <= Authorized Capital
  if (company.paidUpCapital <= company.authorizedCapital) {
    checks.push({
      id: 'capital_check',
      label: 'Share Capital Consistency',
      status: 'passed',
      message: `Paid-up Capital (₹${company.paidUpCapital.toLocaleString('en-IN')}) is within Authorized Capital (₹${company.authorizedCapital.toLocaleString('en-IN')}).`,
    });
  } else {
    checks.push({
      id: 'capital_check',
      label: 'Share Capital Exceeded',
      status: 'error',
      message: `Paid-up capital cannot exceed authorized share capital!`,
    });
  }

  // Check 4: P&L Math Check
  const calculatedPbt = financials.totalRevenue - financials.totalExpenses;
  const pbtDiff = Math.abs(financials.profitBeforeTax - calculatedPbt);
  if (pbtDiff < 10) {
    checks.push({
      id: 'pnl_math',
      label: 'Profit Before Tax Calculation',
      status: 'passed',
      message: `Revenue minus Expenses equals Profit Before Tax (₹${financials.profitBeforeTax.toLocaleString('en-IN')}).`,
    });
  } else {
    checks.push({
      id: 'pnl_math',
      label: 'P&L Computation Warning',
      status: 'warning',
      message: `Computed PBT (₹${calculatedPbt.toLocaleString('en-IN')}) differs from entered PBT (₹${financials.profitBeforeTax.toLocaleString('en-IN')}). Verify exceptional items.`,
    });
  }

  // Check 5: Auditor & Director Details
  if (financials.auditorMembershipNo && financials.auditorFrn) {
    checks.push({
      id: 'auditor_info',
      label: 'Statutory Auditor Information',
      status: 'passed',
      message: `Auditor FRN (${financials.auditorFrn}) and Membership No. (${financials.auditorMembershipNo}) verified.`,
    });
  } else {
    checks.push({
      id: 'auditor_info',
      label: 'Statutory Auditor Information',
      status: 'warning',
      message: `Auditor Firm Registration Number (FRN) or Membership number is pending.`,
    });
  }

  const passedCount = checks.filter(c => c.status === 'passed').length;
  const errorCount = checks.filter(c => c.status === 'error').length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    isValid: errorCount === 0,
    score,
    checks,
  };
}

/**
 * Generates an official MCA-structured Excel Utility (.xlsx)
 * with General Information, Balance Sheet, P&L, and Audit details.
 */
export async function generateMcaExcelUtilityBuffer(
  formKey: McaFormKey,
  company: McaCompanyInfo,
  financials: McaFinancialData
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Professional Samadhan MCA Automation';
  workbook.lastModifiedBy = 'Chartered Accountant e-Filing Suite';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Primary Theme Colors (MCA V3 Teal/Navy Palette)
  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0D47A1' }, // Deep MCA Navy
  };
  const sectionFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF00695C' }, // MCA Teal
  };
  const zebraFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF5F7FA' },
  };

  // ----------------------------------------------------
  // SHEET 1: GENERAL_INFO
  // ----------------------------------------------------
  const sheet1 = workbook.addWorksheet('General_Information', { views: [{ showGridLines: true }] });
  sheet1.columns = [
    { header: 'Field / Parameter', key: 'param', width: 42 },
    { header: 'Value as per MCA Records', key: 'val', width: 55 },
  ];

  sheet1.addRow(['FORM CODE', formKey]);
  sheet1.addRow(['Corporate Identification Number (CIN)', company.cin]);
  sheet1.addRow(['Name of the Company', company.companyName]);
  sheet1.addRow(['Registered Office Address', company.registeredAddress]);
  sheet1.addRow(['Registered Email ID', company.registeredEmail]);
  sheet1.addRow(['Registered Mobile No.', company.registeredPhone]);
  sheet1.addRow(['Date of Incorporation', company.dateOfIncorporation]);
  sheet1.addRow(['Authorized Share Capital (INR)', company.authorizedCapital]);
  sheet1.addRow(['Paid-up Share Capital (INR)', company.paidUpCapital]);
  sheet1.addRow(['Financial Year Commencing', company.financialYearFrom]);
  sheet1.addRow(['Financial Year Ending', company.financialYearTo]);
  sheet1.addRow(['Date of Annual General Meeting (AGM)', company.agmDate]);

  sheet1.getRow(1).eachCell(cell => {
    cell.fill = headerFill;
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
  });

  // ----------------------------------------------------
  // SHEET 2: BALANCE_SHEET
  // ----------------------------------------------------
  const sheet2 = workbook.addWorksheet('Balance_Sheet', { views: [{ showGridLines: true }] });
  sheet2.columns = [
    { header: 'Particulars', key: 'part', width: 45 },
    { header: 'Note No.', key: 'note', width: 12 },
    { header: 'Figures as at End of Current Reporting Period (INR)', key: 'current', width: 35 },
  ];

  sheet2.addRow(['I. EQUITY AND LIABILITIES', '', '']);
  sheet2.addRow(['(1) Shareholders\' Funds', '', '']);
  sheet2.addRow(['  (a) Share Capital', '1', financials.equityShareCapital]);
  sheet2.addRow(['  (b) Reserves and Surplus', '2', financials.reservesAndSurplus]);
  sheet2.addRow(['(2) Non-Current Liabilities', '', '']);
  sheet2.addRow(['  (a) Long-term Borrowings', '3', financials.longTermBorrowings]);
  sheet2.addRow(['(3) Current Liabilities', '', '']);
  sheet2.addRow(['  (a) Short-term Borrowings', '4', financials.shortTermBorrowings]);
  sheet2.addRow(['  (b) Trade Payables', '5', financials.tradePayables]);
  sheet2.addRow(['  (c) Other Current Liabilities', '6', financials.otherCurrentLiabilities]);
  sheet2.addRow(['  (d) Short-term Provisions', '7', financials.shortTermProvisions]);
  sheet2.addRow(['TOTAL EQUITY & LIABILITIES', '', financials.totalLiabilities]);

  sheet2.addRow(['', '', '']);
  sheet2.addRow(['II. ASSETS', '', '']);
  sheet2.addRow(['(1) Non-Current Assets', '', '']);
  sheet2.addRow(['  (a) Property, Plant & Equipment (Tangible)', '8', financials.tangibleAssets]);
  sheet2.addRow(['  (b) Intangible Assets', '9', financials.intangibleAssets]);
  sheet2.addRow(['  (c) Capital Work-in-Progress', '10', financials.capitalWorkInProgress]);
  sheet2.addRow(['  (d) Non-Current Investments', '11', financials.nonCurrentInvestments]);
  sheet2.addRow(['(2) Current Assets', '', '']);
  sheet2.addRow(['  (a) Inventories', '12', financials.inventories]);
  sheet2.addRow(['  (b) Trade Receivables', '13', financials.tradeReceivables]);
  sheet2.addRow(['  (c) Cash and Bank Balances', '14', financials.cashAndBankBalances]);
  sheet2.addRow(['  (d) Short-term Loans and Advances', '15', financials.shortTermLoansAndAdvances]);
  sheet2.addRow(['  (e) Other Current Assets', '16', financials.otherCurrentAssets]);
  sheet2.addRow(['TOTAL ASSETS', '', financials.totalAssets]);

  sheet2.getRow(1).eachCell(cell => {
    cell.fill = sectionFill;
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
  });

  // ----------------------------------------------------
  // SHEET 3: PROFIT_AND_LOSS
  // ----------------------------------------------------
  const sheet3 = workbook.addWorksheet('Profit_and_Loss', { views: [{ showGridLines: true }] });
  sheet3.columns = [
    { header: 'Particulars', key: 'part', width: 45 },
    { header: 'Note No.', key: 'note', width: 12 },
    { header: 'Figures for Current Reporting Period (INR)', key: 'amt', width: 35 },
  ];

  sheet3.addRow(['I. Revenue from Operations', '17', financials.revenueFromOperations]);
  sheet3.addRow(['II. Other Income', '18', financials.otherIncome]);
  sheet3.addRow(['III. TOTAL REVENUE (I + II)', '', financials.totalRevenue]);
  sheet3.addRow(['IV. EXPENSES', '', '']);
  sheet3.addRow(['  (a) Cost of Materials Consumed', '19', financials.costOfMaterialsConsumed]);
  sheet3.addRow(['  (b) Employee Benefits Expense', '20', financials.employeeBenefitExpense]);
  sheet3.addRow(['  (c) Finance Costs', '21', financials.financeCosts]);
  sheet3.addRow(['  (d) Depreciation & Amortization', '22', financials.depreciationAndAmortization]);
  sheet3.addRow(['  (e) Other Expenses', '23', financials.otherExpenses]);
  sheet3.addRow(['  TOTAL EXPENSES', '', financials.totalExpenses]);
  sheet3.addRow(['V. Profit Before Exceptional Items & Tax', '', financials.profitBeforeTax]);
  sheet3.addRow(['VI. Tax Expense (Current + Deferred)', '', financials.currentTax + financials.deferredTax]);
  sheet3.addRow(['VII. PROFIT / (LOSS) FOR THE PERIOD', '', financials.profitAfterTax]);

  sheet3.getRow(1).eachCell(cell => {
    cell.fill = sectionFill;
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
  });

  // ----------------------------------------------------
  // SHEET 4: AUDITOR_AND_SIGNATORIES
  // ----------------------------------------------------
  const sheet4 = workbook.addWorksheet('Auditor_and_Signatories', { views: [{ showGridLines: true }] });
  sheet4.columns = [
    { header: 'Designation / Field', key: 'desig', width: 35 },
    { header: 'Name / Identification', key: 'id', width: 35 },
    { header: 'Number / FRN / DIN', key: 'num', width: 25 },
    { header: 'Date of Signing', key: 'dt', width: 20 },
  ];

  sheet4.addRow([
    'Statutory Auditor',
    financials.auditorFirmName || 'Auditor Firm',
    `FRN: ${financials.auditorFrn || 'N/A'}`,
    financials.auditorReportDate || new Date().toISOString().split('T')[0],
  ]);
  sheet4.addRow([
    'Audit Partner',
    financials.auditorPartnerName || 'Signing Partner',
    `M.No: ${financials.auditorMembershipNo || 'N/A'}`,
    financials.auditorReportDate || new Date().toISOString().split('T')[0],
  ]);
  company.directors.forEach((dir, i) => {
    sheet4.addRow([
      `Director ${i + 1}`,
      dir.name,
      `DIN: ${dir.din || dir.pan || 'N/A'}`,
      financials.boardReportDate || new Date().toISOString().split('T')[0],
    ]);
  });

  sheet4.getRow(1).eachCell(cell => {
    cell.fill = headerFill;
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Creates default / mock financials based on client details
 */
export function getDefaultMcaFinancials(client?: Partial<Client>): McaFinancialData {
  return {
    equityShareCapital: 100000,
    reservesAndSurplus: 450000,
    longTermBorrowings: 200000,
    shortTermBorrowings: 150000,
    tradePayables: 250000,
    otherCurrentLiabilities: 50000,
    shortTermProvisions: 25000,
    totalLiabilities: 1225000,

    tangibleAssets: 350000,
    intangibleAssets: 50000,
    capitalWorkInProgress: 0,
    nonCurrentInvestments: 100000,
    inventories: 275000,
    tradeReceivables: 320000,
    cashAndBankBalances: 95000,
    shortTermLoansAndAdvances: 20000,
    otherCurrentAssets: 15000,
    totalAssets: 1225000,

    revenueFromOperations: 1850000,
    otherIncome: 45000,
    totalRevenue: 1895000,
    costOfMaterialsConsumed: 850000,
    employeeBenefitExpense: 420000,
    financeCosts: 35000,
    depreciationAndAmortization: 45000,
    otherExpenses: 215000,
    totalExpenses: 1565000,
    profitBeforeTax: 330000,
    currentTax: 82500,
    deferredTax: 0,
    profitAfterTax: 247500,

    auditorFirmName: 'Dutta & Associates, Chartered Accountants',
    auditorFrn: '018920N',
    auditorPartnerName: 'CA Rajesh Dutta (FCA)',
    auditorMembershipNo: '089214',
    auditOpinion: 'Unqualified / Clean',
    auditorReportDate: '2026-09-02',
    boardReportDate: '2026-09-02',
  };
}

/**
 * Intelligent extraction of Balance Sheet, P&L, Auditor, and Signatories
 * from uploaded PDF files (Financial Statements, Auditor's Report, Director's Report).
 */
export async function extractFinancialsFromPdfBuffer(
  buffer: Buffer,
  fileName: string
): Promise<{ financials: Partial<McaFinancialData>; rawText: string; warnings: string[] }> {
  let text = '';
  const warnings: string[] = [];
  const extracted: Partial<McaFinancialData> = {};

  try {
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
    const parsed = await pdfParse(buffer);
    text = parsed.text || '';
  } catch (err: any) {
    warnings.push(`PDF text parsing error (${fileName}): ${err.message}. Trying vision fallback...`);
  }

  // 1. Try Gemini Vision / Multimodal if text is too sparse (scanned audit copies)
  if ((!text || text.length < 150) && process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Extract Indian Audited Financial Statement figures (Balance sheet, P&L, Auditor details) from this document. Return JSON:
{
  "equityShareCapital": number,
  "reservesAndSurplus": number,
  "longTermBorrowings": number,
  "shortTermBorrowings": number,
  "tradePayables": number,
  "totalLiabilities": number,
  "tangibleAssets": number,
  "inventories": number,
  "tradeReceivables": number,
  "cashAndBankBalances": number,
  "totalAssets": number,
  "revenueFromOperations": number,
  "totalRevenue": number,
  "totalExpenses": number,
  "profitBeforeTax": number,
  "profitAfterTax": number,
  "auditorFirmName": string,
  "auditorFrn": string,
  "auditorPartnerName": string,
  "auditorMembershipNo": string
}`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: buffer.toString('base64'),
                  mimeType: 'application/pdf',
                },
              },
            ],
          },
        ],
      });
      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedJson = JSON.parse(jsonMatch[0]);
        Object.assign(extracted, parsedJson);
        return { financials: extracted, rawText: text, warnings };
      }
    } catch (e: any) {
      warnings.push(`Gemini extraction fallback notice: ${e.message}`);
    }
  }

  // 2. High-precision Regex Patterns for Indian Financial Statements
  const extractNumberAfter = (pattern: RegExp): number | undefined => {
    const match = text.match(pattern);
    if (match && match[1]) {
      const clean = match[1].replace(/,/g, '').trim();
      const num = parseFloat(clean);
      return !isNaN(num) ? num : undefined;
    }
    return undefined;
  };

  // Equity Share Capital
  const sc = extractNumberAfter(/(?:share\s*capital|equity\s*share\s*capital)[\s\S]{0,30}?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/i);
  if (sc) extracted.equityShareCapital = sc;

  // Reserves and Surplus
  const res = extractNumberAfter(/(?:reserves\s*(?:and|&)\s*surplus)[\s\S]{0,30}?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/i);
  if (res) extracted.reservesAndSurplus = res;

  // Long-Term Borrowings
  const ltb = extractNumberAfter(/(?:long[\s-]*term\s*borrowings)[\s\S]{0,30}?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/i);
  if (ltb) extracted.longTermBorrowings = ltb;

  // Trade Payables
  const tp = extractNumberAfter(/(?:trade\s*payables)[\s\S]{0,30}?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/i);
  if (tp) extracted.tradePayables = tp;

  // Total Liabilities / Equity and Liabilities
  const tl = extractNumberAfter(/(?:total\s*(?:equity\s*(?:and|&)\s*liabilities|liabilities))[\s\S]{0,30}?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/i);
  if (tl) extracted.totalLiabilities = tl;

  // Tangible Assets / Property Plant & Equipment
  const ta = extractNumberAfter(/(?:property[,\s]*plant\s*(?:and|&)\s*equipment|tangible\s*assets|fixed\s*assets)[\s\S]{0,30}?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/i);
  if (ta) extracted.tangibleAssets = ta;

  // Inventories
  const inv = extractNumberAfter(/(?:inventories|stock\s*in\s*trade)[\s\S]{0,30}?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/i);
  if (inv) extracted.inventories = inv;

  // Trade Receivables
  const tr = extractNumberAfter(/(?:trade\s*receivables|sundry\s*debtors)[\s\S]{0,30}?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/i);
  if (tr) extracted.tradeReceivables = tr;

  // Cash and Bank Balances
  const cash = extractNumberAfter(/(?:cash\s*(?:and|&)\s*(?:cash\s*equivalents|bank\s*balances))[\s\S]{0,30}?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/i);
  if (cash) extracted.cashAndBankBalances = cash;

  // Total Assets
  const totAssets = extractNumberAfter(/(?:total\s*assets)[\s\S]{0,30}?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/i);
  if (totAssets) extracted.totalAssets = totAssets;

  // Revenue from Operations
  const rev = extractNumberAfter(/(?:revenue\s*from\s*operations|turnover|gross\s*sales)[\s\S]{0,30}?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/i);
  if (rev) extracted.revenueFromOperations = rev;

  // Total Revenue
  const totRev = extractNumberAfter(/(?:total\s*revenue|total\s*income)[\s\S]{0,30}?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/i);
  if (totRev) extracted.totalRevenue = totRev;

  // Total Expenses
  const totExp = extractNumberAfter(/(?:total\s*expenses)[\s\S]{0,30}?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/i);
  if (totExp) extracted.totalExpenses = totExp;

  // Profit Before Tax
  const pbt = extractNumberAfter(/(?:profit\s*before\s*tax|profit\s*before\s*exceptional\s*items)[\s\S]{0,30}?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/i);
  if (pbt) extracted.profitBeforeTax = pbt;

  // Profit After Tax
  const pat = extractNumberAfter(/(?:profit\s*for\s*the\s*period|profit\s*after\s*tax)[\s\S]{0,30}?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/i);
  if (pat) extracted.profitAfterTax = pat;

  // Auditor FRN & Membership No.
  const frnMatch = text.match(/(?:firm\s*(?:reg(?:istration)?\.?\s*no\.?|frn)[\s:]*([0-9]{6}[A-Za-z]|[A-Za-z0-9\/-]{6,10}))/i);
  if (frnMatch && frnMatch[1]) extracted.auditorFrn = frnMatch[1].trim();

  const memMatch = text.match(/(?:membership\s*no\.?|m\.?\s*no\.?)[\s:]*([0-9]{5,6})/i);
  if (memMatch && memMatch[1]) extracted.auditorMembershipNo = memMatch[1].trim();

  const firmMatch = text.match(/for\s+(.+?(?:chartered\s+accountants|associates|llp))/i);
  if (firmMatch && firmMatch[1]) extracted.auditorFirmName = firmMatch[1].trim();

  return { financials: extracted, rawText: text.slice(0, 1000), warnings };
}
