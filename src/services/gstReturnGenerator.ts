// src/services/gstReturnGenerator.ts
import crypto from 'crypto';

export interface Gstr1InputInvoice {
  id?: string;
  docNumber?: string | null;
  docDate?: string | null; // YYYY-MM-DD or DD/MM/YYYY
  buyerName?: string | null;
  buyerGstin?: string | null;
  placeOfSupply?: string | null; // e.g. "27" or "27-Maharashtra"
  taxableAmount?: number | string | null;
  cgstAmount?: number | string | null;
  sgstAmount?: number | string | null;
  igstAmount?: number | string | null;
  cessAmount?: number | string | null;
  totalAmount?: number | string | null;
  reverseCharge?: boolean | null;
  lineItems?: Array<{
    itemDescription?: string;
    hsnSac?: string | null;
    quantity?: number | string | null;
    rate?: number | string | null;
    taxableValue: number | string;
    taxRatePercent?: number | string | null;
    cgstAmount?: number | string | null;
    sgstAmount?: number | string | null;
    igstAmount?: number | string | null;
    cessAmount?: number | string | null;
    totalAmount: number | string;
  }>;
}

export interface Gstr1GeneratorInput {
  client: {
    id: string;
    businessName: string;
    gstin: string;
    stateCode?: string;
  };
  period: {
    reportingMonth: string; // e.g. "August 2026"
    monthNumber: number; // 8
    year: number; // 2026
  };
  invoices: Gstr1InputInvoice[];
  creditDebitNotes?: Array<any>;
  grossTurnoverPrevYear?: number;
  currentTurnover?: number;
}

/**
 * Normalizes any date string into official GST standard DD-MM-YYYY format
 */
export function formatGstDate(inputDate?: string | null): string {
  if (!inputDate) {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${d}-${m}-${now.getFullYear()}`;
  }

  const clean = inputDate.trim();
  // If already DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) return clean;

  // If YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-');
    return `${d}-${m}-${y}`;
  }

  // If DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    return clean.replace(/\//g, '-');
  }

  // Try parsing Date
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    return `${d}-${m}-${parsed.getFullYear()}`;
  }

  return '01-08-2026';
}

/**
 * Derives the official MMYYYY filing period string (e.g. "082026")
 */
export function formatGstFilingPeriod(monthNumber: number, year: number): string {
  const mm = String(monthNumber).padStart(2, '0');
  return `${mm}${year}`;
}

/**
 * Extracts 2-digit state code from GSTIN or POS string
 */
export function extractStateCode(gstinOrPos?: string | null, fallback = '27'): string {
  if (!gstinOrPos) return fallback;
  const clean = gstinOrPos.trim();
  const match = clean.match(/^(\d{2})/);
  if (match) return match[1];
  return fallback;
}

/**
 * Generates official Government-compliant GSTR-1 JSON Schema (Offline Utility Specification)
 */
export function generateOfficialGstr1Json(input: Gstr1GeneratorInput): {
  payload: any;
  filename: string;
  summary: {
    totalB2bCount: number;
    totalB2csCount: number;
    totalTaxableValue: number;
    totalTaxLiability: number;
    totalHsnCount: number;
  };
} {
  const gstin = (input.client.gstin || '').trim().toUpperCase();
  const ownStateCode = extractStateCode(gstin, '27');
  const fp = formatGstFilingPeriod(input.period.monthNumber, input.period.year);

  let totalTaxableValue = 0;
  let totalTaxLiability = 0;

  // Group invoices into B2B (registered recipients) vs B2CS (unregistered / retail)
  const b2bMap = new Map<string, any[]>();
  const b2csList: any[] = [];
  const hsnMap = new Map<string, any>();
  const allDocNumbers: string[] = [];

  input.invoices.forEach((inv, index) => {
    const docNo = inv.docNumber || `INV-${String(index + 1).padStart(4, '0')}`;
    allDocNumbers.push(docNo);

    const docDate = formatGstDate(inv.docDate);
    const taxable = Math.round(Number(inv.taxableAmount || 0) * 100) / 100;
    const igst = Math.round(Number(inv.igstAmount || 0) * 100) / 100;
    const cgst = Math.round(Number(inv.cgstAmount || 0) * 100) / 100;
    const sgst = Math.round(Number(inv.sgstAmount || 0) * 100) / 100;
    const cess = Math.round(Number(inv.cessAmount || 0) * 100) / 100;
    const total = Math.round(Number(inv.totalAmount || (taxable + igst + cgst + sgst + cess)) * 100) / 100;

    totalTaxableValue += taxable;
    totalTaxLiability += igst + cgst + sgst + cess;

    const buyerGstin = (inv.buyerGstin || '').trim().toUpperCase();
    const isRegisteredBuyer = buyerGstin.length === 15 && !buyerGstin.includes('UNREG');
    const pos = extractStateCode(inv.placeOfSupply || buyerGstin, ownStateCode);

    // Rate calculation
    let calculatedRate = 18.0;
    if (taxable > 0) {
      const taxSum = igst > 0 ? igst : cgst + sgst;
      const rawRate = (taxSum / taxable) * 100;
      // Snap to standard GST rate brackets: 0, 5, 12, 18, 28
      const brackets = [0, 5, 12, 18, 28];
      calculatedRate = brackets.reduce((prev, curr) => (Math.abs(curr - rawRate) < Math.abs(prev - rawRate) ? curr : prev));
    }

    if (isRegisteredBuyer) {
      // B2B INVOICE
      const invObject = {
        inum: docNo,
        idt: docDate,
        val: total,
        pos,
        rchrg: inv.reverseCharge ? 'Y' : 'N',
        inv_typ: 'R', // Regular invoice
        itms: [
          {
            num: 1,
            itm_det: {
              rt: calculatedRate,
              txval: taxable,
              iamt: igst,
              camt: cgst,
              samt: sgst,
              csamt: cess,
            },
          },
        ],
      };

      if (!b2bMap.has(buyerGstin)) {
        b2bMap.set(buyerGstin, []);
      }
      b2bMap.get(buyerGstin)!.push(invObject);
    } else {
      // B2CS INVOICE (Aggregated by State and Rate)
      const supplyType = pos === ownStateCode ? 'INTRA' : 'INTER';
      b2csList.push({
        sply_ty: supplyType,
        pos,
        typ: 'OE', // Other E-commerce / General
        rt: calculatedRate,
        txval: taxable,
        iamt: igst,
        camt: cgst,
        samt: sgst,
        csamt: cess,
      });
    }

    // Accumulate HSN items
    if (inv.lineItems && inv.lineItems.length > 0) {
      inv.lineItems.forEach((item, lIdx) => {
        const hsnCode = (item.hsnSac || '998311').trim();
        const lTaxable = Math.round(Number(item.taxableValue || 0) * 100) / 100;
        const lRate = Number(item.taxRatePercent || calculatedRate);
        const lIgst = Math.round(Number(item.igstAmount || 0) * 100) / 100;
        const lCgst = Math.round(Number(item.cgstAmount || 0) * 100) / 100;
        const lSgst = Math.round(Number(item.sgstAmount || 0) * 100) / 100;
        const lTotal = Math.round(Number(item.totalAmount || (lTaxable + lIgst + lCgst + lSgst)) * 100) / 100;

        if (!hsnMap.has(hsnCode)) {
          hsnMap.set(hsnCode, {
            hsn_sc: hsnCode,
            desc: item.itemDescription || 'Professional & Advisory Services',
            uqc: 'OTH',
            qty: 1,
            val: 0,
            txval: 0,
            iamt: 0,
            camt: 0,
            samt: 0,
            csamt: 0,
          });
        }
        const existing = hsnMap.get(hsnCode)!;
        existing.val += lTotal;
        existing.txval += lTaxable;
        existing.iamt += lIgst;
        existing.camt += lCgst;
        existing.samt += lSgst;
      });
    } else {
      // Default fallback HSN entry for whole invoice
      const defaultHsn = '998311';
      if (!hsnMap.has(defaultHsn)) {
        hsnMap.set(defaultHsn, {
          hsn_sc: defaultHsn,
          desc: 'Accounting, Auditing and Tax Consultancy Services',
          uqc: 'OTH',
          qty: 0,
          val: 0,
          txval: 0,
          iamt: 0,
          camt: 0,
          samt: 0,
          csamt: 0,
        });
      }
      const existing = hsnMap.get(defaultHsn)!;
      existing.val += total;
      existing.txval += taxable;
      existing.iamt += igst;
      existing.camt += cgst;
      existing.samt += sgst;
      existing.qty += 1;
    }
  });

  // Build official B2B structure
  const b2bArray: any[] = [];
  b2bMap.forEach((invoices, ctin) => {
    b2bArray.push({
      ctin,
      cfs: 'N',
      inv: invoices,
    });
  });

  // Build official HSN table
  const hsnData: any[] = [];
  let hsnNum = 1;
  hsnMap.forEach(h => {
    hsnData.push({
      num: hsnNum++,
      hsn_sc: h.hsn_sc,
      desc: h.desc,
      uqc: h.uqc,
      qty: Math.max(h.qty, 1),
      val: Math.round(h.val * 100) / 100,
      txval: Math.round(h.txval * 100) / 100,
      iamt: Math.round(h.iamt * 100) / 100,
      camt: Math.round(h.camt * 100) / 100,
      samt: Math.round(h.samt * 100) / 100,
      csamt: 0.0,
    });
  });

  // Build document issued summary
  const docDet = [
    {
      doc_num: 1, // Invoices for outward supply
      docs: [
        {
          num: 1,
          from: allDocNumbers.length > 0 ? allDocNumbers[0] : 'INV-0001',
          to: allDocNumbers.length > 0 ? allDocNumbers[allDocNumbers.length - 1] : 'INV-0001',
          totnum: Math.max(allDocNumbers.length, 1),
          canc: 0,
          net_issue: Math.max(allDocNumbers.length, 1),
        },
      ],
    },
  ];

  // Official GSTR-1 Root Payload
  const payload = {
    gstin,
    fp,
    version: 'GST1.0',
    hash: crypto.createHash('sha256').update(`${gstin}_${fp}_${Date.now()}`).digest('hex').substring(0, 32),
    gt: input.grossTurnoverPrevYear || 4500000.0,
    cur_gt: input.currentTurnover || totalTaxableValue,
    b2b: b2bArray,
    b2cl: [], // B2C Large (> ₹2.5 Lakh inter-state)
    b2cs: b2csList,
    cdnr: [],
    cdnur: [],
    exp: [],
    at: [],
    atadj: [],
    hsn: {
      data: hsnData,
    },
    doc_issue: {
      doc_det: docDet,
    },
    nil: {
      inv: [
        {
          nil_amt: 0.0,
          expt_amt: 0.0,
          ngsup_amt: 0.0,
          sply_ty: 'INTRARAT',
        },
      ],
    },
  };

  const filename = `GSTR1_${gstin}_${fp}.json`;

  return {
    payload,
    filename,
    summary: {
      totalB2bCount: b2bArray.reduce((acc, curr) => acc + curr.inv.length, 0),
      totalB2csCount: b2csList.length,
      totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
      totalTaxLiability: Math.round(totalTaxLiability * 100) / 100,
      totalHsnCount: hsnData.length,
    },
  };
}

export interface Gstr3bGeneratorInput {
  client: {
    id: string;
    businessName: string;
    gstin: string;
  };
  period: {
    reportingMonth: string;
    monthNumber: number;
    year: number;
  };
  outwardSupplies: {
    taxableAmount: number;
    igstAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    cessAmount?: number;
  };
  eligibleItc: {
    allOtherItcIgst: number;
    allOtherItcCgst: number;
    allOtherItcSgst: number;
    allOtherItcCess?: number;
    importGoodsIgst?: number;
    importServicesIgst?: number;
  };
  ineligibleItc?: {
    igst?: number;
    cgst?: number;
    sgst?: number;
  };
  interestLateFee?: {
    interestIgst?: number;
    interestCgst?: number;
    interestSgst?: number;
    lateFeeCgst?: number;
    lateFeeSgst?: number;
  };
}

/**
 * Generates official Government-compliant GSTR-3B JSON Schema (Offline Utility Specification)
 */
export function generateOfficialGstr3bJson(input: Gstr3bGeneratorInput): {
  payload: any;
  filename: string;
  summary: {
    outwardTaxable: number;
    outwardTaxTotal: number;
    itcClaimedTotal: number;
    netCashPayable: number;
  };
} {
  const gstin = (input.client.gstin || '').trim().toUpperCase();
  const ret_period = formatGstFilingPeriod(input.period.monthNumber, input.period.year);

  const outTax = input.outwardSupplies;
  const itc = input.eligibleItc;

  const totalOutwardTax = outTax.igstAmount + outTax.cgstAmount + outTax.sgstAmount + (outTax.cessAmount || 0);
  const totalItc = itc.allOtherItcIgst + itc.allOtherItcCgst + itc.allOtherItcSgst + (itc.allOtherItcCess || 0);
  const netCashPayable = Math.max(0, totalOutwardTax - totalItc);

  const payload = {
    gstin,
    ret_period,
    filing_typ: 'M',
    sup_details: {
      osup_det: {
        txval: Math.round(outTax.taxableAmount * 100) / 100,
        iamt: Math.round(outTax.igstAmount * 100) / 100,
        camt: Math.round(outTax.cgstAmount * 100) / 100,
        samt: Math.round(outTax.sgstAmount * 100) / 100,
        csamt: Math.round((outTax.cessAmount || 0) * 100) / 100,
      },
      osup_zero: {
        txval: 0.0,
        iamt: 0.0,
        csamt: 0.0,
      },
      osup_nil_exmp: {
        txval: 0.0,
      },
      isup_rev: {
        txval: 0.0,
        iamt: 0.0,
        camt: 0.0,
        samt: 0.0,
        csamt: 0.0,
      },
      osup_nongst: {
        txval: 0.0,
      },
    },
    inter_sup: {
      unreg_details: [],
      comp_details: [],
      uin_details: [],
    },
    itc_elg: {
      itc_avl: [
        {
          ty: 'IMPG', // Import of Goods
          iamt: Math.round((itc.importGoodsIgst || 0) * 100) / 100,
          camt: 0.0,
          samt: 0.0,
          csamt: 0.0,
        },
        {
          ty: 'IMPS', // Import of Services
          iamt: Math.round((itc.importServicesIgst || 0) * 100) / 100,
          camt: 0.0,
          samt: 0.0,
          csamt: 0.0,
        },
        {
          ty: 'ISRC', // Inward supplies reverse charge
          iamt: 0.0,
          camt: 0.0,
          samt: 0.0,
          csamt: 0.0,
        },
        {
          ty: 'ISD', // Inward supplies ISD
          iamt: 0.0,
          camt: 0.0,
          samt: 0.0,
          csamt: 0.0,
        },
        {
          ty: 'OTH', // All other ITC from inward bills
          iamt: Math.round(itc.allOtherItcIgst * 100) / 100,
          camt: Math.round(itc.allOtherItcCgst * 100) / 100,
          samt: Math.round(itc.allOtherItcSgst * 100) / 100,
          csamt: Math.round((itc.allOtherItcCess || 0) * 100) / 100,
        },
      ],
      itc_rev: [
        {
          ty: 'RUL',
          iamt: 0.0,
          camt: 0.0,
          samt: 0.0,
          csamt: 0.0,
        },
        {
          ty: 'OTH',
          iamt: 0.0,
          camt: 0.0,
          samt: 0.0,
          csamt: 0.0,
        },
      ],
      itc_net: {
        iamt: Math.round(itc.allOtherItcIgst * 100) / 100,
        camt: Math.round(itc.allOtherItcCgst * 100) / 100,
        samt: Math.round(itc.allOtherItcSgst * 100) / 100,
        csamt: Math.round((itc.allOtherItcCess || 0) * 100) / 100,
      },
      itc_inelg: [
        {
          ty: 'RUL',
          iamt: Math.round((input.ineligibleItc?.igst || 0) * 100) / 100,
          camt: Math.round((input.ineligibleItc?.cgst || 0) * 100) / 100,
          samt: Math.round((input.ineligibleItc?.sgst || 0) * 100) / 100,
          csamt: 0.0,
        },
        {
          ty: 'OTH',
          iamt: 0.0,
          camt: 0.0,
          samt: 0.0,
          csamt: 0.0,
        },
      ],
    },
    inward_sup: {
      isup_details: [
        {
          ty: 'GST',
          inter: 0.0,
          intra: 0.0,
        },
        {
          ty: 'NONGST',
          inter: 0.0,
          intra: 0.0,
        },
      ],
    },
    interest_latefee: {
      intr_details: {
        iamt: Math.round((input.interestLateFee?.interestIgst || 0) * 100) / 100,
        camt: Math.round((input.interestLateFee?.interestCgst || 0) * 100) / 100,
        samt: Math.round((input.interestLateFee?.interestSgst || 0) * 100) / 100,
        csamt: 0.0,
      },
      latefee_details: {
        camt: Math.round((input.interestLateFee?.lateFeeCgst || 0) * 100) / 100,
        samt: Math.round((input.interestLateFee?.lateFeeSgst || 0) * 100) / 100,
      },
    },
  };

  const filename = `GSTR3B_${gstin}_${ret_period}.json`;

  return {
    payload,
    filename,
    summary: {
      outwardTaxable: Math.round(outTax.taxableAmount * 100) / 100,
      outwardTaxTotal: Math.round(totalOutwardTax * 100) / 100,
      itcClaimedTotal: Math.round(totalItc * 100) / 100,
      netCashPayable: Math.round(netCashPayable * 100) / 100,
    },
  };
}
