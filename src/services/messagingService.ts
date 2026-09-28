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
}): string {
  const hasMissing = params.missingItems && params.missingItems.length > 0;

  if (hasMissing) {
    const missingListText = params.missingItems!.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
    return `Dear ${params.clientName},

Thank you! We received your document upload for ${params.businessName} (${params.reportingMonth}).
Receipt Ref: ${params.ackReferenceId}
Extracted Entries: ${params.extractedCount} item(s)

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
Extracted Entries: ${params.extractedCount} item(s)

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

/**
 * Handle dispatch according to mode:
 * - If Meta WhatsApp Business API credentials (META_WHATSAPP_TOKEN & META_PHONE_NUMBER_ID) exist => Real outbound API
 * - If not configured => Mode A (Manual WhatsApp link) or explicit simulated status
 * Never report "message sent" unless real API returns success!
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

  // Automated Mode: Check if Meta API keys are configured in environment
  const metaToken = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!metaToken || !phoneNumberId) {
    return {
      mode: 'simulated_dev',
      status: 'simulated_dev',
      whatsappDeepLink: manualLink,
      messageText: params.messageText,
      details: 'Meta WhatsApp Business API not configured (META_WHATSAPP_TOKEN / META_PHONE_NUMBER_ID missing in .env). Message generated in Simulated Dev Mode with fallback manual link.',
    };
  }

  try {
    const formattedTo = formatWhatsAppPhone(params.phone);
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
      return {
        mode: 'automated_meta_api',
        status: 'failed',
        whatsappDeepLink: manualLink,
        messageText: params.messageText,
        details: `Meta WhatsApp API error (${res.status}): ${JSON.stringify(data)}`,
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
