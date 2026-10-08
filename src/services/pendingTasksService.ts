// src/services/pendingTasksService.ts
/**
 * Unified Practice Task Radar Service
 * Dynamically aggregates, computes, and tracks all pending tasks across the entire practice
 * for the Next 7 Days (and overdue items):
 * - Adhoc Client Engagements (ROC, Startup India, GST amendments, etc.)
 * - Statutory Tax Filings (GSTR-1, GSTR-3B, TDS Challans, DIR-3 KYC)
 * - GST Document Intake Queue
 * - Client Review & Sign-Off Workbooks
 * - Overdue & Pending Billing Collections
 */

import { PendingTaskItem, AdhocRequestItem, BillingInvoiceItem } from '../types/index.ts';
import {
  INITIAL_ACCUMULATED_TASKS_7_DAYS,
  INITIAL_ADHOC_REQUESTS,
  INITIAL_BILLING_INVOICES,
  INITIAL_CLIENTS_DATA,
} from './frontPageDataService.ts';

/**
 * Returns current practice reference date (October 8, 2026 if simulating, or current system date)
 */
export function getPracticeReferenceDate(): Date {
  const now = new Date();
  if (now.getFullYear() === 2026) {
    return now;
  }
  // Baseline to active practice timeline: October 8, 2026
  return new Date(2026, 9, 8);
}

/**
 * Calculates remaining calendar days between reference date and due date string (YYYY-MM-DD)
 */
export function calculateDaysRemaining(dueDateStr?: string): number {
  if (!dueDateStr) return 7;
  const ref = getPracticeReferenceDate();
  ref.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  if (isNaN(due.getTime())) return 7;
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - ref.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Dynamically aggregates pending tasks across ALL sections for the next 7 days alert window
 */
export function getAccumulated7DaysPendingTasks(): PendingTaskItem[] {
  const aggregated: PendingTaskItem[] = [];
  const seenIds = new Set<string>();

  // 1. STATUTORY TAX, GST INTAKE, CLIENT APPROVALS (from baseline active radar)
  INITIAL_ACCUMULATED_TASKS_7_DAYS.forEach(baseTask => {
    if (baseTask.sourceSection !== 'adhoc' && baseTask.sourceSection !== 'billing') {
      const liveDays = calculateDaysRemaining(baseTask.dueDate);
      if (liveDays <= 7) {
        const urgency: PendingTaskItem['urgency'] =
          liveDays <= 2 ? 'critical' : liveDays <= 5 ? 'urgent' : 'upcoming';
        const task: PendingTaskItem = {
          ...baseTask,
          daysRemaining: Math.max(0, liveDays),
          urgency,
        };
        seenIds.add(task.id);
        aggregated.push(task);
      }
    }
  });

  // 2. ADHOC CLIENT ENGAGEMENTS (Live from localStorage & database)
  let adhocList: AdhocRequestItem[] = INITIAL_ADHOC_REQUESTS;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ps_adhoc_requests_data');
    if (saved) {
      try {
        adhocList = JSON.parse(saved);
      } catch {
        adhocList = INITIAL_ADHOC_REQUESTS;
      }
    }
  }

  adhocList.forEach(adhoc => {
    // Only pending / in-progress / review tasks
    if (adhoc.status !== 'Completed' && adhoc.status !== 'Delivered') {
      const liveDays = calculateDaysRemaining(adhoc.targetDeadline);
      // Include any adhoc task due within the next 7 days (or overdue, e.g. liveDays <= 7)
      if (liveDays <= 7) {
        const taskId = `task_adhoc_${adhoc.id}`;
        if (!seenIds.has(taskId)) {
          seenIds.add(taskId);

          const client = INITIAL_CLIENTS_DATA.find(
            c => c.id === adhoc.clientId || c.businessName.toLowerCase() === adhoc.clientName.toLowerCase()
          );

          const urgency: PendingTaskItem['urgency'] =
            liveDays <= 2 ? 'critical' : liveDays <= 5 ? 'urgent' : 'upcoming';

          aggregated.push({
            id: taskId,
            sourceSection: 'adhoc',
            sourceSectionName: `Adhoc: ${adhoc.serviceCategory}`,
            clientId: adhoc.clientId,
            clientName: adhoc.clientName,
            clientGstin: adhoc.clientGstin || client?.gstin || '',
            taskTitle: adhoc.title,
            taskDescription: adhoc.description || `Specialized engagement for ${adhoc.serviceCategory}.`,
            dueDate: adhoc.targetDeadline || '2026-10-15',
            daysRemaining: Math.max(0, liveDays),
            urgency,
            estimatedAmount: adhoc.feeQuote || 5000,
            amountLabel: 'Fee Quote',
            status: adhoc.status,
            registeredPhone: client?.registeredPhone || '+919873875138',
            assignedStaff: adhoc.assignedStaffName || 'Pooja Verma (Senior Associate)',
            actionType: 'whatsapp_client',
            targetTab: 'adhoc-requests',
          });
        }
      }
    }
  });

  // 3. BILLING INVOICES & COLLECTIONS (Live from localStorage & database)
  let invoicesList: BillingInvoiceItem[] = INITIAL_BILLING_INVOICES;
  if (typeof window !== 'undefined') {
    const savedInvoices = localStorage.getItem('ps_billing_invoices');
    if (savedInvoices) {
      try {
        invoicesList = JSON.parse(savedInvoices);
      } catch {
        invoicesList = INITIAL_BILLING_INVOICES;
      }
    }
  }

  invoicesList.forEach(inv => {
    if (inv.status !== 'Paid') {
      const liveDays = calculateDaysRemaining(inv.dueDate);
      if (liveDays <= 7) {
        const taskId = `task_billing_${inv.id}`;
        if (!seenIds.has(taskId)) {
          seenIds.add(taskId);

          const urgency: PendingTaskItem['urgency'] =
            liveDays <= 2 ? 'critical' : liveDays <= 5 ? 'urgent' : 'upcoming';

          aggregated.push({
            id: taskId,
            sourceSection: 'billing',
            sourceSectionName: 'Billing & Fee Collection',
            clientId: inv.clientId,
            clientName: inv.clientName,
            taskTitle: `Invoice #${inv.invoiceNumber} - ${inv.serviceDescription}`,
            taskDescription: `Professional fee for ${inv.serviceCategory} pending client payment.`,
            dueDate: inv.dueDate,
            daysRemaining: Math.max(0, liveDays),
            urgency,
            estimatedAmount: inv.totalPayable || inv.professionalFee || 0,
            amountLabel: 'Fee Payable',
            status: inv.status === 'Overdue' ? 'Overdue' : 'Pending Payment',
            assignedStaff: 'CA Shekhar Das',
            actionType: 'whatsapp_client',
            targetTab: 'billing-finance',
          });
        }
      }
    }
  });

  // 4. CLIENT TICKETS & REQUESTS (from clients data)
  INITIAL_CLIENTS_DATA.forEach(c => {
    if (c.clientRequests && c.clientRequests.length > 0) {
      c.clientRequests.forEach(cr => {
        if (cr.status === 'Open' || cr.status === 'Needs Review') {
          const taskId = `task_cr_${cr.id}`;
          if (!seenIds.has(taskId)) {
            seenIds.add(taskId);
            const liveDays = calculateDaysRemaining(cr.createdAt ? `${cr.createdAt}` : '2026-10-10');
            aggregated.push({
              id: taskId,
              sourceSection: 'client_approval',
              sourceSectionName: 'Client Request Ticket',
              clientId: c.id,
              clientName: c.businessName,
              clientGstin: c.gstin,
              taskTitle: `Ticket #${cr.requestNumber}: ${cr.title}`,
              taskDescription: `Inquiry raised via client portal regarding ${cr.associatedApp || 'Compliance'}.`,
              dueDate: '2026-10-10',
              daysRemaining: Math.max(0, liveDays <= 7 ? liveDays : 4),
              urgency: 'urgent',
              status: cr.status,
              registeredPhone: c.registeredPhone,
              assignedStaff: cr.assignedTo || 'Pooja Verma',
              actionType: 'open_portal',
              targetTab: 'client-portal',
            });
          }
        }
      });
    }
  });

  // Sort by urgency: shortest days remaining first (0d, 1d, 2d, 3d...)
  return aggregated.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
