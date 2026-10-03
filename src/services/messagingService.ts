// src/services/messagingService.ts

export interface MessageDispatchResult {
  mode: 'manual' | 'automated_meta_api' | 'simulated_dev';
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
 * - Priority 1: Open-Source Linked WhatsApp Device (Baileys session on +91 98738 75138) => Real direct delivery!
 * - Priority 2: If Meta WhatsApp Business API credentials exist => Real outbound API
 * - Priority 3: Manual WhatsApp Web prefilled link or simulated test mode
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
      details: 'Manual WhatsApp mode: Message prepared. Click "Open WhatsApp" to send via WhatsApp Web/Desktop.',
    };
  }

  // Check 1: Open-Source Linked WhatsApp Device Session
  if (baileysWhatsAppManager.isConnected()) {
    try {
      const sendRes = await baileysWhatsAppManager.sendTextMessage(params.phone, params.messageText);
      if (sendRes.success) {
        return {
          mode: 'automated_meta_api',
          status: 'sent',
          whatsappDeepLink: manualLink,
          messageText: params.messageText,
          details: `Delivered directly via Linked WhatsApp (+91 98738 75138) [Msg ID: ${sendRes.messageId}]`,
        };
      } else {
        console.warn('[WhatsApp Open-Source] Direct send failed, falling back:', sendRes.error);
      }
    } catch (err: any) {
      console.error('[WhatsApp Open-Source] Error sending message:', err);
    }
  }

  // Automated Mode: Check if Meta API keys are configured in environment
  const metaToken = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!metaToken || !phoneNumberId) {
    return {
      mode: 'simulated_dev',
      status: 'simulated_dev',
      whatsappDeepLink: manualLink,
      messageText: params.messageText,
      details: 'WhatsApp Device is not currently linked. Open "WhatsApp Device" in dashboard header to scan QR code once with +91 98738 75138, or send manually.',
    };
  }

  try {
    const formattedTo = formatWhatsAppPhone(params.phone);
    const isOwnNumber = formattedTo === '919899267141' || formattedTo === '919873875138';

    // Meta WhatsApp Cloud API does not allow sending automated messages to the sender's own registered number
    if (isOwnNumber) {
      return {
        mode: 'automated_meta_api',
        status: 'failed',
        whatsappDeepLink: manualLink,
        messageText: params.messageText,
        details: `Meta WhatsApp API restriction: Recipient phone (${params.phone}) is identical to your firm's own registered WhatsApp number. Meta does not permit sending automated bot messages to the sender's own number. Please update client's phone number or send via Mode A (WhatsApp Web).`,
      };
    }

    const templateName = process.env.META_WHATSAPP_TEMPLATE_NAME;

    const requestPayload: any = templateName
      ? {
          messaging_product: 'whatsapp',
          to: formattedTo,
          type: 'template',
          template: {
            name: templateName,
            language: { code: process.env.META_WHATSAPP_TEMPLATE_LANG || 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: params.recipientName },
                  { type: 'text', text: params.messageText.slice(0, 1000) },
                ],
              },
            ],
          },
        }
      : {
          messaging_product: 'whatsapp',
          to: formattedTo,
          type: 'text',
          text: { body: params.messageText },
        };

    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${metaToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    const data = await res.json();
    if (!res.ok) {
      const errObj = data.error || {};
      const errCode = errObj.code;
      const errMsg = errObj.message || '';
      const errDetails = errObj.error_data?.details || errObj.error_user_msg || '';

      let friendlyDetails = `Meta WhatsApp API error (${res.status}): ${errMsg || JSON.stringify(data)}`;

      if (errCode === 131030 || errMsg.includes('131030')) {
        friendlyDetails = `Meta Developer Sandbox limitation (Code 131030): Recipient phone (${params.phone}) is not in your Meta Developer test whitelist. While in Developer/Sandbox mode, Meta only allows sending to up to 5 verified test numbers. Use Mode A (WhatsApp Web) to send directly.`;
      } else if (
        errCode === 131047 ||
        errMsg.toLowerCase().includes('customer service window') ||
        errMsg.toLowerCase().includes('outside') ||
        errMsg.toLowerCase().includes('re-engagement') ||
        (!templateName && errCode === 100)
      ) {
        friendlyDetails = `Meta Cloud API restriction (24-Hour Policy): Meta does not permit sending automated free-form text outside the 24-hour customer window without an approved template (Meta Error: ${errMsg || 'Free text not allowed outside 24h window'}). Please send via Mode A (WhatsApp Web) for instant 100% guaranteed delivery, or link your WhatsApp device.`;
      } else if (errCode === 100) {
        friendlyDetails = `Meta WhatsApp API error (#100 Invalid parameter): ${errMsg || errDetails || 'Invalid request parameter or template mismatch'}. Please send via Mode A (WhatsApp Web).`;
      }

      return {
        mode: 'automated_meta_api',
        status: 'failed',
        whatsappDeepLink: manualLink,
        messageText: params.messageText,
        details: friendlyDetails,
      };
    }

    return {
      mode: 'automated_meta_api',
      status: 'sent',
      whatsappDeepLink: manualLink,
      messageText: params.messageText,
      details: `Dispatched via Meta WhatsApp Cloud API (Message ID: ${data.messages?.[0]?.id || 'unknown'})`,
    };
  } catch (err: any) {
    return {
      mode: 'automated_meta_api',
      status: 'failed',
      whatsappDeepLink: manualLink,
      messageText: params.messageText,
      details: `Network error connecting to Meta WhatsApp Cloud API: ${err.message}`,
    };
  }
}
