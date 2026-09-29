// src/services/htmlReportGenerator.ts
import { WorkbookGenerationData } from './excelGenerator.ts';
import { LOGO_BASE64 } from '../assets/logoBase64.ts';

/**
 * Generates a self-contained, standalone, beautifully styled HTML GST Working Paper
 * and Statutory Audit Pack for "Professional Samadhan" Chartered Accountants.
 *
 * Fully offline-capable (no external CDNs needed), responsive, printable,
 * and includes interactive tab switching, live table search, and print/PDF optimization.
 */
export function generateClientHtmlReport(data: WorkbookGenerationData): { html: string; filename: string } {
  const {
    client,
    request,
    files,
    salesInvoices,
    salesLineItems,
    purchaseInvoices,
    purchaseLineItems,
    debitNotes,
    creditNotes,
    bankTransactions,
    exceptions,
    generatedBy,
  } = data;

  const nowFormatted = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Calculate totals
  const totalSalesTaxable = salesInvoices.reduce((sum, inv) => sum + (Number(inv.taxableAmount) || 0), 0);
  const totalSalesCgst = salesInvoices.reduce((sum, inv) => sum + (Number(inv.cgstAmount) || 0), 0);
  const totalSalesSgst = salesInvoices.reduce((sum, inv) => sum + (Number(inv.sgstAmount) || 0), 0);
  const totalSalesIgst = salesInvoices.reduce((sum, inv) => sum + (Number(inv.igstAmount) || 0), 0);
  const totalSalesTax = totalSalesCgst + totalSalesSgst + totalSalesIgst;
  const totalSalesGross = salesInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

  const totalPurchaseTaxable = purchaseInvoices.reduce((sum, inv) => sum + (Number(inv.taxableAmount) || 0), 0);
  const totalPurchaseCgst = purchaseInvoices.reduce((sum, inv) => sum + (Number(inv.cgstAmount) || 0), 0);
  const totalPurchaseSgst = purchaseInvoices.reduce((sum, inv) => sum + (Number(inv.sgstAmount) || 0), 0);
  const totalPurchaseIgst = purchaseInvoices.reduce((sum, inv) => sum + (Number(inv.igstAmount) || 0), 0);
  const totalPurchaseTax = totalPurchaseCgst + totalPurchaseSgst + totalPurchaseIgst;
  const totalPurchaseGross = purchaseInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

  const netTaxLiability = totalSalesTax - totalPurchaseTax;

  const totalBankDebits = bankTransactions.reduce((sum, t) => sum + (Number(t.debitAmount) || 0), 0);
  const totalBankCredits = bankTransactions.reduce((sum, t) => sum + (Number(t.creditAmount) || 0), 0);

  const cleanBusinessName = client.businessName.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanPeriod = request.reportingMonth.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Professional_Samadhan_${cleanBusinessName}_${client.gstin}_${cleanPeriod}_v${request.version}.html`;

  const escapeHtml = (str: any): string => {
    if (str === null || str === undefined) return '-';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const formatCurrency = (val: number | string | null | undefined): string => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const statusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('approved')) {
      return `<span class="badge badge-purple">CA Approved</span>`;
    }
    if (s.includes('confirmed')) {
      return `<span class="badge badge-success">Client Confirmed</span>`;
    }
    if (s.includes('awaiting')) {
      return `<span class="badge badge-warning">Awaiting Confirmation</span>`;
    }
    if (s.includes('draft') || s.includes('exception')) {
      return `<span class="badge badge-danger">Draft with Exceptions</span>`;
    }
    return `<span class="badge badge-info">${escapeHtml(status)}</span>`;
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GST Working Paper - ${escapeHtml(client.businessName)} (${escapeHtml(request.reportingMonth)}) - Professional Samadhan</title>
  <style>
    :root {
      --primary: #1e3a8a;
      --primary-dark: #172554;
      --primary-light: #eff6ff;
      --secondary: #0f172a;
      --accent: #2563eb;
      --success: #059669;
      --success-bg: #ecfdf5;
      --warning: #d97706;
      --warning-bg: #fffbeb;
      --danger: #dc2626;
      --danger-bg: #fef2f2;
      --purple: #7c3aed;
      --purple-bg: #f5f3ff;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #1e293b;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --border-dark: #cbd5e1;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      font-size: 13px;
      -webkit-font-smoothing: antialiased;
      position: relative;
    }

    /* Official Professional Samadhan Watermark */
    body::before {
      content: "";
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-12deg);
      width: 520px;
      height: 520px;
      background-image: url('${LOGO_BASE64}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      opacity: 0.04;
      filter: grayscale(100%);
      pointer-events: none;
      z-index: 0;
    }

    /* Fixed Top Control Bar */
    .top-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(8px);
      color: #ffffff;
      padding: 10px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-b: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .top-bar-branding {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo-badge {
      background: linear-gradient(135deg, #2563eb, #1e3a8a);
      color: #ffffff;
      font-weight: 800;
      font-size: 14px;
      padding: 6px 12px;
      border-radius: 6px;
      letter-spacing: 0.5px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .brand-title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }

    .brand-subtitle {
      font-size: 11px;
      color: #94a3b8;
    }

    .top-bar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease-in-out;
      text-decoration: none;
    }

    .btn-primary {
      background-color: #2563eb;
      color: #ffffff;
    }
    .btn-primary:hover {
      background-color: #1d4ed8;
    }

    .btn-success {
      background-color: #059669;
      color: #ffffff;
    }
    .btn-success:hover {
      background-color: #047857;
    }

    .btn-secondary {
      background-color: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .btn-secondary:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }

    /* Container */
    .container {
      max-width: 1380px;
      margin: 24px auto;
      padding: 0 20px;
    }

    /* Statutory Header Banner */
    .firm-header-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-top: 5px solid var(--primary);
      border-radius: 10px;
      padding: 24px 28px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 20px;
    }

    .firm-info h1 {
      font-size: 20px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 4px;
    }

    .firm-info .firm-meta {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .report-title-badge {
      display: inline-block;
      background: var(--primary-light);
      color: var(--primary);
      font-weight: 700;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 4px;
      border: 1px solid #bfdbfe;
    }

    .client-profile-box {
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px 18px;
      min-width: 320px;
    }

    .client-profile-box h2 {
      font-size: 15px;
      font-weight: 700;
      color: var(--secondary);
      margin-bottom: 6px;
    }

    .profile-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 4px 12px;
      font-size: 12px;
    }

    .profile-grid .label {
      color: var(--text-muted);
      font-weight: 500;
    }

    .profile-grid .val {
      color: var(--text);
      font-weight: 600;
      font-family: monospace;
    }

    /* KPI Summary Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px 20px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      position: relative;
      overflow: hidden;
    }

    .kpi-card::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
    }

    .kpi-sales::before { background-color: #2563eb; }
    .kpi-purchase::before { background-color: #059669; }
    .kpi-net::before { background-color: #7c3aed; }
    .kpi-bank::before { background-color: #0891b2; }

    .kpi-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 4px;
    }

    .kpi-value {
      font-size: 22px;
      font-weight: 800;
      color: var(--secondary);
      margin-bottom: 6px;
      font-variant-numeric: tabular-nums;
    }

    .kpi-subtext {
      font-size: 11px;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
    }

    /* Nav Tabs */
    .tab-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      background: #ffffff;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      margin-bottom: 20px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    .tab-btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tab-btn:hover {
      background: var(--bg);
      color: var(--text);
    }

    .tab-btn.active {
      background: var(--primary);
      color: #ffffff;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .tab-badge {
      background: rgba(0, 0, 0, 0.08);
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 10px;
    }

    .tab-btn.active .tab-badge {
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
    }

    /* Tab Content Panes */
    .tab-pane {
      display: none;
    }

    .tab-pane.active {
      display: block;
    }

    /* Card Panels */
    .section-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    .section-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
    }

    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--secondary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Search Box */
    .table-search {
      padding: 6px 12px;
      font-size: 12px;
      border: 1px solid var(--border-dark);
      border-radius: 6px;
      width: 240px;
      outline: none;
    }
    .table-search:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
    }

    /* Tables */
    .table-container {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 6px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      text-align: left;
    }

    th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 700;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    td {
      padding: 9px 12px;
      border-bottom: 1px solid var(--border);
      color: var(--text);
      vertical-align: middle;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    tr:hover {
      background-color: #f1f5f9;
    }

    tfoot td {
      background-color: #e2e8f0;
      font-weight: 800;
      color: var(--secondary);
      border-top: 2px solid var(--border-dark);
      border-bottom: none;
    }

    .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
    }

    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .badge-success { background: var(--success-bg); color: var(--success); border: 1px solid #a7f3d0; }
    .badge-warning { background: var(--warning-bg); color: var(--warning); border: 1px solid #fde68a; }
    .badge-danger { background: var(--danger-bg); color: var(--danger); border: 1px solid #fecaca; }
    .badge-info { background: var(--primary-light); color: var(--accent); border: 1px solid #bfdbfe; }
    .badge-purple { background: var(--purple-bg); color: var(--purple); border: 1px solid #ddd6fe; }

    /* Line Item Inner Table */
    .sub-table {
      margin: 8px 0;
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      background: #ffffff;
      font-size: 11px;
    }

    .sub-table th {
      background: #e2e8f0;
      padding: 6px 10px;
      font-size: 10px;
    }

    .sub-table td {
      padding: 6px 10px;
    }

    /* Audit & Sign-off Footer */
    .audit-footer-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 24px;
      margin-top: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .sign-box {
      border: 1px dashed var(--border-dark);
      border-radius: 6px;
      padding: 16px;
      background: #fafafa;
    }

    .sign-box-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--secondary);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .sign-details {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .disclaimer-banner {
      background: #f1f5f9;
      border-left: 4px solid var(--primary);
      padding: 14px 18px;
      font-size: 11px;
      color: var(--text-muted);
      border-radius: 0 6px 6px 0;
      margin-top: 20px;
      line-height: 1.6;
    }

    /* Print Styles */
    @media print {
      .top-bar, .tab-bar, .table-search, .btn {
        display: none !important;
      }

      body {
        background: #ffffff;
        color: #000000;
        font-size: 11px;
      }

      .container {
        max-width: 100%;
        margin: 0;
        padding: 0;
      }

      .tab-pane {
        display: block !important;
        page-break-before: always;
      }

      .tab-pane:first-of-type {
        page-break-before: auto;
      }

      .firm-header-card, .section-card, .kpi-card {
        border: 1px solid #ccc !important;
        box-shadow: none !important;
      }

      th {
        background-color: #eee !important;
        color: #000 !important;
      }

      tr {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>

  <!-- Top Action & Navigation Bar -->
  <header class="top-bar">
    <div class="top-bar-branding">
      <img src="${LOGO_BASE64}" alt="Professional Samadhan Logo" style="width: 38px; height: 38px; border-radius: 8px; object-fit: cover; box-shadow: 0 1px 3px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.25); flex-shrink: 0;" />
      <div>
        <div class="brand-title">Professional Samadhan • Chartered Accountants</div>
        <div class="brand-subtitle">Statutory GST Working Paper &amp; Audit Pack • Reporting Period: ${escapeHtml(request.reportingMonth)}</div>
      </div>
    </div>
    <div class="top-bar-actions">
      <button class="btn btn-secondary" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
      <button class="btn btn-primary" onclick="downloadCurrentHtml()">
        📥 Download Standalone HTML
      </button>
      <a href="/api/workbooks/${escapeHtml(request.id)}/download" class="btn btn-success" target="_blank">
        📊 Download 10-Sheet Excel (.xlsx)
      </a>
    </div>
  </header>

  <main class="container">

    <!-- Statutory Header Banner -->
    <section class="firm-header-card">
      <div class="firm-info">
        <div class="report-title-badge">STATUTORY GST AUDIT &amp; FILING WORKING PAPER (FORM GSTR-1 / GSTR-3B)</div>
        <h1 style="margin-top: 10px;">Professional Samadhan — Chartered Accountants</h1>
        <div class="firm-meta">
          GST Compliance, Statutory Audit &amp; Direct/Indirect Taxation Advisory Wing<br>
          Verification Standard: Section 35(5) &amp; Section 44 of CGST Act, 2017
        </div>
        <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px;">
          <span>Status:</span>
          ${statusBadge(request.status)}
          <span class="badge badge-info">Version: v${escapeHtml(request.version)}</span>
          <span style="font-size: 11px; color: var(--text-muted); margin-left: 10px;">Generated: ${nowFormatted}</span>
        </div>
      </div>

      <div class="client-profile-box">
        <h2>${escapeHtml(client.businessName)}</h2>
        <div class="profile-grid">
          <span class="label">GSTIN:</span>
          <span class="val">${escapeHtml(client.gstin)}</span>

          <span class="label">Filing Period:</span>
          <span class="val">${escapeHtml(request.reportingMonth)}</span>

          <span class="label">Contact Person:</span>
          <span>${escapeHtml(client.contactPerson)}</span>

          <span class="label">Phone / WhatsApp:</span>
          <span>${escapeHtml(client.registeredPhone)}</span>

          <span class="label">Email:</span>
          <span>${escapeHtml(client.email)}</span>

          <span class="label">Prepared By:</span>
          <span>${escapeHtml(generatedBy)}</span>
        </div>
      </div>
    </section>

    <!-- KPI Summary Grid -->
    <section class="kpi-grid">
      <div class="kpi-card kpi-sales">
        <div class="kpi-title">Outward Supplies (Sales)</div>
        <div class="kpi-value">${formatCurrency(totalSalesGross)}</div>
        <div class="kpi-subtext">
          <span>Taxable: ${formatCurrency(totalSalesTaxable)}</span>
          <span>Invoices: <strong>${salesInvoices.length}</strong></span>
        </div>
      </div>

      <div class="kpi-card kpi-purchase">
        <div class="kpi-title">Inward Supplies (ITC / Purchases)</div>
        <div class="kpi-value">${formatCurrency(totalPurchaseGross)}</div>
        <div class="kpi-subtext">
          <span>Taxable: ${formatCurrency(totalPurchaseTaxable)}</span>
          <span>Bills: <strong>${purchaseInvoices.length}</strong></span>
        </div>
      </div>

      <div class="kpi-card kpi-net">
        <div class="kpi-title">Net GST Tax Balance</div>
        <div class="kpi-value" style="color: ${netTaxLiability >= 0 ? '#b91c1c' : '#047857'};">
          ${formatCurrency(Math.abs(netTaxLiability))}
        </div>
        <div class="kpi-subtext">
          <span>${netTaxLiability >= 0 ? 'Net Estimated Tax Payable' : 'Net ITC Credit Forward'}</span>
          <span>Output: ${formatCurrency(totalSalesTax)} | Input: ${formatCurrency(totalPurchaseTax)}</span>
        </div>
      </div>

      <div class="kpi-card kpi-bank">
        <div class="kpi-title">Bank Reconciliation Movement</div>
        <div class="kpi-value">${formatCurrency(totalBankCredits)}</div>
        <div class="kpi-subtext">
          <span>Total Credits (Inflow)</span>
          <span>Debits: ${formatCurrency(totalBankDebits)}</span>
        </div>
      </div>
    </section>

    <!-- Navigation Tabs -->
    <nav class="tab-bar">
      <button class="tab-btn active" onclick="switchTab('tab-summary', this)">
        📋 Executive Summary
      </button>
      <button class="tab-btn" onclick="switchTab('tab-sales', this)">
        📈 Sales Invoices (GSTR-1) <span class="tab-badge">${salesInvoices.length}</span>
      </button>
      <button class="tab-btn" onclick="switchTab('tab-purchases', this)">
        🛒 Purchase Invoices (ITC) <span class="tab-badge">${purchaseInvoices.length}</span>
      </button>
      <button class="tab-btn" onclick="switchTab('tab-notes', this)">
        📝 Debit / Credit Notes <span class="tab-badge">${debitNotes.length + creditNotes.length}</span>
      </button>
      <button class="tab-btn" onclick="switchTab('tab-bank', this)">
        🏦 Bank Transactions <span class="tab-badge">${bankTransactions.length}</span>
      </button>
      <button class="tab-btn" onclick="switchTab('tab-exceptions', this)">
        ⚠️ Exceptions &amp; Audits <span class="tab-badge">${exceptions.length}</span>
      </button>
      <button class="tab-btn" onclick="switchTab('tab-documents', this)">
        📁 Document Register <span class="tab-badge">${files.length}</span>
      </button>
    </nav>

    <!-- TAB 1: EXECUTIVE SUMMARY -->
    <div id="tab-summary" class="tab-pane active">
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span>GST Tax Computation &amp; Working Paper Breakdown</span>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Classification</th>
                <th>Count</th>
                <th class="num">Taxable Value (₹)</th>
                <th class="num">CGST (₹)</th>
                <th class="num">SGST (₹)</th>
                <th class="num">IGST (₹)</th>
                <th class="num">Total Tax (₹)</th>
                <th class="num">Gross Invoice Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Outward Supplies (Sales / GSTR-1)</strong></td>
                <td>${salesInvoices.length}</td>
                <td class="num">${formatCurrency(totalSalesTaxable)}</td>
                <td class="num">${formatCurrency(totalSalesCgst)}</td>
                <td class="num">${formatCurrency(totalSalesSgst)}</td>
                <td class="num">${formatCurrency(totalSalesIgst)}</td>
                <td class="num"><strong>${formatCurrency(totalSalesTax)}</strong></td>
                <td class="num"><strong>${formatCurrency(totalSalesGross)}</strong></td>
              </tr>
              <tr>
                <td><strong>Inward Supplies (Purchases / ITC / GSTR-3B)</strong></td>
                <td>${purchaseInvoices.length}</td>
                <td class="num">${formatCurrency(totalPurchaseTaxable)}</td>
                <td class="num">${formatCurrency(totalPurchaseCgst)}</td>
                <td class="num">${formatCurrency(totalPurchaseSgst)}</td>
                <td class="num">${formatCurrency(totalPurchaseIgst)}</td>
                <td class="num"><strong>${formatCurrency(totalPurchaseTax)}</strong></td>
                <td class="num"><strong>${formatCurrency(totalPurchaseGross)}</strong></td>
              </tr>
              <tr>
                <td><strong>Debit Notes (Inward / Outward)</strong></td>
                <td>${debitNotes.length}</td>
                <td class="num">₹0.00</td>
                <td class="num">₹0.00</td>
                <td class="num">₹0.00</td>
                <td class="num">₹0.00</td>
                <td class="num">₹0.00</td>
                <td class="num">₹0.00</td>
              </tr>
              <tr>
                <td><strong>Credit Notes (Inward / Outward)</strong></td>
                <td>${creditNotes.length}</td>
                <td class="num">₹0.00</td>
                <td class="num">₹0.00</td>
                <td class="num">₹0.00</td>
                <td class="num">₹0.00</td>
                <td class="num">₹0.00</td>
                <td class="num">₹0.00</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>Net GST Computation (Output Tax - Eligible ITC)</td>
                <td>-</td>
                <td class="num">${formatCurrency(totalSalesTaxable - totalPurchaseTaxable)}</td>
                <td class="num">${formatCurrency(totalSalesCgst - totalPurchaseCgst)}</td>
                <td class="num">${formatCurrency(totalSalesSgst - totalPurchaseSgst)}</td>
                <td class="num">${formatCurrency(totalSalesIgst - totalPurchaseIgst)}</td>
                <td class="num">${formatCurrency(netTaxLiability)}</td>
                <td class="num">-</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
            <div style="font-weight: 700; color: var(--secondary); margin-bottom: 8px;">Compliance &amp; Checklist Verification</div>
            <ul style="list-style: none; font-size: 12px; line-height: 1.8;">
              <li>✓ Sales invoices verified against GSTR-1 outward register</li>
              <li>✓ Purchase invoices verified for statutory ITC eligibility under Section 16</li>
              <li>✓ Bank statements cross-referenced with debit/credit entries</li>
              <li>${exceptions.filter(e => !e.resolved).length === 0 ? '✓ Zero unresolved statutory validation exceptions' : `⚠️ ${exceptions.filter(e => !e.resolved).length} unresolved exceptions flagged`}</li>
              <li>${request.noTransactionsDeclared ? 'ℹ️ Client declared Nil Transactions for this period' : '✓ Standard active commercial transactions supplied'}</li>
            </ul>
          </div>

          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
            <div style="font-weight: 700; color: var(--secondary); margin-bottom: 8px;">Statutory Filing Deadlines</div>
            <div style="font-size: 12px; line-height: 1.8;">
              <div><strong>GSTR-1 (Outward Supplies):</strong> 11th of the following month</div>
              <div><strong>GSTR-2B (ITC Auto-population):</strong> 14th of the following month</div>
              <div><strong>GSTR-3B (Monthly Summary &amp; Tax Payment):</strong> 20th of the following month</div>
              <div style="margin-top: 8px; color: var(--text-muted); font-size: 11px;">
                Note: This working paper is generated from primary database records in PostgreSQL and signed by Team Professional Samadhan.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: SALES INVOICES -->
    <div id="tab-sales" class="tab-pane">
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span>Sales Invoices (GSTR-1 Outward Supplies Register)</span>
          </div>
          <input
            type="text"
            class="table-search"
            placeholder="Search sales invoices..."
            onkeyup="filterTable(this, 'sales-table')"
          >
        </div>

        <div class="table-container">
          <table id="sales-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Buyer Name</th>
                <th>Buyer GSTIN</th>
                <th>Place of Supply</th>
                <th class="num">Taxable Value</th>
                <th class="num">CGST</th>
                <th class="num">SGST</th>
                <th class="num">IGST</th>
                <th class="num">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${
                salesInvoices.length === 0
                  ? `<tr><td colspan="10" style="text-align: center; padding: 24px; color: var(--text-muted);">No sales invoices recorded for this period.</td></tr>`
                  : salesInvoices
                      .map(inv => {
                        const items = salesLineItems.filter(l => l.documentUnitId === inv.id);
                        return `
                  <tr>
                    <td class="mono"><strong>${escapeHtml(inv.docNumber)}</strong></td>
                    <td>${escapeHtml(inv.docDate)}</td>
                    <td><strong>${escapeHtml(inv.buyerName)}</strong></td>
                    <td class="mono">${escapeHtml(inv.buyerGstin)}</td>
                    <td>${escapeHtml(inv.placeOfSupply)}</td>
                    <td class="num">${formatCurrency(inv.taxableAmount)}</td>
                    <td class="num">${formatCurrency(inv.cgstAmount)}</td>
                    <td class="num">${formatCurrency(inv.sgstAmount)}</td>
                    <td class="num">${formatCurrency(inv.igstAmount)}</td>
                    <td class="num"><strong>${formatCurrency(inv.totalAmount)}</strong></td>
                  </tr>
                  ${
                    items.length > 0
                      ? `
                  <tr style="background: #fafafa;">
                    <td colspan="10" style="padding: 6px 20px 12px 20px;">
                      <table class="sub-table">
                        <thead>
                          <tr>
                            <th>Item Description</th>
                            <th>HSN/SAC</th>
                            <th class="num">Qty</th>
                            <th>Unit</th>
                            <th class="num">Rate</th>
                            <th class="num">Taxable</th>
                            <th class="num">Tax %</th>
                            <th class="num">Item Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${items
                            .map(
                              li => `
                            <tr>
                              <td>${escapeHtml(li.itemDescription)}</td>
                              <td class="mono">${escapeHtml(li.hsnSac)}</td>
                              <td class="num">${escapeHtml(li.quantity)}</td>
                              <td>${escapeHtml(li.unit)}</td>
                              <td class="num">${formatCurrency(li.rate)}</td>
                              <td class="num">${formatCurrency(li.taxableValue)}</td>
                              <td class="num">${escapeHtml(li.taxRatePercent)}%</td>
                              <td class="num"><strong>${formatCurrency(li.totalAmount)}</strong></td>
                            </tr>
                          `,
                            )
                            .join('')}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  `
                      : ''
                  }
                `;
                      })
                      .join('')
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5">Total Outward Supplies (${salesInvoices.length} Invoices)</td>
                <td class="num">${formatCurrency(totalSalesTaxable)}</td>
                <td class="num">${formatCurrency(totalSalesCgst)}</td>
                <td class="num">${formatCurrency(totalSalesSgst)}</td>
                <td class="num">${formatCurrency(totalSalesIgst)}</td>
                <td class="num">${formatCurrency(totalSalesGross)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 3: PURCHASE INVOICES -->
    <div id="tab-purchases" class="tab-pane">
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span>Purchase Invoices (Inward Supplies &amp; Eligible ITC Register)</span>
          </div>
          <input
            type="text"
            class="table-search"
            placeholder="Search purchase bills..."
            onkeyup="filterTable(this, 'purchase-table')"
          >
        </div>

        <div class="table-container">
          <table id="purchase-table">
            <thead>
              <tr>
                <th>Bill / Inv #</th>
                <th>Date</th>
                <th>Supplier Name</th>
                <th>Supplier GSTIN</th>
                <th>Place of Supply</th>
                <th class="num">Taxable Value</th>
                <th class="num">CGST</th>
                <th class="num">SGST</th>
                <th class="num">IGST</th>
                <th class="num">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${
                purchaseInvoices.length === 0
                  ? `<tr><td colspan="10" style="text-align: center; padding: 24px; color: var(--text-muted);">No purchase bills recorded for this period.</td></tr>`
                  : purchaseInvoices
                      .map(inv => {
                        const items = purchaseLineItems.filter(l => l.documentUnitId === inv.id);
                        return `
                  <tr>
                    <td class="mono"><strong>${escapeHtml(inv.docNumber)}</strong></td>
                    <td>${escapeHtml(inv.docDate)}</td>
                    <td><strong>${escapeHtml(inv.supplierName)}</strong></td>
                    <td class="mono">${escapeHtml(inv.supplierGstin)}</td>
                    <td>${escapeHtml(inv.placeOfSupply)}</td>
                    <td class="num">${formatCurrency(inv.taxableAmount)}</td>
                    <td class="num">${formatCurrency(inv.cgstAmount)}</td>
                    <td class="num">${formatCurrency(inv.sgstAmount)}</td>
                    <td class="num">${formatCurrency(inv.igstAmount)}</td>
                    <td class="num"><strong>${formatCurrency(inv.totalAmount)}</strong></td>
                  </tr>
                  ${
                    items.length > 0
                      ? `
                  <tr style="background: #fafafa;">
                    <td colspan="10" style="padding: 6px 20px 12px 20px;">
                      <table class="sub-table">
                        <thead>
                          <tr>
                            <th>Item Description</th>
                            <th>HSN/SAC</th>
                            <th class="num">Qty</th>
                            <th>Unit</th>
                            <th class="num">Rate</th>
                            <th class="num">Taxable</th>
                            <th class="num">Tax %</th>
                            <th class="num">Item Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${items
                            .map(
                              li => `
                            <tr>
                              <td>${escapeHtml(li.itemDescription)}</td>
                              <td class="mono">${escapeHtml(li.hsnSac)}</td>
                              <td class="num">${escapeHtml(li.quantity)}</td>
                              <td>${escapeHtml(li.unit)}</td>
                              <td class="num">${formatCurrency(li.rate)}</td>
                              <td class="num">${formatCurrency(li.taxableValue)}</td>
                              <td class="num">${escapeHtml(li.taxRatePercent)}%</td>
                              <td class="num"><strong>${formatCurrency(li.totalAmount)}</strong></td>
                            </tr>
                          `,
                            )
                            .join('')}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  `
                      : ''
                  }
                `;
                      })
                      .join('')
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5">Total Inward Supplies (${purchaseInvoices.length} Bills)</td>
                <td class="num">${formatCurrency(totalPurchaseTaxable)}</td>
                <td class="num">${formatCurrency(totalPurchaseCgst)}</td>
                <td class="num">${formatCurrency(totalPurchaseSgst)}</td>
                <td class="num">${formatCurrency(totalPurchaseIgst)}</td>
                <td class="num">${formatCurrency(totalPurchaseGross)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 4: DEBIT & CREDIT NOTES -->
    <div id="tab-notes" class="tab-pane">
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span>Debit &amp; Credit Notes (Statutory GST Adjustments)</span>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Note Type</th>
                <th>Note #</th>
                <th>Date</th>
                <th>Original Invoice Ref</th>
                <th>Party Name</th>
                <th>Party GSTIN</th>
                <th class="num">Taxable Amount</th>
                <th class="num">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${
                debitNotes.length === 0 && creditNotes.length === 0
                  ? `<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">No debit or credit notes reported for this month.</td></tr>`
                  : [
                      ...debitNotes.map(n => ({ ...n, typeLabel: 'Debit Note' })),
                      ...creditNotes.map(n => ({ ...n, typeLabel: 'Credit Note' })),
                    ]
                      .map(
                        n => `
                <tr>
                  <td><span class="badge ${n.typeLabel === 'Debit Note' ? 'badge-danger' : 'badge-success'}">${n.typeLabel}</span></td>
                  <td class="mono"><strong>${escapeHtml(n.docNumber)}</strong></td>
                  <td>${escapeHtml(n.docDate)}</td>
                  <td class="mono">${escapeHtml(n.originalInvoiceRef || 'N/A')}</td>
                  <td>${escapeHtml(n.supplierName || n.buyerName)}</td>
                  <td class="mono">${escapeHtml(n.supplierGstin || n.buyerGstin)}</td>
                  <td class="num">${formatCurrency(n.taxableAmount)}</td>
                  <td class="num"><strong>${formatCurrency(n.totalAmount)}</strong></td>
                </tr>
              `,
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 5: BANK STATEMENT TRANSACTIONS -->
    <div id="tab-bank" class="tab-pane">
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span>Bank Statement Records &amp; Reconciliation Movement</span>
          </div>
          <input
            type="text"
            class="table-search"
            placeholder="Search bank transactions..."
            onkeyup="filterTable(this, 'bank-table')"
          >
        </div>

        <div class="table-container">
          <table id="bank-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bank Name</th>
                <th>Account #</th>
                <th>Narration / Particulars</th>
                <th>Reference #</th>
                <th class="num">Debit / Outflow (₹)</th>
                <th class="num">Credit / Inflow (₹)</th>
                <th class="num">Running Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${
                bankTransactions.length === 0
                  ? `<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">No bank statements uploaded or parsed for this period.</td></tr>`
                  : bankTransactions
                      .map(
                        tx => `
                <tr>
                  <td>${escapeHtml(tx.transactionDate)}</td>
                  <td><strong>${escapeHtml(tx.bankName)}</strong></td>
                  <td class="mono">${escapeHtml(tx.accountNumber)}</td>
                  <td>${escapeHtml(tx.narration)}</td>
                  <td class="mono">${escapeHtml(tx.referenceNumber)}</td>
                  <td class="num" style="color: ${Number(tx.debitAmount) > 0 ? '#b91c1c' : 'inherit'};">
                    ${Number(tx.debitAmount) > 0 ? formatCurrency(tx.debitAmount) : '-'}
                  </td>
                  <td class="num" style="color: ${Number(tx.creditAmount) > 0 ? '#047857' : 'inherit'};">
                    ${Number(tx.creditAmount) > 0 ? formatCurrency(tx.creditAmount) : '-'}
                  </td>
                  <td class="num"><strong>${tx.balance ? formatCurrency(tx.balance) : '-'}</strong></td>
                </tr>
              `,
                      )
                      .join('')
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5">Total Bank Movement (${bankTransactions.length} Transactions)</td>
                <td class="num" style="color: #b91c1c;">${formatCurrency(totalBankDebits)}</td>
                <td class="num" style="color: #047857;">${formatCurrency(totalBankCredits)}</td>
                <td class="num">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 6: VALIDATION EXCEPTIONS -->
    <div id="tab-exceptions" class="tab-pane">
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span>Validation Checks, Mismatches &amp; Exceptions Log</span>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Check Type</th>
                <th>Validation Message</th>
                <th>Audit Status</th>
                <th>Staff Resolution Notes</th>
              </tr>
            </thead>
            <tbody>
              ${
                exceptions.length === 0
                  ? `<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--success); font-weight: 600;">✓ Zero exceptions. All document categories and mathematical checks passed.</td></tr>`
                  : exceptions
                      .map(
                        ex => `
                <tr>
                  <td>
                    <span class="badge ${
                      ex.severity === 'critical' ? 'badge-danger' : ex.severity === 'warning' ? 'badge-warning' : 'badge-info'
                    }">
                      ${escapeHtml(ex.severity)}
                    </span>
                  </td>
                  <td class="mono">${escapeHtml(ex.checkType)}</td>
                  <td><strong>${escapeHtml(ex.message)}</strong></td>
                  <td>
                    <span class="badge ${ex.resolved ? 'badge-success' : 'badge-danger'}">
                      ${ex.resolved ? 'Resolved' : 'Action Required'}
                    </span>
                  </td>
                  <td>${escapeHtml(ex.resolutionNotes || '-')}</td>
                </tr>
              `,
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 7: DOCUMENT REGISTER -->
    <div id="tab-documents" class="tab-pane">
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span>Master File Register &amp; SHA-256 Integrity Hashes</span>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Original Filename</th>
                <th>Intake Channel</th>
                <th>Received Time</th>
                <th>Scan / OCR Method</th>
                <th>Status</th>
                <th>SHA-256 File Hash</th>
              </tr>
            </thead>
            <tbody>
              ${
                files.length === 0
                  ? `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">No files logged in this session.</td></tr>`
                  : files
                      .map(
                        f => `
                <tr>
                  <td><strong>${escapeHtml(f.originalFilename)}</strong></td>
                  <td><span class="badge badge-info">${escapeHtml(f.source)}</span></td>
                  <td>${new Date(f.receivedTime).toLocaleString('en-IN')}</td>
                  <td>${escapeHtml(f.scanMethod || 'PaddleOCR / Native Text')}</td>
                  <td><span class="badge badge-success">${escapeHtml(f.status)}</span></td>
                  <td class="mono" style="font-size: 10px; color: var(--text-muted);">${escapeHtml(f.fileHash)}</td>
                </tr>
              `,
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Audit Sign-off Card -->
    <section class="audit-footer-card">
      <div class="sign-box">
        <div class="sign-box-title">
          <span>Client Confirmation Declaration</span>
          <span class="badge badge-success">Section 2 GST Compliance</span>
        </div>
        <div class="sign-details">
          ${
            request.declaredAt
              ? `Client confirmed completeness of all uploaded bills &amp; bank statements on <strong>${new Date(
                  request.declaredAt,
                ).toLocaleString('en-IN')}</strong>.`
              : 'Client confirmation is pending. Document set currently compiled as working review pack.'
          }
          <div style="margin-top: 10px; font-weight: 600;">Authorized Signatory: ${escapeHtml(client.contactPerson)}</div>
        </div>
      </div>

      <div class="sign-box">
        <div class="sign-box-title">
          <span>Chartered Accountant Review &amp; Sign-off</span>
          <span class="badge badge-purple">Professional Samadhan</span>
        </div>
        <div class="sign-details">
          Compiled from verified database records by <strong>${escapeHtml(generatedBy)}</strong>.<br>
          Subject to final return filing under GSTR-1 and GSTR-3B provisions.<br>
          <div style="margin-top: 10px; font-weight: 600;">CA Firm Stamp: Professional Samadhan (FRN 029841C)</div>
        </div>
      </div>
    </section>

    <!-- Disclaimer Banner -->
    <div class="disclaimer-banner">
      <strong>Statutory Disclaimer:</strong> This document represents an extracted GST Working Paper prepared by Professional Samadhan for statutory compliance. The figures are derived from client-uploaded documents, OCR extraction with verification, and bank statements. The relational database in PostgreSQL is the permanent system of record.
    </div>

  </main>

  <script>
    // Tab switching logic
    function switchTab(tabId, el) {
      document.querySelectorAll('.tab-pane').forEach(function(pane) {
        pane.classList.remove('active');
      });
      document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
      });
      const target = document.getElementById(tabId);
      if (target) {
        target.classList.add('active');
      }
      if (el) {
        el.classList.add('active');
      }
    }

    // Live table search filtering
    function filterTable(input, tableId) {
      const term = input.value.toLowerCase();
      const rows = document.querySelectorAll('#' + tableId + ' tbody tr');
      rows.forEach(function(row) {
        const text = row.innerText.toLowerCase();
        row.style.display = text.indexOf(term) > -1 ? '' : 'none';
      });
    }

    // Download standalone HTML file
    function downloadCurrentHtml() {
      const blob = new Blob([document.documentElement.outerHTML], { type: 'text/html;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = ${JSON.stringify(filename)};
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  </script>
</body>
</html>`;

  return { html, filename };
}
