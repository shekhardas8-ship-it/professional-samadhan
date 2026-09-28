#!/usr/bin/env python3
"""
scripts/export_html.py
Standalone Python script to generate high-grade, printable, offline-capable
HTML GST Working Papers & Audit Packs for Professional Samadhan CA Firm.

Usage:
    python3 scripts/export_html.py --request-id req_apex_aug2026_01 --output /path/to/output.html
"""

import sys
import os
import json
import argparse
from datetime import datetime

def format_currency(val):
    try:
        f = float(val or 0)
        return f"₹{f:,.2f}"
    except (ValueError, TypeError):
        return "₹0.00"

def generate_html_report(data):
    client = data.get("client", {})
    request = data.get("request", {})
    files = data.get("files", [])
    sales_invoices = data.get("salesInvoices", [])
    sales_lines = data.get("salesLineItems", [])
    purchase_invoices = data.get("purchaseInvoices", [])
    purchase_lines = data.get("purchaseLineItems", [])
    bank_txns = data.get("bankTransactions", [])
    exceptions = data.get("exceptions", [])
    generated_by = data.get("generatedBy", "Professional Samadhan GST Desk")

    total_sales_taxable = sum(float(i.get("taxableAmount", 0) or 0) for i in sales_invoices)
    total_sales_gross = sum(float(i.get("totalAmount", 0) or 0) for i in sales_invoices)
    total_sales_tax = sum(
        (float(i.get("cgstAmount", 0) or 0) + float(i.get("sgstAmount", 0) or 0) + float(i.get("igstAmount", 0) or 0))
        for i in sales_invoices
    )

    total_purchase_taxable = sum(float(i.get("taxableAmount", 0) or 0) for i in purchase_invoices)
    total_purchase_gross = sum(float(i.get("totalAmount", 0) or 0) for i in purchase_invoices)
    total_purchase_tax = sum(
        (float(i.get("cgstAmount", 0) or 0) + float(i.get("sgstAmount", 0) or 0) + float(i.get("igstAmount", 0) or 0))
        for i in purchase_invoices
    )

    net_tax_liability = total_sales_tax - total_purchase_tax

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GST Working Paper - {client.get('businessName', 'Client')} - Professional Samadhan</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 24px;
      font-size: 13px;
    }}
    .container {{
      max-width: 1200px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }}
    .header {{
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
    }}
    .header h1 {{ margin: 0 0 4px 0; color: #1e3a8a; font-size: 20px; }}
    .kpi-row {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }}
    .kpi {{
      background: #f1f5f9;
      padding: 16px;
      border-radius: 6px;
      border-left: 4px solid #2563eb;
    }}
    .kpi-val {{ font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px; }}
    table {{ width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }}
    th {{ background: #f1f5f9; text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; }}
    td {{ padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }}
    .num {{ text-align: right; }}
    @media print {{
      body {{ background: #fff; padding: 0; }}
      .container {{ border: none; box-shadow: none; }}
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Professional Samadhan — Chartered Accountants</h1>
        <div>GST Working Paper &amp; Statutory Audit Pack (Period: {request.get('reportingMonth', 'N/A')})</div>
      </div>
      <div style="text-align: right;">
        <strong>{client.get('businessName', '')}</strong><br>
        GSTIN: {client.get('gstin', '')}<br>
        Version: v{request.get('version', 1)}
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi">
        <div>Total Sales Taxable</div>
        <div class="kpi-val">{format_currency(total_sales_taxable)}</div>
        <div style="font-size: 11px; color: #64748b;">Output Tax: {format_currency(total_sales_tax)}</div>
      </div>
      <div class="kpi" style="border-left-color: #059669;">
        <div>Total Purchase Taxable</div>
        <div class="kpi-val">{format_currency(total_purchase_taxable)}</div>
        <div style="font-size: 11px; color: #64748b;">Input ITC: {format_currency(total_purchase_tax)}</div>
      </div>
      <div class="kpi" style="border-left-color: #7c3aed;">
        <div>Net GST Liability</div>
        <div class="kpi-val">{format_currency(abs(net_tax_liability))}</div>
        <div style="font-size: 11px; color: #64748b;">{'Payable' if net_tax_liability >= 0 else 'ITC Credit Carryforward'}</div>
      </div>
    </div>

    <h3>Sales Register (GSTR-1 Outward Supplies)</h3>
    <table>
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Date</th>
          <th>Buyer Name</th>
          <th>Buyer GSTIN</th>
          <th class="num">Taxable Value</th>
          <th class="num">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        {"".join([f"<tr><td>{i.get('docNumber', '-')}</td><td>{i.get('docDate', '-')}</td><td>{i.get('buyerName', '-')}</td><td>{i.get('buyerGstin', '-')}</td><td class='num'>{format_currency(i.get('taxableAmount', 0))}</td><td class='num'>{format_currency(i.get('totalAmount', 0))}</td></tr>" for i in sales_invoices]) or "<tr><td colspan='6'>No sales invoices found</td></tr>"}
      </tbody>
    </table>

    <h3>Purchase Register (Inward Supplies / Eligible ITC)</h3>
    <table>
      <thead>
        <tr>
          <th>Bill #</th>
          <th>Date</th>
          <th>Supplier Name</th>
          <th>Supplier GSTIN</th>
          <th class="num">Taxable Value</th>
          <th class="num">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        {"".join([f"<tr><td>{i.get('docNumber', '-')}</td><td>{i.get('docDate', '-')}</td><td>{i.get('supplierName', '-')}</td><td>{i.get('supplierGstin', '-')}</td><td class='num'>{format_currency(i.get('taxableAmount', 0))}</td><td class='num'>{format_currency(i.get('totalAmount', 0))}</td></tr>" for i in purchase_invoices]) or "<tr><td colspan='6'>No purchase bills found</td></tr>"}
      </tbody>
    </table>

    <div style="margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between;">
      <span>Prepared by: {generated_by}</span>
      <span>Professional Samadhan • Statutory Working Paper Generated: {datetime.now().strftime('%d-%b-%Y %H:%M')}</span>
    </div>
  </div>
</body>
</html>"""
    return html

def main():
    parser = argparse.ArgumentParser(description="Export GST Working Paper as HTML")
    parser.add_argument("--json-input", help="Path to input JSON data file")
    parser.add_argument("--output", help="Output HTML file path", default="gst_working_paper.html")
    args = parser.parse_args()

    if args.json_input and os.path.exists(args.json_input):
        with open(args.json_input, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        # Default sample data
        data = {
            "client": {"businessName": "Apex Engineering Works", "gstin": "27AAACA1234A1Z5"},
            "request": {"reportingMonth": "August 2026", "version": 1},
            "salesInvoices": [
                {"docNumber": "AEW/2026-27/089", "docDate": "2026-08-14", "buyerName": "Mahindra & Mahindra Ltd", "buyerGstin": "27AAACM1234L1Z1", "taxableAmount": 125000, "totalAmount": 147500}
            ],
            "purchaseInvoices": [
                {"docNumber": "RIL/INV/78210", "docDate": "2026-08-04", "supplierName": "Reliance Industries Limited", "supplierGstin": "27AAACR1234R1Z2", "taxableAmount": 42000, "totalAmount": 49560}
            ],
            "generatedBy": "CA Rajesh Sharma (FCA)",
        }

    html = generate_html_report(data)
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"HTML report successfully exported to {args.output}")

if __name__ == "__main__":
    main()
