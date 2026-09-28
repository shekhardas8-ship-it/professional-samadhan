// server.ts
import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { ZipArchive } from 'archiver';
import { db } from './src/db/index.ts';
import {
  users,
  clients,
  monthlyRequests,
  documentFiles,
  extractedDocuments,
  extractedLineItems,
  bankTransactions,
  validationExceptions,
  generatedWorkbooks,
  auditNotifications,
} from './src/db/schema.ts';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireAuth, requireClientUploadAuth, AuthRequest } from './src/middleware/auth.ts';
import { extractDocumentContent, computeFileHash, isValidGstinFormat, sanitizePostgresText } from './src/services/extractor.ts';
import { runValidationChecks } from './src/services/validator.ts';
import { evaluateMonthlyChecklist } from './src/services/checklistService.ts';
import { generateClientExcelWorkbook } from './src/services/excelGenerator.ts';
import { generateClientHtmlReport } from './src/services/htmlReportGenerator.ts';
import {
  generateMonthlyRequestMessage,
  generateReminderMessage,
  generateWorkbookReviewMessage,
  generateUploadAcknowledgementMessage,
  dispatchWhatsAppNotification,
  createWhatsAppDeepLink,
} from './src/services/messagingService.ts';
import { triggerMonthlyIntakeRequests, calculatePreviousMonthPeriod, checkAndDispatchDueReminders, generateSecureToken } from './src/services/scheduler.ts';
import { seedInitialData } from './src/db/seed.ts';


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure persistent local storage folders exist
const STORAGE_ROOT = path.resolve(process.cwd(), 'local_storage');
const UPLOAD_DIR = path.join(STORAGE_ROOT, 'uploads');
const WORKBOOK_DIR = path.join(STORAGE_ROOT, 'workbooks');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(WORKBOOK_DIR, { recursive: true });

// Multer storage for handling PDF, JPG, PNG, XLSX, CSV
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}_${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (_req, file, cb) => {
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: PDF, JPG, PNG, XLSX, CSV.`));
    }
  },
});

// Seed DB on startup if empty
(async () => {
  try {
    const existingClients = await db.select().from(clients).limit(1);
    if (existingClients.length === 0) {
      console.log('Database empty, auto-seeding sample clients and requests...');
      await seedInitialData();
    }
  } catch (err: any) {
    console.error('Initial DB seed check error:', err.message);
  }
})();

// ==========================================
// 1. CLIENTS & ROLES APIs
// ==========================================

// Get all clients (with role-based access filtering)
app.get('/api/clients', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    let allClients = await db.select().from(clients).orderBy(clients.businessName);

    // If staff user with specific assignments, filter accordingly
    if (req.user?.role === 'staff' && req.user.assignedClientIds && req.user.assignedClientIds.length > 0) {
      allClients = allClients.filter(c => req.user!.assignedClientIds!.includes(c.id));
    }

    res.json(allClients);
  } catch (err: any) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ error: 'Failed to fetch clients: ' + err.message });
  }
});

// Create or update client
app.post('/api/clients', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      id,
      businessName,
      contactPerson,
      gstin,
      registeredPhone,
      email,
      assignedStaffId,
      assignedStaffName,
      requiredChecklist,
      expectedBankAccounts,
      whatsappConsent,
      reminderCadenceDays,
      maxReminders,
    } = req.body;

    if (!businessName || !contactPerson || !gstin || !registeredPhone || !email) {
      return res.status(400).json({ error: 'Missing mandatory client fields.' });
    }

    if (!isValidGstinFormat(gstin)) {
      return res.status(400).json({ error: `Invalid GSTIN format "${gstin}". Must be 15 characters (e.g., 27AAACA1234A1Z5).` });
    }

    const clientId = id || `cli_${Math.random().toString(36).substring(2, 9)}`;

    await db.insert(clients).values({
      id: clientId,
      businessName,
      contactPerson,
      gstin: gstin.toUpperCase(),
      registeredPhone,
      email,
      assignedStaffId: assignedStaffId || 'staff_pooja_02',
      assignedStaffName: assignedStaffName || 'Pooja Verma',
      active: true,
      requiredChecklist: requiredChecklist || ['sales_invoices', 'purchase_invoices', 'bank_statements'],
      expectedBankAccounts: expectedBankAccounts || [],
      whatsappConsent: whatsappConsent !== undefined ? Boolean(whatsappConsent) : true,
      reminderCadenceDays: reminderCadenceDays || 3,
      maxReminders: maxReminders || 3,
      remindersPaused: false,
    }).onConflictDoUpdate({
      target: clients.id,
      set: {
        businessName,
        contactPerson,
        gstin: gstin.toUpperCase(),
        registeredPhone,
        email,
        assignedStaffId,
        assignedStaffName,
        requiredChecklist,
        expectedBankAccounts,
        whatsappConsent,
        reminderCadenceDays,
        maxReminders,
        updatedAt: new Date(),
      },
    });

    // Automatically ensure active monthly request for current period so client immediately appears in pipeline
    await autoCreateMonthlyRequestIfMissing(clientId, reminderCadenceDays);

    const saved = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    res.json(saved[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save client: ' + err.message });
  }
});

// Helper to auto-create monthly request for newly registered client
async function autoCreateMonthlyRequestIfMissing(clientId: string, cadenceDays: number = 3) {
  try {
    const period = calculatePreviousMonthPeriod();
    const existing = await db
      .select()
      .from(monthlyRequests)
      .where(
        and(
          eq(monthlyRequests.clientId, clientId),
          eq(monthlyRequests.reportingMonth, period.reportingMonth)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      const token = generateSecureToken();
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);
      const nextReminder = new Date();
      nextReminder.setDate(nextReminder.getDate() + (cadenceDays || 3));

      await db.insert(monthlyRequests).values({
        id: `req_${clientId.replace('cli_', '').slice(-6)}_${period.year}_${period.monthNumber < 10 ? '0' + period.monthNumber : period.monthNumber}`,
        clientId: clientId,
        reportingMonth: period.reportingMonth,
        year: period.year,
        monthNumber: period.monthNumber,
        status: 'Requested',
        secureUploadToken: token,
        tokenExpiresAt: tokenExpiresAt,
        reminderCount: 0,
        nextReminderAt: nextReminder,
        totalFilesReceived: 0,
        totalInvoicesExtracted: 0,
        unresolvedExceptionsCount: 0,
      });
    }
  } catch (e: any) {
    console.error('Error auto-creating monthly request for client:', clientId, e.message);
  }
}

// Bulk create or upsert clients (e.g. CSV import or multi-client upload)
app.post('/api/clients/bulk', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { clientList } = req.body;
    if (!Array.isArray(clientList) || clientList.length === 0) {
      return res.status(400).json({ error: 'Expected clientList to be a non-empty array.' });
    }

    const createdOrUpdated: any[] = [];
    const errors: any[] = [];

    for (const item of clientList) {
      try {
        if (!item.businessName || !item.contactPerson || !item.gstin || !item.registeredPhone || !item.email) {
          errors.push({ gstin: item.gstin || 'unknown', businessName: item.businessName || 'unknown', error: 'Missing mandatory fields' });
          continue;
        }

        const cleanGstin = String(item.gstin).trim().toUpperCase();
        if (!isValidGstinFormat(cleanGstin)) {
          errors.push({ gstin: cleanGstin, businessName: item.businessName, error: `Invalid GSTIN format "${cleanGstin}"` });
          continue;
        }

        const existing = await db.select().from(clients).where(eq(clients.gstin, cleanGstin)).limit(1);
        const clientId = existing[0]?.id || item.id || `cli_${Math.random().toString(36).substring(2, 9)}`;

        await db.insert(clients).values({
          id: clientId,
          businessName: item.businessName.trim(),
          contactPerson: item.contactPerson.trim(),
          gstin: cleanGstin,
          registeredPhone: String(item.registeredPhone).trim(),
          email: String(item.email).trim(),
          assignedStaffId: item.assignedStaffId || 'staff_pooja_02',
          assignedStaffName: item.assignedStaffName || 'Pooja Verma',
          active: item.active !== undefined ? Boolean(item.active) : true,
          requiredChecklist: item.requiredChecklist || ['sales_invoices', 'purchase_invoices', 'bank_statements'],
          expectedBankAccounts: item.expectedBankAccounts || [],
          whatsappConsent: item.whatsappConsent !== undefined ? Boolean(item.whatsappConsent) : true,
          reminderCadenceDays: Number(item.reminderCadenceDays) || 3,
          maxReminders: Number(item.maxReminders) || 3,
          remindersPaused: Boolean(item.remindersPaused),
        }).onConflictDoUpdate({
          target: clients.id,
          set: {
            businessName: item.businessName.trim(),
            contactPerson: item.contactPerson.trim(),
            gstin: cleanGstin,
            registeredPhone: String(item.registeredPhone).trim(),
            email: String(item.email).trim(),
            assignedStaffId: item.assignedStaffId || 'staff_pooja_02',
            assignedStaffName: item.assignedStaffName || 'Pooja Verma',
            active: item.active !== undefined ? Boolean(item.active) : true,
            whatsappConsent: item.whatsappConsent !== undefined ? Boolean(item.whatsappConsent) : true,
            reminderCadenceDays: Number(item.reminderCadenceDays) || 3,
            maxReminders: Number(item.maxReminders) || 3,
            remindersPaused: Boolean(item.remindersPaused),
            updatedAt: new Date(),
          },
        });

        await autoCreateMonthlyRequestIfMissing(clientId, item.reminderCadenceDays);
        createdOrUpdated.push({ id: clientId, businessName: item.businessName, gstin: cleanGstin });
      } catch (subErr: any) {
        errors.push({ gstin: item.gstin, error: subErr.message });
      }
    }

    res.json({
      success: true,
      totalProcessed: clientList.length,
      successCount: createdOrUpdated.length,
      errorCount: errors.length,
      createdOrUpdated,
      errors,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Bulk client operation failed: ' + err.message });
  }
});

// Bulk batch update properties on selected client IDs (e.g. pause reminders, change cadence, assign staff)
app.post('/api/clients/batch-update', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { clientIds, updates } = req.body;
    if (!Array.isArray(clientIds) || clientIds.length === 0) {
      return res.status(400).json({ error: 'Expected clientIds array.' });
    }

    const allowedUpdates: Record<string, any> = { updatedAt: new Date() };
    if (updates.remindersPaused !== undefined) allowedUpdates.remindersPaused = Boolean(updates.remindersPaused);
    if (updates.whatsappConsent !== undefined) allowedUpdates.whatsappConsent = Boolean(updates.whatsappConsent);
    if (updates.active !== undefined) allowedUpdates.active = Boolean(updates.active);
    if (updates.reminderCadenceDays !== undefined) allowedUpdates.reminderCadenceDays = Number(updates.reminderCadenceDays);
    if (updates.maxReminders !== undefined) allowedUpdates.maxReminders = Number(updates.maxReminders);
    if (updates.assignedStaffId) {
      allowedUpdates.assignedStaffId = updates.assignedStaffId;
      allowedUpdates.assignedStaffName = updates.assignedStaffName || updates.assignedStaffId;
    }

    let updatedCount = 0;
    for (const cid of clientIds) {
      await db.update(clients).set(allowedUpdates).where(eq(clients.id, cid));
      if (updates.remindersPaused !== undefined) {
        await db.update(monthlyRequests).set({ remindersPaused: Boolean(updates.remindersPaused) }).where(eq(monthlyRequests.clientId, cid));
      }
      updatedCount++;
    }

    res.json({ success: true, updatedCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Batch update failed: ' + err.message });
  }
});

// ==========================================
// 2. MONTHLY REQUESTS & STATUSES APIs
// ==========================================

// List monthly requests
app.get('/api/monthly-requests', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId, status, month } = req.query;

    let query = db
      .select({
        request: monthlyRequests,
        client: clients,
      })
      .from(monthlyRequests)
      .innerJoin(clients, eq(monthlyRequests.clientId, clients.id))
      .orderBy(desc(monthlyRequests.requestedAt));

    const results = await query;

    // In-memory filter for flexible query combinations
    let filtered = results;
    if (clientId) {
      filtered = filtered.filter(r => r.request.clientId === clientId);
    }
    if (status) {
      filtered = filtered.filter(r => r.request.status === status);
    }
    if (month) {
      filtered = filtered.filter(r => r.request.reportingMonth === month);
    }

    // Role-based filtering for staff
    if (req.user?.role === 'staff' && req.user.assignedClientIds && req.user.assignedClientIds.length > 0) {
      filtered = filtered.filter(r => req.user!.assignedClientIds!.includes(r.request.clientId));
    }

    const payload = filtered.map(r => ({
      ...r.request,
      clientName: r.client.businessName,
      clientGstin: r.client.gstin,
      contactPerson: r.client.contactPerson,
      registeredPhone: r.client.registeredPhone,
      assignedStaffName: r.client.assignedStaffName,
    }));

    res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch monthly requests: ' + err.message });
  }
});

// Get single monthly request with all related files, extracted items, bank txns, exceptions, workbooks
app.get('/api/monthly-requests/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const reqList = await db
      .select({
        request: monthlyRequests,
        client: clients,
      })
      .from(monthlyRequests)
      .innerJoin(clients, eq(monthlyRequests.clientId, clients.id))
      .where(eq(monthlyRequests.id, id))
      .limit(1);

    if (reqList.length === 0) {
      return res.status(404).json({ error: 'Monthly request not found.' });
    }

    const item = reqList[0];
    const files = await db
      .select()
      .from(documentFiles)
      .where(eq(documentFiles.monthlyRequestId, id))
      .orderBy(desc(documentFiles.receivedTime));

    const extracted = await db
      .select()
      .from(extractedDocuments)
      .where(eq(extractedDocuments.monthlyRequestId, id))
      .orderBy(extractedDocuments.docDate);

    const docIds = extracted.map(d => d.id);
    let lineItemsList: any[] = [];
    if (docIds.length > 0) {
      lineItemsList = await db
        .select()
        .from(extractedLineItems)
        .where(sql`${extractedLineItems.documentUnitId} IN ${docIds}`);
    }

    const bankTxns = await db
      .select()
      .from(bankTransactions)
      .where(eq(bankTransactions.monthlyRequestId, id))
      .orderBy(bankTransactions.transactionDate);

    const exceptions = await db
      .select()
      .from(validationExceptions)
      .where(eq(validationExceptions.monthlyRequestId, id))
      .orderBy(desc(validationExceptions.severity));

    const workbooks = await db
      .select()
      .from(generatedWorkbooks)
      .where(eq(generatedWorkbooks.monthlyRequestId, id))
      .orderBy(desc(generatedWorkbooks.version));

    const checklistEvaluation = evaluateMonthlyChecklist({
      client: {
        requiredChecklist: item.client.requiredChecklist || [],
        expectedBankAccounts: item.client.expectedBankAccounts || [],
      },
      request: {
        reportingMonth: item.request.reportingMonth,
        noTransactionsDeclared: item.request.noTransactionsDeclared,
        categoryDeclarations: (item.request.categoryDeclarations as any) || {},
      },
      extractedDocs: extracted,
      files,
      bankTransactions: bankTxns,
      manualExceptions: exceptions,
    });

    res.json({
      request: item.request,
      client: item.client,
      files,
      extractedDocuments: extracted,
      lineItems: lineItemsList,
      bankTransactions: bankTxns,
      exceptions,
      workbooks,
      checklist: checklistEvaluation.checklist,
      missingItems: checklistEvaluation.missingItems,
      isFullySatisfied: checklistEvaluation.isFullySatisfied,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch details: ' + err.message });
  }
});

// Trigger monthly scheduled intake job (1st of month at 9:00 AM IST or manual trigger)
app.post('/api/monthly-requests/schedule-trigger', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { overrideMonth, mode } = req.body;
    let periodInfo = calculatePreviousMonthPeriod();

    if (overrideMonth) {
      // Custom format e.g. "August 2026"
      const parts = overrideMonth.split(' ');
      periodInfo = {
        year: parseInt(parts[1] || '2026', 10),
        monthNumber: 8,
        reportingMonth: overrideMonth,
        reportingCode: '2026-08',
      };
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;

    const triggerResult = await triggerMonthlyIntakeRequests({
      overridePeriod: periodInfo,
      appBaseUrl: baseUrl,
      messagingMode: mode || 'manual',
    });

    res.json(triggerResult);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to trigger schedule: ' + err.message });
  }
});

// Middleware for internal worker (n8n orchestrator) or authenticated staff
const requireWorkerOrAuth = async (req: AuthRequest, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  const workerSecret = process.env.INTERNAL_WORKER_SECRET || 'ps_internal_worker_key_2026';

  if (authHeader && (authHeader === `Bearer ${workerSecret}` || authHeader.replace('Bearer ', '').trim() === workerSecret)) {
    req.user = {
      uid: 'n8n-worker',
      email: 'n8n-worker@system.local',
      role: 'ca_admin',
      displayName: 'n8n Orchestrator Worker',
      assignedClientIds: [],
    };
    return next();
  }

  return requireAuth(req, res, next);
};

// n8n Scheduler Endpoint: Trigger monthly document intake (1st of month at 9:00 AM IST)
app.post('/api/scheduler/run-monthly', requireWorkerOrAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { overrideMonth, mode } = req.body || {};
    let periodInfo = calculatePreviousMonthPeriod();

    if (overrideMonth) {
      const parts = overrideMonth.split(' ');
      periodInfo = {
        year: parseInt(parts[1] || '2026', 10),
        monthNumber: 8,
        reportingMonth: overrideMonth,
        reportingCode: '2026-08',
      };
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;

    const triggerResult = await triggerMonthlyIntakeRequests({
      overridePeriod: periodInfo,
      appBaseUrl: baseUrl,
      messagingMode: mode || (process.env.META_WHATSAPP_TOKEN ? 'automated' : 'manual'),
    });

    console.log(`[n8n Scheduler] Monthly run triggered for ${triggerResult.period.reportingMonth}. Total clients: ${triggerResult.totalClients}`);
    res.json({ success: true, ...triggerResult });
  } catch (err: any) {
    console.error('[n8n Scheduler] Run monthly error:', err.message);
    res.status(500).json({ error: 'Failed to run monthly scheduler: ' + err.message });
  }
});

// n8n Scheduler Endpoint: Scan & dispatch due reminders (Daily at 10:30 AM IST)
app.post('/api/scheduler/check-reminders', requireWorkerOrAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { mode } = req.body || {};
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;

    const results = await checkAndDispatchDueReminders({
      appBaseUrl: baseUrl,
      messagingMode: mode || (process.env.META_WHATSAPP_TOKEN ? 'automated' : 'manual'),
    });

    console.log(`[n8n Scheduler] Daily reminders checked: ${results.totalChecked} checked, ${results.processedCount} processed.`);
    res.json({ success: true, ...results });
  } catch (err: any) {
    console.error('[n8n Scheduler] Check reminders error:', err.message);
    res.status(500).json({ error: 'Failed to check reminders: ' + err.message });
  }
});

// ==========================================
// 3. REMINDERS & MESSAGING APIs
// ==========================================

// Dispatch reminder for missing items
app.post('/api/monthly-requests/:id/reminder', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { mode } = req.body; // 'manual' | 'automated'

    const reqList = await db
      .select({
        request: monthlyRequests,
        client: clients,
      })
      .from(monthlyRequests)
      .innerJoin(clients, eq(monthlyRequests.clientId, clients.id))
      .where(eq(monthlyRequests.id, id))
      .limit(1);

    if (reqList.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const { request: mr, client } = reqList[0];

    // Check if reminders paused or consent withdrawn
    if (mr.remindersPaused || client.remindersPaused || !client.whatsappConsent) {
      return res.status(400).json({
        error: 'Reminders are paused or WhatsApp consent has been withdrawn by client.',
      });
    }

    // Check max reminder limit
    if (mr.reminderCount >= (client.maxReminders || 3)) {
      return res.status(400).json({
        error: `Maximum reminder limit (${client.maxReminders || 3}) reached for this monthly request. Escalated to staff.`,
      });
    }

    // Determine pending items
    const exceptions = await db
      .select()
      .from(validationExceptions)
      .where(and(eq(validationExceptions.monthlyRequestId, id), eq(validationExceptions.resolved, false)));

    let missingText = '';
    const pendingCatExceptions = exceptions.filter(e => e.checkType === 'category_missing' || e.checkType === 'period_coverage_gap');
    if (pendingCatExceptions.length > 0) {
      missingText = pendingCatExceptions.map((e, idx) => `${idx + 1}. ${e.message}`).join('\n');
    } else {
      missingText = '1. Remaining Sales / Purchase Invoices\n2. Bank Statement for the month';
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const secureUploadLink = `${baseUrl}/client-portal?token=${mr.secureUploadToken}`;

    const reminderMsg = generateReminderMessage({
      clientName: client.contactPerson,
      reportingMonth: mr.reportingMonth,
      missingItemsText: missingText,
      secureUploadLink,
    });

    const dispatchResult = await dispatchWhatsAppNotification({
      phone: client.registeredPhone,
      recipientName: client.contactPerson,
      messageText: reminderMsg,
      mode: mode || 'manual',
    });

    // Update reminder count & timestamp
    const nextReminder = new Date();
    nextReminder.setDate(nextReminder.getDate() + (client.reminderCadenceDays || 3));

    await db
      .update(monthlyRequests)
      .set({
        reminderCount: mr.reminderCount + 1,
        lastReminderAt: new Date(),
        nextReminderAt: nextReminder,
        status: 'Missing Documents',
        updatedAt: new Date(),
      })
      .where(eq(monthlyRequests.id, id));

    // Audit log
    await db.insert(auditNotifications).values({
      id: `aud_rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      monthlyRequestId: id,
      clientId: client.id,
      eventType: 'reminder_prepared',
      channel: dispatchResult.mode === 'automated_meta_api' ? 'whatsapp_cloud_api' : 'whatsapp_manual',
      recipient: client.registeredPhone,
      messageBody: reminderMsg,
      status: dispatchResult.status,
      details: {
        mode: dispatchResult.mode,
        details: dispatchResult.details,
        deepLink: dispatchResult.whatsappDeepLink,
        reminderNumber: mr.reminderCount + 1,
      },
    });

    res.json({
      success: true,
      reminderCount: mr.reminderCount + 1,
      dispatchResult,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to send reminder: ' + err.message });
  }
});

// Pause / resume reminders
app.post('/api/monthly-requests/:id/pause-reminders', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paused } = req.body;

    await db
      .update(monthlyRequests)
      .set({
        remindersPaused: Boolean(paused),
        updatedAt: new Date(),
      })
      .where(eq(monthlyRequests.id, id));

    res.json({ success: true, remindersPaused: Boolean(paused) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update reminder status: ' + err.message });
  }
});

// ==========================================
// 4. DOCUMENT UPLOAD & INTAKE ZONE
// ==========================================

// Handle multi-file document upload (from staff or client portal)
app.post('/api/documents/upload', upload.array('files', 15), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided for upload.' });
    }

    const { monthlyRequestId, uploaderName, source, clientGstinOverride } = req.body;
    if (!monthlyRequestId) {
      return res.status(400).json({ error: 'monthlyRequestId is required.' });
    }

    // Fetch monthly request & client
    const reqList = await db
      .select({
        request: monthlyRequests,
        client: clients,
      })
      .from(monthlyRequests)
      .innerJoin(clients, eq(monthlyRequests.clientId, clients.id))
      .where(eq(monthlyRequests.id, monthlyRequestId))
      .limit(1);

    if (reqList.length === 0) {
      return res.status(404).json({ error: 'Invalid monthly request ID.' });
    }

    const { request: mr, client } = reqList[0];
    const clientGstin = clientGstinOverride || client.gstin;

    const processedDocs: any[] = [];
    const newExceptions: any[] = [];

    for (const f of files) {
      const buffer = fs.readFileSync(f.path);
      const fileHash = computeFileHash(buffer);

      // Check duplicate file hash in this monthly request
      const existingFileWithHash = await db
        .select()
        .from(documentFiles)
        .where(
          and(
            eq(documentFiles.monthlyRequestId, monthlyRequestId),
            eq(documentFiles.fileHash, fileHash)
          )
        )
        .limit(1);

      const isDuplicate = existingFileWithHash.length > 0;
      const fileId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Save document file entry
      await db.insert(documentFiles).values({
        id: fileId,
        monthlyRequestId,
        clientId: client.id,
        gstin: clientGstin,
        reportingPeriod: mr.reportingMonth,
        originalFilename: f.originalname,
        storagePath: f.path,
        fileHash,
        mimeType: f.mimetype,
        sizeBytes: f.size,
        source: source || 'client_portal',
        uploaderName: uploaderName || client.contactPerson,
        status: isDuplicate ? 'duplicate_flagged' : 'processing',
        isDuplicate,
        duplicateOfId: isDuplicate ? existingFileWithHash[0].id : null,
      });

      // Run document extraction
      const extractedList = await extractDocumentContent(buffer, f.originalname, clientGstin, f.mimetype);

      for (const item of extractedList) {
        const docUnitId = `ext_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        await db.insert(extractedDocuments).values({
          id: docUnitId,
          documentFileId: fileId,
          monthlyRequestId,
          clientId: client.id,
          gstin: clientGstin,
          docType: item.docType,
          docNumber: sanitizePostgresText(item.docNumber),
          docDate: item.docDate,
          supplierName: sanitizePostgresText(item.supplierName),
          supplierGstin: sanitizePostgresText(item.supplierGstin),
          supplierAddress: sanitizePostgresText(item.supplierAddress),
          buyerName: sanitizePostgresText(item.buyerName),
          buyerGstin: sanitizePostgresText(item.buyerGstin),
          buyerAddress: sanitizePostgresText(item.buyerAddress),
          placeOfSupply: sanitizePostgresText(item.placeOfSupply),
          originalInvoiceRef: sanitizePostgresText(item.originalInvoiceRef),
          reverseCharge: Boolean(item.reverseCharge),
          currency: item.currency || 'INR',
          taxableAmount: String(item.taxableAmount || 0),
          cgstAmount: String(item.cgstAmount || 0),
          sgstAmount: String(item.sgstAmount || 0),
          igstAmount: String(item.igstAmount || 0),
          cessAmount: String(item.cessAmount || 0),
          roundOff: String(item.roundOff || 0),
          totalAmount: String(item.totalAmount || 0),
          rawText: sanitizePostgresText(item.rawText) || `Scanned document: ${sanitizePostgresText(f.originalname)}`,
          extractionConfidence: String(item.extractionConfidence || 95),
          reviewStatus: 'auto_extracted',
          additionalFields: item.additionalFields || {},
        });

        // Insert Line items
        if (item.lineItems && item.lineItems.length > 0) {
          for (const line of item.lineItems) {
            await db.insert(extractedLineItems).values({
              id: `li_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              documentUnitId: docUnitId,
              itemDescription: sanitizePostgresText(line.itemDescription) || 'Line item',
              hsnSac: sanitizePostgresText(line.hsnSac),
              quantity: line.quantity ? String(line.quantity) : null,
              unit: line.unit,
              rate: line.rate ? String(line.rate) : null,
              discount: String(line.discount || 0),
              taxableValue: String(line.taxableValue || 0),
              taxRatePercent: String(line.taxRatePercent || 18),
              cgstAmount: String(line.cgstAmount || 0),
              sgstAmount: String(line.sgstAmount || 0),
              igstAmount: String(line.igstAmount || 0),
              cessAmount: String(line.cessAmount || 0),
              totalAmount: String(line.totalAmount || 0),
            });
          }
        }

        // Insert Bank Transactions if bank statement
        if (item.bankTransactions && item.bankTransactions.length > 0) {
          for (const tx of item.bankTransactions) {
            await db.insert(bankTransactions).values({
              id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              documentUnitId: docUnitId,
              monthlyRequestId,
              bankName: sanitizePostgresText(tx.bankName),
              accountNumber: sanitizePostgresText(tx.accountNumber),
              transactionDate: tx.transactionDate,
              valueDate: tx.valueDate,
              narration: sanitizePostgresText(tx.narration) || 'Transaction',
              referenceNumber: tx.referenceNumber,
              debitAmount: String(tx.debitAmount || 0),
              creditAmount: String(tx.creditAmount || 0),
              balance: tx.balance ? String(tx.balance) : null,
            });
          }
        }

        processedDocs.push({ ...item, id: docUnitId });
      }

      // Update document file status to processed
      await db
        .update(documentFiles)
        .set({ status: 'processed' })
        .where(eq(documentFiles.id, fileId));
    }

    // Now re-run Validation Engine across all docs for this monthly request
    const allFiles = await db.select().from(documentFiles).where(eq(documentFiles.monthlyRequestId, monthlyRequestId));
    const allDocs = await db.select().from(extractedDocuments).where(eq(extractedDocuments.monthlyRequestId, monthlyRequestId));
    const allBankTxns = await db.select().from(bankTransactions).where(eq(bankTransactions.monthlyRequestId, monthlyRequestId));

    const checkResults = runValidationChecks({
      client: {
        id: client.id,
        businessName: client.businessName,
        gstin: client.gstin,
        requiredChecklist: client.requiredChecklist || [],
        expectedBankAccounts: client.expectedBankAccounts || [],
      },
      request: {
        id: mr.id,
        reportingMonth: mr.reportingMonth,
        noTransactionsDeclared: mr.noTransactionsDeclared,
      },
      files: allFiles.map(f => ({
        id: f.id,
        originalFilename: f.originalFilename,
        isDuplicate: f.isDuplicate,
        isPasswordProtected: f.isPasswordProtected,
        status: f.status,
      })),
      extractedDocs: allDocs,
      bankTransactions: allBankTxns,
    });

    // Clear previous unresolved exceptions so we don't accumulate duplicates
    await db
      .delete(validationExceptions)
      .where(and(
        eq(validationExceptions.monthlyRequestId, monthlyRequestId),
        eq(validationExceptions.resolved, false)
      ));

    // Save newly calculated unresolved exceptions to DB
    for (const chk of checkResults) {
      await db.insert(validationExceptions).values({
        id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        monthlyRequestId,
        documentFileId: chk.documentFileId,
        documentUnitId: chk.documentUnitId,
        severity: chk.severity,
        checkType: chk.checkType,
        message: chk.message,
        details: chk.details || {},
        resolved: false,
      });
      newExceptions.push(chk);
    }

    // Evaluate dynamic checklist and detect any missing files
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const secureUploadLink = `${baseUrl}/client-portal?token=${mr.secureUploadToken}`;

    const checklistEvaluation = evaluateMonthlyChecklist({
      client: {
        requiredChecklist: client.requiredChecklist || [],
        expectedBankAccounts: client.expectedBankAccounts || [],
      },
      request: {
        reportingMonth: mr.reportingMonth,
        noTransactionsDeclared: mr.noTransactionsDeclared,
        categoryDeclarations: (mr.categoryDeclarations as any) || {},
      },
      extractedDocs: allDocs,
      files: allFiles,
      bankTransactions: allBankTxns,
      manualExceptions: checkResults,
    });

    const hasMissingItems = checklistEvaluation.missingItems.length > 0;
    const newStatus = hasMissingItems ? 'Missing Documents' : 'Needs Review';

    // Update monthly request counts and status
    await db
      .update(monthlyRequests)
      .set({
        totalFilesReceived: allFiles.length,
        totalInvoicesExtracted: allDocs.length,
        unresolvedExceptionsCount: checkResults.length,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(monthlyRequests.id, monthlyRequestId));

    // Automated Acknowledgement Generation & Notification with missing documents list
    const ackRef = `ACK_${Date.now().toString(36).toUpperCase()}`;
    const fileSummaryText = files.map(f => `• ${f.originalname}`).join('\n');

    const ackMessageText = generateUploadAcknowledgementMessage({
      clientName: client.contactPerson,
      businessName: client.businessName,
      reportingMonth: mr.reportingMonth,
      filesSummaryText: fileSummaryText,
      extractedCount: processedDocs.length,
      ackReferenceId: ackRef,
      missingItems: checklistEvaluation.missingItems,
      secureUploadLink,
    });

    const dispatchResult = await dispatchWhatsAppNotification({
      phone: client.registeredPhone,
      recipientName: client.contactPerson,
      messageText: ackMessageText,
      mode: process.env.META_WHATSAPP_TOKEN ? 'automated' : 'manual',
    });

    // Log acknowledgement in audit notifications table
    await db.insert(auditNotifications).values({
      id: `aud_ack_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      monthlyRequestId,
      clientId: client.id,
      eventType: 'receipt_acknowledged',
      channel: dispatchResult.mode === 'automated_meta_api' ? 'whatsapp_cloud_api' : 'whatsapp_manual',
      recipient: client.registeredPhone,
      messageBody: ackMessageText,
      status: dispatchResult.status,
      details: {
        ackReferenceId: ackRef,
        filesUploadedCount: files.length,
        extractedCount: processedDocs.length,
        missingItems: checklistEvaluation.missingItems,
        isFullySatisfied: checklistEvaluation.isFullySatisfied,
        dispatch: dispatchResult,
      },
    });

    res.json({
      success: true,
      ackReferenceId: ackRef,
      ackMessage: ackMessageText,
      filesUploaded: files.length,
      extractedCount: processedDocs.length,
      isFullySatisfied: checklistEvaluation.isFullySatisfied,
      missingItems: checklistEvaluation.missingItems,
      checklist: checklistEvaluation.checklist,
      exceptionsFound: checkResults.length,
      status: newStatus,
      dispatchResult,
    });
  } catch (err: any) {
    console.error('Upload processing error:', err);
    res.status(500).json({ error: 'Failed to process upload: ' + err.message });
  }
});

// Download original document file
app.get('/api/documents/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await db.select().from(documentFiles).where(eq(documentFiles.id, id)).limit(1);

    if (doc.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const fileRec = doc[0];
    if (fs.existsSync(fileRec.storagePath)) {
      res.setHeader('Content-Disposition', `attachment; filename="${fileRec.originalFilename}"`);
      return res.sendFile(fileRec.storagePath);
    }

    // If file in storage path does not exist on disk, return synthetic representation
    res.setHeader('Content-Type', fileRec.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileRec.originalFilename}"`);
    res.send(`Professional Samadhan Archive\nDocument ID: ${fileRec.id}\nOriginal File: ${fileRec.originalFilename}\nSHA-256 Digest: ${fileRec.fileHash}\nStatus: Verified`);
  } catch (err: any) {
    res.status(500).json({ error: 'Download failed: ' + err.message });
  }
});

// Update extracted document fields (Staff review & corrections)
app.patch('/api/extracted-documents/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      docType,
      docNumber,
      docDate,
      supplierName,
      supplierGstin,
      buyerName,
      buyerGstin,
      placeOfSupply,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
      reviewStatus,
      reviewerNotes,
    } = req.body;

    await db
      .update(extractedDocuments)
      .set({
        docType,
        docNumber,
        docDate,
        supplierName,
        supplierGstin,
        buyerName,
        buyerGstin,
        placeOfSupply,
        taxableAmount: taxableAmount !== undefined ? String(taxableAmount) : undefined,
        cgstAmount: cgstAmount !== undefined ? String(cgstAmount) : undefined,
        sgstAmount: sgstAmount !== undefined ? String(sgstAmount) : undefined,
        igstAmount: igstAmount !== undefined ? String(igstAmount) : undefined,
        totalAmount: totalAmount !== undefined ? String(totalAmount) : undefined,
        reviewStatus: reviewStatus || 'verified',
        reviewerNotes,
      })
      .where(eq(extractedDocuments.id, id));

    const updated = await db.select().from(extractedDocuments).where(eq(extractedDocuments.id, id)).limit(1);
    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update extracted document: ' + err.message });
  }
});

// Resolve or override validation exception
app.patch('/api/validation-exceptions/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { resolved, resolutionNotes } = req.body;

    await db
      .update(validationExceptions)
      .set({
        resolved: Boolean(resolved),
        resolvedBy: req.user?.displayName || 'Staff Reviewer',
        resolutionNotes,
      })
      .where(eq(validationExceptions.id, id));

    res.json({ success: true, id, resolved: Boolean(resolved) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update exception: ' + err.message });
  }
});

// ==========================================
// 5. EXCEL WORKBOOK GENERATION & DOWNLOAD
// ==========================================

// Generate client workbook
app.post('/api/monthly-requests/:id/generate-workbook', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const reqList = await db
      .select({
        request: monthlyRequests,
        client: clients,
      })
      .from(monthlyRequests)
      .innerJoin(clients, eq(monthlyRequests.clientId, clients.id))
      .where(eq(monthlyRequests.id, id))
      .limit(1);

    if (reqList.length === 0) {
      return res.status(404).json({ error: 'Monthly request not found.' });
    }

    const { request: mr, client } = reqList[0];

    // Check critical unresolved exceptions
    const exceptions = await db
      .select()
      .from(validationExceptions)
      .where(eq(validationExceptions.monthlyRequestId, id));

    const criticalUnresolved = exceptions.filter(e => !e.resolved && e.severity === 'critical');
    // If critical exceptions exist, workbook will be generated as 'draft'
    const newVersion = (mr.activeWorkbookVersion || 0) + 1;

    const files = await db.select().from(documentFiles).where(eq(documentFiles.monthlyRequestId, id));
    const allDocs = await db.select().from(extractedDocuments).where(eq(extractedDocuments.monthlyRequestId, id));
    const docIds = allDocs.map(d => d.id);

    let allLineItems: any[] = [];
    if (docIds.length > 0) {
      allLineItems = await db
        .select()
        .from(extractedLineItems)
        .where(sql`${extractedLineItems.documentUnitId} IN ${docIds}`);
    }

    const bankTxns = await db.select().from(bankTransactions).where(eq(bankTransactions.monthlyRequestId, id));

    const salesDocs = allDocs.filter(d => d.docType === 'sales_invoice');
    const salesDocIds = salesDocs.map(d => d.id);
    const salesLines = allLineItems.filter(l => salesDocIds.includes(l.documentUnitId));

    const purchaseDocs = allDocs.filter(d => d.docType === 'purchase_invoice');
    const purchaseDocIds = purchaseDocs.map(d => d.id);
    const purchaseLines = allLineItems.filter(l => purchaseDocIds.includes(l.documentUnitId));

    const debitDocs = allDocs.filter(d => d.docType === 'debit_note');
    const creditDocs = allDocs.filter(d => d.docType === 'credit_note');

    // Generate Excel with exceljs
    const { buffer, filename } = await generateClientExcelWorkbook({
      client: {
        id: client.id,
        businessName: client.businessName,
        gstin: client.gstin,
        contactPerson: client.contactPerson,
        registeredPhone: client.registeredPhone,
        email: client.email,
      },
      request: {
        id: mr.id,
        reportingMonth: mr.reportingMonth,
        status: criticalUnresolved.length > 0 ? 'draft_with_exceptions' : 'awaiting_client_confirmation',
        version: newVersion,
        declaredAt: mr.declaredAt ? mr.declaredAt.toISOString() : null,
        noTransactionsDeclared: mr.noTransactionsDeclared,
      },
      files: files.map(f => ({
        id: f.id,
        originalFilename: f.originalFilename,
        fileHash: f.fileHash,
        receivedTime: f.receivedTime.toISOString(),
        source: f.source,
        status: f.status,
        scanMethod: f.scanMethod,
      })),
      salesInvoices: salesDocs,
      salesLineItems: salesLines,
      purchaseInvoices: purchaseDocs,
      purchaseLineItems: purchaseLines,
      debitNotes: debitDocs,
      creditNotes: creditDocs,
      bankTransactions: bankTxns,
      exceptions: exceptions.map(e => ({
        id: e.id,
        severity: e.severity,
        checkType: e.checkType,
        message: e.message,
        resolved: e.resolved,
        resolutionNotes: e.resolutionNotes,
      })),
      generatedBy: req.user?.displayName || 'Pooja Verma (Senior Associate)',
    });

    const workbookFilePath = path.join(WORKBOOK_DIR, filename);
    fs.writeFileSync(workbookFilePath, buffer);

    const workbookId = `wb_${Date.now()}_v${newVersion}`;

    await db.insert(generatedWorkbooks).values({
      id: workbookId,
      monthlyRequestId: id,
      clientId: client.id,
      gstin: client.gstin,
      reportingPeriod: mr.reportingMonth,
      version: newVersion,
      filename,
      filePath: workbookFilePath,
      status: 'awaiting_client_confirmation',
      generatedBy: req.user?.displayName || 'Pooja Verma (Senior Associate)',
      dataSnapshot: {
        totalSales: salesDocs.length,
        totalPurchases: purchaseDocs.length,
        totalBankTxns: bankTxns.length,
        unresolvedExceptions: exceptions.filter(e => !e.resolved).length,
      },
    });

    await db
      .update(monthlyRequests)
      .set({
        activeWorkbookVersion: newVersion,
        status: 'Awaiting Client Confirmation',
        updatedAt: new Date(),
      })
      .where(eq(monthlyRequests.id, id));

    res.json({
      success: true,
      workbookId,
      filename,
      version: newVersion,
      unresolvedExceptions: criticalUnresolved.length,
    });
  } catch (err: any) {
    console.error('Workbook generation error:', err);
    res.status(500).json({ error: 'Failed to generate workbook: ' + err.message });
  }
});

// Download generated workbook
app.get('/api/workbooks/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const wb = await db.select().from(generatedWorkbooks).where(eq(generatedWorkbooks.id, id)).limit(1);

    if (wb.length === 0) {
      return res.status(404).json({ error: 'Workbook not found.' });
    }

    const wbRec = wb[0];
    if (fs.existsSync(wbRec.filePath)) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${wbRec.filename}"`);
      return res.sendFile(wbRec.filePath);
    }

    // If file missing on disk, regenerate on the fly
    const reqList = await db
      .select({
        request: monthlyRequests,
        client: clients,
      })
      .from(monthlyRequests)
      .innerJoin(clients, eq(monthlyRequests.clientId, clients.id))
      .where(eq(monthlyRequests.id, wbRec.monthlyRequestId))
      .limit(1);

    if (reqList.length > 0) {
      const { request: mr, client } = reqList[0];
      const allDocs = await db.select().from(extractedDocuments).where(eq(extractedDocuments.monthlyRequestId, mr.id));
      const docIds = allDocs.map(d => d.id);
      let allLineItems: any[] = [];
      if (docIds.length > 0) {
        allLineItems = await db.select().from(extractedLineItems).where(sql`${extractedLineItems.documentUnitId} IN ${docIds}`);
      }
      const files = await db.select().from(documentFiles).where(eq(documentFiles.monthlyRequestId, mr.id));
      const bankTxns = await db.select().from(bankTransactions).where(eq(bankTransactions.monthlyRequestId, mr.id));
      const exceptions = await db.select().from(validationExceptions).where(eq(validationExceptions.monthlyRequestId, mr.id));

      const { buffer, filename } = await generateClientExcelWorkbook({
        client: {
          id: client.id,
          businessName: client.businessName,
          gstin: client.gstin,
          contactPerson: client.contactPerson,
          registeredPhone: client.registeredPhone,
          email: client.email,
        },
        request: {
          id: mr.id,
          reportingMonth: mr.reportingMonth,
          status: wbRec.status,
          version: wbRec.version,
        },
        files: files.map(f => ({
          id: f.id,
          originalFilename: f.originalFilename,
          fileHash: f.fileHash,
          receivedTime: f.receivedTime.toISOString(),
          source: f.source,
          status: f.status,
        })),
        salesInvoices: allDocs.filter(d => d.docType === 'sales_invoice'),
        salesLineItems: allLineItems,
        purchaseInvoices: allDocs.filter(d => d.docType === 'purchase_invoice'),
        purchaseLineItems: allLineItems,
        debitNotes: allDocs.filter(d => d.docType === 'debit_note'),
        creditNotes: allDocs.filter(d => d.docType === 'credit_note'),
        bankTransactions: bankTxns,
        exceptions: exceptions.map(e => ({
          id: e.id,
          severity: e.severity,
          checkType: e.checkType,
          message: e.message,
          resolved: e.resolved,
          resolutionNotes: e.resolutionNotes,
        })),
        generatedBy: wbRec.generatedBy,
      });

      fs.writeFileSync(wbRec.filePath, buffer);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    }

    res.status(404).json({ error: 'Workbook file not found' });
  } catch (err: any) {
    res.status(500).json({ error: 'Download failed: ' + err.message });
  }
});

// Stream all uploaded documents, statements, and Excel workbooks for a client into a single .zip to the CA's local PC
app.get('/api/monthly-requests/:id/download-package', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const purgeAfter = req.query.purge === 'true';

    const reqList = await db
      .select({
        request: monthlyRequests,
        client: clients,
      })
      .from(monthlyRequests)
      .innerJoin(clients, eq(monthlyRequests.clientId, clients.id))
      .where(eq(monthlyRequests.id, id))
      .limit(1);

    if (reqList.length === 0) {
      return res.status(404).json({ error: 'Monthly request not found.' });
    }

    const { request: mr, client } = reqList[0];
    const files = await db.select().from(documentFiles).where(eq(documentFiles.monthlyRequestId, id));
    const workbooks = await db.select().from(generatedWorkbooks).where(eq(generatedWorkbooks.monthlyRequestId, id));

    const sanitizedClient = client.businessName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedMonth = mr.reportingMonth.replace(/[^a-zA-Z0-9_-]/g, '_');
    const zipFilename = `${sanitizedClient}_${sanitizedMonth}_GST_Package.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    const archive = new ZipArchive({ zlib: { level: 9 } });

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) res.status(500).send({ error: err.message });
    });

    archive.pipe(res);

    // 1. Add Summary Manifest
    const manifestText = `PROFESSIONAL SAMADHAN CHARTERED ACCOUNTANTS
STATUTORY GST CLIENT PACKAGE
===========================================================
Client Business : ${client.businessName}
GSTIN           : ${client.gstin}
Contact Person  : ${client.contactPerson} (${client.registeredPhone})
Email           : ${client.email}
Reporting Month : ${mr.reportingMonth}
Package Export  : ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Total Documents : ${files.length}
Invoices Count  : ${mr.totalInvoicesExtracted}
Status          : ${mr.status}

FILES INCLUDED IN THIS PACKAGE:
${files.length > 0 ? files.map((f, i) => `${i + 1}. [${f.source}] ${f.originalFilename} (${(f.sizeBytes / 1024).toFixed(1)} KB) - Hash: ${f.fileHash}`).join('\n') : 'No uploaded document files recorded.'}

WORKBOOKS INCLUDED:
${workbooks.length > 0 ? workbooks.map((w, i) => `${i + 1}. v${w.version} ${w.filename} (${w.status})`).join('\n') : 'No workbooks generated yet.'}
===========================================================
Downloaded directly to Local PC storage.
Extracted GST tax line items remain preserved in Neon PostgreSQL Database.`;

    archive.append(manifestText, { name: 'PACKAGE_MANIFEST.txt' });

    // 2. Add all physical uploaded files
    const filesToPurge: string[] = [];
    for (const f of files) {
      if (f.storagePath && fs.existsSync(f.storagePath)) {
        archive.file(f.storagePath, { name: `Client_Documents/${f.originalFilename}` });
        filesToPurge.push(f.storagePath);
      }
    }

    // 3. Add workbooks if present
    for (const wb of workbooks) {
      if (wb.filePath && fs.existsSync(wb.filePath)) {
        archive.file(wb.filePath, { name: `Workbooks/${wb.filename}` });
      }
    }

    await archive.finalize();

    // If purge was requested, reclaim server disk space immediately after stream
    if (purgeAfter && filesToPurge.length > 0) {
      res.on('finish', () => {
        for (const p of filesToPurge) {
          try {
            if (fs.existsSync(p)) fs.unlinkSync(p);
          } catch (e: any) {
            console.error('Error auto-cleaning file from server:', p, e.message);
          }
        }
        console.log(`[Storage Auto-Clean] Reclaimed server disk: deleted ${filesToPurge.length} files for ${mr.id}.`);
      });
    }
  } catch (err: any) {
    console.error('Download package error:', err);
    res.status(500).json({ error: 'Failed to build package: ' + err.message });
  }
});

// Storage Health & Disk Usage endpoint
app.get('/api/system/storage-info', requireAuth, (_req: Request, res: Response) => {
  try {
    let uploadBytes = 0;
    let uploadCount = 0;
    if (fs.existsSync(UPLOAD_DIR)) {
      const uFiles = fs.readdirSync(UPLOAD_DIR);
      uploadCount = uFiles.length;
      uploadBytes = uFiles.reduce((acc, f) => {
        try {
          return acc + fs.statSync(path.join(UPLOAD_DIR, f)).size;
        } catch {
          return acc;
        }
      }, 0);
    }

    let wbBytes = 0;
    let wbCount = 0;
    if (fs.existsSync(WORKBOOK_DIR)) {
      const wFiles = fs.readdirSync(WORKBOOK_DIR);
      wbCount = wFiles.length;
      wbBytes = wFiles.reduce((acc, f) => {
        try {
          return acc + fs.statSync(path.join(WORKBOOK_DIR, f)).size;
        } catch {
          return acc;
        }
      }, 0);
    }

    const totalBytes = uploadBytes + wbBytes;
    res.json({
      uploadCount,
      uploadSizeMB: +(uploadBytes / (1024 * 1024)).toFixed(2),
      workbookCount: wbCount,
      workbookSizeMB: +(wbBytes / (1024 * 1024)).toFixed(2),
      totalSizeMB: +(totalBytes / (1024 * 1024)).toFixed(2),
      status: totalBytes > 200 * 1024 * 1024 ? 'warning_high' : 'optimized_lean',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to inspect storage: ' + err.message });
  }
});

// 1-Click Server Disk Purge (Reclaim Cloud Storage)
app.post('/api/system/purge-storage', requireAuth, async (_req: Request, res: Response) => {
  try {
    let deletedCount = 0;
    let freedBytes = 0;

    if (fs.existsSync(UPLOAD_DIR)) {
      const files = fs.readdirSync(UPLOAD_DIR);
      for (const f of files) {
        try {
          const fp = path.join(UPLOAD_DIR, f);
          const sz = fs.statSync(fp).size;
          fs.unlinkSync(fp);
          deletedCount++;
          freedBytes += sz;
        } catch {}
      }
    }

    console.log(`[Manual Purge] Deleted ${deletedCount} files, freed ${(freedBytes / 1024 / 1024).toFixed(2)} MB on server.`);
    res.json({
      success: true,
      deletedCount,
      freedMB: +(freedBytes / (1024 * 1024)).toFixed(2),
      message: `Successfully reclaimed ${(freedBytes / 1024 / 1024).toFixed(2)} MB of server space! Extracted database records remain completely safe.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to purge storage: ' + err.message });
  }
});

// Export workbook as Standalone HTML Report
app.get('/api/workbooks/:id/export-html', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isDownload = req.query.download === 'true';

    const wb = await db.select().from(generatedWorkbooks).where(eq(generatedWorkbooks.id, id)).limit(1);
    if (wb.length === 0) {
      return res.status(404).json({ error: 'Workbook not found.' });
    }

    const wbRec = wb[0];
    const reqList = await db
      .select({
        request: monthlyRequests,
        client: clients,
      })
      .from(monthlyRequests)
      .innerJoin(clients, eq(monthlyRequests.clientId, clients.id))
      .where(eq(monthlyRequests.id, wbRec.monthlyRequestId))
      .limit(1);

    if (reqList.length === 0) {
      return res.status(404).json({ error: 'Associated client request not found.' });
    }

    const { request: mr, client } = reqList[0];
    const allDocs = await db.select().from(extractedDocuments).where(eq(extractedDocuments.monthlyRequestId, mr.id));
    const docIds = allDocs.map(d => d.id);
    let allLineItems: any[] = [];
    if (docIds.length > 0) {
      allLineItems = await db.select().from(extractedLineItems).where(sql`${extractedLineItems.documentUnitId} IN ${docIds}`);
    }
    const files = await db.select().from(documentFiles).where(eq(documentFiles.monthlyRequestId, mr.id));
    const bankTxns = await db.select().from(bankTransactions).where(eq(bankTransactions.monthlyRequestId, mr.id));
    const exceptions = await db.select().from(validationExceptions).where(eq(validationExceptions.monthlyRequestId, mr.id));

    const { html, filename } = generateClientHtmlReport({
      client: {
        id: client.id,
        businessName: client.businessName,
        gstin: client.gstin,
        contactPerson: client.contactPerson,
        registeredPhone: client.registeredPhone,
        email: client.email,
      },
      request: {
        id: mr.id,
        reportingMonth: mr.reportingMonth,
        status: wbRec.status,
        version: wbRec.version,
        declaredAt: mr.declaredAt ? mr.declaredAt.toISOString() : null,
        noTransactionsDeclared: mr.noTransactionsDeclared,
      },
      files: files.map(f => ({
        id: f.id,
        originalFilename: f.originalFilename,
        fileHash: f.fileHash,
        receivedTime: f.receivedTime.toISOString(),
        source: f.source,
        status: f.status,
        scanMethod: f.scanMethod,
      })),
      salesInvoices: allDocs.filter(d => d.docType === 'sales_invoice'),
      salesLineItems: allLineItems,
      purchaseInvoices: allDocs.filter(d => d.docType === 'purchase_invoice'),
      purchaseLineItems: allLineItems,
      debitNotes: allDocs.filter(d => d.docType === 'debit_note'),
      creditNotes: allDocs.filter(d => d.docType === 'credit_note'),
      bankTransactions: bankTxns,
      exceptions: exceptions.map(e => ({
        id: e.id,
        severity: e.severity,
        checkType: e.checkType,
        message: e.message,
        resolved: e.resolved,
        resolutionNotes: e.resolutionNotes,
      })),
      generatedBy: wbRec.generatedBy,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (isDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    return res.send(html);
  } catch (err: any) {
    console.error('HTML export error:', err);
    res.status(500).json({ error: 'HTML export failed: ' + err.message });
  }
});

// Export monthly request directly as Standalone HTML Report (even before Excel generation)
app.get('/api/monthly-requests/:id/export-html', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isDownload = req.query.download === 'true';

    const reqList = await db
      .select({
        request: monthlyRequests,
        client: clients,
      })
      .from(monthlyRequests)
      .innerJoin(clients, eq(monthlyRequests.clientId, clients.id))
      .where(eq(monthlyRequests.id, id))
      .limit(1);

    if (reqList.length === 0) {
      return res.status(404).json({ error: 'Monthly request not found.' });
    }

    const { request: mr, client } = reqList[0];
    const allDocs = await db.select().from(extractedDocuments).where(eq(extractedDocuments.monthlyRequestId, mr.id));
    const docIds = allDocs.map(d => d.id);
    let allLineItems: any[] = [];
    if (docIds.length > 0) {
      allLineItems = await db.select().from(extractedLineItems).where(sql`${extractedLineItems.documentUnitId} IN ${docIds}`);
    }
    const files = await db.select().from(documentFiles).where(eq(documentFiles.monthlyRequestId, mr.id));
    const bankTxns = await db.select().from(bankTransactions).where(eq(bankTransactions.monthlyRequestId, mr.id));
    const exceptions = await db.select().from(validationExceptions).where(eq(validationExceptions.monthlyRequestId, mr.id));

    const { html, filename } = generateClientHtmlReport({
      client: {
        id: client.id,
        businessName: client.businessName,
        gstin: client.gstin,
        contactPerson: client.contactPerson,
        registeredPhone: client.registeredPhone,
        email: client.email,
      },
      request: {
        id: mr.id,
        reportingMonth: mr.reportingMonth,
        status: mr.status,
        version: mr.activeWorkbookVersion || 1,
        declaredAt: mr.declaredAt ? mr.declaredAt.toISOString() : null,
        noTransactionsDeclared: mr.noTransactionsDeclared,
      },
      files: files.map(f => ({
        id: f.id,
        originalFilename: f.originalFilename,
        fileHash: f.fileHash,
        receivedTime: f.receivedTime.toISOString(),
        source: f.source,
        status: f.status,
        scanMethod: f.scanMethod,
      })),
      salesInvoices: allDocs.filter(d => d.docType === 'sales_invoice'),
      salesLineItems: allLineItems,
      purchaseInvoices: allDocs.filter(d => d.docType === 'purchase_invoice'),
      purchaseLineItems: allLineItems,
      debitNotes: allDocs.filter(d => d.docType === 'debit_note'),
      creditNotes: allDocs.filter(d => d.docType === 'credit_note'),
      bankTransactions: bankTxns,
      exceptions: exceptions.map(e => ({
        id: e.id,
        severity: e.severity,
        checkType: e.checkType,
        message: e.message,
        resolved: e.resolved,
        resolutionNotes: e.resolutionNotes,
      })),
      generatedBy: 'Professional Samadhan GST Desk',
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (isDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    return res.send(html);
  } catch (err: any) {
    console.error('HTML export error:', err);
    res.status(500).json({ error: 'HTML export failed: ' + err.message });
  }
});

// ==========================================
// 6. CLIENT PORTAL & CONFIRMATION APIs
// ==========================================

// Authenticate client portal session via secure upload token or phone lookup
app.get('/api/client-portal/session', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    const phone = req.query.phone as string;

    if (!token && !phone) {
      return res.status(400).json({ error: 'Missing token or phone number.' });
    }

    if (token) {
      const requests = await db
        .select({
          request: monthlyRequests,
          client: clients,
        })
        .from(monthlyRequests)
        .innerJoin(clients, eq(monthlyRequests.clientId, clients.id))
        .where(eq(monthlyRequests.secureUploadToken, token))
        .limit(1);

      if (requests.length === 0) {
        return res.status(404).json({ error: 'Invalid or expired upload link.' });
      }

      const { request: mr, client } = requests[0];
      const files = await db
        .select()
        .from(documentFiles)
        .where(eq(documentFiles.monthlyRequestId, mr.id))
        .orderBy(desc(documentFiles.receivedTime));

      const workbooks = await db
        .select()
        .from(generatedWorkbooks)
        .where(eq(generatedWorkbooks.monthlyRequestId, mr.id))
        .orderBy(desc(generatedWorkbooks.version));

      // Also fetch other businesses linked to this client's registered phone
      const sisterBusinesses = await db
        .select()
        .from(clients)
        .where(eq(clients.registeredPhone, client.registeredPhone));

      const allDocs = await db.select().from(extractedDocuments).where(eq(extractedDocuments.monthlyRequestId, mr.id));
      const allBankTxns = await db.select().from(bankTransactions).where(eq(bankTransactions.monthlyRequestId, mr.id));
      const allExceptions = await db.select().from(validationExceptions).where(eq(validationExceptions.monthlyRequestId, mr.id));

      const checklistEvaluation = evaluateMonthlyChecklist({
        client: {
          requiredChecklist: client.requiredChecklist || [],
          expectedBankAccounts: client.expectedBankAccounts || [],
        },
        request: {
          reportingMonth: mr.reportingMonth,
          noTransactionsDeclared: mr.noTransactionsDeclared,
          categoryDeclarations: (mr.categoryDeclarations as any) || {},
        },
        extractedDocs: allDocs,
        files,
        bankTransactions: allBankTxns,
        manualExceptions: allExceptions,
      });

      return res.json({
        request: mr,
        client,
        files,
        workbooks,
        checklist: checklistEvaluation.checklist,
        missingItems: checklistEvaluation.missingItems,
        isFullySatisfied: checklistEvaluation.isFullySatisfied,
        sisterBusinesses: sisterBusinesses.map(b => ({
          id: b.id,
          businessName: b.businessName,
          gstin: b.gstin,
        })),
      });
    }

    // If query by phone: return all businesses under this phone number
    const matchingClients = await db
      .select()
      .from(clients)
      .where(eq(clients.registeredPhone, phone));

    res.json({ clients: matchingClients });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load client portal: ' + err.message });
  }
});

// Category-Level Nil Declaration (e.g. client confirms "No purchase invoices" or "No debit notes" this month)
app.post('/api/monthly-requests/:id/declare-category', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, status, notes, declaredBy } = req.body;
    // status: 'nil' | 'pending'

    const reqList = await db.select().from(monthlyRequests).where(eq(monthlyRequests.id, id)).limit(1);
    if (reqList.length === 0) return res.status(404).json({ error: 'Request not found' });
    const mr = reqList[0];
    const clientList = await db.select().from(clients).where(eq(clients.id, mr.clientId)).limit(1);
    if (clientList.length === 0) return res.status(404).json({ error: 'Client not found' });
    const client = clientList[0];

    const currentDecl = { ...((mr.categoryDeclarations as any) || {}) };
    if (status === 'nil') {
      currentDecl[category] = {
        status: 'nil',
        notes: notes || 'Nil confirmed by client',
        declaredAt: new Date().toISOString(),
        declaredBy: declaredBy || client.contactPerson,
      };
    } else {
      delete currentDecl[category];
    }

    const allDocs = await db.select().from(extractedDocuments).where(eq(extractedDocuments.monthlyRequestId, id));
    const allFiles = await db.select().from(documentFiles).where(eq(documentFiles.monthlyRequestId, id));
    const allBankTxns = await db.select().from(bankTransactions).where(eq(bankTransactions.monthlyRequestId, id));
    const allExceptions = await db.select().from(validationExceptions).where(eq(validationExceptions.monthlyRequestId, id));

    const evalResult = evaluateMonthlyChecklist({
      client: {
        requiredChecklist: client.requiredChecklist || [],
        expectedBankAccounts: client.expectedBankAccounts || [],
      },
      request: {
        reportingMonth: mr.reportingMonth,
        noTransactionsDeclared: mr.noTransactionsDeclared,
        categoryDeclarations: currentDecl,
      },
      extractedDocs: allDocs,
      files: allFiles,
      bankTransactions: allBankTxns,
      manualExceptions: allExceptions,
    });

    const newStatus = evalResult.missingItems.length > 0 ? 'Missing Documents' : (mr.status === 'Requested' ? 'Requested' : 'Needs Review');

    await db
      .update(monthlyRequests)
      .set({
        categoryDeclarations: currentDecl,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(monthlyRequests.id, id));

    res.json({
      success: true,
      categoryDeclarations: currentDecl,
      checklist: evalResult.checklist,
      missingItems: evalResult.missingItems,
      isFullySatisfied: evalResult.isFullySatisfied,
      status: newStatus,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update category: ' + err.message });
  }
});

// CA Staff flags a document or requirement as missing
app.post('/api/monthly-requests/:id/flag-missing', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message, severity, category } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    await db.insert(validationExceptions).values({
      id: `ex_flag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      monthlyRequestId: id,
      severity: severity || 'critical',
      checkType: 'category_missing',
      message: message.trim(),
      details: { category: category || 'custom', flaggedBy: req.user?.displayName || 'CA Staff' },
      resolved: false,
    });

    await db
      .update(monthlyRequests)
      .set({
        status: 'Missing Documents',
        updatedAt: new Date(),
      })
      .where(eq(monthlyRequests.id, id));

    res.json({ success: true, message: 'Document marked as missing and flagged for client.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Client Declaration: "No transactions" or "Not applicable" (Global)
app.post('/api/monthly-requests/:id/declaration', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { noTransactions, declarationNotes, declaredBy } = req.body;

    await db
      .update(monthlyRequests)
      .set({
        noTransactionsDeclared: Boolean(noTransactions),
        declarationNotes,
        declaredAt: new Date(),
        declaredBy: declaredBy || 'Client',
        status: noTransactions ? 'Needs Review' : 'Requested',
        updatedAt: new Date(),
      })
      .where(eq(monthlyRequests.id, id));

    res.json({ success: true, id, noTransactions: Boolean(noTransactions) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record declaration: ' + err.message });
  }
});

// Client confirms or requests corrections on workbook
app.post('/api/workbooks/:id/client-confirm', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, confirmationText, comments, clientName } = req.body; // action: 'approve' | 'request_corrections'

    const wb = await db.select().from(generatedWorkbooks).where(eq(generatedWorkbooks.id, id)).limit(1);
    if (wb.length === 0) {
      return res.status(404).json({ error: 'Workbook not found.' });
    }

    const wbRec = wb[0];
    const isApproved = action === 'approve';
    const newStatus = isApproved ? 'client_confirmed' : 'corrections_requested';

    await db
      .update(generatedWorkbooks)
      .set({
        status: newStatus,
        clientConfirmationText: isApproved ? (confirmationText || 'I confirm all applicable documents for this period have been supplied and the compiled figures are verified.') : null,
        clientConfirmedAt: isApproved ? new Date() : null,
        clientConfirmedBy: clientName || 'Client Authorised Signatory',
        clientCorrectionComments: !isApproved ? comments : null,
      })
      .where(eq(generatedWorkbooks.id, id));

    // Update monthly request status
    await db
      .update(monthlyRequests)
      .set({
        status: isApproved ? 'Client Confirmed' : 'Corrections Requested',
        updatedAt: new Date(),
      })
      .where(eq(monthlyRequests.id, wbRec.monthlyRequestId));

    // Audit notification log
    await db.insert(auditNotifications).values({
      id: `aud_cf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      monthlyRequestId: wbRec.monthlyRequestId,
      clientId: wbRec.clientId,
      eventType: isApproved ? 'client_confirmed' : 'corrections_requested',
      channel: 'portal',
      recipient: clientName || 'Client',
      messageBody: isApproved ? `Client confirmed workbook v${wbRec.version}` : `Client requested corrections on v${wbRec.version}: ${comments}`,
      status: 'sent',
      details: { version: wbRec.version, comments },
    });

    res.json({
      success: true,
      status: newStatus,
      clientConfirmed: isApproved,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record confirmation: ' + err.message });
  }
});

// CA Administrator Final Approval (Mandatory check: blocks if critical exceptions exist without override)
app.post('/api/workbooks/:id/ca-approve', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { caApprovalNotes, caOverrideReason } = req.body;

    // Must be CA admin
    if (req.user?.role !== 'ca_admin') {
      return res.status(403).json({ error: 'Only CA administrators can grant final statutory approval.' });
    }

    const wb = await db.select().from(generatedWorkbooks).where(eq(generatedWorkbooks.id, id)).limit(1);
    if (wb.length === 0) {
      return res.status(404).json({ error: 'Workbook not found.' });
    }

    const wbRec = wb[0];

    // Check critical unresolved exceptions
    const exceptions = await db
      .select()
      .from(validationExceptions)
      .where(and(eq(validationExceptions.monthlyRequestId, wbRec.monthlyRequestId), eq(validationExceptions.resolved, false)));

    const criticalUnresolved = exceptions.filter(e => e.severity === 'critical');
    if (criticalUnresolved.length > 0 && !caOverrideReason) {
      return res.status(400).json({
        error: `Cannot grant final CA approval: ${criticalUnresolved.length} critical exceptions remain unresolved. A formal CA override reason must be provided to bypass.`,
      });
    }

    await db
      .update(generatedWorkbooks)
      .set({
        status: 'ca_approved',
        caApprovedAt: new Date(),
        caApprovedBy: req.user.displayName || 'CA Rajesh Sharma (FCA)',
        caApprovalNotes,
        caOverrideReason: caOverrideReason || null,
      })
      .where(eq(generatedWorkbooks.id, id));

    await db
      .update(monthlyRequests)
      .set({
        status: 'CA Approved',
        updatedAt: new Date(),
      })
      .where(eq(monthlyRequests.id, wbRec.monthlyRequestId));

    // Audit log
    await db.insert(auditNotifications).values({
      id: `aud_ca_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      monthlyRequestId: wbRec.monthlyRequestId,
      clientId: wbRec.clientId,
      eventType: 'ca_approved',
      channel: 'system',
      recipient: 'Professional Samadhan Records',
      messageBody: `CA Final Approval granted by ${req.user.displayName || 'CA Admin'} for ${wbRec.filename}. Ready for GSTR-1 & GSTR-3B return compilation.`,
      status: 'sent',
      details: { override: Boolean(caOverrideReason), notes: caApprovalNotes },
    });

    res.json({
      success: true,
      status: 'CA Approved',
      approvedBy: req.user.displayName,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'CA Approval failed: ' + err.message });
  }
});

// ==========================================
// 7. AUDIT LOGS & WHATSAPP WEBHOOK
// ==========================================

// Get audit logs
app.get('/api/audit-logs', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const logs = await db
      .select({
        log: auditNotifications,
        client: clients,
      })
      .from(auditNotifications)
      .leftJoin(clients, eq(auditNotifications.clientId, clients.id))
      .orderBy(desc(auditNotifications.createdAt))
      .limit(100);

    const formatted = logs.map(l => ({
      ...l.log,
      clientBusinessName: l.client?.businessName || 'System',
      clientGstin: l.client?.gstin || '-',
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs: ' + err.message });
  }
});

// Meta WhatsApp Business Platform Webhook (GET for verification, POST for incoming messages)
app.get('/api/whatsapp/webhook', (req: Request, res: Response) => {
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'professional_samadhan_token_2026';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WhatsApp webhook verified successfully.');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Incoming WhatsApp messages & attachment handler
app.post('/api/whatsapp/webhook', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    // Immediate 200 OK as required by Meta Webhooks to prevent retries
    res.status(200).send('EVENT_RECEIVED');

    if (body.object === 'whatsapp_business_account' && body.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (value?.messages) {
            for (const msg of value.messages) {
              const senderPhone = '+' + msg.from;
              const msgType = msg.type;

              console.log(`Received incoming WhatsApp message from ${senderPhone}, type: ${msgType}`);

              // Find client by phone
              const clientList = await db
                .select()
                .from(clients)
                .where(eq(clients.registeredPhone, senderPhone))
                .limit(1);

              if (clientList.length > 0) {
                const client = clientList[0];
                // Log webhook event
                await db.insert(auditNotifications).values({
                  id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  clientId: client.id,
                  eventType: 'webhook_received',
                  channel: 'whatsapp_cloud_api',
                  recipient: 'Professional Samadhan Inbound',
                  messageBody: msgType === 'text' ? msg.text.body : `[Attachment received: ${msgType}]`,
                  status: 'sent',
                  details: { messageId: msg.id, type: msgType },
                });
              }
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.error('WhatsApp webhook processing error:', err.message);
  }
});

// Synthetic test files list
app.get('/api/synthetic/samples', (_req: Request, res: Response) => {
  const sampleDir = path.resolve(process.cwd(), 'synthetic_samples');
  if (!fs.existsSync(sampleDir)) {
    return res.json([]);
  }
  const files = fs.readdirSync(sampleDir).map(name => ({
    name,
    path: `/synthetic_samples/${name}`,
    size: fs.statSync(path.join(sampleDir, name)).size,
  }));
  res.json(files);
});

// Re-seed DB endpoint
app.post('/api/system/seed', requireAuth, async (_req: Request, res: Response) => {
  try {
    await seedInitialData();
    res.json({ success: true, message: 'Database seeded with sample CA clients, documents, and requests.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Seed error: ' + err.message });
  }
});

// Serve synthetic files directly
app.use('/synthetic_samples', express.static(path.resolve(process.cwd(), 'synthetic_samples')));

// Vite middlewares for frontend SPA
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Professional Samadhan GST Server running on http://localhost:${PORT}`);
  });
}

startServer();
