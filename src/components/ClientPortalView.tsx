// src/components/ClientPortalView.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Building2,
  Check,
  Send,
  MessageSquare,
  Clock,
  Shield,
  Layers,
  FileCode2,
  Trash2,
  Plus,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  X,
  FileCheck,
  FolderPlus,
  ArrowLeft,
  Sparkles,
  Bot,
  Cpu,
  Key,
  SlidersHorizontal,
  ShieldCheck,
  Loader2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { HtmlReportModal } from './HtmlReportModal.tsx';
import InteractiveListPreview, { InteractiveListItem } from './ui/interactive-list-preview.tsx';
import { getStoredPortalPreferences } from '../services/portalSettingsService';
import {
  getStoredClientAiSettings,
  saveStoredClientAiSettings,
  AiProviderId,
  AVAILABLE_MODELS_BY_PROVIDER,
  AI_PROVIDERS_METADATA,
} from '../services/clientAiSettingsService';

const CA_PRACTICE_SERVICES: InteractiveListItem[] = [
  {
    client: "GST COMPLIANCE",
    platform: "GSTR-1 / 3B / 9 / 9C",
    services: "Automated Reconciliation, 2B Ingestion, Input Tax Credit Optimization, Annual Audit",
    img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800&auto=format&fit=crop",
  },
  {
    client: "INCOME TAX & TDS",
    platform: "ITR 1-7 & 24Q / 26Q",
    services: "Corporate & Individual Filing, Advance Tax Computation, Form 16 Generation, Lower Deduction",
    img: "https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=800&auto=format&fit=crop",
  },
  {
    client: "SCRUTINY & NOTICES",
    platform: "LEGAL & TAX DEFENSE",
    services: "Faceless Assessment Handling, GST SCN Representation, Demand Resolution, Appellate Advisory",
    img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800&auto=format&fit=crop",
  },
  {
    client: "ROC & CORPORATE",
    platform: "MCA 21 SUITE",
    services: "Company Incorporation, Annual Filings (AOC-4 / MGT-7), Director KYC, Board Resolutions",
    img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
  },
  {
    client: "MIS & FINANCIALS",
    platform: "CLOSING & ANALYTICS",
    services: "Monthly P&L Finalization, Working Capital Analysis, CMA Data Preparation for Bank Credit",
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop",
  },
];

interface ClientPortalProps {
  initialToken?: string;
  isStandaloneClient?: boolean;
  onBack?: () => void;
}

/**
 * Safely parse JSON response from server, gracefully handling HTML error pages
 * (e.g. Render proxy timeouts, 413 payload limits, 502/504, or SPA fallback index.html)
 */
async function safeParseResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
      }
      return data;
    } catch (e: any) {
      if (!res.ok && e.message) throw e;
      throw new Error(`Invalid JSON response: ${e.message}`);
    }
  }

  const text = await res.text();
  if (!res.ok) {
    if (res.status === 413) {
      throw new Error('Upload size exceeded server limit (maximum 25MB per batch).');
    }
    if (res.status === 504) {
      throw new Error('Server timeout: Cloud processing took longer than expected. Please try uploading fewer or smaller files.');
    }
    if (res.status === 502 || res.status === 503) {
      throw new Error('Server is waking up or temporarily busy (502 Bad Gateway). Please retry in a moment.');
    }
    if (text.includes('<title>')) {
      const match = text.match(/<title>(.*?)<\/title>/i);
      if (match && match[1]) {
        throw new Error(`Server error (${res.status}): ${match[1]}`);
      }
    }
    if (text.includes('<pre>')) {
      const match = text.match(/<pre>(.*?)<\/pre>/is);
      if (match && match[1]) {
        const cleanPre = match[1].replace(/<[^>]+>/g, '').trim().split('\n')[0];
        throw new Error(`Server error (${res.status}): ${cleanPre}`);
      }
    }
    throw new Error(`Server returned error HTTP ${res.status}: ${res.statusText || 'Unexpected error'}`);
  }

  // If status is 200 but content is HTML (SPA index.html served for an unmatched API route)
  if (text.trim().startsWith('<') || text.includes('<!DOCTYPE')) {
    throw new Error('API connection notice: Server returned an HTML page instead of JSON data. Please refresh or retry.');
  }

  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

export const ClientPortalView: React.FC<ClientPortalProps> = ({ initialToken, isStandaloneClient = false, onBack }) => {
  const [token, setToken] = useState<string>(initialToken || '');
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [portalPrefs] = useState(() => getStoredPortalPreferences());

  // File Upload & Queue State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressPercent, setUploadProgressPercent] = useState(0);
  const [uploadStageText, setUploadStageText] = useState('Uploading in progress: Transferring encrypted evidence...');
  const [estimatedSecondsRemaining, setEstimatedSecondsRemaining] = useState(10);
  const [uploadElapsedSeconds, setUploadElapsedSeconds] = useState(0);
  const countdownTimerRef = useRef<any>(null);
  const progressTimerRef = useRef<any>(null);

  const formatUploadRemainingText = (remainingSec: number, elapsedSec: number) => {
    if (remainingSec <= 0 || remainingSec <= 4) {
      return elapsedSec > 40
        ? `~${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s • Finalizing...`
        : 'Finalizing verification...';
    }
    const mins = Math.floor(remainingSec / 60);
    const secs = remainingSec % 60;
    if (mins > 0) {
      return secs > 0 ? `~${mins}m ${secs}s left` : `~${mins}m left`;
    }
    return `~${secs}s left`;
  };

  const [pdfPassword, setPdfPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUploadAreaOpen, setIsUploadAreaOpen] = useState(true);
  const [targetCategory, setTargetCategory] = useState<'sales_invoices' | 'purchase_invoices' | 'bank_statements' | 'debit_credit_notes' | 'auto'>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadSectionRef = useRef<HTMLDivElement>(null);

  // Additional Documents & Client Declaration Modal State
  const [showAdditionalDocModal, setShowAdditionalDocModal] = useState(false);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [additionalCategory, setAdditionalCategory] = useState<'sales_invoices' | 'purchase_invoices' | 'bank_statements' | 'debit_credit_notes' | 'auto'>('sales_invoices');
  const [additionalPassword, setAdditionalPassword] = useState('');
  const [declarationNotes, setDeclarationNotes] = useState('');
  const [declaredByName, setDeclaredByName] = useState('');
  const [isSubmittingDeclaration, setIsSubmittingDeclaration] = useState(false);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);

  // Workbook Approval State
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showCorrectionsDialog, setShowCorrectionsDialog] = useState(false);
  const [confirmationSignatory, setConfirmationSignatory] = useState('');
  const [correctionComments, setCorrectionComments] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [activeHtmlReport, setActiveHtmlReport] = useState<{
    isOpen: boolean;
    reportUrl: string;
    downloadUrl: string;
    title: string;
    subtitle: string;
  } | null>(null);

  const [noticeFilesList, setNoticeFilesList] = useState<Array<{
    filename: string;
    reason: string;
    foundGstin?: string;
    expectedGstin?: string;
    docNumber?: string;
  }>>([]);

  const [uploadAckData, setUploadAckData] = useState<{
    ackReferenceId: string;
    ackMessage: string;
    filesUploaded: number;
    extractedCount: number;
    missingItems?: string[];
    isFullySatisfied?: boolean;
    dispatchResult?: any;
  } | null>(null);

  // Government ARN Copy State
  const [copiedArn, setCopiedArn] = useState(false);

  // Client AI Copilot & Model Integration State
  const [aiSettings, setAiSettings] = useState(() => getStoredClientAiSettings());
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isAiModelModalOpen, setIsAiModelModalOpen] = useState(false);
  const [clientChosenProvider, setClientChosenProvider] = useState<AiProviderId>(() => aiSettings.defaultClientProvider || 'gemini');
  const [clientChosenModel, setClientChosenModel] = useState<string>(() => aiSettings.defaultClientModel || 'gemini-2.5-flash');
  const [clientByokKey, setClientByokKey] = useState<string>('');
  const [isByokActive, setIsByokActive] = useState<boolean>(false);
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: 'Namaste! I am your AI Statutory Assistant. You can ask me questions about GST invoices, ITC rules under Section 16, TDS provisions, or portal document uploads.',
      time: 'Just now',
    },
  ]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiIsTyping, setAiIsTyping] = useState(false);

  // Sync client chosen model from practice allocation settings if available
  useEffect(() => {
    if (session?.client?.gstin || session?.client?.id) {
      const match = aiSettings.clientAllocations.find(
        c => c.gstin === session.client.gstin || c.clientId === session.client.id
      );
      if (match) {
        setClientChosenProvider(match.assignedProvider);
        setClientChosenModel(match.assignedModel);
        setIsByokActive(match.isCustomKeyConnected);
        if (match.customApiKeyMasked) setClientByokKey(match.customApiKeyMasked);
      }
    }
  }, [session, aiSettings]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const handleSaveClientAiChoice = (provider: AiProviderId, model: string, byokKey?: string) => {
    setClientChosenProvider(provider);
    setClientChosenModel(model);
    if (byokKey) {
      setIsByokActive(true);
      setClientByokKey(byokKey);
    }
    if (session?.client?.id) {
      const updatedAllocations = aiSettings.clientAllocations.map(c => {
        if (c.clientId === session.client.id || c.gstin === session.client.gstin) {
          return {
            ...c,
            assignedProvider: provider,
            assignedModel: model,
            isCustomKeyConnected: Boolean(byokKey || isByokActive),
            customApiKeyMasked: byokKey ? byokKey.slice(0, 6) + '...' + byokKey.slice(-4) : c.customApiKeyMasked,
          };
        }
        return c;
      });
      const updatedSettings = { ...aiSettings, clientAllocations: updatedAllocations };
      setAiSettings(updatedSettings);
      saveStoredClientAiSettings(updatedSettings);
    }
    setIsAiModelModalOpen(false);
    setSuccessMsg(`AI Model updated to ${model}. Requests will route through your chosen engine.`);
  };

  const handleSendAiMessage = (queryText?: string) => {
    const textToSend = queryText || aiChatInput;
    if (!textToSend.trim()) return;

    const userMsg = { sender: 'user' as const, text: textToSend, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setAiChatMessages(prev => [...prev, userMsg]);
    setAiChatInput('');
    setAiIsTyping(true);

    setTimeout(() => {
      let reply = '';
      const lower = textToSend.toLowerCase();
      if (lower.includes('16(4)') || lower.includes('itc') || lower.includes('credit')) {
        reply = `Under Section 16(2) and Section 16(4) of the CGST Act, Input Tax Credit can only be claimed if the tax invoice is uploaded by the supplier in GSTR-1 and appears in your GSTR-2B before the statutory cutoff (30th November). If you upload the invoice here, our CA firm will run automated 2B reconciliation to verify eligibility.`;
      } else if (lower.includes('msme') || lower.includes('43b')) {
        reply = `Under Section 43B(h) of the Income Tax Act, payments to registered Micro and Small enterprises must be settled within 45 days (if written agreement exists) or 15 days (without agreement). Unpaid amounts at year-end are added back to taxable income.`;
      } else if (lower.includes('tds') || lower.includes('194')) {
        reply = `For purchases exceeding ₹50 Lakhs in a financial year, Section 194Q TDS (0.1%) applies if buyer turnover exceeds ₹10 Crores. If Section 194Q applies, TCS under Section 206C(1H) is not applicable.`;
      } else {
        reply = `Thank you for your question. Based on Indian tax compliance guidelines, your query regarding "${textToSend}" has been processed by your selected AI engine (${clientChosenModel}). For certified statutory filings, your assigned CA partner will review all uploaded documentation.`;
      }

      if (aiSettings.appendLegalDisclaimer && aiSettings.disclaimerText) {
        reply += `\n\n⚖️ ${aiSettings.disclaimerText}`;
      }

      const aiMsg = { sender: 'ai' as const, text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setAiChatMessages(prev => [...prev, aiMsg]);
      setAiIsTyping(false);
    }, 600);
  };

  const handleCategoryNilToggle = async (categoryId: string, status: 'nil' | 'pending') => {
    if (!session) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/monthly-requests/${session.request.id}/declare-category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryId,
          status,
          declaredBy: session.client.contactPerson,
        }),
      });
      await safeParseResponse(res);
      await fetchSession(token);
      setSuccessMsg(status === 'nil' ? `Marked "${categoryId.replace('_', ' ')}" as Nil / None this month.` : `Reset declaration for "${categoryId.replace('_', ' ')}".`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSession = async (currentToken: string, retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      const queryParam = currentToken ? `?token=${encodeURIComponent(currentToken)}` : '';
      const res = await fetch(`/api/client-portal/session${queryParam}`);

      // Handle Render free tier cold-starts (502 / 503 / 504 proxy response while spinning up)
      if ((res.status === 502 || res.status === 503 || res.status === 504) && retryCount < 4) {
        console.warn(`[Client Portal] Server is waking up (HTTP ${res.status}). Retrying in 2.5s (attempt ${retryCount + 1}/4)...`);
        await new Promise(resolve => setTimeout(resolve, 2500));
        return await fetchSession(currentToken, retryCount + 1);
      }

      const data = await safeParseResponse(res);
      setSession(data);
      if (data.client?.id && !token) {
        setToken(data.client.id);
      }
      if (data.client?.contactPerson) {
        setDeclaredByName(data.client.contactPerson);
        setConfirmationSignatory(data.client.contactPerson);
      }
      if (data.request?.declarationNotes) {
        setDeclarationNotes(data.request.declarationNotes);
      }
    } catch (err: any) {
      setError(err.message);
      setSession((prev: any) => prev || null);
    } finally {
      if (retryCount === 0 || retryCount >= 4) {
        setLoading(false);
      }
    }
  };

  // Auto-open Additional Documents & Declaration popup if opened from "Remind Client" link
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('remind') === 'missing' || params.get('action') === 'declaration' || params.get('action') === 'notes' || params.get('popup') === 'true') {
        setShowAdditionalDocModal(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Fetch available real clients for switching
  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAvailableClients(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const activeVal = initialToken || token || '';
    if (initialToken) {
      setToken(initialToken);
    }
    fetchSession(activeVal);
  }, [initialToken]);

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const clearAllSelectedFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const openUploadSection = () => {
    setIsUploadAreaOpen(true);
    setTimeout(() => {
      uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const handleUploadCategoryClick = (categoryId?: string) => {
    if (categoryId && ['sales_invoices', 'purchase_invoices', 'bank_statements', 'debit_credit_notes'].includes(categoryId)) {
      setTargetCategory(categoryId as any);
    } else {
      setTargetCategory('auto');
    }
    openUploadSection();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const incoming = Array.from(e.target.files);
      const existingQueueKeys = new Set(selectedFiles.map(f => `${f.name}_${f.size}`));
      const previouslyUploadedKeys = new Set(
        (session?.files || []).map((f: any) => `${f.originalFilename}_${f.sizeBytes}`)
      );

      const duplicatesInQueue: string[] = [];
      const duplicatesPreviouslyUploaded: string[] = [];
      const newFilesToStage: File[] = [];

      for (const file of incoming) {
        const key = `${file.name}_${file.size}`;
        if (existingQueueKeys.has(key)) {
          duplicatesInQueue.push(file.name);
        } else {
          existingQueueKeys.add(key);
          newFilesToStage.push(file);
          if (previouslyUploadedKeys.has(key)) {
            duplicatesPreviouslyUploaded.push(file.name);
          }
        }
      }

      if (duplicatesInQueue.length > 0) {
        setError(`Ignored ${duplicatesInQueue.length} duplicate file(s) already in your selection queue (${duplicatesInQueue.slice(0, 2).join(', ')}${duplicatesInQueue.length > 2 ? '...' : ''}).`);
      } else if (duplicatesPreviouslyUploaded.length > 0) {
        setError(`⚠️ Notice: ${duplicatesPreviouslyUploaded.length} selected file(s) were already uploaded previously for this period. Our system will automatically detect and skip duplicates to prevent double-counting.`);
      }

      setSelectedFiles(prev => [...prev, ...newFilesToStage]);
      setIsUploadAreaOpen(true);
      // Reset input value so same files can be re-selected if removed
      e.target.value = '';
    }
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0 || !session) return;

    const fileCount = selectedFiles.length;
    const totalMb = selectedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024);
    // Real-world calibrated duration: ~13s per document + 3s per MB + 12s server round-trip / DB compilation
    // For 1 file: ~28s. For 3 files: ~54s. For 11 files: ~165s (~2m 45s).
    const estimatedTotalSec = Math.max(25, Math.round(fileCount * 13 + totalMb * 3 + 12));
    const totalDurationMs = estimatedTotalSec * 1000;
    const startTime = Date.now();

    setEstimatedSecondsRemaining(estimatedTotalSec);
    setUploadElapsedSeconds(0);
    setUploadProgressPercent(8);
    setUploadStageText(`Uploading in progress: Transferring ${fileCount} encrypted evidence file(s)...`);
    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    progressTimerRef.current = setInterval(() => {
      const elapsedMs = Date.now() - startTime;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      setUploadElapsedSeconds(elapsedSec);

      const remainingSec = Math.max(0, Math.round((totalDurationMs - elapsedMs) / 1000));
      setEstimatedSecondsRemaining(remainingSec);

      let currentPct = 8;
      const fraction = elapsedMs / totalDurationMs;

      if (fraction < 0.90) {
        // Smooth progression up to 90% in sync with real elapsed time
        currentPct = Math.round(8 + fraction * 82);
      } else {
        // Asymptotic progression past 90%: smoothly creeps 91% -> 92% -> 93% -> 94% -> 95% -> 96% -> 97% -> 98%
        // It NEVER freezes or locks at 93%!
        const overtimeMs = Math.max(0, elapsedMs - totalDurationMs * 0.90);
        const extraProgress = (1 - Math.exp(-overtimeMs / 45000)) * 8;
        currentPct = Math.min(98, Math.round(90 + extraProgress));
      }
      setUploadProgressPercent(currentPct);

      if (currentPct < 25) {
        setUploadStageText(`Uploading in progress: Encrypting and streaming ${fileCount} evidence file(s)...`);
      } else if (currentPct < 60) {
        setUploadStageText(`AI is scanning your docs: Reading invoices, GSTINs & line items (${fileCount} files)...`);
      } else if (currentPct < 85) {
        setUploadStageText('Validating GSTIN, Section 16 ITC eligibility & tax breakdowns...');
      } else if (currentPct < 96) {
        setUploadStageText('Compiling monthly GST audit snapshot & generating working papers...');
      } else {
        setUploadStageText('Finalizing verification records & saving statutory audit register...');
      }
    }, 350);

    try {
      const formData = new FormData();
      formData.append('monthlyRequestId', session.request.id);
      formData.append('uploaderName', session.client.contactPerson);
      formData.append('source', 'client_portal');
      formData.append('targetCategory', targetCategory);

      if (pdfPassword.trim()) {
        formData.append('pdfPassword', pdfPassword.trim());
        formData.append('bankStatementPassword', pdfPassword.trim());
      }

      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await safeParseResponse(res);

      // Finish progress animation
      setUploadProgressPercent(100);
      setUploadStageText('AI is scanning your docs: Extraction & verification complete!');
      setEstimatedSecondsRemaining(0);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);

      if (data.mismatchedNoticeFiles && data.mismatchedNoticeFiles.length > 0) {
        setNoticeFilesList(data.mismatchedNoticeFiles);
      } else {
        setNoticeFilesList([]);
      }

      setUploadAckData({
        ackReferenceId: data.ackReferenceId,
        ackMessage: data.ackMessage,
        filesUploaded: data.filesUploaded,
        extractedCount: data.extractedCount,
        missingItems: data.missingItems || [],
        isFullySatisfied: data.isFullySatisfied,
        dispatchResult: data.dispatchResult,
      });

      if (data.mismatchedNoticeFiles && data.mismatchedNoticeFiles.length > 0) {
        setSuccessMsg(
          `Uploaded and accepted ${selectedFiles.length} file(s) (${data.extractedCount} invoices extracted). Notice: ${data.mismatchedNoticeFiles.length} file(s) have a GSTIN advisory note for your CA team.`
        );
      } else if (data.duplicateCount && data.duplicateCount > 0) {
        const newCount = data.filesUploaded - data.duplicateCount;
        setSuccessMsg(
          `Processed ${newCount} new document(s) (${data.extractedCount} invoices extracted). Notice: ${data.duplicateCount} duplicate file(s) were safely skipped to protect against duplicate GST calculations.`
        );
      } else if (data.missingItems && data.missingItems.length > 0) {
        setSuccessMsg(`Uploaded and accepted ${selectedFiles.length} file(s) (${data.extractedCount} invoices extracted). Notice: ${data.missingItems.length} document(s) still required to complete filing.`);
      } else {
        setSuccessMsg(`Successfully uploaded and scanned ${selectedFiles.length} document(s)! All monthly checklist requirements are complete.`);
      }
      setSelectedFiles([]);
      setPdfPassword('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchSession(token);

      // Brief pause so client sees 100% completion
      setTimeout(() => {
        setIsUploading(false);
      }, 750);
    } catch (err: any) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setIsUploading(false);
      setError(err.message);
    }
  };

  const handleAdditionalDocAndDeclarationSubmit = async () => {
    if (!session) return;
    try {
      setIsSubmittingDeclaration(true);
      setError(null);

      // 1. If additional files are selected, upload them
      if (additionalFiles.length > 0) {
        const formData = new FormData();
        formData.append('monthlyRequestId', session.request.id);
        formData.append('uploaderName', declaredByName || session.client.contactPerson);
        formData.append('source', 'client_portal_additional');
        formData.append('targetCategory', additionalCategory);

        if (additionalPassword.trim()) {
          formData.append('pdfPassword', additionalPassword.trim());
          formData.append('bankStatementPassword', additionalPassword.trim());
        }

        additionalFiles.forEach(file => {
          formData.append('files', file);
        });

        const uploadRes = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) {
          const errData = await safeParseResponse(uploadRes);
          throw new Error(errData.error || 'Failed to upload additional documents');
        }
      }

      // 2. Submit Note / Reason / Declaration if provided
      if (declarationNotes.trim() || declaredByName.trim()) {
        const declRes = await fetch(`/api/monthly-requests/${session.request.id}/declaration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noTransactions: false,
            declarationNotes: declarationNotes.trim(),
            declaredBy: declaredByName.trim() || session.client.contactPerson,
          }),
        });
        if (!declRes.ok) {
          const errData = await safeParseResponse(declRes);
          throw new Error(errData.error || 'Failed to record declaration note');
        }
      }

      setShowAdditionalDocModal(false);
      setAdditionalFiles([]);
      setAdditionalPassword('');
      setSuccessMsg(
        additionalFiles.length > 0
          ? `✓ Successfully uploaded ${additionalFiles.length} additional document(s) & submitted notes to CA.`
          : '✓ Client note & reason / declaration submitted successfully for CA review.'
      );
      await fetchSession(token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingDeclaration(false);
    }
  };

  const handleClientConfirmWorkbook = async (action: 'approve' | 'request_corrections', workbookId: string) => {
    try {
      setIsSubmittingApproval(true);
      setError(null);
      const res = await fetch(`/api/workbooks/${workbookId}/client-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          clientName: confirmationSignatory,
          comments: correctionComments,
          confirmationText: 'I confirm all applicable documents for this period have been supplied and the compiled figures are verified.',
        }),
      });

      await safeParseResponse(res);

      setShowApproveDialog(false);
      setShowCorrectionsDialog(false);
      setSuccessMsg(action === 'approve' ? 'Workbook officially approved by client!' : 'Corrections request submitted to CA firm.');
      await fetchSession(token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const latestWorkbook = session?.workbooks?.[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Navigation / Back Button (if embedded) */}
      {onBack && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs inline-flex items-center space-x-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Executive Cockpit</span>
          </button>
          <span className="text-xs font-semibold text-slate-500">Live Client Submission View</span>
        </div>
      )}

      {/* Top Banner / Secure Link Switcher */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
          {isStandaloneClient ? (
            <span className="font-medium">
              Verified Client Session: <strong className="text-slate-900">{session?.client?.businessName || 'Loading...'}</strong>
            </span>
          ) : (
            <span>Restricted Client Portal (Protected via Scoped Upload Token)</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowServicesModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
            title="Explore our CA Practice Services & Advisory Offerings"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Practice Services Suite</span>
          </button>

          {isStandaloneClient ? (
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold border border-emerald-200">
                GSTIN: {session?.client?.gstin || '...'}
              </span>
            </div>
          ) : (
            /* Business Picker for testing and portal navigation */
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">Switch Business:</span>
              <select
                value={session?.client?.id || token}
                onChange={e => {
                  setToken(e.target.value);
                  fetchSession(e.target.value);
                }}
                className="text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 font-medium text-slate-800"
              >
                {availableClients.length > 0 ? (
                  availableClients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.businessName} ({c.gstin})
                    </option>
                  ))
                ) : (
                  <option value={session?.client?.id || ''}>
                    {session?.client?.businessName || 'Active Client'} ({session?.client?.gstin || 'GSTIN'})
                  </option>
                )}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 text-slate-500">Loading client records and upload portal...</div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 text-sm flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 text-rose-400 hover:text-rose-600 rounded transition"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          {uploadAckData && (
            <span className="font-mono text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold border border-emerald-300">
              {uploadAckData.ackReferenceId}
            </span>
          )}
        </div>
      )}

      {/* Practice Portal Announcement Banner Message (configured in Self Service Portal Settings) */}
      {portalPrefs.bannerMessage && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/90 rounded-2xl p-4 text-slate-800 text-xs shadow-xs flex items-start gap-3 animate-in fade-in">
          <div className="p-2 bg-blue-100/80 rounded-xl text-blue-700 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 leading-relaxed">
            <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide mb-0.5">
              Firm Notice
            </span>
            <p className="text-slate-700 font-medium">{portalPrefs.bannerMessage}</p>
          </div>
        </div>
      )}

      {/* High-Visibility Alert: Upload Rejected Files (GST Mismatch) */}
      {noticeFilesList.length > 0 && (
        <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-5 shadow-xs space-y-3 animate-in fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 text-amber-900">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h4 className="font-bold text-base flex flex-wrap items-center gap-2">
                  <span>⚠️ Document Notice: {noticeFilesList.length} File(s) Accepted with GSTIN Advisory Note</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs rounded-full font-bold border border-emerald-300">
                    ✓ Accepted in Return
                  </span>
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  All files have been uploaded and accepted into your return. Our AI noted that the documents below contain GST numbers differing from your registered profile (<strong>{session?.client?.gstin}</strong>). Your CA audit team will review these during final working paper compilation.
                </p>
              </div>
            </div>
            <button
              onClick={() => setNoticeFilesList([])}
              className="text-xs font-semibold px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-900 rounded-lg transition cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1 max-h-80 overflow-y-auto pr-1">
            {noticeFilesList.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-white rounded-xl border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-2xs"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="text-amber-600">ℹ️</span>
                    <span>{item.filename}</span>
                    {item.docNumber && <span className="text-[11px] text-slate-500 font-mono">#{item.docNumber}</span>}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                      Accepted
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 font-medium">{item.reason}</div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {item.foundGstin && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[10px] font-bold rounded-md">
                      Found GST: {item.foundGstin}
                    </span>
                  )}
                  {item.expectedGstin && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 font-mono text-[10px] font-bold rounded-md">
                      Client GST: {item.expectedGstin}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Digital Receipt & Automated Acknowledgement Card */}
      {uploadAckData && (
        <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-emerald-600 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-emerald-100">Official Document Receipt & Acknowledgement</h3>
            </div>
            <span className="font-mono text-xs bg-emerald-800/60 border border-emerald-500/40 text-emerald-200 px-2.5 py-1 rounded-md font-bold">
              Ref: {uploadAckData.ackReferenceId}
            </span>
          </div>

          <div className="text-xs text-slate-200 whitespace-pre-wrap font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            {uploadAckData.ackMessage}
          </div>

          {/* Missing items warning if any still pending */}
          {uploadAckData.missingItems && uploadAckData.missingItems.length > 0 ? (
            <div className="bg-amber-950/70 border border-amber-500/60 rounded-xl p-3 text-xs text-amber-200 space-y-1.5">
              <div className="font-bold flex items-center space-x-1.5 text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Notice: Additional Documents Still Required for {session?.request?.reportingMonth}</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-100">
                {uploadAckData.missingItems.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-300">
                A WhatsApp notification has been dispatched to your phone listing these missing items.
              </p>
            </div>
          ) : (
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>All mandatory checklist items are complete! CA staff will now compile your returns.</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <div className="text-emerald-300">
              Status: <strong>{uploadAckData.dispatchResult?.status === 'sent' ? 'WhatsApp Sent Automatically via OpenWA Bot' : 'Acknowledgement Logged & Prepared'}</strong>
            </div>

            {uploadAckData.dispatchResult?.whatsappDeepLink && (
              <a
                href={uploadAckData.dispatchResult.whatsappDeepLink}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1"
              >
                <span>Open Receipt in WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      )}

      {session && !loading && (
        <>
          {/* Business Profile & Multi-Business Notice */}
          <div className="theme-banner text-white rounded-2xl p-6 shadow-xl border space-y-4 relative overflow-hidden">
            {/* Subtle card watermark */}
            <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.06] select-none translate-x-6 translate-y-6">
              <img src="/logo.jpg" alt="" className="w-60 h-60 object-contain filter grayscale contrast-125" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
              <div className="flex items-center space-x-4">
                <img
                  src="/logo.jpg"
                  alt="QuinceCA"
                  className="w-14 h-14 rounded-xl object-cover shadow-md border border-white/20 shrink-0"
                />
                <div>
                  <span className="text-xs uppercase tracking-wider theme-accent-text font-semibold">QuinceCA • Client GST Portal</span>
                  <h1 className="text-2xl font-bold tracking-tight mt-0.5">{session.client.businessName}</h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1 font-mono">
                    <span>GSTIN: <strong>{session.client.gstin}</strong></span>
                    <span>Contact: {session.client.contactPerson}</span>
                    <span>Reporting Period: <strong className="text-white">{session.request.reportingMonth}</strong></span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600/80 text-white border border-blue-400/40">
                  {session.request.status}
                </span>
                <div className="text-[11px] text-slate-400 mt-1">
                  Assigned CA Staff: {session.client.assignedStaffName || 'QuinceCA Team'}
                </div>
              </div>
            </div>

            {/* Sister Businesses notice if multiple businesses under same phone */}
            {session.sisterBusinesses && session.sisterBusinesses.length > 1 && (
              <div className="bg-blue-900/40 border border-blue-700/50 rounded-lg p-3 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Your contact number is linked to <strong>{session.sisterBusinesses.length} businesses</strong>. You are currently viewing <strong>{session.client.businessName}</strong>.
                  </span>
                </div>
                <span className="text-blue-300 font-medium">Verified isolation</span>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* STATUTORY FILING STATUS & GOVERNMENT RECEIPT (PORTAL SYNC) */}
          {/* ========================================================================= */}
          {session.filingReceipt && (
            <div
              className={`rounded-2xl p-5 border shadow-sm transition-all ${
                session.filingReceipt.isFiled
                  ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-[#0e1626] border-emerald-500/40 text-white'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100/10">
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      session.filingReceipt.isFiled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm tracking-tight">
                        {session.filingReceipt.isFiled
                          ? 'Government Portal Synced • Return Officially Filed'
                          : 'Government E-Filing In Progress'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          session.filingReceipt.isFiled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {session.filingReceipt.isFiled ? 'Verified on GSTN / CBDT' : 'Pending Sign-Off'}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-0.5 ${
                        session.filingReceipt.isFiled ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {session.filingReceipt.isFiled
                        ? `Official statutory compliance confirmed for ${session.client.businessName} (${session.request.reportingMonth}).`
                        : `Your document register is being reconciled by CA audit team for official submission.`}
                    </p>
                  </div>
                </div>

                {session.filingReceipt.isFiled && session.filingReceipt.arnNumber && (
                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    <button
                      onClick={() => {
                        if (session.filingReceipt?.arnNumber) {
                          navigator.clipboard.writeText(session.filingReceipt.arnNumber);
                          setCopiedArn(true);
                          setTimeout(() => setCopiedArn(false), 2000);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white/10 hover:bg-white/15 text-emerald-300 border border-emerald-500/30 transition flex items-center space-x-1.5"
                      title="Copy Government ARN"
                    >
                      <span>ARN: {session.filingReceipt.arnNumber}</span>
                      {copiedArn ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>

              {session.filingReceipt.isFiled ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Return Type</span>
                    <span className="font-bold text-white text-xs">
                      {session.filingReceipt.returnType || 'GSTR-1 & 3B'}
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Government ARN</span>
                    <span className="font-mono font-bold text-emerald-300 text-xs truncate block">
                      {session.filingReceipt.arnNumber}
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Filing Date</span>
                    <span className="font-semibold text-slate-200 text-xs">
                      {session.filingReceipt.filingDate || 'Current Period'}
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Digital Verification</span>
                    <span className="font-semibold text-emerald-400 text-xs flex items-center gap-1">
                      <Check className="w-3 h-3" /> EVC / Aadhaar OTP
                    </span>
                  </div>
                </div>
              ) : (
                <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Docs Ingested
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className="flex items-center gap-1 font-semibold text-blue-600">
                      <Clock className="w-3.5 h-3.5" /> Working Paper Audited
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className="flex items-center gap-1 font-medium text-slate-400">
                      <Shield className="w-3.5 h-3.5" /> Govt Portal Upload
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">Due Date Sync: Active</span>
                </div>
              )}
            </div>
          )}

          {/* Missing Documents Alert Banner */}
          {session.missingItems && session.missingItems.length > 0 ? (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-xs flex items-start space-x-3 text-amber-900 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="font-bold text-sm flex items-center justify-between">
                  <span>Filing Action Required: {session.missingItems.length} Document(s) Still Missing for {session.request.reportingMonth}</span>
                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-semibold">Missing Documents</span>
                </div>
                <p className="text-xs text-amber-800">
                  Please upload the following required documents or provide your note / reason / declaration for your CA:
                </p>
                <ul className="list-disc list-inside text-xs font-semibold text-amber-900 space-y-0.5 pt-1">
                  {session.missingItems.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 shadow-xs flex items-center space-x-3 text-emerald-900 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <div className="font-bold text-sm">All Monthly Documents Received & Complete!</div>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Your sales invoices, purchase bills, and bank statements for {session.request.reportingMonth} are complete. CA audit team is preparing your working paper.
                </p>
              </div>
            </div>
          )}

          {/* 1. Primary Highlight: Monthly Document Checklist (Full Width) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <span>Monthly Document Checklist</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit requirements for <strong>{session.request.reportingMonth}</strong> ({session.client.businessName})
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {session.missingItems?.length > 0 ? (
                  <span className="px-2.5 py-1 rounded-full text-xs bg-rose-100 text-rose-800 font-bold border border-rose-200 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{session.missingItems.length} Missing Requirements</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>All Requirements Complete</span>
                  </span>
                )}

                <button
                  onClick={() => {
                    openUploadSection();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1 cursor-pointer"
                  title="Upload additional documents"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Upload Documents</span>
                </button>

                <button
                  onClick={() => setShowAdditionalDocModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-lg border border-slate-300 hover:border-slate-400 shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
                  title="Upload additional documents or submit client note / reason / declaration to CA"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Upload Additional Docs & Note / Reason</span>
                </button>
              </div>
            </div>

            {/* Checklist Category Cards: strictly aligned in ONE SINGLE LINE with dynamic columns */}
            <div
              className="grid gap-2.5 overflow-x-auto pb-1 scrollbar-thin"
              style={{
                gridTemplateColumns: `repeat(${Math.max(session.checklist?.length || 1, 1)}, minmax(180px, 1fr))`
              }}
            >
              {session.checklist && session.checklist.length > 0 ? (
                session.checklist.map((item: any) => {
                  const isGreen = item.status === 'uploaded' || item.status === 'nil_declared';

                  const categoryShortTitle =
                    item.id === 'sales_invoices' ? 'Sales Invoices' :
                    item.id === 'purchase_invoices' ? 'Purchase Bills' :
                    item.id === 'bank_statements' ? 'Bank Statements' :
                    item.id === 'debit_credit_notes' ? 'Dr / Cr Notes' :
                    item.id?.startsWith('custom_') ? 'CA Requested' :
                    item.label?.replace(' Document', '') || item.label;

                  const categorySubtitle =
                    item.id === 'sales_invoices' ? 'Outward GSTR-1 supplies' :
                    item.id === 'purchase_invoices' ? 'Inward ITC tax bills' :
                    item.id === 'bank_statements' ? 'Monthly bank statement' :
                    item.id === 'debit_credit_notes' ? 'Rate/quantity revisions' :
                    item.id?.startsWith('custom_') ? (item.missingReason || 'Specific audit bill') :
                    (item.description?.slice(0, 26) || 'Monthly compliance');

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between min-h-[128px] ${
                        isGreen
                          ? 'bg-emerald-50/80 border-emerald-300 hover:border-emerald-400 shadow-2xs'
                          : 'bg-rose-50/80 border-rose-300 hover:border-rose-400 shadow-2xs'
                      }`}
                    >
                      <div>
                        {/* Top: Category Title & Status Pill (strictly green vs red) */}
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <div className="font-bold text-xs text-slate-800 flex items-center space-x-1 min-w-0">
                            {isGreen ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            )}
                            <span className="truncate font-bold" title={item.label}>
                              {categoryShortTitle}
                            </span>
                          </div>

                          <div className="shrink-0">
                            {isGreen ? (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                <span>{item.status === 'nil_declared' ? 'Nil' : `${item.uploadedCount || 1} Done`}</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                <span>Missing</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Subtitle / Scope line */}
                        <p className="text-[11px] text-slate-500 truncate" title={item.description || item.missingReason}>
                          {categorySubtitle}
                        </p>

                        {/* Binary Status Text */}
                        <div className="mt-1">
                          {isGreen ? (
                            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                              <span>✓</span> Ready for CA Review
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                              <span>⚠️</span> Action Required
                            </span>
                          )}
                        </div>

                        {/* If Bank Statement has password, reflect it right on the card */}
                        {item.id === 'bank_statements' && ((session as any)?.bankStatementPassword || session?.files?.find((f: any) => f.documentPassword)?.documentPassword) && (
                          <div className="mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-900 font-mono text-[10px] font-bold">
                            <Key className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                            <span className="truncate">Password: {(session as any)?.bankStatementPassword || session?.files?.find((f: any) => f.documentPassword)?.documentPassword}</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="pt-2 mt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                        {!isGreen ? (
                          <>
                            <button
                              onClick={() => handleUploadCategoryClick(item.id)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow-2xs flex items-center gap-1 transition shrink-0 cursor-pointer"
                            >
                              <UploadCloud className="w-3 h-3" />
                              <span>Upload File</span>
                            </button>
                            <button
                              onClick={() => handleCategoryNilToggle(item.id, 'nil')}
                              className="text-slate-500 hover:text-slate-800 text-[10px] font-medium hover:underline shrink-0 cursor-pointer"
                              title="Declare 0 transactions for this category this month"
                            >
                              Mark Nil
                            </button>
                          </>
                        ) : item.status === 'nil_declared' ? (
                          <>
                            <span className="text-slate-500 text-[10px]">Nil Declared</span>
                            <button
                              onClick={() => handleCategoryNilToggle(item.id, 'pending')}
                              className="text-blue-600 hover:underline text-[10px] font-medium cursor-pointer"
                            >
                              Undo / Upload
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Verified</span>
                            </span>
                            <button
                              onClick={() => handleUploadCategoryClick(item.id)}
                              className="text-slate-500 hover:text-blue-600 text-[10px] font-medium hover:underline cursor-pointer"
                            >
                              + Upload More
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-slate-400 text-center py-4 col-span-4">No checklist items configured.</div>
              )}
            </div>

            {/* Client Submitted Note / Reason Declaration Card */}
            {session.request.declarationNotes && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-950 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold flex items-center gap-1.5 text-indigo-950">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Client Submitted Declaration / Reason Note:</span>
                  </div>
                  <button
                    onClick={() => setShowAdditionalDocModal(true)}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Edit Note / Add Files</span>
                  </button>
                </div>
                <p className="whitespace-pre-wrap font-sans text-slate-800 bg-white p-2.5 rounded-lg border border-indigo-100 leading-relaxed">
                  {session.request.declarationNotes}
                </p>
                <div className="text-[11px] text-indigo-600 flex items-center justify-between">
                  <span>
                    Submitted by: <strong>{session.request.declaredBy || session.client.contactPerson}</strong>
                  </span>
                  {session.request.declaredAt && (
                    <span>{new Date(session.request.declaredAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Squeezed, Compact & Collapsible Upload Area */}
          <div ref={uploadSectionRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Upload Monthly Documents
                </h3>
                <span className="hidden sm:inline-block text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                  Up to 150 files per batch
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400 hidden md:inline">PDF, JPG, PNG, XLSX, CSV (Max 25MB each)</span>
                <button
                  onClick={() => setIsUploadAreaOpen(!isUploadAreaOpen)}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1 transition font-medium"
                >
                  <span>{isUploadAreaOpen ? 'Squeeze / Minimize' : 'Expand Upload Box'}</span>
                  {isUploadAreaOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv"
              className="hidden"
            />

            {!isUploadAreaOpen && selectedFiles.length === 0 ? (
              <div className="p-3 bg-slate-50 hover:bg-blue-50/40 border border-dashed border-slate-300 hover:border-blue-400 rounded-xl flex items-center justify-between transition cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}>
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span>Click to select files (accepts multiple sales invoices, expense bills, and bank statements)</span>
                </div>
                <button
                  type="button"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Select Files
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Target Section Selector */}
                <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 text-xs mr-1">Upload To Section:</span>
                  <button
                    type="button"
                    onClick={() => setTargetCategory('auto')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 ${
                      targetCategory === 'auto'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>✨ Smart Auto-Detect (Recommended)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetCategory('sales_invoices')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 ${
                      targetCategory === 'sales_invoices'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>Sales Invoices / Outward (GSTR-1)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetCategory('purchase_invoices')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 ${
                      targetCategory === 'purchase_invoices'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>Purchase Bills / Inward (ITC)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetCategory('bank_statements')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 ${
                      targetCategory === 'bank_statements'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>Bank Statements</span>
                  </button>
                </div>

                {/* Compact Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 sm:p-5 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/40 transition space-y-1"
                >
                  <UploadCloud className="w-7 h-7 mx-auto text-blue-600" />
                  <div className="text-xs font-semibold text-slate-700">
                    Click to browse or drop files here (select multiple files at once)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Supports high-volume batch uploads (up to 150 files), multi-page PDFs, bank statements, Excel workbooks & scanned bills.
                  </p>
                </div>

                {/* Staged Files Queue Editor (Add more, delete individual files, clear all) */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                      <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                        <span>Files Staged for Upload ({selectedFiles.length})</span>
                        <span className="text-slate-400 font-normal">
                          • Total {formatFileSize(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-700 text-xs font-semibold rounded border border-blue-200 flex items-center space-x-1 transition shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add More Files</span>
                        </button>
                        <button
                          type="button"
                          onClick={clearAllSelectedFiles}
                          className="px-2 py-1 text-rose-600 hover:text-rose-800 text-xs hover:bg-rose-50 rounded transition"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Scrollable file list with Delete Option per file */}
                      {selectedFiles.map((file, idx) => {
                        const isAlreadyUploaded = session?.files?.some((f: any) => f.originalFilename === file.name && f.sizeBytes === file.size);
                        return (
                          <div
                            key={idx}
                            className={`text-xs p-2.5 rounded-lg border flex items-center justify-between group transition ${
                              isAlreadyUploaded
                                ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0 flex-1 pr-2">
                              <FileText className={`w-4 h-4 shrink-0 ${isAlreadyUploaded ? 'text-amber-600' : 'text-blue-500'}`} />
                              <span className="font-medium text-slate-800 truncate" title={file.name}>
                                {file.name}
                              </span>
                              {isAlreadyUploaded && (
                                <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded shrink-0">
                                  Already Uploaded (Will Skip)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-3 shrink-0">
                              <span className="text-[11px] text-slate-400">{formatFileSize(file.size)}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSelectedFile(idx);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                title="Delete / remove this file from upload"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                    {/* Bank Statement Password Option */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5">
                      <div className="flex items-center space-x-1.5">
                        <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="text-xs font-bold text-amber-900">
                          Bank Statement / Encrypted PDF Password (Optional)
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-tight">
                        Bank statements (SBI, HDFC, ICICI, Axis, PNB) are typically password-protected. Provide the password below so our OCR scanner can decrypt and scan it for your report.
                      </p>
                      <div className="relative mt-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={pdfPassword}
                          onChange={(e) => setPdfPassword(e.target.value)}
                          placeholder="e.g. PAN card number in CAPITALS or DOB (DDMMYYYY)"
                          className="w-full text-xs px-3 py-2 pr-10 border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Display saved password if already configured */}
                      {((session as any)?.bankStatementPassword || session?.files?.find((f: any) => f.documentPassword)?.documentPassword) && (
                        <div className="mt-1 flex items-center justify-between text-[11px] text-amber-900 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-300">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <Key className="w-3 h-3 text-amber-700" />
                            <span>Saved Statement Password:</span>
                            <code className="font-mono font-bold text-amber-950 bg-white/80 px-1.5 py-0.2 rounded border border-amber-200">
                              {(session as any)?.bankStatementPassword || session?.files?.find((f: any) => f.documentPassword)?.documentPassword}
                            </code>
                          </span>
                          <button
                            type="button"
                            onClick={() => setPdfPassword((session as any)?.bankStatementPassword || session?.files?.find((f: any) => f.documentPassword)?.documentPassword || '')}
                            className="text-amber-800 underline font-bold hover:text-amber-950 cursor-pointer ml-2 text-xs"
                          >
                            Fill in Box
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Live Upload Status Card while uploading */}
                    {isUploading && (
                      <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-xl space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-blue-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                            <span>Uploading in progress: AI is scanning your docs</span>
                          </span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-mono font-bold text-[11px] flex items-center gap-1 border border-blue-200">
                            <Clock className="w-3 h-3 text-blue-600 animate-spin" />
                            <span>{formatUploadRemainingText(estimatedSecondsRemaining, uploadElapsedSeconds)}</span>
                          </span>
                        </div>
                        <div className="w-full bg-blue-200/80 rounded-full h-2.5 overflow-hidden p-0.5">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgressPercent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-blue-700">
                          <span className="truncate italic">{uploadStageText}</span>
                          <span className="font-mono font-bold shrink-0 ml-2">{uploadProgressPercent}%</span>
                        </div>
                      </div>
                    )}

                    {/* Submit Upload Button */}
                    <button
                      onClick={handleUploadSubmit}
                      disabled={isUploading}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-75 text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>AI is scanning your docs ({formatUploadRemainingText(estimatedSecondsRemaining, uploadElapsedSeconds)})...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>Upload & Scan {selectedFiles.length} Document(s)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section: Compiled Excel Workbook Review & Client Confirmation */}
          {latestWorkbook ? (
            <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-200 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Compiled GST Working Paper & Excel Workbook</h3>
                    <p className="text-xs text-slate-500">
                      Version: <strong>v{latestWorkbook.version}</strong> | Generated on {new Date(latestWorkbook.generatedAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      setActiveHtmlReport({
                        isOpen: true,
                        reportUrl: `/api/workbooks/${latestWorkbook.id}/export-html`,
                        downloadUrl: `/api/workbooks/${latestWorkbook.id}/export-html?download=true`,
                        title: `GST Working Paper HTML Report (v${latestWorkbook.version})`,
                        subtitle: `${session.client.businessName} • Period: ${session.request.reportingMonth}`,
                      })
                    }
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition flex items-center space-x-1.5"
                    title="View and download standalone HTML statutory working paper"
                  >
                    <FileCode2 className="w-4 h-4 text-indigo-600" />
                    <span>View / Export HTML Report</span>
                  </button>

                  <a
                    href={`/api/workbooks/${latestWorkbook.id}/download`}
                    download
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition flex items-center space-x-1.5"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Download Excel Workbook</span>
                  </a>
                </div>
              </div>

              {/* Status Banner */}
              {latestWorkbook.status === 'client_confirmed' ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>You have officially confirmed this workbook (v{latestWorkbook.version})</span>
                  </div>
                  <p>Confirmation recorded: &quot;{latestWorkbook.clientConfirmationText}&quot; by {latestWorkbook.clientConfirmedBy}</p>
                </div>
              ) : latestWorkbook.status === 'corrections_requested' ? (
                <div className="bg-orange-50 border border-orange-300 rounded-xl p-4 text-xs text-orange-900 space-y-1">
                  <div className="font-bold text-orange-800">Corrections Requested</div>
                  <p>Comments: &quot;{latestWorkbook.clientCorrectionComments}&quot;. Team QuinceCA is reviewing.</p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                  <div className="text-xs text-blue-900">
                    Please review the 10-sheet Excel workbook. Confirm that all sales invoices, purchase invoices, and bank statements have been included accurately.
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setShowApproveDialog(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Approve Workbook</span>
                    </button>
                    <button
                      onClick={() => setShowCorrectionsDialog(true)}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Request Adjustments / Corrections</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center text-slate-500 space-y-3">
              <Clock className="w-8 h-8 mx-auto text-slate-400" />
              <div className="text-sm font-semibold text-slate-700">Workbook Pending Staff Compilation</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Once our CA staff reviews your uploaded documents and runs OCR reconciliation, the official 10-sheet Excel workbook will appear here for your review and approval.
              </p>
              <div>
                <button
                  onClick={() =>
                    setActiveHtmlReport({
                      isOpen: true,
                      reportUrl: `/api/monthly-requests/${session.request.id}/export-html`,
                      downloadUrl: `/api/monthly-requests/${session.request.id}/export-html?download=true`,
                      title: `Interim GST Working Paper HTML Report — ${session.client.businessName}`,
                      subtitle: `Period: ${session.request.reportingMonth} • Status: ${session.request.status}`,
                    })
                  }
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition inline-flex items-center space-x-1.5"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Preview Uploaded Data as HTML</span>
                </button>
              </div>
            </div>
          )}

          {/* Upload History Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-slate-800 text-sm">Uploaded Document Register ({session.files?.length || 0})</h3>
              {session.files && session.files.length > 0 && session.request?.id && (
                <a
                  href={`/api/monthly-requests/${session.request.id}/download-zip`}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition inline-flex items-center space-x-1.5 shadow-sm"
                  title="Download all uploaded documents for this period as a single ZIP file"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Save All to PC (.ZIP)</span>
                </a>
              )}
            </div>
            {session.files?.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No documents uploaded yet for this period.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                      <th className="py-2">Filename</th>
                      <th className="py-2">Source</th>
                      <th className="py-2">Upload Time</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {session.files.map((file: any) => {
                      const isDup = file.isDuplicate || file.status === 'duplicate_skipped' || file.status === 'duplicate_flagged';
                      const isRejected = file.status === 'rejected_gstin_mismatch';
                      return (
                        <tr
                          key={file.id}
                          className={
                            isRejected
                              ? 'bg-rose-50/70 border-rose-200'
                              : isDup
                              ? 'bg-amber-50/40'
                              : ''
                          }
                        >
                          <td className="py-2 font-medium text-slate-800">
                            <div>{file.originalFilename}</div>
                            {(() => {
                              const isBank = (file as any).docType === 'bank_statement' ||
                                /(bank|statement|passbook|hdfc|sbi|icici|axis|kotak|canara|pnb|acct)/i.test(file.originalFilename) ||
                                file.status === 'password_protected';
                              const pwd = isBank ? (file.documentPassword || file.scanNotes?.match(/Password:\s*([^|\n]+)/i)?.[1]) : null;
                              if (pwd) {
                                return (
                                  <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-mono text-blue-900 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                    <Key className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                                    <span>Password: {pwd}</span>
                                  </span>
                                );
                              }
                              return null;
                            })()}
                            {isRejected && (
                              <span className="text-[10px] text-rose-700 block font-semibold">
                                ❌ REJECTED: Bill GSTIN does not match client profile GSTIN ({session?.client?.gstin}). File was rejected from GST return.
                              </span>
                            )}
                            {isDup && (
                              <span className="text-[10px] text-amber-700 block font-normal">
                                ⚠️ Skipped duplicate (prevents double-counting in GST)
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-slate-500 uppercase text-[11px]">{file.source}</td>
                          <td className="py-2 text-slate-500">{new Date(file.receivedTime).toLocaleString('en-IN')}</td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase ${
                                isRejected
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300 font-bold'
                                  : isDup
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : file.status === 'processed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isRejected ? 'Rejected (GST Mismatch)' : isDup ? 'Duplicate (Skipped)' : file.status}
                            </span>
                          </td>
                        <td className="py-2 text-right">
                          <div className="inline-flex items-center space-x-1.5">
                            <a
                              href={`/api/documents/${file.id}/download`}
                              download={file.originalFilename}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded border border-blue-200 transition inline-flex items-center space-x-1"
                              title="Save file directly to your PC"
                            >
                              <Download className="w-3 h-3 text-blue-600" />
                              <span>Save to PC</span>
                            </a>
                            <a
                              href={`/api/documents/${file.id}/preview`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition"
                              title="Preview in new tab"
                            >
                              Preview
                            </a>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal: Additional Documents & Client Declaration */}
          {showAdditionalDocModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 border border-slate-200 max-h-[92vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Upload Additional Documents & Reason / Declaration
                      </h3>
                      <p className="text-xs text-slate-500">
                        For <strong>{session.client.businessName}</strong> • {session.request.reportingMonth}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdditionalDocModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* OPTION 1: Upload Additional Document Option */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">1</span>
                        <span>Upload Additional Document(s)</span>
                        <span className="text-[11px] text-slate-400 font-normal">(Optional)</span>
                      </div>
                      <span className="text-[10px] text-slate-500">PDF, JPG, PNG, Excel</span>
                    </div>

                    {/* Category Selector */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-medium mr-1">Document Category:</span>
                      {[
                        { id: 'sales_invoices', label: 'Sales Invoices / Missing Bills' },
                        { id: 'purchase_invoices', label: 'Purchase Bills' },
                        { id: 'bank_statements', label: 'Bank Statements' },
                        { id: 'debit_credit_notes', label: 'Debit / Credit Notes' },
                        { id: 'auto', label: 'Other Supporting Docs' },
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setAdditionalCategory(cat.id as any)}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer ${
                            additionalCategory === cat.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={additionalFileInputRef}
                      onChange={(e) => {
                        if (e.target.files) {
                          const newFiles = Array.from(e.target.files);
                          setAdditionalFiles(prev => [...prev, ...newFiles]);
                          e.target.value = '';
                        }
                      }}
                      multiple
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
                    />

                    <div
                      onClick={() => additionalFileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl p-4 text-center cursor-pointer transition space-y-1 bg-white"
                    >
                      <UploadCloud className="w-6 h-6 text-blue-600 mx-auto" />
                      <div className="text-xs font-semibold text-slate-700">
                        Click to select or drop additional files here
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Upload missing bills, cancelled invoice copies, or supporting bank proofs
                      </p>
                    </div>

                    {/* Staged Additional Files List */}
                    {additionalFiles.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                          <span>Selected {additionalFiles.length} file(s) to upload:</span>
                          <button
                            type="button"
                            onClick={() => setAdditionalFiles([])}
                            className="text-rose-600 hover:underline text-[10px] cursor-pointer"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="max-h-28 overflow-y-auto space-y-1">
                          {additionalFiles.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="font-medium truncate text-slate-800">{file.name}</span>
                                <span className="text-[10px] text-slate-400">({formatFileSize(file.size)})</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setAdditionalFiles(prev => prev.filter((_, i) => i !== idx))}
                                className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bank statement password if selected */}
                    {additionalCategory === 'bank_statements' && (
                      <div className="flex items-center gap-2 pt-1">
                        <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="PDF Password (if statement is encrypted)"
                          value={additionalPassword}
                          onChange={e => setAdditionalPassword(e.target.value)}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* OPTION 2: Client Able to Write Some Note or Reason / Declaration */}
                  <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold">2</span>
                        <span>Write Note, Reason or Declaration</span>
                      </div>
                      <span className="text-[10px] text-indigo-600 font-medium">Shared directly with CA</span>
                    </div>

                    {/* Quick preset chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Missing Invoice Cancelled', text: 'Invoice was cancelled/void and not issued to buyer. Kindly record as cancelled in GSTR-1 serial declarations.' },
                        { label: 'Sequence Gap Clarification', text: 'The missing invoice number was skipped due to a billing software reset / printer jam error. No supply was made.' },
                        { label: 'Attached Missing Bills', text: 'Enclosed the missing invoice copies as requested for audit.' },
                        { label: 'All Bills Supplied', text: 'I declare that all sales invoices and purchase bills for this period have been fully provided.' },
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setDeclarationNotes(prev => prev ? `${prev}\n${chip.text}` : chip.text);
                          }}
                          className="px-2 py-0.5 rounded-full bg-white text-indigo-700 hover:bg-indigo-100 text-[10px] font-medium border border-indigo-200 transition cursor-pointer"
                        >
                          + {chip.label}
                        </button>
                      ))}
                    </div>

                    <div>
                      <textarea
                        rows={4}
                        value={declarationNotes}
                        onChange={e => setDeclarationNotes(e.target.value)}
                        placeholder="e.g. Invoice INV-2026017 was cancelled before delivery and not issued to customer. Kindly treat as cancelled invoice..."
                        className="w-full text-xs p-3 border border-indigo-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 leading-relaxed font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Authorised Signatory / Contact Person
                        </label>
                        <input
                          type="text"
                          value={declaredByName}
                          onChange={e => setDeclaredByName(e.target.value)}
                          placeholder="Your name"
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Declaration Date
                        </label>
                        <div className="text-xs p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-medium">
                          {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowAdditionalDocModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleAdditionalDocAndDeclarationSubmit}
                    disabled={isSubmittingDeclaration || (!declarationNotes.trim() && additionalFiles.length === 0)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    {isSubmittingDeclaration ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting to CA...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit to CA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Approve Workbook */}
          {showApproveDialog && latestWorkbook && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center space-x-2 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold">Client Confirmation & Approval</h3>
                </div>
                <p className="text-xs text-slate-600">
                  You are approving <strong>{latestWorkbook.filename} (v{latestWorkbook.version})</strong> for <strong>{session.request.reportingMonth}</strong>.
                </p>
                <div className="bg-slate-50 p-3 rounded text-xs text-slate-700 italic border border-slate-200">
                  &quot;I confirm all applicable documents for this period have been supplied and the compiled figures are verified.&quot;
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Authorised Signatory Name</label>
                  <input
                    type="text"
                    value={confirmationSignatory}
                    onChange={e => setConfirmationSignatory(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button
                    onClick={() => setShowApproveDialog(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleClientConfirmWorkbook('approve', latestWorkbook.id)}
                    disabled={isSubmittingApproval || !confirmationSignatory}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow"
                  >
                    {isSubmittingApproval ? 'Submitting...' : 'Confirm & Approve'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Request Corrections */}
          {showCorrectionsDialog && latestWorkbook && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Request Adjustments / Corrections</h3>
                <p className="text-xs text-slate-600">
                  State the discrepancies or missing invoices so our staff can adjust the records and issue a new workbook version (v{latestWorkbook.version + 1}).
                </p>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Correction Details</label>
                  <textarea
                    rows={3}
                    value={correctionComments}
                    onChange={e => setCorrectionComments(e.target.value)}
                    placeholder="e.g. Sales invoice 042 was cancelled; please exclude from sales register..."
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button
                    onClick={() => setShowCorrectionsDialog(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleClientConfirmWorkbook('request_corrections', latestWorkbook.id)}
                    disabled={isSubmittingApproval || !correctionComments}
                    className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg shadow"
                  >
                    {isSubmittingApproval ? 'Submitting...' : 'Send Correction Request'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: CA Practice Services Suite */}
      {showServicesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/70">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">CA Practice & Advisory Services</h3>
                  <p className="text-xs text-neutral-400">Hover over services to preview our compliance, audit & filing capabilities</p>
                </div>
              </div>
              <button
                onClick={() => setShowServicesModal(false)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 md:p-6">
              <div className="rounded-xl overflow-hidden border border-neutral-800 shadow-inner">
                <InteractiveListPreview
                  items={CA_PRACTICE_SERVICES}
                  bgColor="#141414"
                  duration={0.5}
                  smoothness={0.3}
                  className="py-4"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
              <span>Need custom compliance support or tax defense? Contact your assigned CA partner.</span>
              <button
                onClick={() => setShowServicesModal(false)}
                className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-semibold transition"
              >
                Close Showcase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Copilot Trigger */}
      {aiSettings.enabled && aiSettings.enablePortalTaxCopilot && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsAiDrawerOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-[#00c073] to-teal-800 hover:from-[#00ab66] hover:to-teal-700 text-white rounded-full shadow-lg shadow-emerald-500/25 flex items-center space-x-2.5 transition transform hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span className="text-xs font-bold">Ask AI Copilot</span>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-mono">
              {clientChosenModel}
            </span>
          </button>
        </div>
      )}

      {/* Slide-over AI Copilot Drawer */}
      {isAiDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00c073] to-teal-800 text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-800 text-sm">Tax & Statutory Copilot</h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Model: <strong className="text-slate-700">{clientChosenModel}</strong>
                    {isByokActive && ' (Corporate BYOK)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                {aiSettings.allowClientsToChooseAi && (
                  <button
                    onClick={() => setIsAiModelModalOpen(true)}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-200 rounded-lg transition"
                    title="Configure AI Model / Integration"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsAiDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
              {aiChatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs ${
                      msg.sender === 'user'
                        ? 'bg-[#00c073] text-white rounded-br-none shadow-xs'
                        : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-none shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                    <span
                      className={`block text-[9px] mt-1.5 font-mono ${
                        msg.sender === 'user' ? 'text-emerald-100 text-right' : 'text-slate-400'
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
              {aiIsTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-3 text-xs text-slate-500 flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                    <span>Consulting statutory models ({clientChosenModel})...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action Prompts & Input Box */}
            <div className="p-3.5 bg-white border-t border-slate-200 space-y-2.5">
              {/* Prompt Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                {[
                  'Section 16(4) ITC Rule',
                  'Section 43B(h) MSME 45-day Rule',
                  'Section 194Q vs 206C(1H)',
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendAiMessage(chip)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full whitespace-nowrap transition cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input bar */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={aiChatInput}
                  onChange={e => setAiChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendAiMessage()}
                  placeholder="Ask about GST, TDS, invoice rules..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  onClick={() => handleSendAiMessage()}
                  disabled={!aiChatInput.trim() || aiIsTyping}
                  className="p-2 bg-[#00c073] hover:bg-[#00a864] text-white rounded-xl transition disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Model & Integration Selection Modal (Client Self-Service) */}
      {isAiModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Choose Your AI Engine</h3>
                  <p className="text-[11px] text-slate-500">Pick an AI provider or connect your company's own key</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModelModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Available AI Models</span>
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {[
                  { id: 'gemini:gemini-2.5-flash', name: 'Google Gemini 2.5 Flash', tag: 'Fast & Included', desc: 'Instant invoice OCR, GST FAQ copilot, and quick verification.' },
                  { id: 'gemini:gemini-2.5-pro', name: 'Google Gemini 2.5 Pro', tag: 'Deep Analysis', desc: 'Complex ledger analysis and cross-financial statements.' },
                  { id: 'openai:gpt-4o-mini', name: 'OpenAI GPT-4o mini', tag: 'High Speed', desc: 'Conversational assistant with bilingual support.' },
                  { id: 'openai:gpt-4o', name: 'OpenAI GPT-4o', tag: 'Flagship Omni', desc: 'Highest precision statutory interpretations and notice handling.' },
                  { id: 'claude:claude-3-5-sonnet-20241022', name: 'Anthropic Claude 3.5 Sonnet', tag: 'Audit Grade', desc: 'Specialized for long balance sheet reports and audit trail review.' },
                  { id: 'deepseek:deepseek-reasoner', name: 'DeepSeek-R1', tag: 'Chain of Thought', desc: 'Step-by-step statutory mathematical and tax derivations.' },
                ].map(opt => {
                  const [prov, mdl] = opt.id.split(':');
                  const isSelected = clientChosenModel === mdl;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setClientChosenProvider(prov as AiProviderId);
                        setClientChosenModel(mdl);
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{opt.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                          {opt.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{opt.desc}</p>
                    </div>
                  );
                })}
              </div>

              {aiSettings.allowClientsToBringOwnKey && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-slate-500" />
                      Company Corporate API Key (BYOK)
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Optional</span>
                  </label>
                  <input
                    type="password"
                    value={clientByokKey}
                    onChange={e => {
                      setClientByokKey(e.target.value);
                      setIsByokActive(Boolean(e.target.value));
                    }}
                    placeholder="sk-... or AIzaSy... (leave blank to use firm included quota)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    Unmetered usage directly billed to your corporate OpenAI or Google account.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAiModelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveClientAiChoice(clientChosenProvider, clientChosenModel, clientByokKey)}
                className="px-4 py-2 bg-[#00c073] hover:bg-[#00a864] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Apply Engine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uploading in Progress & AI Document Scanning Modal Dialog Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all">
            {/* Top Banner / Pulse Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 p-5 text-white relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Uploading in Progress</span>
                    </div>
                    <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                      AI is scanning your docs
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                    <span>{formatUploadRemainingText(estimatedSecondsRemaining, uploadElapsedSeconds)}</span>
                  </div>
                  <div className="text-[10px] text-blue-100 mt-0.5 font-medium">
                    Time to finish up
                  </div>
                </div>
              </div>
            </div>

            {/* Body with Progress Bar, Stage, and Pipeline */}
            <div className="p-6 space-y-5">
              {/* Big percentage & Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    <span>Scanning Evidence Document(s)</span>
                  </span>
                  <span className="font-extrabold text-blue-600 text-sm font-mono">
                    {uploadProgressPercent}%
                  </span>
                </div>

                {/* Animated Gradient Bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 rounded-full transition-all duration-300 ease-out shadow-xs"
                    style={{ width: `${uploadProgressPercent}%` }}
                  ></div>
                </div>

                {/* Current Stage Description */}
                <p className="text-xs text-slate-600 font-medium italic pt-1 flex items-center gap-1.5 min-h-[20px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span>{uploadStageText}</span>
                </p>
              </div>

              {/* 3-Step Milestone Pipeline */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className={`p-2.5 rounded-xl border text-center transition ${
                  uploadProgressPercent >= 25
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-blue-50/50 border-blue-200 text-blue-800'
                }`}>
                  <div className="flex justify-center mb-1">
                    {uploadProgressPercent >= 25 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <UploadCloud className="w-4 h-4 text-blue-600 animate-bounce" />
                    )}
                  </div>
                  <div className="text-[11px] font-bold">1. File Upload</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Encrypted Stream</div>
                </div>

                <div className={`p-2.5 rounded-xl border text-center transition ${
                  uploadProgressPercent >= 75
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : uploadProgressPercent >= 25
                    ? 'bg-blue-50/70 border-blue-300 text-blue-800 ring-1 ring-blue-400'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  <div className="flex justify-center mb-1">
                    {uploadProgressPercent >= 75 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : uploadProgressPercent >= 25 ? (
                      <Bot className="w-4 h-4 text-blue-600 animate-pulse" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="text-[11px] font-bold">2. AI Vision Scan</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Gemini OCR Engine</div>
                </div>

                <div className={`p-2.5 rounded-xl border text-center transition ${
                  uploadProgressPercent >= 100
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : uploadProgressPercent >= 75
                    ? 'bg-blue-50/70 border-blue-300 text-blue-800 ring-1 ring-blue-400'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  <div className="flex justify-center mb-1">
                    {uploadProgressPercent >= 100 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="text-[11px] font-bold">3. Audit Verify</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Working Papers</div>
                </div>
              </div>

              {/* Footer Guarantee & Countdown Summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>256-Bit SSL Protected Statutory Vault</span>
                </div>
                <div className="font-bold text-slate-700 font-mono text-[11px]">
                  {formatUploadRemainingText(estimatedSecondsRemaining, uploadElapsedSeconds)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
