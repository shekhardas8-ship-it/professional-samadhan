// src/services/tallyExportService.ts
import ExcelJS from 'exceljs';

export interface BankTransactionItem {
  id?: string;
  transactionDate: string; // DD-MM-YYYY or YYYY-MM-DD
  valueDate?: string | null;
  bankName: string;
  accountNumber: string;
  narration: string;
  referenceNumber?: string | null;
  debitAmount: string | number;
  creditAmount: string | number;
  balance?: string | number | null;
}

export interface TallyExportMeta {
  clientName: string;
  clientGstin?: string;
  bankName: string;
  accountNumber: string;
  reportingMonth: string;
  openingBalance?: number | string;
  closingBalance?: number | string;
}

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toTallyDate(dateStr: string): string {
  if (!dateStr) return '20260801';
  // Handles DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD
  const clean = dateStr.trim();
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(clean)) {
    const parts = clean.split(/[-/]/);
    return `${parts[2]}${parts[1]}${parts[0]}`; // YYYYMMDD
  }
  if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(clean)) {
    const parts = clean.split(/[-/]/);
    return `${parts[0]}${parts[1]}${parts[2]}`; // YYYYMMDD
  }
  return clean.replace(/[^0-9]/g, '');
}

/**
 * Generate Tally XML format string ready for Import into Tally Prime / Tally 9
 */
export function generateTallyXml(transactions: BankTransactionItem[], meta: TallyExportMeta): string {
  const bankLedgerName = `${meta.bankName || 'Bank Account'} - ${meta.accountNumber || 'Account'}`;
  
  let vouchersXml = '';

  transactions.forEach((tx, idx) => {
    const debit = parseFloat(String(tx.debitAmount || 0)) || 0;
    const credit = parseFloat(String(tx.creditAmount || 0)) || 0;
    const isPayment = debit > 0;
    const amount = isPayment ? debit : credit;
    if (amount <= 0) return;

    const vchType = isPayment ? 'Payment' : 'Receipt';
    const vchDate = toTallyDate(tx.transactionDate);
    const ref = tx.referenceNumber ? tx.referenceNumber.trim() : `TXN${String(idx + 1).padStart(4, '0')}`;
    const vchNum = `BNK-${ref}`;
    const narration = escapeXml(tx.narration || 'Bank Transaction');
    const safeBankLedger = escapeXml(bankLedgerName);

    // Opposite ledger heuristic: categorize UPI vs Party vs Charges
    let oppositeLedger = isPayment ? 'Suspense / Direct Expenses' : 'Suspense / Direct Income';
    const narrUpper = (tx.narration || '').toUpperCase();
    if (narrUpper.includes('BANK CHARGES') || narrUpper.includes('CHG') || narrUpper.includes('SMS CHARGE')) {
      oppositeLedger = 'Bank Charges';
    } else if (narrUpper.includes('INTEREST')) {
      oppositeLedger = isPayment ? 'Interest Expense' : 'Interest Income';
    } else if (narrUpper.includes('CASH')) {
      oppositeLedger = 'Cash Account';
    }

    const safeOppositeLedger = escapeXml(oppositeLedger);

    if (isPayment) {
      // Payment Voucher: Debit Opposite Ledger, Credit Bank Ledger
      vouchersXml += `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Payment" ACTION="Create">
            <DATE>${vchDate}</DATE>
            <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(vchNum)}</VOUCHERNUMBER>
            <REFERENCE>${escapeXml(ref)}</REFERENCE>
            <NARRATION>${narration}</NARRATION>
            <EFFECTIVEDATE>${vchDate}</EFFECTIVEDATE>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${safeOppositeLedger}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${amount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${safeBankLedger}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${amount.toFixed(2)}</AMOUNT>
              <BANKALLOCATIONS.LIST>
                <DATE>${vchDate}</DATE>
                <INSTRUMENTDATE>${vchDate}</INSTRUMENTDATE>
                <TRANSACTIONTYPE>Others</TRANSACTIONTYPE>
                <PAYMENTFAVOURING>${safeOppositeLedger}</PAYMENTFAVOURING>
                <INSTRUMENTNUMBER>${escapeXml(ref)}</INSTRUMENTNUMBER>
                <AMOUNT>${amount.toFixed(2)}</AMOUNT>
              </BANKALLOCATIONS.LIST>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>`;
    } else {
      // Receipt Voucher: Debit Bank Ledger, Credit Opposite Ledger
      vouchersXml += `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Receipt" ACTION="Create">
            <DATE>${vchDate}</DATE>
            <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(vchNum)}</VOUCHERNUMBER>
            <REFERENCE>${escapeXml(ref)}</REFERENCE>
            <NARRATION>${narration}</NARRATION>
            <EFFECTIVEDATE>${vchDate}</EFFECTIVEDATE>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${safeBankLedger}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${amount.toFixed(2)}</AMOUNT>
              <BANKALLOCATIONS.LIST>
                <DATE>${vchDate}</DATE>
                <INSTRUMENTDATE>${vchDate}</INSTRUMENTDATE>
                <TRANSACTIONTYPE>Others</TRANSACTIONTYPE>
                <INSTRUMENTNUMBER>${escapeXml(ref)}</INSTRUMENTNUMBER>
                <AMOUNT>-${amount.toFixed(2)}</AMOUNT>
              </BANKALLOCATIONS.LIST>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${safeOppositeLedger}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${amount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>`;
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <DATA>
      ${vouchersXml}
    </DATA>
  </BODY>
</ENVELOPE>`;
}

/**
 * Generate Excel workbook mapped for Tally Voucher Import
 */
export async function generateTallyExcelWorkbook(
  transactions: BankTransactionItem[],
  meta: TallyExportMeta
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'QuinceCA GST & Accounting Suite';
  wb.created = new Date();

  const ws = wb.addWorksheet('Tally Bank Vouchers', {
    properties: { tabColor: { argb: 'FF1E3A8A' } },
    views: [{ state: 'frozen', ySplit: 5 }],
  });

  // Client Title Banner
  ws.mergeCells('A1:J1');
  const titleCell = ws.getCell('A1');
  titleCell.value = `${meta.clientName} — Bank Account Transactions (Tally Accounting Import)`;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 28;

  // Metadata Subtitle
  ws.mergeCells('A2:J2');
  const subCell = ws.getCell('A2');
  subCell.value = `Bank: ${meta.bankName} | A/C No: ${meta.accountNumber} | Period: ${meta.reportingMonth} | GSTIN: ${meta.clientGstin || 'N/A'}`;
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF334155' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(2).height = 20;

  // Summary Metrics Row
  ws.mergeCells('A3:J3');
  const sumCell = ws.getCell('A3');
  const openStr = meta.openingBalance ? `Opening Bal: ₹${Number(meta.openingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} | ` : '';
  const closeStr = meta.closingBalance ? `Closing Bal: ₹${Number(meta.closingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} | ` : '';
  sumCell.value = `${openStr}${closeStr}Total Transactions: ${transactions.length} | Format: Standard Tally Voucher Template`;
  sumCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E40AF' } };
  sumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
  sumCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(3).height = 20;

  ws.getRow(4).height = 10; // Spacer

  // Header Row (Row 5)
  const headers = [
    'Date (DD-MM-YYYY)',
    'Voucher Type',
    'Voucher Number',
    'Bank Ledger Name',
    'Particulars / Narration',
    'Cheque / Ref No',
    'Withdrawal / Debit (₹)',
    'Deposit / Credit (₹)',
    'Running Balance (₹)',
    'Tally Status',
  ];

  const headerRow = ws.getRow(5);
  headerRow.height = 26;
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: i === 6 || i === 7 || i === 8 ? 'right' : 'left' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF64748B' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  const bankLedgerName = `${meta.bankName} - ${meta.accountNumber}`;

  // Add Data Rows
  transactions.forEach((tx, idx) => {
    const rowNum = idx + 6;
    const r = ws.getRow(rowNum);
    const debit = parseFloat(String(tx.debitAmount || 0)) || 0;
    const credit = parseFloat(String(tx.creditAmount || 0)) || 0;
    const balance = tx.balance !== null && tx.balance !== undefined ? parseFloat(String(tx.balance)) : null;
    const isPayment = debit > 0;
    const vchType = isPayment ? 'Payment' : 'Receipt';
    const ref = tx.referenceNumber || '-';
    const vchNum = `BNK-${ref !== '-' ? ref : String(idx + 1).padStart(4, '0')}`;

    r.getCell(1).value = tx.transactionDate;
    r.getCell(2).value = vchType;
    r.getCell(3).value = vchNum;
    r.getCell(4).value = bankLedgerName;
    r.getCell(5).value = tx.narration;
    r.getCell(6).value = ref;
    r.getCell(7).value = debit > 0 ? debit : null;
    r.getCell(8).value = credit > 0 ? credit : null;
    r.getCell(9).value = balance;
    r.getCell(10).value = 'Ready for Tally';

    // Formatting
    r.getCell(1).alignment = { horizontal: 'center' };
    r.getCell(2).alignment = { horizontal: 'center' };
    r.getCell(2).font = { bold: true, color: { argb: isPayment ? 'FFB91C1C' : 'FF047857' } };
    r.getCell(3).font = { name: 'Consolas', size: 9 };
    r.getCell(6).font = { name: 'Consolas', size: 9 };

    r.getCell(7).numFmt = '#,##0.00';
    r.getCell(7).font = { bold: debit > 0, color: { argb: debit > 0 ? 'FFB91C1C' : 'FF64748B' } };
    r.getCell(8).numFmt = '#,##0.00';
    r.getCell(8).font = { bold: credit > 0, color: { argb: credit > 0 ? 'FF047857' : 'FF64748B' } };
    r.getCell(9).numFmt = '#,##0.00';
    r.getCell(9).font = { bold: true, color: { argb: 'FF1E293B' } };

    // Zebra striping
    const isEven = idx % 2 === 0;
    const bg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';
    for (let c = 1; c <= 10; c++) {
      const cell = r.getCell(c);
      if (c !== 2) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    }
  });

  // Column Widths
  ws.columns = [
    { width: 14 }, // Date
    { width: 14 }, // Voucher Type
    { width: 22 }, // Voucher Number
    { width: 26 }, // Bank Ledger
    { width: 48 }, // Narration
    { width: 20 }, // Cheque / Ref No
    { width: 18 }, // Debit
    { width: 18 }, // Credit
    { width: 18 }, // Balance
    { width: 16 }, // Status
  ];

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
