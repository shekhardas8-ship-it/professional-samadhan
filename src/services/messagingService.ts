// src/services/messagingService.ts

export interface MessageDispatchResult {
  mode: 'manual' | 'automated' | 'automated_openwa' | 'automated_meta_api' | 'simulated_dev';
  status: 'prepared' | 'sent' | 'failed' | 'simulated_dev';
  whatsappDeepLink?: string;
  messageText: string;
  details: string;
}

export function generateMonthlyRequestMessage(params: {
  reportingMonth: string;
  secureUploadLink: string;
}): string {
  return `Good morning Sir/Madam,

Kindly send the following documents for GST filing for ${params.reportingMonth}:

1. Sales invoices
2. Purchase invoices
3. Bank statements for the previous month
4. Debit notes and credit notes, if any

Please upload documents here: ${params.secureUploadLink}

If there were no transactions or no debit/credit notes, please confirm this in the portal.

Regards,
Team Professional Samadhan`;
}

export function generateReminderMessage(params: {
  clientName: string;
  reportingMonth: string;
  missingItemsText: string;
  secureUploadLink: string;
}): string {
  return `Dear ${params.clientName},

For ${params.reportingMonth}, the following items are still pending:

${params.missingItemsText}

Please upload them here: ${params.secureUploadLink}

If an item is not applicable, please confirm in the portal.

Regards,
Team Professional Samadhan`;
}

export function generateWorkbookReviewMessage(params: {
  clientName: string;
  reportingMonth: string;
  version: number;
  reviewLink: string;
}): string {
  return `Dear ${params.clientName},

Your GST working paper and compiled Excel workbook (v${params.version}) for ${params.reportingMonth} is now ready for your review.

Please review your sales, purchases, and bank entries, and provide your formal confirmation or request any adjustments here:
${params.reviewLink}

Regards,
Team Professional Samadhan`;
}

export function generateUploadAcknowledgementMessage(params: {
  clientName: string;
  businessName: string;
  reportingMonth: string;
  filesSummaryText: string;
  extractedCount: number;
  ackReferenceId: string;
  missingItems?: string[];
  secureUploadLink?: string;
  duplicateCount?: number;
  duplicateFilesSummary?: string;
}): string {
  const hasMissing = params.missingItems && params.missingItems.length > 0;
  const duplicateNotice = (params.duplicateCount && params.duplicateCount > 0)
    ? `\n\n⚠️ DUPLICATE FILE NOTICE: ${params.duplicateCount} duplicate file(s) were detected and safely skipped to protect your GST filing from double-counting.`
    : '';

  if (hasMissing) {
    const missingListText = params.missingItems!.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
    return `Dear ${params.clientName},

Thank you! We received your document upload for ${params.businessName} (${params.reportingMonth}).
Receipt Ref: ${params.ackReferenceId}
Extracted Entries: ${params.extractedCount} item(s)${duplicateNotice}

${params.filesSummaryText}

⚠️ ACTION REQUIRED — The following documents are still missing to complete your GST filing:
${missingListText}

Please upload the missing documents here:
${params.secureUploadLink || 'https://professionalsamadhan.in/client-portal'}

(If there were no transactions or no purchases for any item, please confirm Nil in the portal).

Regards,
Team Professional Samadhan
Chartered Accountants`;
  }

  return `Dear ${params.clientName},

Thank you! All required documents for ${params.businessName} (${params.reportingMonth}) have been successfully received and extracted!
Receipt Ref: ${params.ackReferenceId}
Extracted Entries: ${params.extractedCount} item(s)${duplicateNotice}

${params.filesSummaryText}

Our GST audit team is now compiling your GST working paper and draft GSTR-1/3B calculations.

Regards,
Team Professional Samadhan
Chartered Accountants`;
}

/**
 * Clean phone number for WhatsApp deep link
 * Format: Country code followed by 10 digit number (e.g. 919820112345)
 */
export function formatWhatsAppPhone(phone: string): string {
  let digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }
  if (digits.length === 10) {
    return '91' + digits; // Default India prefix
  }
  return digits;
}

/**
 * Generate click-to-chat WhatsApp link for Manual Mode
 */
export function createWhatsAppDeepLink(phone: string, text: string): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

import { baileysWhatsAppManager } from './baileysService.js';

/**
 * Handle dispatch according to mode:
 * - Mode A ('manual'): WhatsApp Web / Mobile click-to-chat deep link (100% reliable, 0 restrictions)
 * - Mode B ('automated'): OpenWA / Baileys Linked Device (+91 98738 75138) with zero Meta fees and direct push
 */
export async function dispatchWhatsAppNotification(params: {
  phone: string;
  recipientName: string;
  messageText: string;
  mode: 'manual' | 'automated';
}): Promise<MessageDispatchResult> {
  const manualLink = createWhatsAppDeepLink(params.phone, params.messageText);

  if (params.mode === 'manual') {
    return {
      mode: 'manual',
      status: 'prepared',
      whatsappDeepLink: manualLink,
      messageText: params.messageText,
      details: 'Manual WhatsApp mode: Message prepared. Click "Open in WhatsApp Web" to send with 1 click.',
    };
  }

  // Automated Mode: Send directly via OpenWA Linked WhatsApp Device Session
  if (baileysWhatsAppManager.isConnected()) {
    try {
      const sendRes = await baileysWhatsAppManager.sendTextMessage(params.phone, params.messageText);
      if (sendRes.success) {
        return {
          mode: 'automated_openwa',
          status: 'sent',
          whatsappDeepLink: manualLink,
          messageText: params.messageText,
          details: `Delivered directly via OpenWA Linked WhatsApp (+91 98738 75138) [Msg ID: ${sendRes.messageId}]`,
        };
      } else {
        console.warn('[OpenWA WhatsApp] Direct send failed:', sendRes.error);
        return {
          mode: 'automated_openwa',
          status: 'failed',
          whatsappDeepLink: manualLink,
          messageText: params.messageText,
          details: `OpenWA delivery failed: ${sendRes.error || 'Recipient could not be reached'}. Please send via Mode A (WhatsApp Web).`,
        };
      }
    } catch (err: any) {
      console.error('[OpenWA WhatsApp] Error sending message:', err);
      return {
        mode: 'automated_openwa',
        status: 'failed',
        whatsappDeepLink: manualLink,
        messageText: params.messageText,
        details: `OpenWA error: ${err.message}. Please send via Mode A (WhatsApp Web).`,
      };
    }
  }

  // OpenWA WhatsApp Device is not connected
  return {
    mode: 'simulated_dev',
    status: 'failed',
    whatsappDeepLink: manualLink,
    messageText: params.messageText,
    details: 'OpenWA WhatsApp Device is not currently connected. Open "WhatsApp Bot" in the top header to scan the QR code or enter the 8-digit pairing code once with your phone (+91 98738 75138), or click below to send via Mode A (WhatsApp Web).',
  };
}
