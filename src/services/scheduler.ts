// src/services/scheduler.ts
import crypto from 'crypto';
import { db } from '../db/index.ts';
import { clients, monthlyRequests, auditNotifications, validationExceptions } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { generateMonthlyRequestMessage, generateReminderMessage, dispatchWhatsAppNotification } from './messagingService.ts';
import { baileysWhatsAppManager } from './baileysService.ts';

export interface MonthlyPeriodInfo {
  year: number;
  monthNumber: number; // 1 to 12
  reportingMonth: string; // e.g. "August 2026"
  reportingCode: string; // e.g. "2026-08"
}

/**
 * Calculates reporting month for a given run date (defaults to current date).
 * E.g., on 1st January 2027 => Previous month is December 2026 (Year rollover handled!).
 */
export function calculatePreviousMonthPeriod(date: Date = new Date()): MonthlyPeriodInfo {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let currentYear = date.getFullYear();
  let currentMonthIndex = date.getMonth(); // 0-11

  let prevMonthIndex = currentMonthIndex - 1;
  let prevYear = currentYear;

  if (prevMonthIndex < 0) {
    prevMonthIndex = 11;
    prevYear = currentYear - 1;
  }

  const monthNum = prevMonthIndex + 1;
  const monthCode = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
  const reportingMonth = `${monthNames[prevMonthIndex]} ${prevYear}`;
  const reportingCode = `${prevYear}-${monthCode}`;

  return {
    year: prevYear,
    monthNumber: monthNum,
    reportingMonth,
    reportingCode,
  };
}

export function generateSecureToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Runs the monthly request generation for all active clients.
 * Prevents duplicate requests if already executed.
 */
export async function triggerMonthlyIntakeRequests(params?: {
  overridePeriod?: MonthlyPeriodInfo;
  appBaseUrl?: string;
  messagingMode?: 'manual' | 'automated';
}) {
  const period = params?.overridePeriod || calculatePreviousMonthPeriod();
  const baseUrl = params?.appBaseUrl || process.env.APP_URL || 'http://localhost:3000';
  const messagingMode = params?.messagingMode || 'manual';

  // Fetch all active clients
  const activeClients = await db
    .select()
    .from(clients)
    .where(eq(clients.active, true));

  const results: Array<{
    clientId: string;
    businessName: string;
    requestId?: string;
    status: 'created' | 'already_exists' | 'error';
    message?: string;
    uploadLink?: string;
    whatsappResult?: any;
  }> = [];

  for (const client of activeClients) {
    try {
      // 1. Check if request already exists for this client and period (Idempotent!)
      const existing = await db
        .select()
        .from(monthlyRequests)
        .where(
          and(
            eq(monthlyRequests.clientId, client.id),
            eq(monthlyRequests.reportingMonth, period.reportingMonth)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        results.push({
          clientId: client.id,
          businessName: client.businessName,
          requestId: existing[0].id,
          status: 'already_exists',
          message: `Request for ${period.reportingMonth} already exists (ID: ${existing[0].id}).`,
          uploadLink: `${baseUrl}/client-portal?token=${existing[0].secureUploadToken}`,
        });
        continue;
      }

      // 2. Create new monthly request
      const reqId = `req_${client.id.slice(-6)}_${period.year}_${period.monthNumber < 10 ? '0' + period.monthNumber : period.monthNumber}`;
      const token = generateSecureToken();
      // Token valid for 30 days
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

      const nextReminder = new Date();
      nextReminder.setDate(nextReminder.getDate() + (client.reminderCadenceDays || 3));

      await db.insert(monthlyRequests).values({
        id: reqId,
        clientId: client.id,
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

      const secureUploadLink = `${baseUrl}/client-portal?token=${token}`;
      const messageText = generateMonthlyRequestMessage({
        reportingMonth: period.reportingMonth,
        secureUploadLink,
      });

      // 3. Dispatch or prepare WhatsApp message
      const dispatch = await dispatchWhatsAppNotification({
        phone: client.registeredPhone,
        recipientName: client.contactPerson,
        messageText,
        mode: messagingMode,
      });

      // 4. Log audit notification
      await db.insert(auditNotifications).values({
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        monthlyRequestId: reqId,
        clientId: client.id,
        eventType: 'request_prepared',
        channel: messagingMode === 'automated' ? 'whatsapp_cloud_api' : 'whatsapp_manual',
        recipient: client.registeredPhone,
        messageBody: messageText,
        status: dispatch.status,
        details: { mode: dispatch.mode, details: dispatch.details, deepLink: dispatch.whatsappDeepLink },
      });

      results.push({
        clientId: client.id,
        businessName: client.businessName,
        requestId: reqId,
        status: 'created',
        uploadLink: secureUploadLink,
        whatsappResult: dispatch,
      });
    } catch (err: any) {
      results.push({
        clientId: client.id,
        businessName: client.businessName,
        status: 'error',
        message: err.message,
      });
    }
  }

  return {
    period,
    totalClients: activeClients.length,
    results,
  };
}

/**
 * Automatically scans for active requests requiring reminders and dispatches notifications.
 * Triggered by n8n orchestrator daily reminder node.
 */
export async function checkAndDispatchDueReminders(params?: {
  appBaseUrl?: string;
  messagingMode?: 'manual' | 'automated';
}) {
  const baseUrl = params?.appBaseUrl || process.env.APP_URL || 'http://localhost:3000';
  const messagingMode = params?.messagingMode || (baileysWhatsAppManager.isConnected() ? 'automated' : 'manual');
  const now = new Date();

  const pendingRequests = await db
    .select({
      request: monthlyRequests,
      client: clients,
    })
    .from(monthlyRequests)
    .innerJoin(clients, eq(monthlyRequests.clientId, clients.id))
    .where(
      and(
        eq(monthlyRequests.remindersPaused, false),
        eq(clients.remindersPaused, false),
        eq(clients.whatsappConsent, true)
      )
    );

  const results: Array<{
    requestId: string;
    clientId: string;
    businessName: string;
    action: 'reminded' | 'skipped' | 'max_limit_reached' | 'not_due';
    details?: any;
  }> = [];

  for (const { request: mr, client } of pendingRequests) {
    if (mr.status !== 'Requested' && mr.status !== 'Missing Documents') {
      results.push({
        requestId: mr.id,
        clientId: client.id,
        businessName: client.businessName,
        action: 'skipped',
        details: `Request status is ${mr.status}`,
      });
      continue;
    }

    if (mr.nextReminderAt && new Date(mr.nextReminderAt) > now) {
      results.push({
        requestId: mr.id,
        clientId: client.id,
        businessName: client.businessName,
        action: 'not_due',
        details: `Next reminder scheduled for ${mr.nextReminderAt}`,
      });
      continue;
    }

    const maxAllowed = client.maxReminders || 3;
    if (mr.reminderCount >= maxAllowed) {
      results.push({
        requestId: mr.id,
        clientId: client.id,
        businessName: client.businessName,
        action: 'max_limit_reached',
        details: `Reminder count (${mr.reminderCount}) reached maximum threshold (${maxAllowed})`,
      });
      continue;
    }

    const exceptions = await db
      .select()
      .from(validationExceptions)
      .where(and(eq(validationExceptions.monthlyRequestId, mr.id), eq(validationExceptions.resolved, false)));

    let missingText = '';
    const pendingCatExceptions = exceptions.filter(e => e.checkType === 'category_missing' || e.checkType === 'period_coverage_gap');
    if (pendingCatExceptions.length > 0) {
      missingText = pendingCatExceptions.map((e, idx) => `${idx + 1}. ${e.message}`).join('\n');
    } else {
      missingText = '1. Remaining Sales / Purchase Invoices\n2. Bank Statement for the month';
    }

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
      mode: messagingMode,
    });

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
      .where(eq(monthlyRequests.id, mr.id));

    await db.insert(auditNotifications).values({
      id: `aud_auto_rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      monthlyRequestId: mr.id,
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
        source: 'n8n_cron_scheduler',
      },
    });

    results.push({
      requestId: mr.id,
      clientId: client.id,
      businessName: client.businessName,
      action: 'reminded',
      details: dispatchResult,
    });
  }

  return {
    totalChecked: pendingRequests.length,
    processedCount: results.filter(r => r.action === 'reminded').length,
    results,
  };
}

