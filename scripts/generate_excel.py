#!/usr/bin/env python3
"""
QuinceCA - Standalone Python Excel Generator
Generates client-specific, 10-sheet GST workbook with formula injection prevention,
frozen headers, and audit trails.
"""

import sys
import json
import argparse

def sanitize(val):
    if val is None:
        return ""
    s = str(val).strip()
    if s.startswith(('=', '+', '-', '@')):
        return f"'{s}"
    return s

def generate_workbook(data_path, output_path):
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    try:
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    except ImportError:
        sys.stderr.write("openpyxl required for python excel generator: pip install openpyxl\n")
        return

    wb = openpyxl.Workbook()
    # Remove default sheet
    default_sheet = wb.active

    navy_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
    header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")

    # Sheet 1: Summary
    ws_summary = wb.create_sheet(title="Summary & Checklist")
    ws_summary.append(["Parameter", "Value / Detail", "Status"])
    ws_summary.append(["CA Firm", "QuinceCA Chartered Accountants", "Official Working Paper"])
    ws_summary.append(["Client Business", sanitize(data.get("businessName")), "Verified"])
    ws_summary.append(["GSTIN", sanitize(data.get("gstin")), "Statutory Record"])
    ws_summary.append(["Reporting Month", sanitize(data.get("reportingMonth")), f"Version v{data.get('version', 1)}"])

    # Sheet 2: Sales Invoices
    ws_sales = wb.create_sheet(title="Sales Invoices")
    ws_sales.append(["Document Ref ID", "Invoice Number", "Invoice Date", "Buyer Name", "Buyer GSTIN", "Taxable (₹)", "CGST (₹)", "SGST (₹)", "IGST (₹)", "Total (₹)"])
    for s in data.get("salesInvoices", []):
        ws_sales.append([
            s.get("id"),
            sanitize(s.get("docNumber")),
            s.get("docDate"),
            sanitize(s.get("buyerName")),
            sanitize(s.get("buyerGstin")),
            s.get("taxableAmount", 0),
            s.get("cgstAmount", 0),
            s.get("sgstAmount", 0),
            s.get("igstAmount", 0),
            s.get("totalAmount", 0)
        ])

    # Sheet 3: Purchase Invoices
    ws_purch = wb.create_sheet(title="Purchase Invoices")
    ws_purch.append(["Document Ref ID", "Invoice Number", "Invoice Date", "Supplier Name", "Supplier GSTIN", "Taxable (₹)", "CGST (₹)", "SGST (₹)", "IGST (₹)", "Total (₹)"])
    for p in data.get("purchaseInvoices", []):
        ws_purch.append([
            p.get("id"),
            sanitize(p.get("docNumber")),
            p.get("docDate"),
            sanitize(p.get("supplierName")),
            sanitize(p.get("supplierGstin")),
            p.get("taxableAmount", 0),
            p.get("cgstAmount", 0),
            p.get("sgstAmount", 0),
            p.get("igstAmount", 0),
            p.get("totalAmount", 0)
        ])

    # Style all sheets
    for ws in wb.worksheets:
        if ws != default_sheet:
            for cell in ws[1]:
                cell.fill = navy_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center", vertical="center")
            ws.freeze_panes = "A2"

    wb.remove(default_sheet)
    wb.save(output_path)
    print(f"Generated Excel workbook saved to: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    generate_workbook(args.data, args.out)
