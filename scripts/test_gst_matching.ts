// scripts/test_gst_matching.ts
import { extractDocumentContent } from '../src/services/extractor.ts';

async function run() {
  const clientGstin = '07DWAPK0131H1Z1';

  // 1. Sales invoice where seller GSTIN is different (06ABCDE1234F1Z5)
  const salesDiff = `
    TAX INVOICE
    Sold by: Other Vendor Private Limited
    Seller GSTIN: 06ABCDE1234F1Z5
    Bill To: Shekhar
    Invoice No: INV-2026-001
    Total Amount: 15000
  `;
  const res1 = await extractDocumentContent(Buffer.from(salesDiff), 'sales_bill.txt', clientGstin, 'text/plain', '', 'tradewithshek', 'sales_invoices');
  console.log('1. Sales Slip Mismatched GSTIN:');
  console.log('   Extracted Supplier GSTIN:', res1[0].supplierGstin);
  console.log('   Client Registered GSTIN:', clientGstin);
  console.log('   Is Mismatch Detected?:', res1[0].supplierGstin !== clientGstin);

  // 2. Sales invoice matching client GSTIN
  const salesMatch = `
    TAX INVOICE
    Sold by: tradewithshek
    Seller GSTIN: 07DWAPK0131H1Z1
    Bill To: Consumer
    Invoice No: INV-2026-002
    Total Amount: 8000
  `;
  const res2 = await extractDocumentContent(Buffer.from(salesMatch), 'sales_valid.txt', clientGstin, 'text/plain', '', 'tradewithshek', 'sales_invoices');
  console.log('\n2. Sales Slip Matching GSTIN:');
  console.log('   Extracted Supplier GSTIN:', res2[0].supplierGstin);
  console.log('   Matches Registered GSTIN?:', res2[0].supplierGstin === clientGstin);

  // 3. Purchase bill with mismatched Buyer GSTIN (08XYZAB1234C1Z9)
  const purchDiff = `
    TAX INVOICE
    Sold by: Tech Supplies Ltd
    GSTIN: 09AABCD1234E1Z1
    Billed To: Another Firm LLP
    Buyer GSTIN: 08XYZAB1234C1Z9
    Invoice No: PUR-999
    Total Amount: 45000
  `;
  const res3 = await extractDocumentContent(Buffer.from(purchDiff), 'purchase_wrong.txt', clientGstin, 'text/plain', '', 'tradewithshek', 'purchase_invoices');
  console.log('\n3. Purchase Bill Mismatched Buyer GSTIN:');
  console.log('   Extracted Buyer GSTIN:', res3[0].buyerGstin);
  console.log('   Client Registered GSTIN:', clientGstin);
  console.log('   Is Mismatch Detected?:', res3[0].buyerGstin !== clientGstin);

  // 4. Challan with mismatched GSTIN
  const challanDiff = `
    GST PMT-06 PAYMENT CHALLAN
    CPIN: 26100012345678
    Taxpayer GSTIN: 29AABCS1429B1ZB
    Challan Date: 04/10/2026
    Total Amount: 12500
  `;
  const res4 = await extractDocumentContent(Buffer.from(challanDiff), 'challan_wrong.txt', clientGstin, 'text/plain', '', 'tradewithshek');
  const allGstins = res4[0].additionalFields?.allGstins || [];
  console.log('\n4. Challan Slip Mismatched GSTIN:');
  console.log('   Challan GSTINs:', allGstins);
  console.log('   Client Registered GSTIN:', clientGstin);
  console.log('   Does it match Client GSTIN?:', allGstins.includes(clientGstin));
}

run();
