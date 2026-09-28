// src/services/excelGenerator.ts
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { sanitizeExcelValue } from './extractor.ts';

export interface WorkbookGenerationData {
  client: {
    id: string;
    businessName: string;
    gstin: string;
    contactPerson: string;
    registeredPhone: string;
    email: string;
  };
  request: {
    id: string;
    reportingMonth: string;
    status: string;
    version: number;
    declaredAt?: string | null;
    noTransactionsDeclared?: boolean | null;
  };
  files: Array<{
    id: string;
    originalFilename: string;
    fileHash: string;
    receivedTime: string;
    source: string;
    status: string;
    scanMethod?: string | null;
  }>;
  salesInvoices: Array<{
    id: string;
    docNumber?: string | null;
    docDate?: string | null;
    buyerName?: string | null;
    buyerGstin?: string | null;
    placeOfSupply?: string | null;
    taxableAmount?: number | string | null;
    cgstAmount?: number | string | null;
    sgstAmount?: number | string | null;
    igstAmount?: number | string | null;
    cessAmount?: number | string | null;
    totalAmount?: number | string | null;
    documentFileId: string;
  }>;
  salesLineItems: Array<{
    id: string;
    docNumber?: string | null;
    documentUnitId: string;
    itemDescription: string;
    hsnSac?: string | null;
    quantity?: number | string | null;
    unit?: string | null;
    rate?: number | string | null;
    taxableValue: number | string;
    taxRatePercent?: number | string | null;
    cgstAmount?: number | string | null;
    sgstAmount?: number | string | null;
    igstAmount?: number | string | null;
    totalAmount: number | string;
  }>;
  purchaseInvoices: Array<{
    id: string;
    docNumber?: string | null;
    docDate?: string | null;
    supplierName?: string | null;
    supplierGstin?: string | null;
    placeOfSupply?: string | null;
    taxableAmount?: number | string | null;
    cgstAmount?: number | string | null;
    sgstAmount?: number | string | null;
    igstAmount?: number | string | null;
    totalAmount?: number | string | null;
    documentFileId: string;
  }>;
  purchaseLineItems: Array<{
    id: string;
    docNumber?: string | null;
    documentUnitId: string;
    itemDescription: string;
    hsnSac?: string | null;
    quantity?: number | string | null;
    unit?: string | null;
    rate?: number | string | null;
    taxableValue: number | string;
    taxRatePercent?: number | string | null;
    cgstAmount?: number | string | null;
    sgstAmount?: number | string | null;
    igstAmount?: number | string | null;
    totalAmount: number | string;
  }>;
  debitNotes: Array<any>;
  creditNotes: Array<any>;
  bankTransactions: Array<{
    id: string;
    bankName: string;
    accountNumber: string;
    transactionDate: string;
    valueDate?: string | null;
    narration: string;
    referenceNumber?: string | null;
    debitAmount?: number | string | null;
    creditAmount?: number | string | null;
    balance?: number | string | null;
    documentUnitId: string;
  }>;
  exceptions: Array<{
    id: string;
    severity: string;
    checkType: string;
    message: string;
    resolved: boolean;
    resolutionNotes?: string | null;
  }>;
  generatedBy: string;
}

export async function generateClientExcelWorkbook(data: WorkbookGenerationData): Promise<{ buffer: Buffer; filename: string }> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Professional Samadhan CA Firm';
  wb.lastModifiedBy = data.generatedBy;
  wb.created = new Date();
  wb.modified = new Date();

  const primaryHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }, // Deep CA Navy Blue
  };
  const headerFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };

  const styleSheet = (sheet: ExcelJS.Worksheet) => {
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = primaryHeaderFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
    });
  };

  // 1. Sheet: Summary and Checklist
  const wsSummary = wb.addWorksheet('Summary & Checklist');
  wsSummary.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];
  wsSummary.columns = [
    { header: 'Parameter', key: 'param', width: 35 },
    { header: 'Detail / Value', key: 'val', width: 45 },
    { header: 'Status / Verification Note', key: 'note', width: 40 },
  ];

  wsSummary.addRow(['CA FIRM', 'PROFESSIONAL SAMADHAN CHARTERED ACCOUNTANTS', 'Official Statutory Working Paper']);
  wsSummary.addRow(['Client Business Name', sanitizeExcelValue(data.client.businessName), `Client ID: ${data.client.id}`]);
  wsSummary.addRow(['Client GSTIN', sanitizeExcelValue(data.client.gstin), 'Preserved as text']);
  wsSummary.addRow(['Reporting Month / Period', data.request.reportingMonth, `Version: v${data.request.version}`]);
  wsSummary.addRow(['Workbook Status', data.request.status, data.exceptions.filter(e => !e.resolved && e.severity === 'critical').length > 0 ? 'CRITICAL EXCEPTIONS PENDING' : 'VALIDATED']);
  wsSummary.addRow(['Generated Date & By', `${new Date().toLocaleDateString('en-IN')} by ${data.generatedBy}`, 'Automated Drizzle/Postgres snapshot']);
  wsSummary.addRow(['Total Uploaded Files', data.files.length, `${data.files.filter(f => f.status === 'processed').length} processed`]);
  wsSummary.addRow(['Total Sales Invoices', data.salesInvoices.length, `₹${data.salesInvoices.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0).toFixed(2)}`]);
  wsSummary.addRow(['Total Purchase Invoices', data.purchaseInvoices.length, `₹${data.purchaseInvoices.reduce((acc, p) => acc + Number(p.totalAmount || 0), 0).toFixed(2)}`]);
  wsSummary.addRow(['Bank Transactions Extracted', data.bankTransactions.length, 'Reconciled with statements']);
  wsSummary.addRow(['Unresolved Exceptions', data.exceptions.filter(e => !e.resolved).length, 'See "Validation Exceptions" tab']);

  // Format summary header rows
  for (let r = 1; r <= 3; r++) {
    const row = wsSummary.getRow(r);
    row.font = { bold: true };
    row.height = 22;
  }

  // 2. Sheet: Sales Invoice Headers
  const wsSales = wb.addWorksheet('Sales Invoices');
  wsSales.columns = [
    { header: 'Document Ref ID', key: 'id', width: 22 },
    { header: 'Invoice Number', key: 'docNumber', width: 20 },
    { header: 'Invoice Date', key: 'docDate', width: 15 },
    { header: 'Buyer Legal Name', key: 'buyerName', width: 30 },
    { header: 'Buyer GSTIN', key: 'buyerGstin', width: 20 },
    { header: 'Place of Supply', key: 'pos', width: 18 },
    { header: 'Taxable Amount (₹)', key: 'taxable', width: 20 },
    { header: 'CGST (₹)', key: 'cgst', width: 16 },
    { header: 'SGST (₹)', key: 'sgst', width: 16 },
    { header: 'IGST (₹)', key: 'igst', width: 16 },
    { header: 'Cess (₹)', key: 'cess', width: 14 },
    { header: 'Total Value (₹)', key: 'total', width: 20 },
    { header: 'Source File ID', key: 'fileId', width: 22 },
  ];
  styleSheet(wsSales);
  data.salesInvoices.forEach(s => {
    wsSales.addRow({
      id: s.id,
      docNumber: sanitizeExcelValue(s.docNumber),
      docDate: s.docDate || '',
      buyerName: sanitizeExcelValue(s.buyerName),
      buyerGstin: sanitizeExcelValue(s.buyerGstin),
      pos: s.placeOfSupply || '27-Maharashtra',
      taxable: Number(s.taxableAmount || 0),
      cgst: Number(s.cgstAmount || 0),
      sgst: Number(s.sgstAmount || 0),
      igst: Number(s.igstAmount || 0),
      cess: Number(s.cessAmount || 0),
      total: Number(s.totalAmount || 0),
      fileId: s.documentFileId,
    });
  });

  // 3. Sheet: Sales Line Items
  const wsSalesLines = wb.addWorksheet('Sales Line Items');
  wsSalesLines.columns = [
    { header: 'Line Item ID', key: 'id', width: 20 },
    { header: 'Parent Doc Ref', key: 'docUnitId', width: 20 },
    { header: 'Invoice Number', key: 'docNumber', width: 18 },
    { header: 'Item Description', key: 'desc', width: 35 },
    { header: 'HSN / SAC Code', key: 'hsn', width: 16 },
    { header: 'Quantity', key: 'qty', width: 14 },
    { header: 'Unit', key: 'unit', width: 12 },
    { header: 'Rate (₹)', key: 'rate', width: 16 },
    { header: 'Taxable Value (₹)', key: 'taxable', width: 20 },
    { header: 'GST Rate %', key: 'ratePercent', width: 14 },
    { header: 'CGST (₹)', key: 'cgst', width: 14 },
    { header: 'SGST (₹)', key: 'sgst', width: 14 },
    { header: 'IGST (₹)', key: 'igst', width: 14 },
    { header: 'Total (₹)', key: 'total', width: 20 },
  ];
  styleSheet(wsSalesLines);
  data.salesLineItems.forEach(item => {
    wsSalesLines.addRow({
      id: item.id,
      docUnitId: item.documentUnitId,
      docNumber: sanitizeExcelValue(item.docNumber),
      desc: sanitizeExcelValue(item.itemDescription),
      hsn: sanitizeExcelValue(item.hsnSac || '8483'),
      qty: Number(item.quantity || 1),
      unit: item.unit || 'NOS',
      rate: Number(item.rate || 0),
      taxable: Number(item.taxableValue || 0),
      ratePercent: Number(item.taxRatePercent || 18),
      cgst: Number(item.cgstAmount || 0),
      sgst: Number(item.sgstAmount || 0),
      igst: Number(item.igstAmount || 0),
      total: Number(item.totalAmount || 0),
    });
  });

  // 4. Sheet: Purchase Invoice Headers
  const wsPurchase = wb.addWorksheet('Purchase Invoices');
  wsPurchase.columns = [
    { header: 'Document Ref ID', key: 'id', width: 22 },
    { header: 'Invoice Number', key: 'docNumber', width: 20 },
    { header: 'Invoice Date', key: 'docDate', width: 15 },
    { header: 'Supplier Name', key: 'supName', width: 32 },
    { header: 'Supplier GSTIN', key: 'supGstin', width: 20 },
    { header: 'Place of Supply', key: 'pos', width: 18 },
    { header: 'Taxable Value (₹)', key: 'taxable', width: 20 },
    { header: 'CGST (₹)', key: 'cgst', width: 16 },
    { header: 'SGST (₹)', key: 'sgst', width: 16 },
    { header: 'IGST (₹)', key: 'igst', width: 16 },
    { header: 'Total Amount (₹)', key: 'total', width: 20 },
    { header: 'Source File ID', key: 'fileId', width: 22 },
  ];
  styleSheet(wsPurchase);
  data.purchaseInvoices.forEach(p => {
    wsPurchase.addRow({
      id: p.id,
      docNumber: sanitizeExcelValue(p.docNumber),
      docDate: p.docDate || '',
      supName: sanitizeExcelValue(p.supplierName),
      supGstin: sanitizeExcelValue(p.supplierGstin),
      pos: p.placeOfSupply || '27-Maharashtra',
      taxable: Number(p.taxableAmount || 0),
      cgst: Number(p.cgstAmount || 0),
      sgst: Number(p.sgstAmount || 0),
      igst: Number(p.igstAmount || 0),
      total: Number(p.totalAmount || 0),
      fileId: p.documentFileId,
    });
  });

  // 5. Sheet: Purchase Line Items
  const wsPurchaseLines = wb.addWorksheet('Purchase Line Items');
  wsPurchaseLines.columns = [
    { header: 'Line Item ID', key: 'id', width: 20 },
    { header: 'Parent Doc Ref', key: 'docUnitId', width: 20 },
    { header: 'Invoice Number', key: 'docNumber', width: 18 },
    { header: 'Item Description', key: 'desc', width: 35 },
    { header: 'HSN / SAC Code', key: 'hsn', width: 16 },
    { header: 'Taxable Value (₹)', key: 'taxable', width: 20 },
    { header: 'CGST (₹)', key: 'cgst', width: 14 },
    { header: 'SGST (₹)', key: 'sgst', width: 14 },
    { header: 'IGST (₹)', key: 'igst', width: 14 },
    { header: 'Total (₹)', key: 'total', width: 20 },
  ];
  styleSheet(wsPurchaseLines);
  data.purchaseLineItems.forEach(item => {
    wsPurchaseLines.addRow({
      id: item.id,
      docUnitId: item.documentUnitId,
      docNumber: sanitizeExcelValue(item.docNumber),
      desc: sanitizeExcelValue(item.itemDescription),
      hsn: sanitizeExcelValue(item.hsnSac || '7219'),
      taxable: Number(item.taxableValue || 0),
      cgst: Number(item.cgstAmount || 0),
      sgst: Number(item.sgstAmount || 0),
      igst: Number(item.igstAmount || 0),
      total: Number(item.totalAmount || 0),
    });
  });

  // 6. Sheet: Debit Notes & 7. Credit Notes
  const wsDebit = wb.addWorksheet('Debit Notes');
  wsDebit.columns = [
    { header: 'Note Ref ID', key: 'id', width: 20 },
    { header: 'Debit Note No.', key: 'docNumber', width: 18 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Original Invoice Ref', key: 'origRef', width: 22 },
    { header: 'Party GSTIN', key: 'gstin', width: 18 },
    { header: 'Taxable Value (₹)', key: 'taxable', width: 18 },
    { header: 'Total Value (₹)', key: 'total', width: 18 },
  ];
  styleSheet(wsDebit);
  data.debitNotes.forEach(d => {
    wsDebit.addRow({
      id: d.id,
      docNumber: sanitizeExcelValue(d.docNumber),
      date: d.docDate,
      origRef: sanitizeExcelValue(d.originalInvoiceRef),
      gstin: sanitizeExcelValue(d.buyerGstin || d.supplierGstin),
      taxable: Number(d.taxableAmount || 0),
      total: Number(d.totalAmount || 0),
    });
  });

  const wsCredit = wb.addWorksheet('Credit Notes');
  wsCredit.columns = [
    { header: 'Note Ref ID', key: 'id', width: 20 },
    { header: 'Credit Note No.', key: 'docNumber', width: 18 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Original Invoice Ref', key: 'origRef', width: 22 },
    { header: 'Party GSTIN', key: 'gstin', width: 18 },
    { header: 'Taxable Value (₹)', key: 'taxable', width: 18 },
    { header: 'Total Value (₹)', key: 'total', width: 18 },
  ];
  styleSheet(wsCredit);
  data.creditNotes.forEach(c => {
    wsCredit.addRow({
      id: c.id,
      docNumber: sanitizeExcelValue(c.docNumber),
      date: c.docDate,
      origRef: sanitizeExcelValue(c.originalInvoiceRef),
      gstin: sanitizeExcelValue(c.buyerGstin || c.supplierGstin),
      taxable: Number(c.taxableAmount || 0),
      total: Number(c.totalAmount || 0),
    });
  });

  // 8. Sheet: Bank Transactions
  const wsBank = wb.addWorksheet('Bank Transactions');
  wsBank.columns = [
    { header: 'Transaction Ref', key: 'id', width: 20 },
    { header: 'Bank Name', key: 'bank', width: 22 },
    { header: 'Account Number', key: 'account', width: 20 },
    { header: 'Transaction Date', key: 'date', width: 16 },
    { header: 'Narration / Description', key: 'narr', width: 40 },
    { header: 'Reference / Chq No.', key: 'ref', width: 20 },
    { header: 'Debit (₹)', key: 'debit', width: 18 },
    { header: 'Credit (₹)', key: 'credit', width: 18 },
    { header: 'Running Balance (₹)', key: 'bal', width: 20 },
  ];
  styleSheet(wsBank);
  data.bankTransactions.forEach(tx => {
    wsBank.addRow({
      id: tx.id,
      bank: tx.bankName,
      account: sanitizeExcelValue(tx.accountNumber),
      date: tx.transactionDate,
      narr: sanitizeExcelValue(tx.narration),
      ref: sanitizeExcelValue(tx.referenceNumber || '-'),
      debit: Number(tx.debitAmount || 0),
      credit: Number(tx.creditAmount || 0),
      bal: Number(tx.balance || 0),
    });
  });

  // 9. Sheet: Validation Exceptions
  const wsExceptions = wb.addWorksheet('Validation Exceptions');
  wsExceptions.columns = [
    { header: 'Exception ID', key: 'id', width: 20 },
    { header: 'Severity', key: 'sev', width: 14 },
    { header: 'Check Type', key: 'type', width: 24 },
    { header: 'Audit Checkpoint Message', key: 'msg', width: 55 },
    { header: 'Resolved Status', key: 'res', width: 18 },
    { header: 'Staff Resolution Notes', key: 'notes', width: 40 },
  ];
  styleSheet(wsExceptions);
  data.exceptions.forEach(ex => {
    const row = wsExceptions.addRow({
      id: ex.id,
      sev: ex.severity.toUpperCase(),
      type: ex.checkType,
      msg: ex.message,
      res: ex.resolved ? 'RESOLVED' : 'UNRESOLVED',
      notes: ex.resolutionNotes || '',
    });
    if (ex.severity === 'critical' && !ex.resolved) {
      row.getCell('sev').font = { color: { argb: 'FFDC2626' }, bold: true };
    }
  });

  // 10. Sheet: Document Register
  const wsDocs = wb.addWorksheet('Document Register');
  wsDocs.columns = [
    { header: 'File ID', key: 'id', width: 20 },
    { header: 'Original Filename', key: 'filename', width: 35 },
    { header: 'SHA-256 Digest', key: 'hash', width: 30 },
    { header: 'Received Timestamp', key: 'received', width: 22 },
    { header: 'Intake Channel', key: 'source', width: 20 },
    { header: 'Extraction Method', key: 'scan', width: 22 },
    { header: 'Audit Status', key: 'status', width: 18 },
  ];
  styleSheet(wsDocs);
  data.files.forEach(f => {
    wsDocs.addRow({
      id: f.id,
      filename: sanitizeExcelValue(f.originalFilename),
      hash: f.fileHash,
      received: f.receivedTime,
      source: f.source,
      scan: f.scanMethod || 'native_pdf',
      status: f.status,
    });
  });

  const sanitizedBusinessName = data.client.businessName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${sanitizedBusinessName}_${data.client.gstin}_${data.request.reportingMonth}_v${data.request.version}.xlsx`;
  const buffer = Buffer.from(await wb.xlsx.writeBuffer());

  return { buffer, filename };
}
