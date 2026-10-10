// src/services/kycDocumentService.ts
import { GoogleGenAI } from '@google/genai';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

export interface ExtractedKycData {
  docType: 'aadhar' | 'pan' | 'bank' | 'din' | 'cin' | 'other';
  aadharNumber?: string;
  panNumber?: string;
  din?: string;
  bankAccount?: string;
  ifsc?: string;
  cin?: string;
  holderName?: string;
  rawTextSnippet?: string;
}

/**
 * Format 12-digit string to standard Aadhaar "XXXX XXXX XXXX" format
 */
export function formatAadharNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
  }
  return raw.trim();
}

/**
 * Extract Aadhaar and other KYC numbers from text using strict Indian ID patterns
 */
export function parseKycText(text: string): ExtractedKycData {
  const result: ExtractedKycData = {
    docType: 'other',
    rawTextSnippet: text.slice(0, 500),
  };

  if (!text || typeof text !== 'string') return result;

  // 1. Aadhaar Number Extraction
  // Look for labeled Aadhaar: "Aadhaar No : 1234 5678 9012"
  const labeledAadharMatch = text.match(/(?:Aadhaar|Aadhar|UIDAI|UID|Adhar)[\s\S]{0,35}?([2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4})/i);
  if (labeledAadharMatch && labeledAadharMatch[1]) {
    result.aadharNumber = formatAadharNumber(labeledAadharMatch[1]);
    result.docType = 'aadhar';
  } else {
    // Unlabeled 12-digit patterns: "9842 1284 4821" (Aadhaar starting 2-9)
    const spacedAadharMatch = text.match(/\b([2-9]\d{3}\s\d{4}\s\d{4})\b/);
    if (spacedAadharMatch && spacedAadharMatch[1]) {
      result.aadharNumber = formatAadharNumber(spacedAadharMatch[1]);
      result.docType = 'aadhar';
    } else {
      // 12 continuous digits near Aadhaar keywords or standalone
      const fallbackAadhar = text.match(/\b([2-9]\d{11})\b/);
      if (fallbackAadhar && fallbackAadhar[1]) {
        result.aadharNumber = formatAadharNumber(fallbackAadhar[1]);
        if (result.docType === 'other') result.docType = 'aadhar';
      }
    }
  }

  // 2. PAN Number Extraction (e.g., ABCDE1234F)
  const panMatch = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/i);
  if (panMatch && panMatch[1]) {
    result.panNumber = panMatch[1].toUpperCase();
    if (result.docType === 'other' || /income\s*tax|permanent\s*account/i.test(text)) {
      result.docType = 'pan';
    }
  }

  // 3. DIN Extraction (8 digits near Director / DIN)
  const dinLabeled = text.match(/(?:DIN|Director\s*Identification\s*Number)[\s\S]{0,25}?\b(\d{8})\b/i);
  if (dinLabeled && dinLabeled[1]) {
    result.din = dinLabeled[1];
    if (result.docType === 'other') result.docType = 'din';
  } else {
    const dinMatch = text.match(/\b(\d{8})\b/);
    if (dinMatch && /director|mca/i.test(text)) {
      result.din = dinMatch[1];
    }
  }

  // 4. IFSC and Bank Account Extraction
  const ifscMatch = text.match(/\b([A-Z]{4}0[A-Z0-9]{6})\b/i);
  if (ifscMatch && ifscMatch[1]) {
    result.ifsc = ifscMatch[1].toUpperCase();
    if (result.docType === 'other') result.docType = 'bank';
  }

  const bankAccMatch = text.match(/(?:A\/C|Account\s*No|Account\s*Number)[\s\S]{0,25}?\b(\d{9,18})\b/i);
  if (bankAccMatch && bankAccMatch[1]) {
    result.bankAccount = bankAccMatch[1];
    if (result.docType === 'other') result.docType = 'bank';
  }

  // 5. CIN Extraction (21-character Corporate Identity Number)
  const cinMatch = text.match(/\b([LUu]\d{5}[A-Za-z]{2}\d{4}[A-Za-z]{3}\d{6})\b/);
  if (cinMatch && cinMatch[1]) {
    result.cin = cinMatch[1].toUpperCase();
    if (result.docType === 'other') result.docType = 'cin';
  }

  return result;
}

/**
 * Intelligent Document Extraction: Reads PDF / Image buffer, uses native text + regex,
 * and falls back to Gemini Vision for scans/photos if available.
 */
export async function extractKycFromBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ExtractedKycData> {
  const isPdf = mimeType.includes('pdf') || filename.toLowerCase().endsWith('.pdf');
  let extractedText = '';

  // 1. Try native PDF parsing first
  if (isPdf) {
    try {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData?.text || '';
    } catch (err: any) {
      console.warn(`[KYC Parser] Native PDF parse warning for ${filename}:`, err?.message || err);
    }
  }

  // Run regex on text
  let parsed = parseKycText(extractedText);

  // If already found strong ID or is text-heavy PDF, return early
  if (parsed.aadharNumber || parsed.panNumber || parsed.cin || (isPdf && extractedText.length > 300)) {
    return parsed;
  }

  // 2. Multimodal Fallback via Google Gemini Vision for scanned PDFs or Images
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const effectiveMime = isPdf
        ? 'application/pdf'
        : mimeType.startsWith('image/')
        ? mimeType
        : filename.toLowerCase().endsWith('.png')
        ? 'image/png'
        : 'image/jpeg';

      const prompt = `You are an expert KYC Document verification specialist for Indian regulatory compliance.
Analyze this uploaded document/card (Aadhaar Card, PAN Card, Cancelled Cheque, Bank Passbook, DIN Letter, or Certificate).
Extract and output JSON ONLY matching this structure:
{
  "docType": "aadhar" | "pan" | "bank" | "din" | "cin" | "other",
  "aadharNumber": string or null (Format as 12 digits: "XXXX XXXX XXXX" if Aadhaar card),
  "panNumber": string or null (Format as 10 alphanumeric: e.g. "ABCDE1234F"),
  "din": string or null (8 digits),
  "bankAccount": string or null,
  "ifsc": string or null,
  "cin": string or null (21 alphanumeric characters),
  "holderName": string or null
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: buffer.toString('base64'),
                  mimeType: effectiveMime,
                },
              },
              { text: prompt },
            ],
          },
        ],
      });

      const rawAiText = response.text || '';
      const cleanJson = rawAiText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const aiData = JSON.parse(cleanJson);

      return {
        docType: aiData.docType || parsed.docType,
        aadharNumber: aiData.aadharNumber ? formatAadharNumber(aiData.aadharNumber) : parsed.aadharNumber,
        panNumber: aiData.panNumber || parsed.panNumber,
        din: aiData.din || parsed.din,
        bankAccount: aiData.bankAccount || parsed.bankAccount,
        ifsc: aiData.ifsc || parsed.ifsc,
        cin: aiData.cin || parsed.cin,
        holderName: aiData.holderName,
        rawTextSnippet: extractedText.slice(0, 300) || rawAiText.slice(0, 300),
      };
    } catch (err: any) {
      console.warn(`[KYC Parser] Gemini Vision fallback failed for ${filename}:`, err?.message || err);
    }
  }

  return parsed;
}
