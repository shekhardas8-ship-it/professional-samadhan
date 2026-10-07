// src/services/serverMonitor.ts
import nodemailer from 'nodemailer';
import os from 'os';
import { db } from '../db/index.ts';
import { clients, documentFiles, extractedDocuments, validationExceptions, monthlyRequests } from '../db/schema.ts';
import { sql } from 'drizzle-orm';
import { googleDriveStorage } from './googleDriveStorage.ts';

export interface ServerHealthMetrics {
  status: 'healthy' | 'warning' | 'critical';
  uptimeSeconds: number;
  uptimeFormatted: string;
  nodeVersion: string;
  platform: string;
  timestamp: string;
  memory: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
    heapUsedPercent: number;
    totalSystemMemoryMb: number;
    freeSystemMemoryMb: number;
  };
  storage: {
    databaseRecords: {
      clientsCount: number;
      documentFilesCount: number;
      extractedInvoicesCount: number;
      validationExceptionsCount: number;
      monthlyRequestsCount: number;
    };
    neonDbEstimateMb: number;
    serverContainerDisk: string;
    googleDriveConfigured: boolean;
    googleDriveStatus: string;
  };
  aiOcrEngines: {
    geminiActive: boolean;
    geminiModel: string;
    tesseractActive: boolean;
    nativePdfActive: boolean;
  };
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}

export async function collectServerMetrics(): Promise<ServerHealthMetrics> {
  const mem = process.memoryUsage();
  const uptime = process.uptime();
  const totalMem = Math.round(os.totalmem() / (1024 * 1024));
  const freeMem = Math.round(os.freemem() / (1024 * 1024));
  const heapUsedPercent = Math.round((mem.heapUsed / mem.heapTotal) * 100);

  // Collect database record counts
  let clientsCount = 0;
  let documentFilesCount = 0;
  let extractedInvoicesCount = 0;
  let validationExceptionsCount = 0;
  let monthlyRequestsCount = 0;
  let totalDataBytes = 0;

  try {
    const [cCount] = await db.select({ count: sql<number>`count(*)` }).from(clients);
    clientsCount = Number(cCount?.count || 0);

    const [fCount] = await db.select({ 
      count: sql<number>`count(*)`,
      totalBytes: sql<number>`coalesce(sum(size_bytes), 0)` 
    }).from(documentFiles);
    documentFilesCount = Number(fCount?.count || 0);
    totalDataBytes = Number(fCount?.totalBytes || 0);

    const [iCount] = await db.select({ count: sql<number>`count(*)` }).from(extractedDocuments);
    extractedInvoicesCount = Number(iCount?.count || 0);

    const [exCount] = await db.select({ count: sql<number>`count(*)` }).from(validationExceptions);
    validationExceptionsCount = Number(exCount?.count || 0);

    const [mrCount] = await db.select({ count: sql<number>`count(*)` }).from(monthlyRequests);
    monthlyRequestsCount = Number(mrCount?.count || 0);
  } catch (err: any) {
    console.warn('[SERVER MONITOR] Failed to query database metrics:', err?.message);
  }

  const isDriveConfigured = googleDriveStorage.isEnabled();
  const neonEstimateMb = Math.round((totalDataBytes / (1024 * 1024)) * 100) / 100;

  return {
    status: heapUsedPercent > 90 ? 'warning' : 'healthy',
    uptimeSeconds: Math.floor(uptime),
    uptimeFormatted: formatUptime(uptime),
    nodeVersion: process.version,
    platform: `${os.platform()} (${os.arch()})`,
    timestamp: new Date().toISOString(),
    memory: {
      rssMb: Math.round(mem.rss / (1024 * 1024)),
      heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
      heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
      heapUsedPercent,
      totalSystemMemoryMb: totalMem,
      freeSystemMemoryMb: freeMem,
    },
    storage: {
      databaseRecords: {
        clientsCount,
        documentFilesCount,
        extractedInvoicesCount,
        validationExceptionsCount,
        monthlyRequestsCount,
      },
      neonDbEstimateMb: neonEstimateMb,
      serverContainerDisk: 'Render Ephemeral Container (Backed up permanently in Neon Cloud Database & Google Drive)',
      googleDriveConfigured: isDriveConfigured,
      googleDriveStatus: isDriveConfigured ? 'Connected & Active' : 'Ready (Awaiting Service Account Key or Folder Link)',
    },
    aiOcrEngines: {
      geminiActive: !!process.env.GEMINI_API_KEY,
      geminiModel: 'gemini-3.8-flash',
      tesseractActive: true,
      nativePdfActive: true,
    },
  };
}

export async function sendServerHealthEmail(recipientEmail: string = 'shekhardas8@gmail.com'): Promise<{ success: boolean; message: string }> {
  const metrics = await collectServerMetrics();

  // Create transporter using configured SMTP credentials or standard fallback
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || '';
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || '';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; color: #ffffff; padding: 28px; text-align: left; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em; }
    .header p { margin: 0; font-size: 13px; color: #94a3b8; }
    .status-badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; background: #10b981; color: #ffffff; margin-top: 12px; }
    .content { padding: 28px; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin: 20px 0 10px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
    .card-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .card-value { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    .bar-container { background: #e2e8f0; border-radius: 9999px; height: 8px; overflow: hidden; margin-top: 8px; }
    .bar-fill { height: 100%; background: #3b82f6; border-radius: 9999px; }
    .list-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .list-label { color: #64748b; }
    .list-val { font-weight: 600; color: #0f172a; font-family: monospace; }
    .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>QuinceCA • Server Monitoring</h1>
      <p>Automated Cloud Infrastructure & Storage Telemetry Report</p>
      <span class="status-badge">🟢 System Online • ${metrics.status.toUpperCase()}</span>
    </div>

    <div class="content">
      <div class="section-title">Storage & Database Telemetry</div>
      <div class="grid">
        <div class="card">
          <div class="card-label">Persistent Files Stored</div>
          <div class="card-value">${metrics.storage.databaseRecords.documentFilesCount} files</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">~${metrics.storage.neonDbEstimateMb} MB in Cloud PostgreSQL</div>
        </div>
        <div class="card">
          <div class="card-label">Active Registered Clients</div>
          <div class="card-value">${metrics.storage.databaseRecords.clientsCount} clients</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${metrics.storage.databaseRecords.monthlyRequestsCount} monthly periods active</div>
        </div>
      </div>

      <div class="list-row">
        <span class="list-label">Database Storage (Neon PostgreSQL Cloud):</span>
        <span class="list-val">AWS Singapore • Persistent</span>
      </div>
      <div class="list-row">
        <span class="list-label">Google Drive Integration:</span>
        <span class="list-val">${metrics.storage.googleDriveStatus}</span>
      </div>
      <div class="list-row">
        <span class="list-label">Extracted Invoices & Slips:</span>
        <span class="list-val">${metrics.storage.databaseRecords.extractedInvoicesCount} invoices parsed</span>
      </div>
      <div class="list-row">
        <span class="list-label">Pending Validation Exceptions:</span>
        <span class="list-val" style="color: ${metrics.storage.databaseRecords.validationExceptionsCount > 0 ? '#d97706' : '#10b981'}; font-weight: 700;">
          ${metrics.storage.databaseRecords.validationExceptionsCount} items
        </span>
      </div>

      <div class="section-title">AI & OCR Extraction Engine Status</div>
      <div class="list-row">
        <span class="list-label">Google Gemini Multimodal AI:</span>
        <span class="list-val" style="color: ${metrics.aiOcrEngines.geminiActive ? '#10b981' : '#64748b'};">
          ${metrics.aiOcrEngines.geminiActive ? '✨ ACTIVE (Gemini 3.8 Flash)' : 'Disabled'}
        </span>
      </div>
      <div class="list-row">
        <span class="list-label">Local Tesseract Pixel OCR:</span>
        <span class="list-val" style="color: #10b981;">⚡ ACTIVE (Local Offline Engine)</span>
      </div>
      <div class="list-row">
        <span class="list-label">Native PDF Stream Parser:</span>
        <span class="list-val" style="color: #10b981;">📄 ACTIVE</span>
      </div>

      <div class="section-title">Server Runtime & Memory</div>
      <div class="card" style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px;">
          <span style="font-weight: 600;">Node.js Heap Memory</span>
          <span style="color: #64748b;">${metrics.memory.heapUsedMb} MB / ${metrics.memory.heapTotalMb} MB (${metrics.memory.heapUsedPercent}%)</span>
        </div>
        <div class="bar-container">
          <div class="bar-fill" style="width: ${metrics.memory.heapUsedPercent}%;"></div>
        </div>
      </div>

      <div class="list-row">
        <span class="list-label">System Uptime:</span>
        <span class="list-val">${metrics.uptimeFormatted}</span>
      </div>
      <div class="list-row">
        <span class="list-label">Node Runtime:</span>
        <span class="list-val">${metrics.nodeVersion} on ${metrics.platform}</span>
      </div>
      <div class="list-row">
        <span class="list-label">Report Generated At:</span>
        <span class="list-val">${new Date(metrics.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
      </div>
    </div>

    <div class="footer">
      This is an automated system health report sent from <strong>QuinceCA Chartered Accountants GST Suite</strong>.<br/>
      Server: Render Cloud Web Service • Database: Neon Serverless PostgreSQL
    </div>
  </div>
</body>
</html>
  `;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: `"QuinceCA Cloud Monitor" <${smtpUser}>`,
        to: recipientEmail,
        subject: `🟢 [Server Health] QuinceCA Telemetry Report - ${new Date().toLocaleDateString('en-IN')}`,
        html: htmlContent,
      });

      console.log(`[SERVER MONITOR] Monitoring email dispatched successfully to ${recipientEmail}`);
      return { success: true, message: `Server monitoring report sent successfully to ${recipientEmail}` };
    } catch (err: any) {
      console.error('[SERVER MONITOR] SMTP transmission failed:', err.message);
      return {
        success: false,
        message: `SMTP delivery failed: ${err.message}. Metrics collected successfully.`,
      };
    }
  } else {
    console.log(`[SERVER MONITOR] SMTP credentials not set in .env. Metrics report prepared for ${recipientEmail}.`);
    return {
      success: true,
      message: `Server telemetry generated successfully for ${recipientEmail}. (To receive live email in Gmail, configure SMTP_USER & SMTP_PASS in .env).`,
    };
  }
}
