// src/components/ClientDirectoryKycView.tsx
import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  Edit2,
  Upload,
  Download,
  Eye,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  AlertTriangle,
  FolderOpen,
  UserPlus,
  ExternalLink,
  Search,
  Check,
  ArrowLeft,
  X,
  FileCheck,
  BadgeCheck,
  Printer,
  Sparkles,
  Tag,
  Star,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  MoreHorizontal,
  DollarSign,
  TrendingUp,
  CreditCard,
  Layers,
  Sliders,
  Send,
  HelpCircle,
  AlertCircle,
  MessageSquare,
  Paperclip,
  Share2,
  ArrowRight,
  CornerDownRight,
  RefreshCw,
  Filter,
  Pin,
} from 'lucide-react';
import {
  Client,
  DirectorKYC,
  ClientAttachedDoc,
  ContactPerson,
  ClientNote,
  ClientRequestItem,
  MonthlyRequest,
} from '../types/index.ts';
import {
  INITIAL_CLIENTS_DATA,
  ATTACHED_DOC_TEMPLATES,
} from '../services/frontPageDataService.ts';
import { ClientManagementModal } from './ClientManagementModal.tsx';
import { CaDashboard } from './CaDashboard.tsx';

export interface ClientEmailLog {
  id: string;
  clientId: string;
  to: string;
  subject: string;
  tag: string;
  senderName: string;
  sentAt: string;
  status: 'Delivered' | 'Opened' | 'Sent' | 'Failed';
  body: string;
  attachments?: string[];
}

export interface DiscussionThread {
  id: string;
  clientId: string;
  authorName: string;
  authorRole: string;
  tag: 'Audit Note' | 'Tax Query' | 'Client Follow-up' | 'Compliance Risk' | 'General';
  text: string;
  createdAt: string;
  isPinned?: boolean;
  isResolved?: boolean;
  replies?: Array<{
    id: string;
    authorName: string;
    text: string;
    createdAt: string;
  }>;
}

interface ClientDirectoryKycViewProps {
  onBack?: () => void;
  onOpenClientPortal?: (token: string) => void;
  onRefreshParent?: () => void;
  initialSubTab?: 'overview' | 'profile' | 'tasks' | 'insights' | 'client-requests' | 'emails' | 'discussions' | 'documents';
  requests?: MonthlyRequest[];
  onOpenReview?: (request: MonthlyRequest) => void;
  onOpenWhatsApp?: (request: MonthlyRequest, actionType: 'initial' | 'reminder') => void;
  onGenerateWorkbook?: (requestId: string) => Promise<void>;
  onTriggerSchedule?: () => Promise<void>;
  onTogglePauseReminders?: (requestId: string, paused: boolean) => Promise<void>;
  isActionLoading?: boolean;
}

export const ClientDirectoryKycView: React.FC<ClientDirectoryKycViewProps> = ({
  onBack,
  onOpenClientPortal,
  onRefreshParent,
  initialSubTab,
  requests,
  onOpenReview,
  onOpenWhatsApp,
  onGenerateWorkbook,
  onTriggerSchedule,
  onTogglePauseReminders,
  isActionLoading,
}) => {
  // Load clients with local persistence
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('ps_clients_kyc_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        return INITIAL_CLIENTS_DATA;
      }
    }
    return INITIAL_CLIENTS_DATA;
  });

  // Navigation mode: 'table' (Screenshot 5: All Clients directory) vs 'detail' (Screenshots 1, 3, 4: Client 360 Workspace)
  const [viewMode, setViewMode] = useState<'table' | 'detail'>('table');
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients[0]?.id || 'cli_zylker_01'
  );

  // Client 360 Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<
    | 'overview'
    | 'profile'
    | 'tasks'
    | 'insights'
    | 'client-requests'
    | 'emails'
    | 'discussions'
    | 'documents'
  >(initialSubTab || 'profile');

  // State for expanded request details drawer
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [requestFilterCategory, setRequestFilterCategory] = useState<'all' | 'gst' | 'service'>('all');

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
      if (initialSubTab === 'client-requests') {
        setViewMode('detail');
      }
    }
  }, [initialSubTab]);

  // Search & Filter in Table
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  // Toast feedback (matching the green banner at top of Screenshot 1)
  const [feedbackToast, setFeedbackToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Client Management Modals (Add / Edit Client)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientManagementEditId, setClientManagementEditId] = useState<string | null>(null);

  // Associated Accounting Apps Modals (Books, Expense, Inventory)
  const [activeFinanceAppModal, setActiveFinanceAppModal] = useState<'books' | 'expense' | 'inventory' | null>(null);

  // Helper to format Indian client location from GSTIN / state
  const getClientLocation = (client: Client) => {
    if (client.address && client.address !== 'New York' && !client.address.includes('U.S.A.')) {
      return client.address;
    }
    const stateCode = client.gstin?.slice(0, 2);
    const stateMap: Record<string, string> = {
      '29': 'Bengaluru, Karnataka, India',
      '07': 'New Delhi, Delhi, India',
      '27': 'Mumbai, Maharashtra, India',
      '19': 'Kolkata, West Bengal, India',
      '24': 'Ahmedabad, Gujarat, India',
      '33': 'Chennai, Tamil Nadu, India',
      '06': 'Gurugram, Haryana, India',
      '09': 'Noida, Uttar Pradesh, India',
      '36': 'Hyderabad, Telangana, India',
    };
    if (stateCode && stateMap[stateCode]) {
      return stateMap[stateCode];
    }
    if (client.city) return `${client.city}, India`;
    return 'India';
  };

  // ==========================================
  // SCREENSHOT 2: ADD CONTACT PERSON MODAL
  // ==========================================
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState<{
    name: string;
    email: string;
    countryCode: string;
    phone: string;
    phoneType: 'Mobile' | 'Work' | 'Personal';
    skypeNumber: string;
    designation: string;
    department: string;
    isPrimary: boolean;
  }>({
    name: '',
    email: '',
    countryCode: '+1',
    phone: '',
    phoneType: 'Mobile',
    skypeNumber: '',
    designation: '',
    department: '',
    isPrimary: false,
  });

  // ==========================================
  // SCREENSHOT 1: NOTES & ONBOARDING STATE
  // ==========================================
  const [noteInputText, setNoteInputText] = useState('');
  const [noteIsBold, setNoteIsBold] = useState(false);
  const [noteIsItalic, setNoteIsItalic] = useState(false);
  const [noteIsUnderline, setNoteIsUnderline] = useState(false);
  const [showWhatsNextDropdown, setShowWhatsNextDropdown] = useState(false);
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);
  const [selectedAssigneeName, setSelectedAssigneeName] = useState('Dwaipayan Bose');

  // ==========================================
  // SCREENSHOT 3: CLIENT REQUESTS FILTERS
  // ==========================================
  const [requestFilterApp, setRequestFilterApp] = useState('all');
  const [requestFilterStatus, setRequestFilterStatus] = useState('all');
  const [requestFilterPriority, setRequestFilterPriority] = useState('all');
  const [requestFilterUser, setRequestFilterUser] = useState('all');
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [newRequestForm, setNewRequestForm] = useState({
    title: '',
    associatedApp: 'Books' as 'Books' | 'GST' | 'Expense' | 'Inventory',
    priority: 'Medium' as 'Very Low' | 'Low' | 'Medium' | 'High' | 'Urgent',
    assignedTo: 'Dwaipayan Bose',
  });

  // ==========================================
  // SCREENSHOT 4: INSIGHTS BANK & EXPENSE TABS
  // ==========================================
  const [bankSubTab, setBankSubTab] = useState<'disconnected' | 'uncategorized' | 'unreconciled' | 'duplicate'>('disconnected');

  // ==========================================
  // EMAILS, DISCUSSIONS & DOCUMENTS STATE
  // ==========================================
  // Emails state
  const [clientEmails, setClientEmails] = useState<Record<string, ClientEmailLog[]>>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('ps_client_emails_logs') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {};
  });
  const [emailFilter, setEmailFilter] = useState<'all' | 'Delivered' | 'Opened' | 'Sent'>('all');
  const [emailSearchQuery, setEmailSearchQuery] = useState('');
  const [isComposeEmailModalOpen, setIsComposeEmailModalOpen] = useState(false);
  const [selectedEmailPreview, setSelectedEmailPreview] = useState<ClientEmailLog | null>(null);
  const [composeEmailForm, setComposeEmailForm] = useState({
    to: '',
    cc: '',
    template: 'gst_reminder',
    subject: '[GST-COMPLIANCE] Monthly GST Document Upload Reminder',
    body: '',
    attachments: ['Monthly_GST_Document_Checklist.pdf'],
  });

  // Discussions state
  const [clientDiscussions, setClientDiscussions] = useState<Record<string, DiscussionThread[]>>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('ps_client_discussions_data') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {};
  });
  const [discussionFilter, setDiscussionFilter] = useState<'all' | 'Audit Note' | 'Tax Query' | 'Client Follow-up'>('all');
  const [discussionText, setDiscussionText] = useState('');
  const [discussionTag, setDiscussionTag] = useState<'Audit Note' | 'Tax Query' | 'Client Follow-up' | 'Compliance Risk' | 'General'>('Tax Query');
  const [discussionAuthor, setDiscussionAuthor] = useState('CA Suraj Dutta (Partner)');
  const [replyingThreadId, setReplyingThreadId] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState('');

  // Documents state
  const [docCategoryFilter, setDocCategoryFilter] = useState<'all' | 'kyc' | 'gst' | 'itr' | 'banking'>('all');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ClientAttachedDoc | null>(null);
  const [uploadDocForm, setUploadDocForm] = useState({
    docName: '',
    category: 'kyc',
    fileName: '',
    fileSize: '1.2 MB',
    status: 'verified' as 'verified' | 'pending',
    notes: '',
  });

  // Auto-dismiss toast
  useEffect(() => {
    if (feedbackToast) {
      const timer = setTimeout(() => setFeedbackToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [feedbackToast]);

  const persistClients = (updated: Client[]) => {
    setClients(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ps_clients_kyc_data', JSON.stringify(updated));
      window.dispatchEvent(new Event('ps_data_updated'));
    }
  };

  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('ps_clients_kyc_data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setClients(parsed);
        } catch {}
      }
    };
    window.addEventListener('ps_data_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('ps_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const selectedClient =
    clients.find(c => c.id === selectedClientId) ||
    clients[0] || {
      id: 'empty',
      displayName: 'Empty',
      businessName: 'No Clients Found',
      contactPerson: '',
      gstin: '',
      registeredPhone: '',
      email: '',
      active: true,
      requiredChecklist: [],
      expectedBankAccounts: [],
      whatsappConsent: false,
      reminderCadenceDays: 3,
      maxReminders: 3,
      remindersPaused: false,
    };

  // ==========================================
  // EMAILS, DISCUSSIONS & DOCUMENTS HELPERS
  // ==========================================
  // Email Helpers
  const getEmailsForClient = (clientId: string): ClientEmailLog[] => {
    if (clientEmails[clientId]) return clientEmails[clientId];
    const clientObj = clients.find(c => c.id === clientId) || selectedClient;
    return [
      {
        id: `mail_${clientId}_1`,
        clientId,
        to: clientObj.email || 'client@example.com',
        subject: `[GST-COMPLIANCE] Monthly GST Document Upload Reminder - Action Required`,
        tag: 'GST Reminder',
        senderName: 'CA Practice Dispatcher',
        sentAt: 'Yesterday, 09:30 AM',
        status: 'Opened',
        body: `Dear ${clientObj.businessName},\n\nThis is a friendly reminder to upload your monthly sales invoices, purchase invoices, and bank statements for the period to the QuinceCA portal.\n\nFiling Deadlines:\n• GSTR-1: 11th of this month\n• GSTR-3B: 20th of this month\n\nDirect Portal Access: https://quinceca.quinceautomation.com/portal\n\nPlease let us know if you need any assistance.\n\nWarm regards,\nCA Practice Team\nQuinceCA Practice OS`,
        attachments: ['Monthly_GST_Document_Checklist.pdf'],
      },
      {
        id: `mail_${clientId}_2`,
        clientId,
        to: clientObj.email || 'client@example.com',
        subject: `[TAX-CHALLAN] GSTR-3B Draft Tax Liability & Input Tax Credit Computation`,
        tag: 'Tax Computation',
        senderName: 'Pooja Verma (Senior Associate)',
        sentAt: '04 Oct 2026, 03:45 PM',
        status: 'Delivered',
        body: `Dear ${clientObj.businessName},\n\nPlease find attached the draft tax liability computation for GSTR-3B. All eligible ITC entries from GSTR-2B have been reconciled against your purchase register.\n\nKindly confirm the draft figures so we can generate the CPIN payment challan on the GST portal.\n\nBest regards,\nPooja Verma\nSenior Tax Associate`,
        attachments: ['GSTR3B_Draft_Computation.pdf', 'PMT06_Challan_Draft.pdf'],
      },
      {
        id: `mail_${clientId}_3`,
        clientId,
        to: clientObj.email || 'client@example.com',
        subject: `[WELCOME] Practice OS Client Portal & Vault Access Credentials`,
        tag: 'Onboarding',
        senderName: 'CA Suraj Dutta (Partner)',
        sentAt: '28 Sep 2026, 11:15 AM',
        status: 'Opened',
        body: `Dear ${clientObj.businessName},\n\nWelcome to QuinceCA Practice OS. Your secure client portal is now active where you can upload documents, track return filing statuses, and download signed audit workpapers in one click.\n\nWarm regards,\nCA Suraj Dutta, FCA\nManaging Partner`,
        attachments: ['QuinceCA_Portal_Quick_Guide.pdf'],
      },
    ];
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const currentLogs = getEmailsForClient(selectedClient.id);
    const newEmail: ClientEmailLog = {
      id: `mail_${Date.now()}`,
      clientId: selectedClient.id,
      to: composeEmailForm.to || selectedClient.email || 'client@example.com',
      subject: composeEmailForm.subject || 'Statutory Notice & Update',
      tag: composeEmailForm.template === 'gst_reminder' ? 'GST Reminder' : composeEmailForm.template === 'challan' ? 'Tax Challan' : 'Notice / Advisory',
      senderName: 'CA Suraj Dutta (Partner)',
      sentAt: 'Just now',
      status: 'Delivered',
      body: composeEmailForm.body || 'Please review the attached documents.',
      attachments: composeEmailForm.attachments.length > 0 ? composeEmailForm.attachments : undefined,
    };
    const updatedLogs = [newEmail, ...currentLogs];
    const updatedAll = { ...clientEmails, [selectedClient.id]: updatedLogs };
    setClientEmails(updatedAll);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ps_client_emails_logs', JSON.stringify(updatedAll));
    }
    setIsComposeEmailModalOpen(false);
    setFeedbackToast({
      type: 'success',
      message: `Email dispatched successfully to ${newEmail.to}!`,
    });
  };

  const handleResendEmail = (email: ClientEmailLog) => {
    setFeedbackToast({
      type: 'success',
      message: `Resent email "${email.subject}" to ${email.to}. Delivery confirmed.`,
    });
  };

  // Discussions Helpers
  const getDiscussionsForClient = (clientId: string): DiscussionThread[] => {
    if (clientDiscussions[clientId]) return clientDiscussions[clientId];
    return [
      {
        id: `disc_${clientId}_1`,
        clientId,
        authorName: 'CA Suraj Dutta',
        authorRole: 'Partner (FCA)',
        tag: 'Audit Note',
        text: `Reviewed provisional balance sheet and reconciliation for Q2. Debtor aging over 45 days is clean. Ensure interest income from fixed deposits is matched with AIS/TIS before filing ITR.`,
        createdAt: 'Yesterday, 04:30 PM',
        isPinned: true,
        replies: [
          {
            id: `rep_${clientId}_1`,
            authorName: 'Pooja Verma',
            text: 'Noted sir, cross-checking with AIS statement downloaded from ITD portal. Will update workpaper.',
            createdAt: 'Yesterday, 05:15 PM',
          },
        ],
      },
      {
        id: `disc_${clientId}_2`,
        clientId,
        authorName: 'Pooja Verma',
        authorRole: 'Senior Associate',
        tag: 'Tax Query',
        text: `Checked GSTR-2B vs Purchase Register. Vendor invoice #902 for ₹38,400 has missing GSTIN on bill. Contacted client accountant to obtain revised invoice before claiming ITC in 3B.`,
        createdAt: 'Today, 10:15 AM',
        replies: [],
      },
    ];
  };

  const handlePostDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discussionText.trim()) return;
    const currentThreads = getDiscussionsForClient(selectedClient.id);
    const newThread: DiscussionThread = {
      id: `disc_${Date.now()}`,
      clientId: selectedClient.id,
      authorName: discussionAuthor.includes('Partner') ? 'CA Suraj Dutta' : discussionAuthor.includes('Pooja') ? 'Pooja Verma' : 'Sonu Sharma',
      authorRole: discussionAuthor.includes('Partner') ? 'Partner (FCA)' : 'Senior Associate',
      tag: discussionTag,
      text: discussionText.trim(),
      createdAt: 'Just now',
      replies: [],
    };
    const updatedThreads = [newThread, ...currentThreads];
    const updatedAll = { ...clientDiscussions, [selectedClient.id]: updatedThreads };
    setClientDiscussions(updatedAll);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ps_client_discussions_data', JSON.stringify(updatedAll));
    }
    setDiscussionText('');
    setFeedbackToast({
      type: 'success',
      message: 'Internal discussion note posted successfully.',
    });
  };

  const handlePostReply = (threadId: string) => {
    if (!replyInputText.trim()) return;
    const currentThreads = getDiscussionsForClient(selectedClient.id);
    const updatedThreads = currentThreads.map(th => {
      if (th.id === threadId) {
        return {
          ...th,
          replies: [
            ...(th.replies || []),
            {
              id: `rep_${Date.now()}`,
              authorName: 'CA Suraj Dutta',
              text: replyInputText.trim(),
              createdAt: 'Just now',
            },
          ],
        };
      }
      return th;
    });
    const updatedAll = { ...clientDiscussions, [selectedClient.id]: updatedThreads };
    setClientDiscussions(updatedAll);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ps_client_discussions_data', JSON.stringify(updatedAll));
    }
    setReplyInputText('');
    setReplyingThreadId(null);
    setFeedbackToast({
      type: 'success',
      message: 'Reply added to discussion thread.',
    });
  };

  const handleToggleResolveDiscussion = (threadId: string) => {
    const currentThreads = getDiscussionsForClient(selectedClient.id);
    const updatedThreads = currentThreads.map(th => {
      if (th.id === threadId) return { ...th, isResolved: !th.isResolved };
      return th;
    });
    const updatedAll = { ...clientDiscussions, [selectedClient.id]: updatedThreads };
    setClientDiscussions(updatedAll);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ps_client_discussions_data', JSON.stringify(updatedAll));
    }
  };

  const handleDeleteDiscussion = (threadId: string) => {
    const currentThreads = getDiscussionsForClient(selectedClient.id);
    const updatedThreads = currentThreads.filter(th => th.id !== threadId);
    const updatedAll = { ...clientDiscussions, [selectedClient.id]: updatedThreads };
    setClientDiscussions(updatedAll);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ps_client_discussions_data', JSON.stringify(updatedAll));
    }
    setFeedbackToast({
      type: 'success',
      message: 'Discussion note removed.',
    });
  };

  // Document Helpers
  const getClientDocuments = (client: Client): ClientAttachedDoc[] => {
    if (client.attachedDocuments && client.attachedDocuments.length > 0) {
      return client.attachedDocuments;
    }
    return [
      {
        id: `att_${client.id}_1`,
        docKey: 'gst_reg',
        docName: 'GST Registration Certificate (REG-06)',
        categoryNumber: 2,
        fileName: `${(client.businessName || 'Client').replace(/[^a-zA-Z0-9]/g, '_')}_GST_REG_06.pdf`,
        fileSize: '850 KB',
        uploadedAt: '2026-08-15',
        status: 'verified',
        notes: `GSTIN: ${client.gstin || '07AAACS1234D1Z1'} verified on GST Portal`,
      },
      {
        id: `att_${client.id}_2`,
        docKey: 'company_pan',
        docName: 'Permanent Account Number (PAN Card)',
        categoryNumber: 4,
        fileName: `${(client.businessName || 'Client').replace(/[^a-zA-Z0-9]/g, '_')}_PAN_Card.pdf`,
        fileSize: '420 KB',
        uploadedAt: '2026-08-15',
        status: 'verified',
        notes: 'Entity PAN card verified with NSDL/UTI',
      },
      {
        id: `att_${client.id}_3`,
        docKey: 'coi',
        docName: 'Certificate of Incorporation / Trade License',
        categoryNumber: 1,
        fileName: `${(client.businessName || 'Client').replace(/[^a-zA-Z0-9]/g, '_')}_COI.pdf`,
        fileSize: '1.4 MB',
        uploadedAt: '2026-08-18',
        status: 'verified',
        notes: 'Statutory registration document',
      },
      {
        id: `att_${client.id}_4`,
        docKey: 'bank_statement',
        docName: 'Bank Statement (Q1 FY 25-26)',
        categoryNumber: 9,
        fileName: `Bank_Current_Account_Statement_Q1.pdf`,
        fileSize: '2.8 MB',
        uploadedAt: '2026-09-05',
        status: 'verified',
        notes: 'Reconciled with bank book ledger',
      },
      {
        id: `att_${client.id}_5`,
        docKey: 'financials',
        docName: 'Audited Financial Statements & Tax Audit Report',
        categoryNumber: 10,
        fileName: `Audited_Financials_FY2425.pdf`,
        fileSize: '3.6 MB',
        uploadedAt: '2026-09-12',
        status: 'pending',
        notes: 'Balance Sheet, P&L, 3CB-3CD workpapers',
      },
    ];
  };

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocForm.docName.trim()) return;
    const currentDocs = getClientDocuments(selectedClient);
    const newDoc: ClientAttachedDoc = {
      id: `doc_${Date.now()}`,
      docKey: uploadDocForm.category,
      docName: uploadDocForm.docName.trim(),
      categoryNumber: uploadDocForm.category === 'kyc' ? 1 : uploadDocForm.category === 'gst' ? 2 : uploadDocForm.category === 'itr' ? 10 : 9,
      fileName: uploadDocForm.fileName || `${uploadDocForm.docName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      fileSize: uploadDocForm.fileSize || '1.2 MB',
      uploadedAt: 'Today',
      status: uploadDocForm.status,
      notes: uploadDocForm.notes || undefined,
    };
    const updatedDocs = [newDoc, ...currentDocs];
    const updatedClients = clients.map(c => {
      if (c.id === selectedClient.id) {
        return { ...c, attachedDocuments: updatedDocs };
      }
      return c;
    });
    persistClients(updatedClients);
    setIsUploadDocModalOpen(false);
    setUploadDocForm({
      docName: '',
      category: 'kyc',
      fileName: '',
      fileSize: '1.2 MB',
      status: 'verified',
      notes: '',
    });
    setFeedbackToast({
      type: 'success',
      message: `Document "${newDoc.docName}" saved to vault successfully.`,
    });
  };

  const handleToggleVerifyDoc = (docId: string) => {
    const currentDocs = getClientDocuments(selectedClient);
    const updatedDocs = currentDocs.map(d => {
      if (d.id === docId) {
        const nextStatus = d.status === 'verified' ? 'pending' : 'verified';
        return { ...d, status: nextStatus as any };
      }
      return d;
    });
    const updatedClients = clients.map(c => {
      if (c.id === selectedClient.id) {
        return { ...c, attachedDocuments: updatedDocs };
      }
      return c;
    });
    persistClients(updatedClients);
    setFeedbackToast({
      type: 'success',
      message: 'Document verification status updated.',
    });
  };

  const handleDeleteDoc = (docId: string) => {
    const currentDocs = getClientDocuments(selectedClient);
    const updatedDocs = currentDocs.filter(d => d.id !== docId);
    const updatedClients = clients.map(c => {
      if (c.id === selectedClient.id) {
        return { ...c, attachedDocuments: updatedDocs };
      }
      return c;
    });
    persistClients(updatedClients);
    setFeedbackToast({
      type: 'success',
      message: 'Document removed from vault.',
    });
  };

  const handleDownloadDoc = (doc: ClientAttachedDoc) => {
    setFeedbackToast({
      type: 'success',
      message: `Downloading ${doc.fileName}...`,
    });
  };
  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      (c.displayName && c.displayName.toLowerCase().includes(q)) ||
      c.businessName?.toLowerCase().includes(q) ||
      c.gstin?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.contactPerson?.toLowerCase().includes(q)
    );
  });

  // Toggle row select
  const toggleSelectRow = (id: string) => {
    setSelectedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectAll = () => {
    if (Object.keys(selectedRows).length === filteredClients.length) {
      setSelectedRows({});
    } else {
      const all: Record<string, boolean> = {};
      filteredClients.forEach(c => (all[c.id] = true));
      setSelectedRows(all);
    }
  };

  // Add Contact Person Handler (Screenshot 2)
  const handleSaveContactPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim()) {
      alert('Please provide contact person name and email address.');
      return;
    }

    const newContact: ContactPerson = {
      id: `cp_${Date.now()}`,
      name: contactForm.name.trim(),
      email: contactForm.email.trim(),
      countryCode: contactForm.countryCode,
      phone: contactForm.phone.trim(),
      phoneType: contactForm.phoneType,
      skypeNumber: contactForm.skypeNumber.trim() || undefined,
      designation: contactForm.designation.trim() || undefined,
      department: contactForm.department.trim() || undefined,
      isPrimary: contactForm.isPrimary,
    };

    const updated = clients.map(c => {
      if (c.id === selectedClient.id) {
        const existing = c.contactPersons || [];
        return {
          ...c,
          contactPersons: [...existing, newContact],
        };
      }
      return c;
    });

    persistClients(updated);
    setIsAddContactModalOpen(false);
    setContactForm({
      name: '',
      email: '',
      countryCode: '+1',
      phone: '',
      phoneType: 'Mobile',
      skypeNumber: '',
      designation: '',
      department: '',
      isPrimary: false,
    });

    // Exact toast feedback matching Screenshot 1!
    setFeedbackToast({
      type: 'success',
      message: "Contact person's information has been saved.",
    });
  };

  // Add Note Handler (Screenshot 1 - Column 3)
  const handleSaveNote = () => {
    if (!noteInputText.trim()) return;

    const newNote: ClientNote = {
      id: `note_${Date.now()}`,
      text: noteInputText.trim(),
      isBold: noteIsBold,
      isItalic: noteIsItalic,
      isUnderline: noteIsUnderline,
      authorName: 'Dwaipayan Bose',
      createdAt: 'Just now',
    };

    const updated = clients.map(c => {
      if (c.id === selectedClient.id) {
        return {
          ...c,
          notes: [newNote, ...(c.notes || [])],
        };
      }
      return c;
    });

    persistClients(updated);
    setNoteInputText('');
    setNoteIsBold(false);
    setNoteIsItalic(false);
    setNoteIsUnderline(false);

    setFeedbackToast({
      type: 'success',
      message: 'Note saved successfully.',
    });
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = clients.map(c => {
      if (c.id === selectedClient.id) {
        return {
          ...c,
          notes: (c.notes || []).filter(n => n.id !== noteId),
        };
      }
      return c;
    });
    persistClients(updated);
    setFeedbackToast({
      type: 'success',
      message: 'Note deleted.',
    });
  };

  // Assign User Handler
  const handleAssignUser = (userName: string) => {
    const updated = clients.map(c => {
      if (c.id === selectedClient.id) {
        return {
          ...c,
          assignedStaffName: userName,
          managedBy: [{ id: `usr_${Date.now()}`, name: userName, role: 'Staff Member' }],
        };
      }
      return c;
    });
    persistClients(updated);
    setIsAssignUserModalOpen(false);
    setFeedbackToast({
      type: 'success',
      message: `Assigned client to ${userName}.`,
    });
  };

  // Add Request Handler (Screenshot 3)
  const handleCreateClientRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestForm.title.trim()) return;

    const existing = selectedClient.clientRequests || [];
    const newReq: ClientRequestItem = {
      id: `cr_${Date.now()}`,
      requestNumber: existing.length + 1,
      title: newRequestForm.title.trim(),
      assignedTo: newRequestForm.assignedTo,
      status: 'Open',
      priority: newRequestForm.priority,
      clientName: selectedClient.businessName,
      associatedApp: newRequestForm.associatedApp,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = clients.map(c => {
      if (c.id === selectedClient.id) {
        return {
          ...c,
          openClientRequestsCount: (c.openClientRequestsCount || 0) + 1,
          clientRequests: [newReq, ...(c.clientRequests || [])],
        };
      }
      return c;
    });

    persistClients(updated);
    setIsNewRequestModalOpen(false);
    setNewRequestForm({
      title: '',
      associatedApp: 'Books',
      priority: 'Medium',
      assignedTo: 'Dwaipayan Bose',
    });
    setFeedbackToast({
      type: 'success',
      message: 'Client request created successfully.',
    });
  };

  // Unified Merged Client Requests List: Combines Service Tickets & GST Filing Intake Pipeline
  const mergedClientRequestsList = React.useMemo(() => {
    // 1. Regular client requests / service tickets
    const serviceItems = (selectedClient.clientRequests || []).map((r, idx) => ({
      id: r.id || `sr_${idx}`,
      requestNumber: typeof r.requestNumber === 'number' ? `REQ-00${r.requestNumber}` : r.requestNumber,
      title: r.title,
      assignedTo: r.assignedTo || 'Dwaipayan Bose',
      status: r.status || 'Open',
      priority: r.priority || 'Medium',
      clientName: r.clientName || selectedClient.businessName || 'dsfdsf',
      associatedApp: r.associatedApp || 'Books',
      type: 'service_ticket' as 'service_ticket' | 'gst_intake',
      period: 'Ad-hoc Service',
      filesCount: 0,
      extractedInvoicesCount: 0,
      validationExceptionsCount: 0,
      monthlyRequest: undefined as MonthlyRequest | undefined,
    }));

    // If no service tickets exist yet, provide initial tickets matching Screenshot 2
    if (serviceItems.length === 0) {
      serviceItems.push(
        {
          id: 'sr_default_1',
          requestNumber: 'REQ-001',
          title: 'hu',
          assignedTo: 'Dwaipayan Bose',
          status: 'Open',
          priority: 'Medium',
          clientName: selectedClient.businessName || 'dsfdsf',
          associatedApp: 'Books',
          type: 'service_ticket',
          period: 'Ad-hoc Service',
          filesCount: 0,
          extractedInvoicesCount: 0,
          validationExceptionsCount: 0,
          monthlyRequest: undefined,
        },
        {
          id: 'sr_default_2',
          requestNumber: 'REQ-002',
          title: 'ITR-1 Form 16 Verification & AIS Tax Credit Cross-Check',
          assignedTo: 'CA Suraj Dutta',
          status: 'In Progress',
          priority: 'High',
          clientName: selectedClient.businessName || 'dsfdsf',
          associatedApp: 'ITR',
          type: 'service_ticket',
          period: 'AY 2026-27',
          filesCount: 2,
          extractedInvoicesCount: 0,
          validationExceptionsCount: 0,
          monthlyRequest: undefined,
        }
      );
    }

    // 2. GST & Document Intake Pipeline requests (merged directly into the same list!)
    const pipelineItems = (requests || []).map((mReq, idx) => {
      let mappedStatus = 'Open';
      if (mReq.status === 'awaiting_uploads') mappedStatus = 'Awaiting Uploads';
      else if (mReq.status === 'in_confirmation') mappedStatus = 'In Confirmation';
      else if (mReq.status === 'confirmed_by_client') mappedStatus = 'Client Confirmed';
      else if (mReq.status === 'ca_approved') mappedStatus = 'CA Approved';
      else if (mReq.status === 'exceptions') mappedStatus = 'Validation Exceptions';

      return {
        id: mReq.id || `pipe_${idx}`,
        requestNumber: `GST-${(mReq.month || '2026-08').replace('-', '')}`,
        title: `GST Document Collection & Filing Pipeline (${mReq.month || 'August 2026'})`,
        assignedTo: mReq.assignedStaffName || 'Pooja Verma (Senior Associate)',
        status: mappedStatus,
        priority: (mReq.status === 'awaiting_uploads' ? 'Urgent' : 'High') as 'Very Low' | 'Low' | 'Medium' | 'High' | 'Urgent',
        clientName: mReq.clientName || selectedClient.businessName || 'social Corn',
        associatedApp: 'GST',
        type: 'gst_intake' as 'service_ticket' | 'gst_intake',
        period: mReq.month || 'August 2026',
        filesCount: mReq.uploadedFiles?.length || 53,
        extractedInvoicesCount: mReq.extractedInvoicesCount || 52,
        validationExceptionsCount: mReq.validationExceptionsCount || 3,
        monthlyRequest: mReq,
      };
    });

    const combined = [...serviceItems, ...pipelineItems];

    return combined.filter(r => {
      if (requestFilterCategory === 'gst' && r.type !== 'gst_intake') return false;
      if (requestFilterCategory === 'service' && r.type !== 'service_ticket') return false;
      if (requestFilterApp !== 'all') {
        if (requestFilterApp === 'GST' && r.associatedApp !== 'GST') return false;
        if (requestFilterApp !== 'GST' && r.associatedApp !== requestFilterApp) return false;
      }
      if (requestFilterStatus !== 'all' && r.status !== requestFilterStatus) return false;
      if (requestFilterPriority !== 'all' && r.priority !== requestFilterPriority) return false;
      if (requestFilterUser !== 'all' && !r.assignedTo.includes(requestFilterUser)) return false;
      return true;
    });
  }, [selectedClient, requests, requestFilterCategory, requestFilterApp, requestFilterStatus, requestFilterPriority, requestFilterUser]);

  return (
    <div className="min-h-screen bg-[#f3f5f8] text-slate-800 -m-4 sm:-m-6 lg:-m-8 flex flex-col font-sans select-none">
      {/* Top Floating Feedback Toast (Exact Screenshot 1 green badge) */}
      {feedbackToast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg border flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-2 bg-[#e6f8f0] text-[#00874e] border-[#b0e8ce]">
          <CheckCircle2 className="w-4 h-4 text-[#00c073] shrink-0" />
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 1: ALL CLIENTS DIRECTORY TABLE (SCREENSHOT 5)
         ========================================================================= */}
      {viewMode === 'table' && (
        <div className="flex-1 flex flex-col p-6 sm:p-8 space-y-4">
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button className="flex items-center space-x-1.5 text-lg font-bold text-slate-900 hover:text-blue-700 transition cursor-pointer">
                  <span>All Clients</span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search input */}
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search in Clients ( / )"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* + New Client Button */}
              <button
                onClick={() => {
                  setClientManagementEditId(null);
                  setIsClientModalOpen(true);
                }}
                className="px-4 py-2 bg-[#1565c0] hover:bg-[#0d47a1] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Client</span>
              </button>

              <button className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Directory Table (Screenshot 5) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 select-none">
                  <tr>
                    <th className="py-3.5 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredClients.length > 0 &&
                          Object.keys(selectedRows).length === filteredClients.length
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="py-3.5 px-4">NAME</th>
                    <th className="py-3.5 px-4">BUSINESS NAME</th>
                    <th className="py-3.5 px-4">EMAIL</th>
                    <th className="py-3.5 px-4">MOBILE PHONE</th>
                    <th className="py-3.5 px-4 text-center">PENDING TASKS</th>
                    <th className="py-3.5 px-4 text-center">OPEN CLIENTREQUESTS</th>
                    <th className="py-3.5 px-4">ASSOCIATED APPS</th>
                    <th className="py-3.5 px-4">MANAGED BY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map(client => {
                    const isSelected = Boolean(selectedRows[client.id]);
                    const initials = client.displayName
                      ? client.displayName.charAt(0)
                      : client.businessName.charAt(0);

                    return (
                      <tr
                        key={client.id}
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setViewMode('detail');
                        }}
                        className={`hover:bg-blue-50/40 transition cursor-pointer ${
                          isSelected ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3.5 px-4"
                          onClick={e => {
                            e.stopPropagation();
                            toggleSelectRow(client.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(client.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>

                        {/* Name with circle letter avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                              {initials}
                            </div>
                            <span className="font-semibold text-blue-600 hover:underline">
                              {client.displayName || client.businessName}
                            </span>
                          </div>
                        </td>

                        {/* Business Name */}
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {client.businessName}
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 text-slate-500">
                          {client.email || '—'}
                        </td>

                        {/* Mobile Phone */}
                        <td className="py-3.5 px-4 text-slate-500 font-mono">
                          {client.registeredPhone || '—'}
                        </td>

                        {/* Pending Tasks Count */}
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                          {client.pendingTasksCount ?? 0}
                        </td>

                        {/* Open Client Requests Count */}
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                          {client.openClientRequestsCount ?? 0}
                        </td>

                        {/* Associated Apps (Accounting/Books, Expense, Inventory) */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5 text-slate-500">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" title="Books / Accounting" />
                            <FileText className="w-3.5 h-3.5 text-rose-500" title="Expense Management" />
                            <Layers className="w-3.5 h-3.5 text-amber-500" title="Inventory / Stock" />
                          </div>
                        </td>

                        {/* Managed By */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Users className="w-3 h-3 text-emerald-600" />
                            <span>1 Users</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredClients.length === 0 && (
              <div className="text-center py-16 text-slate-400 text-xs">
                No clients match your filter or search query.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: CLIENT 360 WORKSPACE (SCREENSHOTS 1, 3, 4)
         ========================================================================= */}
      {viewMode === 'detail' && (
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Bar: Back to All Clients & Client Switcher */}
          <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode('table')}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition flex items-center gap-1 text-xs font-semibold"
                title="Back to All Clients Table"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">All Clients</span>
              </button>

              <span className="text-slate-300">|</span>

              {/* Client Avatar & Name Selector */}
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  {(selectedClient.displayName || selectedClient.businessName).charAt(0)}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-1 font-bold text-slate-900 text-sm cursor-pointer">
                    <span>{selectedClient.displayName || selectedClient.businessName}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono -mt-0.5">
                    {selectedClient.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center space-x-2.5">
              {onOpenClientPortal && (
                <button
                  onClick={() => onOpenClientPortal(selectedClient.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Portal View</span>
                </button>
              )}

              <button
                onClick={() => {
                  setClientManagementEditId(selectedClient.id);
                  setIsClientModalOpen(true);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Client</span>
              </button>

              <button
                onClick={() => {
                  if (activeSubTab === 'client-requests') {
                    setIsNewRequestModalOpen(true);
                  } else {
                    setIsAddContactModalOpen(true);
                  }
                }}
                className="px-3.5 py-1.5 bg-[#1565c0] hover:bg-[#0d47a1] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Two-Pane Body: Left Sub-Navigation + Right Content Pane */}
          <div className="flex-1 flex min-h-0 bg-[#f8fafc]">
            {/* Left Sub-Navigation (Matching Screenshots 1, 3, 4) */}
            <aside className="w-48 bg-white border-r border-slate-200/90 flex flex-col shrink-0 select-none py-3">
              {[
                { id: 'overview', label: 'Overview', icon: Layers },
                { id: 'profile', label: 'Profile', icon: Users },
                { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
                { id: 'insights', label: 'Insights', icon: TrendingUp },
                { id: 'client-requests', label: 'Client Requests', icon: FileText },
                { id: 'emails', label: 'Emails', icon: Mail },
                { id: 'discussions', label: 'Discussions', icon: MessageSquare },
                { id: 'documents', label: 'Documents', icon: FolderOpen },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`px-4 py-2.5 mx-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 transition cursor-pointer ${
                      isActive
                        ? 'bg-[#1565c0] text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </aside>

            {/* Right Content Area */}
            <main className="flex-1 overflow-y-auto p-6 sm:p-8">

              {/* =================================================================
                  SUB-TAB: PROFILE (SCREENSHOT 1)
                 ================================================================= */}
              {activeSubTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* COLUMN 1: CLIENT DETAILS */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                        Client Details
                      </h3>
                    </div>

                    {/* Associated Finance Apps */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          ASSOCIATED ACCOUNTING APPS
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          3 Active
                        </span>
                      </div>
                      <div className="space-y-2">
                        {/* Books */}
                        <div
                          onClick={() => setActiveFinanceAppModal('books')}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/40 transition text-xs cursor-pointer group shadow-2xs"
                          title="Open Accounting Books & General Ledger"
                        >
                          <div className="flex items-center space-x-2.5 text-slate-700">
                            <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 group-hover:text-blue-700 block">Books</span>
                              <span className="text-[10px] text-slate-500 font-medium">Daybook & Sales Register</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                              4 Invoices
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>

                        {/* Expense */}
                        <div
                          onClick={() => setActiveFinanceAppModal('expense')}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/90 hover:border-rose-400 hover:bg-rose-50/40 transition text-xs cursor-pointer group shadow-2xs"
                          title="Open Expense & Purchase Bills Register"
                        >
                          <div className="flex items-center space-x-2.5 text-slate-700">
                            <div className="w-7 h-7 rounded-lg bg-rose-100/80 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 group-hover:text-rose-700 block">Expense</span>
                              <span className="text-[10px] text-slate-500 font-medium">Vendor Bills & ITC</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200">
                              ₹17.2k ITC
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>

                        {/* Inventory */}
                        <div
                          onClick={() => setActiveFinanceAppModal('inventory')}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/90 hover:border-amber-400 hover:bg-amber-50/40 transition text-xs cursor-pointer group shadow-2xs"
                          title="Open Inventory & HSN/SAC Stock Register"
                        >
                          <div className="flex items-center space-x-2.5 text-slate-700">
                            <div className="w-7 h-7 rounded-lg bg-amber-100/80 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <Layers className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 group-hover:text-amber-700 block">Inventory</span>
                              <span className="text-[10px] text-slate-500 font-medium">HSN/SAC & Stock Slabs</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">
                              2 Items
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>BILLING ADDRESS</span>
                      </span>
                      <div className="text-xs text-slate-700 font-medium leading-relaxed pl-4">
                        {getClientLocation(selectedClient)}
                      </div>
                    </div>

                    {/* Unbilled Tasks */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>UNBILLED TASKS</span>
                      </span>
                      <div className="flex items-center space-x-3 pt-1">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-base font-bold text-slate-900 leading-none">
                            {selectedClient.unbilledTasksCount ?? 0}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 font-mono">
                            Total hours logged - {selectedClient.totalHoursLogged ?? 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 2: CONTACT PERSONS & MANAGED BY */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
                    {/* Contact Persons Header */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                        Contact Persons
                      </h3>
                    </div>

                    {/* Contact Persons List */}
                    <div className="space-y-3">
                      {(selectedClient.contactPersons || []).length > 0 ? (
                        selectedClient.contactPersons?.map(contact => (
                          <div
                            key={contact.id}
                            className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                              {contact.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-xs text-slate-800 truncate">
                                  {contact.name}
                                </span>
                                {contact.isPrimary && (
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono truncate">
                                {contact.email}
                              </div>
                              {contact.phone && (
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {contact.countryCode} {contact.phone} {contact.phoneType && `(${contact.phoneType})`}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 py-2">
                          No contact persons added yet.
                        </div>
                      )}

                      {/* + Contact Person Button (Screenshot 1) */}
                      <button
                        onClick={() => setIsAddContactModalOpen(true)}
                        className="w-full py-2 bg-blue-50/60 hover:bg-blue-100/70 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Contact Person</span>
                      </button>
                    </div>

                    {/* Managed By Section */}
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>MANAGED BY</span>
                      </span>

                      <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-50">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                          {(selectedClient.managedBy?.[0]?.name || selectedClient.assignedStaffName || 'Dwaipayan Bose').charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">
                            {selectedClient.managedBy?.[0]?.name || selectedClient.assignedStaffName || 'Dwaipayan Bose'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Managing Practice Partner
                          </div>
                        </div>
                      </div>

                      {/* + Assign User Button */}
                      <button
                        onClick={() => setIsAssignUserModalOpen(true)}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Assign User</span>
                      </button>
                    </div>
                  </div>

                  {/* COLUMN 3: NOTES & ONBOARDING (SCREENSHOT 1) */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-2xs">
                    {/* Top Right "What's Next?" & Progress Bar */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="relative">
                        <button
                          onClick={() => setShowWhatsNextDropdown(!showWhatsNextDropdown)}
                          className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          <span>"What's Next?"</span>
                          <ChevronDown className="w-3 h-3 text-blue-500" />
                        </button>

                        {/* What's next dropdown modal */}
                        {showWhatsNextDropdown && (
                          <div className="absolute left-0 top-6 z-20 w-64 p-3 bg-white border border-slate-200 rounded-xl shadow-xl text-xs space-y-2 animate-in fade-in">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase">
                              Client Onboarding Checklist
                            </span>
                            <div className="space-y-1.5 text-slate-600">
                              <label className="flex items-center gap-1.5 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Setup client profile & GSTIN</span>
                              </label>
                              <label className="flex items-center gap-1.5 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Assign primary contact person</span>
                              </label>
                              <label className="flex items-center gap-1.5 text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span>Connect bank feeds or upload PDF</span>
                              </label>
                              <label className="flex items-center gap-1.5 text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span>Dispatch first monthly intake</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progress Percent (Screenshot 1: 33% Completed) */}
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-emerald-600">
                          {selectedClient.onboardingProgressPercent ?? 33}% Completed
                        </span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            style={{ width: `${selectedClient.onboardingProgressPercent ?? 33}%` }}
                            className="bg-[#00c073] h-full rounded-full"
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Notes Section with Rich Text Formatting Toolbar (B, I, U) */}
                    <div className="space-y-2.5">
                      <span className="text-xs font-bold text-slate-800 block">Notes</span>

                      {/* Editor Box */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-blue-500">
                        {/* Toolbar */}
                        <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center space-x-3 text-slate-600">
                          <button
                            type="button"
                            onClick={() => setNoteIsBold(!noteIsBold)}
                            className={`p-1 rounded font-bold text-xs transition ${
                              noteIsBold ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-200'
                            }`}
                            title="Bold"
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onClick={() => setNoteIsItalic(!noteIsItalic)}
                            className={`p-1 rounded italic text-xs transition ${
                              noteIsItalic ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-200'
                            }`}
                            title="Italic"
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onClick={() => setNoteIsUnderline(!noteIsUnderline)}
                            className={`p-1 rounded underline text-xs transition ${
                              noteIsUnderline ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-200'
                            }`}
                            title="Underline"
                          >
                            U
                          </button>
                        </div>

                        {/* Textarea */}
                        <textarea
                          rows={3}
                          value={noteInputText}
                          onChange={e => setNoteInputText(e.target.value)}
                          placeholder="Add Note"
                          className={`w-full p-3 text-xs text-slate-800 bg-white border-0 focus:outline-none resize-none ${
                            noteIsBold ? 'font-bold' : ''
                          } ${noteIsItalic ? 'italic' : ''} ${noteIsUnderline ? 'underline' : ''}`}
                        />

                        {/* Save Note Button */}
                        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={handleSaveNote}
                            disabled={!noteInputText.trim()}
                            className="px-3 py-1 bg-[#1565c0] hover:bg-[#0d47a1] text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition cursor-pointer"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* All Notes List */}
                    <div className="space-y-3 pt-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        ALL NOTES
                      </span>

                      {(selectedClient.notes || []).length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {selectedClient.notes?.map(note => (
                            <div
                              key={note.id}
                              className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1 relative group"
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                <span>{note.authorName}</span>
                                <span>{note.createdAt}</span>
                              </div>
                              <p
                                className={`text-slate-700 leading-relaxed ${
                                  note.isBold ? 'font-bold' : ''
                                } ${note.isItalic ? 'italic' : ''} ${
                                  note.isUnderline ? 'underline' : ''
                                }`}
                              >
                                {note.text}
                              </p>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition"
                                title="Delete note"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-400 text-xs font-medium">
                          No Notes found
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* =================================================================
                  SUB-TAB: CLIENT REQUESTS (MERGED SERVICE & INTAKE TICKETS)
                 ================================================================= */}
              {activeSubTab === 'client-requests' && (
                <div className="space-y-5">
                  {/* Top Header: Dropdown + Badges + New Request Button (Matching Screenshot 2) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <button className="flex items-center space-x-1.5 text-base font-bold text-slate-900 cursor-pointer">
                          <span>All Requests</span>
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {mergedClientRequestsList.length} Total
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          {
                            mergedClientRequestsList.filter(
                              r =>
                                r.status.toLowerCase().includes('open') ||
                                r.status.toLowerCase().includes('awaiting') ||
                                r.status.toLowerCase().includes('confirmation')
                            ).length
                          }{' '}
                          Due
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsNewRequestModalOpen(true)}
                      className="px-4 py-2 bg-[#1565c0] hover:bg-[#0d47a1] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition self-start sm:self-auto cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New</span>
                    </button>
                  </div>

                  {/* Filters Bar (Matching Screenshot 2 & 3) */}
                  <div className="flex flex-wrap items-center gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                      FILTERS:
                    </span>

                    {/* Filter: Select an App */}
                    <select
                      value={requestFilterApp}
                      onChange={e => setRequestFilterApp(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      <option value="all">Select an App</option>
                      <option value="Books">Books</option>
                      <option value="GST">GST Compliance</option>
                      <option value="ITR">Income Tax / ITR</option>
                      <option value="Expense">Expense</option>
                      <option value="Inventory">Inventory</option>
                    </select>

                    {/* Filter: Select Status */}
                    <select
                      value={requestFilterStatus}
                      onChange={e => setRequestFilterStatus(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      <option value="all">Select Status</option>
                      <option value="Open">Open</option>
                      <option value="Awaiting Uploads">Awaiting Uploads</option>
                      <option value="In Progress">In Progress</option>
                      <option value="In Confirmation">In Confirmation</option>
                      <option value="Needs Review">Needs Review</option>
                      <option value="Completed">Completed</option>
                    </select>

                    {/* Filter: Select Priority */}
                    <select
                      value={requestFilterPriority}
                      onChange={e => setRequestFilterPriority(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      <option value="all">Select Priority</option>
                      <option value="Very Low">Very Low</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>

                    {/* Filter: Select user */}
                    <select
                      value={requestFilterUser}
                      onChange={e => setRequestFilterUser(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      <option value="all">Select user</option>
                      <option value="Dwaipayan Bose">Dwaipayan Bose</option>
                      <option value="CA Suraj Dutta">CA Suraj Dutta</option>
                      <option value="Pooja Verma">Pooja Verma</option>
                    </select>
                  </div>

                  {/* Unified Requests Table (Matching Screenshot 2) */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f8fafc] text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3.5 px-4">CLIENT REQUEST#</th>
                          <th className="py-3.5 px-4">TITLE</th>
                          <th className="py-3.5 px-4">ASSIGNED TO</th>
                          <th className="py-3.5 px-4">STATUS</th>
                          <th className="py-3.5 px-4">PRIORITY</th>
                          <th className="py-3.5 px-4">CLIENT</th>
                          <th className="py-3.5 px-4">ASSOCIATED APP</th>
                          <th className="py-3.5 px-4 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {mergedClientRequestsList.map(req => {
                          const isGst = req.type === 'gst_intake';
                          const isExpanded = expandedRequestId === req.id;
                          const statusDotColor = {
                            Open: 'bg-amber-500',
                            'Awaiting Uploads': 'bg-amber-500',
                            'In Progress': 'bg-blue-500',
                            'In Confirmation': 'bg-purple-500',
                            'Needs Review': 'bg-rose-500',
                            'Client Confirmed': 'bg-emerald-500',
                            'CA Approved': 'bg-teal-500',
                            Completed: 'bg-emerald-500',
                          }[req.status] || 'bg-slate-400';

                          return (
                            <React.Fragment key={req.id}>
                              <tr
                                onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                                className={`hover:bg-slate-50 transition cursor-pointer ${
                                  isExpanded ? 'bg-blue-50/40' : ''
                                }`}
                              >
                                <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                                  {req.requestNumber}
                                </td>
                                <td className="py-3.5 px-4 font-semibold text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <span>{req.title}</span>
                                    {isGst && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        Intake Pipeline
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-slate-600">
                                  {req.assignedTo}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                                    <span className={`w-1.5 h-3 rounded-full ${statusDotColor}`}></span>
                                    <span>{req.status}</span>
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-600">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      req.priority === 'Urgent'
                                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                        : req.priority === 'High'
                                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {req.priority}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-700 font-medium">
                                  {req.clientName}
                                </td>
                                <td className="py-3.5 px-4 text-slate-500">
                                  <span className="inline-flex items-center gap-1.5">
                                    {req.associatedApp === 'GST' ? (
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : req.associatedApp === 'ITR' ? (
                                      <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                                    ) : (
                                      <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                                    )}
                                    <span>{req.associatedApp}</span>
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div
                                    className="flex items-center justify-end gap-1.5"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    {isGst && req.monthlyRequest && (
                                      <>
                                        <button
                                          onClick={() => onOpenWhatsApp?.(req.monthlyRequest!, 'reminder')}
                                          title="Send WhatsApp Reminder"
                                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 font-bold text-[11px] flex items-center gap-1 transition"
                                        >
                                          <Send className="w-3 h-3 text-emerald-600" />
                                          <span>WhatsApp</span>
                                        </button>
                                        <button
                                          onClick={() => onOpenReview?.(req.monthlyRequest!)}
                                          title="Review Data & OCR"
                                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 font-bold text-[11px] flex items-center gap-1 transition"
                                        >
                                          <Eye className="w-3 h-3 text-blue-600" />
                                          <span>Review</span>
                                        </button>
                                      </>
                                    )}
                                    <button
                                      onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                                      className="p-1 hover:bg-slate-200 rounded text-slate-500 transition"
                                      title={isExpanded ? 'Collapse' : 'Expand Details'}
                                    >
                                      <ChevronDown
                                        className={`w-3.5 h-3.5 transition-transform ${
                                          isExpanded ? 'rotate-180' : ''
                                        }`}
                                      />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expandable Details Row for Pipeline / Service Details */}
                              {isExpanded && (
                                <tr className="bg-slate-50/80">
                                  <td colSpan={8} className="p-4 border-t border-slate-200/80">
                                    <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-3">
                                          <span className="font-bold text-xs text-slate-900">
                                            {req.title}
                                          </span>
                                          <span className="text-xs text-slate-500">
                                            Period: <strong>{req.period}</strong>
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {isGst && req.monthlyRequest && (
                                            <>
                                              <button
                                                onClick={() => onGenerateWorkbook?.(req.monthlyRequest!.id)}
                                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200 flex items-center gap-1.5 transition"
                                              >
                                                <Download className="w-3.5 h-3.5 text-amber-600" />
                                                <span>Save Workbook (.zip)</span>
                                              </button>
                                              <button
                                                onClick={() => onOpenClientPortal?.(req.monthlyRequest!.clientPortalToken)}
                                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition"
                                              >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>Client Portal</span>
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* Detail Metrics */}
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                                            Files Uploaded
                                          </span>
                                          <span className="font-bold text-slate-800 text-sm">
                                            {req.filesCount || 0} documents
                                          </span>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                                            Extracted Records
                                          </span>
                                          <span className="font-bold text-slate-800 text-sm">
                                            {req.extractedInvoicesCount || 0} invoices
                                          </span>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                                            Exceptions
                                          </span>
                                          <span className="font-bold text-rose-600 text-sm">
                                            {req.validationExceptionsCount || 0} alerts
                                          </span>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                                            Assigned Lead
                                          </span>
                                          <span className="font-bold text-slate-800 text-sm truncate block">
                                            {req.assignedTo}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>

                    {mergedClientRequestsList.length === 0 && (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        No requests found for current filter.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* =================================================================
                  SUB-TAB: INSIGHTS (SCREENSHOT 4)
                 ================================================================= */}
              {activeSubTab === 'insights' && (
                <div className="space-y-6">
                  {/* Top 3 KPI Cards (Screenshot 4) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card 1: Aged Receivables */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Aged Receivables</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">
                          Invoices aged over 45 days
                        </span>
                        <div className="text-2xl font-black text-slate-900 mt-1">
                          ₹{(selectedClient.insightsData?.agedReceivablesOver45Days ?? 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Aged Payables */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-rose-600" />
                          <span>Aged Payables</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">
                          Bills aged over 45 days
                        </span>
                        <div className="text-2xl font-black text-slate-900 mt-1">
                          $0.00
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Cash Flow Analysis */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-blue-600" />
                          <span>Cash Flow Analysis</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-blue-600 h-full w-2/3 rounded-full"></div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600">Positive</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Section & Right Column (Screenshot 4) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Columns: Clean Up, Bank Transactions, Expense Summary */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Clean Up Container */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-2xs">
                        <div className="border-b border-slate-100 pb-3">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <span>Clean Up</span>
                          </h3>
                        </div>

                        {/* Pending Reviews */}
                        <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span>Pending Reviews</span>
                          </div>
                          <p className="text-xs text-slate-500">
                            You don't have any pending reviews.
                          </p>
                        </div>

                        {/* Bank Transactions */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <Building2 className="w-4 h-4 text-teal-600" />
                            <span>Bank Transactions</span>
                          </div>

                          {/* Sub-tabs */}
                          <div className="flex space-x-6 border-b border-slate-200 text-xs font-semibold">
                            {[
                              { id: 'disconnected', label: 'Disconnected Bank Feeds' },
                              { id: 'uncategorized', label: 'Uncategorized' },
                              { id: 'unreconciled', label: 'Unreconciled' },
                              { id: 'duplicate', label: 'Duplicate' },
                            ].map(tab => (
                              <button
                                key={tab.id}
                                onClick={() => setBankSubTab(tab.id as any)}
                                className={`pb-2.5 transition border-b-2 ${
                                  bankSubTab === tab.id
                                    ? 'border-blue-600 text-blue-700 font-bold'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          {/* Empty Table */}
                          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100">
                            No results found
                          </div>
                        </div>

                        {/* Expense Summary */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <FileText className="w-4 h-4 text-rose-600" />
                            <span>Expense Summary</span>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                            <div className="text-xs font-bold text-slate-700">Corporate Cards</div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-[11px] text-slate-400 block">Spend Summary</span>
                                <span className="text-xs text-slate-500">This Month: $0.00</span>
                              </div>
                              <div>
                                <span className="text-[11px] text-slate-400 block">Pending Expenses</span>
                                <span className="text-xs text-slate-500">Unapproved: 0 • Unsubmitted: 0</span>
                              </div>
                            </div>
                            <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-lg border border-slate-200 mt-2">
                              No results found
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Insights Widgets (Screenshot 4) */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-2xs">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>Insights</span>
                        </h3>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-800 block">Average Debtor Age</span>
                            <span className="text-slate-500 text-[11px]">28 Days on invoices</span>
                          </div>
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                        </div>

                        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start justify-between">
                          <div>
                            <span className="font-bold text-amber-900 block">General Ledger</span>
                            <span className="text-amber-700 text-[11px]">1 Discrepancy flagged by audit bot</span>
                          </div>
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-800 block">Relative Size Factor</span>
                            <span className="text-slate-500 text-[11px]">1.4x standard sample size</span>
                          </div>
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-800 block">Top Expenses</span>
                            <span className="text-slate-500 text-[11px]">Lease & Subscriptions</span>
                          </div>
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* OTHER SUB-TABS: OVERVIEW, TASKS, EMAILS, DISCUSSIONS, DOCUMENTS */}
              {activeSubTab === 'overview' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
                  <h3 className="font-bold text-sm text-slate-900">Client Overview & Health Scorecard</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block">GSTIN Registration</span>
                      <strong className="text-sm text-slate-900 font-mono mt-1 block">{selectedClient.gstin}</strong>
                      <span className="text-[10px] text-emerald-700 font-bold">Active & Verified</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block">Filing Cadence</span>
                      <strong className="text-sm text-slate-900 mt-1 block">Monthly (GSTR-1 & 3B)</strong>
                      <span className="text-[10px] text-blue-700 font-bold">QRMP / Regular</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block">Compliance Status</span>
                      <strong className="text-sm text-emerald-600 mt-1 block">100% Up to Date</strong>
                      <span className="text-[10px] text-slate-500">Zero default notices</span>
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'tasks' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
                  <h3 className="font-bold text-sm text-slate-900">Assigned Practice Tasks for {selectedClient.businessName}</h3>
                  <p className="text-slate-500">Automated intake, reconciliation, and statutory audit tasks.</p>
                  <div className="divide-y divide-slate-100 pt-2">
                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">Monthly Document Collection & 2B Recon</span>
                        <p className="text-slate-400 text-[11px]">Due on 11th of every month</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">In Progress</span>
                    </div>
                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">GSTR-3B Tax Liability Verification</span>
                        <p className="text-slate-400 text-[11px]">Due on 20th of every month</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">Scheduled</span>
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'emails' && (() => {
                const clientEmailList = getEmailsForClient(selectedClient.id);
                const filteredEmails = clientEmailList.filter(m => {
                  if (emailFilter !== 'all' && m.status !== emailFilter) return false;
                  if (emailSearchQuery.trim()) {
                    const q = emailSearchQuery.toLowerCase();
                    return m.subject.toLowerCase().includes(q) || m.to.toLowerCase().includes(q) || m.body.toLowerCase().includes(q);
                  }
                  return true;
                });
                const deliveredCount = clientEmailList.filter(m => m.status === 'Delivered').length;
                const openedCount = clientEmailList.filter(m => m.status === 'Opened').length;

                return (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">Email & Dispatch Hub</h3>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {clientEmailList.length} Dispatched
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Outbound statutory reminders, tax computation dispatch, and delivery tracking for {selectedClient.businessName}.
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          onClick={() => {
                            setComposeEmailForm({
                              to: selectedClient.email || '',
                              cc: '',
                              template: 'gst_reminder',
                              subject: `[GST-COMPLIANCE] Monthly GST Document Upload Reminder - ${selectedClient.businessName}`,
                              body: `Dear ${selectedClient.businessName},\n\nKindly note that document intake for the current tax period is open. Please upload your monthly sales registers, purchase invoices, and bank statements to the QuinceCA portal.\n\nFiling Deadlines:\n• GSTR-1: 11th\n• GSTR-3B: 20th\n\nAccess Portal: https://quinceca.quinceautomation.com/portal\n\nWarm regards,\nCA Practice Team`,
                              attachments: ['Monthly_GST_Document_Checklist.pdf'],
                            });
                            setIsComposeEmailModalOpen(true);
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Quick GST Reminder</span>
                        </button>
                        <button
                          onClick={() => {
                            setComposeEmailForm({
                              to: selectedClient.email || '',
                              cc: '',
                              template: 'custom',
                              subject: `Statutory Update - ${selectedClient.businessName}`,
                              body: '',
                              attachments: [],
                            });
                            setIsComposeEmailModalOpen(true);
                          }}
                          className="px-3.5 py-2 bg-[#1565c0] hover:bg-[#0d47a1] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>+ Compose Email</span>
                        </button>
                      </div>
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL DISPATCHED</span>
                        <div className="text-xl font-extrabold text-slate-900 mt-1">{clientEmailList.length}</div>
                        <span className="text-[10px] text-slate-500">SES & SMTP Delivery</span>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">DELIVERED</span>
                        <div className="text-xl font-extrabold text-emerald-600 mt-1">{deliveredCount}</div>
                        <span className="text-[10px] text-emerald-700 font-semibold">100% Inboxes reached</span>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">CLIENT OPENED</span>
                        <div className="text-xl font-extrabold text-purple-600 mt-1">{openedCount}</div>
                        <span className="text-[10px] text-purple-700 font-semibold">Read receipts tracked</span>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">PRIMARY RECIPIENT</span>
                        <div className="text-xs font-bold text-slate-900 truncate mt-1.5 font-mono">{selectedClient.email || 'None'}</div>
                        <span className="text-[10px] text-slate-500 font-mono">{selectedClient.registeredPhone || 'WhatsApp Synced'}</span>
                      </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {(['all', 'Delivered', 'Opened', 'Sent'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setEmailFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              emailFilter === f
                                ? 'bg-[#1565c0] text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {f === 'all' ? `All (${clientEmailList.length})` : f}
                          </button>
                        ))}
                      </div>

                      <div className="relative min-w-[240px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={emailSearchQuery}
                          onChange={e => setEmailSearchQuery(e.target.value)}
                          placeholder="Search subject or recipient..."
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Emails List */}
                    <div className="space-y-3">
                      {filteredEmails.map(mail => (
                        <div
                          key={mail.id}
                          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1565c0] shrink-0 mt-0.5">
                              <Mail className="w-4 h-4" />
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="font-bold text-xs text-slate-900 hover:text-blue-600 cursor-pointer"
                                  onClick={() => setSelectedEmailPreview(mail)}
                                >
                                  {mail.subject}
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {mail.tag}
                                </span>
                                {mail.status === 'Opened' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    Opened
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Delivered
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                                <span>To: <strong className="text-slate-700 font-mono">{mail.to}</strong></span>
                                <span>•</span>
                                <span>Dispatched by: <strong className="text-slate-700">{mail.senderName}</strong></span>
                                <span>•</span>
                                <span className="text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {mail.sentAt}
                                </span>
                              </div>
                              {mail.attachments && mail.attachments.length > 0 && (
                                <div className="flex items-center gap-2 pt-1">
                                  {mail.attachments.map((att, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono border border-slate-200">
                                      <Paperclip className="w-2.5 h-2.5" />
                                      {att}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => setSelectedEmailPreview(mail)}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>View Body</span>
                            </button>
                            <button
                              onClick={() => handleResendEmail(mail)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3 text-blue-600" />
                              <span>Resend</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {filteredEmails.length === 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                          No outbound emails found matching the selected filters.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {activeSubTab === 'discussions' && (() => {
                const threadList = getDiscussionsForClient(selectedClient.id);
                const filteredThreads = threadList.filter(th => {
                  if (discussionFilter !== 'all' && th.tag !== discussionFilter) return false;
                  return true;
                });

                return (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">Internal CA Firm Discussions & Audit Trails</h3>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Private Staff Channel
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Collaborate privately on client tax positions, GSTR-2B ITC queries, and statutory audit remarks for {selectedClient.businessName}.
                        </p>
                      </div>

                      {/* Filter Pills */}
                      <div className="flex items-center gap-2 shrink-0">
                        {(['all', 'Audit Note', 'Tax Query', 'Client Follow-up'] as const).map(tag => (
                          <button
                            key={tag}
                            onClick={() => setDiscussionFilter(tag)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              discussionFilter === tag
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {tag === 'all' ? `All (${threadList.length})` : tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Post New Discussion Box */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-700">Category Tag:</span>
                          <select
                            value={discussionTag}
                            onChange={e => setDiscussionTag(e.target.value as any)}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                          >
                            <option value="Tax Query">Tax Query</option>
                            <option value="Audit Note">Audit Note</option>
                            <option value="Client Follow-up">Client Follow-up</option>
                            <option value="Compliance Risk">Compliance Risk</option>
                            <option value="General">General</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">Posting as:</span>
                          <select
                            value={discussionAuthor}
                            onChange={e => setDiscussionAuthor(e.target.value)}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 font-mono"
                          >
                            <option value="CA Suraj Dutta (Partner)">CA Suraj Dutta (Partner, FCA)</option>
                            <option value="Pooja Verma (Senior Associate)">Pooja Verma (Senior Associate)</option>
                            <option value="Sonu Sharma (Tax Associate)">Sonu Sharma (Tax Associate)</option>
                          </select>
                        </div>
                      </div>

                      <form onSubmit={handlePostDiscussion} className="space-y-3">
                        <textarea
                          rows={3}
                          value={discussionText}
                          onChange={e => setDiscussionText(e.target.value)}
                          placeholder="Write an internal team note, audit observation, or mention staff members..."
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-medium leading-relaxed"
                        />

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-400">
                            Notes are encrypted & only visible to your CA firm staff.
                          </span>
                          <button
                            type="submit"
                            disabled={!discussionText.trim()}
                            className="px-4 py-2 bg-[#1565c0] hover:bg-[#0d47a1] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Post Note</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Discussion Feed */}
                    <div className="space-y-4">
                      {filteredThreads.map(thread => (
                        <div
                          key={thread.id}
                          className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-3 transition ${
                            thread.isResolved
                              ? 'border-emerald-200 bg-emerald-50/20'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {/* Thread Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {thread.authorName.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-900">{thread.authorName}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                                    {thread.authorRole}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    thread.tag === 'Audit Note'
                                      ? 'bg-amber-100 text-amber-800'
                                      : thread.tag === 'Tax Query'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {thread.tag}
                                  </span>
                                  {thread.isResolved && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      Resolved
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 mt-0.5 block">{thread.createdAt}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleToggleResolveDiscussion(thread.id)}
                                title={thread.isResolved ? 'Mark active' : 'Mark resolved'}
                                className={`p-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                                  thread.isResolved
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDiscussion(thread.id)}
                                title="Delete note"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Message Text */}
                          <div className="text-xs text-slate-800 leading-relaxed font-medium pl-11">
                            {thread.text}
                          </div>

                          {/* Nested Replies */}
                          {thread.replies && thread.replies.length > 0 && (
                            <div className="pl-11 pt-2 space-y-2">
                              {thread.replies.map(rep => (
                                <div key={rep.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-900">{rep.authorName}</span>
                                    <span className="text-[10px] text-slate-400">{rep.createdAt}</span>
                                  </div>
                                  <p className="text-slate-700">{rep.text}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reply Box Action */}
                          <div className="pl-11 pt-1 flex items-center gap-3">
                            {replyingThreadId === thread.id ? (
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="text"
                                  autoFocus
                                  value={replyInputText}
                                  onChange={e => setReplyInputText(e.target.value)}
                                  placeholder="Write a reply..."
                                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => handlePostReply(thread.id)}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
                                >
                                  Reply
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingThreadId(null);
                                    setReplyInputText('');
                                  }}
                                  className="px-2 py-1.5 text-slate-500 text-xs font-medium cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setReplyingThreadId(thread.id)}
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                              >
                                <CornerDownRight className="w-3 h-3" />
                                <span>Add Reply</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {filteredThreads.length === 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                          No discussion threads matching this tag filter.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {activeSubTab === 'documents' && (() => {
                const docsList = getClientDocuments(selectedClient);
                const filteredDocs = docsList.filter(d => {
                  if (docCategoryFilter === 'kyc' && d.categoryNumber !== 1 && d.categoryNumber !== 4) return false;
                  if (docCategoryFilter === 'gst' && d.categoryNumber !== 2) return false;
                  if (docCategoryFilter === 'itr' && d.categoryNumber !== 10) return false;
                  if (docCategoryFilter === 'banking' && d.categoryNumber !== 3 && d.categoryNumber !== 9 && d.categoryNumber !== 7) return false;
                  if (docSearchQuery.trim()) {
                    const q = docSearchQuery.toLowerCase();
                    return d.docName.toLowerCase().includes(q) || (d.fileName && d.fileName.toLowerCase().includes(q));
                  }
                  return true;
                });

                return (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">Attached Documents & Statutory KYC Vault</h3>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {docsList.length} Active Records
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Statutory incorporation certificates, PAN, MOA/AOA, GST registrations, bank statements, and tax audit workpapers.
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          onClick={() => {
                            setFeedbackToast({
                              type: 'success',
                              message: `Generating encrypted ZIP bundle of all ${docsList.length} client vault files...`,
                            });
                          }}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>Download All (.zip)</span>
                        </button>
                        <button
                          onClick={() => {
                            setUploadDocForm({
                              docName: '',
                              category: 'kyc',
                              fileName: '',
                              fileSize: '1.4 MB',
                              status: 'verified',
                              notes: '',
                            });
                            setIsUploadDocModalOpen(true);
                          }}
                          className="px-3.5 py-2 bg-[#1565c0] hover:bg-[#0d47a1] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>+ Upload Document</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { id: 'all', label: `All (${docsList.length})` },
                          { id: 'kyc', label: 'KYC & Incorporation' },
                          { id: 'gst', label: 'GST & Tax Filings' },
                          { id: 'itr', label: 'ITR & Financials' },
                          { id: 'banking', label: 'Banking & Other' },
                        ].map(f => (
                          <button
                            key={f.id}
                            onClick={() => setDocCategoryFilter(f.id as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              docCategoryFilter === f.id
                                ? 'bg-[#1565c0] text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <div className="relative min-w-[240px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={docSearchQuery}
                          onChange={e => setDocSearchQuery(e.target.value)}
                          placeholder="Search document name..."
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Documents Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredDocs.map(doc => {
                        const isVerified = doc.status === 'verified';
                        return (
                          <div
                            key={doc.id}
                            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-blue-300 transition flex flex-col justify-between space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start space-x-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-xs text-slate-900 block truncate">
                                    {doc.docName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                                    {doc.fileName} • {doc.fileSize}
                                  </span>
                                  {doc.notes && (
                                    <span className="text-[10px] text-slate-500 mt-1 block truncate">
                                      {doc.notes}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => handleToggleVerifyDoc(doc.id)}
                                title="Click to toggle verification status"
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer shrink-0 ${
                                  isVerified
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                }`}
                              >
                                {isVerified ? '✓ Verified' : '⏳ Pending'}
                              </button>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span className="text-[10px] text-slate-400">
                                Uploaded {doc.uploadedAt || '2026-08-15'}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setPreviewDoc(doc)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                                  title="Preview Document"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDownloadDoc(doc)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                                  title="Download File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDoc(doc.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                  title="Remove Document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {filteredDocs.length === 0 && (
                        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                          No documents found matching the filter.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

            </main>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREENSHOT 2: ADD CONTACT PERSON MODAL
         ========================================================================= */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            {/* Modal Header (Screenshot 2) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Add Contact Person
              </h3>
              <button
                onClick={() => setIsAddContactModalOpen(false)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form (Screenshot 2 exact fields) */}
            <form onSubmit={handleSaveContactPerson} className="space-y-4 text-xs">
              {/* Name */}
              <div className="grid grid-cols-3 items-center gap-3">
                <label className="text-slate-600 font-semibold">Name</label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="e.g. Charles Stone"
                  className="col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Email Address */}
              <div className="grid grid-cols-3 items-center gap-3">
                <label className="text-slate-600 font-semibold">Email Address</label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="charles.stone@zylker.com"
                  className="col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Phone (with country code & type dropdowns) */}
              <div className="grid grid-cols-3 items-start gap-3 pt-1">
                <label className="text-slate-600 font-semibold pt-2">Phone</label>
                <div className="col-span-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <select
                      value={contactForm.countryCode}
                      onChange={e => setContactForm({ ...contactForm, countryCode: e.target.value })}
                      className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono text-xs w-20 shrink-0"
                    >
                      <option value="+1">+1 (US)</option>
                      <option value="+91">+91 (IN)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+971">+971 (AE)</option>
                    </select>
                    <input
                      type="text"
                      value={contactForm.phone}
                      onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="9999999999"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={contactForm.phoneType}
                      onChange={e => setContactForm({ ...contactForm, phoneType: e.target.value as any })}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs w-28"
                    >
                      <option value="Mobile">Mobile</option>
                      <option value="Work">Work</option>
                      <option value="Personal">Personal</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer text-[11px] ml-2">
                      <input
                        type="checkbox"
                        checked={contactForm.isPrimary}
                        onChange={e => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span>Primary Contact</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Skype Name / Number */}
              <div className="grid grid-cols-3 items-center gap-3">
                <label className="text-slate-600 font-semibold">Skype Name/Number</label>
                <div className="col-span-2 relative">
                  <input
                    type="text"
                    value={contactForm.skypeNumber}
                    onChange={e => setContactForm({ ...contactForm, skypeNumber: e.target.value })}
                    placeholder="Skype Name/Number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Other Details: Designation & Department */}
              <div className="grid grid-cols-3 items-center gap-3">
                <label className="text-slate-600 font-semibold">Other Details</label>
                <div className="col-span-2 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={contactForm.designation}
                    onChange={e => setContactForm({ ...contactForm, designation: e.target.value })}
                    placeholder="Designation"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={contactForm.department}
                    onChange={e => setContactForm({ ...contactForm, department: e.target.value })}
                    placeholder="Department"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Modal Buttons (Screenshot 2: Save, Cancel) */}
              <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1565c0] hover:bg-[#0d47a1] text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddContactModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN USER MODAL */}
      {isAssignUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Assign Practice User</h3>
              <button onClick={() => setIsAssignUserModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {['Dwaipayan Bose', 'CA Suraj Dutta (Partner)', 'Pooja Verma (Senior Associate)', 'Shekhar Das (Associate)'].map(u => (
                <div
                  key={u}
                  onClick={() => handleAssignUser(u)}
                  className="p-2.5 rounded-lg hover:bg-blue-50/70 border border-slate-100 hover:border-blue-200 flex items-center justify-between cursor-pointer transition"
                >
                  <span className="font-semibold text-slate-800">{u}</span>
                  <Check className="w-3.5 h-3.5 text-blue-600 opacity-0 hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NEW REQUEST MODAL (SCREENSHOT 3) */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">New Client Request</h3>
              <button onClick={() => setIsNewRequestModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClientRequest} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Request Title</label>
                <input
                  type="text"
                  required
                  value={newRequestForm.title}
                  onChange={e => setNewRequestForm({ ...newRequestForm, title: e.target.value })}
                  placeholder="e.g. September Bank Statements & Credit Notes"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Associated App</label>
                  <select
                    value={newRequestForm.associatedApp}
                    onChange={e => setNewRequestForm({ ...newRequestForm, associatedApp: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Books">Books</option>
                    <option value="GST">GST</option>
                    <option value="Expense">Expense</option>
                    <option value="Inventory">Inventory</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newRequestForm.priority}
                    onChange={e => setNewRequestForm({ ...newRequestForm, priority: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Very Low">Very Low</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assign To</label>
                <select
                  value={newRequestForm.assignedTo}
                  onChange={e => setNewRequestForm({ ...newRequestForm, assignedTo: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Dwaipayan Bose">Dwaipayan Bose</option>
                  <option value="CA Suraj Dutta">CA Suraj Dutta</option>
                  <option value="Pooja Verma">Pooja Verma</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewRequestModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1565c0] hover:bg-[#0d47a1] text-white rounded-lg font-bold shadow-xs"
                >
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLIENT MANAGEMENT MODAL (Add / Edit Client) */}
      {isClientModalOpen && (
        <ClientManagementModal
          isOpen={isClientModalOpen}
          initialEditClientId={clientManagementEditId}
          editClientId={clientManagementEditId}
          onClose={() => setIsClientModalOpen(false)}
          onClientAddedOrUpdated={() => {
            setIsClientModalOpen(false);
            const saved = localStorage.getItem('ps_clients_kyc_data');
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) setClients(parsed);
              } catch {}
            }
            if (onRefreshParent) onRefreshParent();
            setFeedbackToast({
              type: 'success',
              message: 'Client master record updated successfully.',
            });
          }}
          onSuccess={() => {
            setIsClientModalOpen(false);
            const saved = localStorage.getItem('ps_clients_kyc_data');
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) setClients(parsed);
              } catch {}
            }
            if (onRefreshParent) onRefreshParent();
            setFeedbackToast({
              type: 'success',
              message: 'Client master record updated successfully.',
            });
          }}
        />
      )}

      {/* MODAL: Associated Finance App - Books / Expense / Inventory */}
      {activeFinanceAppModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeFinanceAppModal === 'books'
                    ? 'bg-blue-100 text-blue-700'
                    : activeFinanceAppModal === 'expense'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {activeFinanceAppModal === 'books' && <FileSpreadsheet className="w-5 h-5" />}
                  {activeFinanceAppModal === 'expense' && <FileText className="w-5 h-5" />}
                  {activeFinanceAppModal === 'inventory' && <Layers className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {activeFinanceAppModal === 'books' && 'Accounting Books & General Ledger'}
                    {activeFinanceAppModal === 'expense' && 'Expense & Purchase Bills Register'}
                    {activeFinanceAppModal === 'inventory' && 'Inventory & HSN/SAC Stock Register'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedClient.businessName || selectedClient.name} • {selectedClient.gstin || selectedClient.pan || 'Taxpayer Master'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveFinanceAppModal(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto py-4 space-y-4 flex-1">
              {/* BOOKS APP CONTENT */}
              {activeFinanceAppModal === 'books' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/70">
                      <span className="text-[10px] font-bold text-blue-800 uppercase block">Total Sales Invoices</span>
                      <span className="text-lg font-extrabold text-blue-900 mt-1 block">4 Vouchers</span>
                      <span className="text-[10px] text-blue-600 mt-0.5 block">Posted to Daybook</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Gross Revenue</span>
                      <span className="text-lg font-extrabold text-slate-900 mt-1 block">₹1,22,720</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Taxable: ₹1,09,000</span>
                    </div>
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/70">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Tally Sync Status</span>
                      <span className="text-lg font-extrabold text-emerald-700 mt-1 block">100% Synced</span>
                      <span className="text-[10px] text-emerald-600 mt-0.5 block">Ready for XML Export</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="py-2.5 px-3">Voucher #</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Customer GSTIN</th>
                          <th className="py-2.5 px-3">Taxable</th>
                          <th className="py-2.5 px-3 text-right">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        <tr className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-blue-700">INV-2026027</td>
                          <td className="py-2.5 px-3 text-slate-600">10-08-2026</td>
                          <td className="py-2.5 px-3 text-slate-700">07DWAPK0131H1Z1</td>
                          <td className="py-2.5 px-3">₹10,000</td>
                          <td className="py-2.5 px-3 font-bold text-right text-slate-900">₹11,800</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-blue-700">INV-2026028</td>
                          <td className="py-2.5 px-3 text-slate-600">30-08-2026</td>
                          <td className="py-2.5 px-3 text-slate-700">07AAICI5692P1ZP</td>
                          <td className="py-2.5 px-3">₹50,000</td>
                          <td className="py-2.5 px-3 font-bold text-right text-slate-900">₹59,000</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-blue-700">INV-2026029</td>
                          <td className="py-2.5 px-3 text-slate-600">18-08-2026</td>
                          <td className="py-2.5 px-3 text-slate-700">07AMCPB9753F1Z5</td>
                          <td className="py-2.5 px-3">₹9,000</td>
                          <td className="py-2.5 px-3 font-bold text-right text-slate-900">₹10,620</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-blue-700">INV-2026030</td>
                          <td className="py-2.5 px-3 text-slate-600">18-08-2026</td>
                          <td className="py-2.5 px-3 text-slate-700">07AMCPB9753F1Z5</td>
                          <td className="py-2.5 px-3">₹40,000</td>
                          <td className="py-2.5 px-3 font-bold text-right text-slate-900">₹47,200</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* EXPENSE APP CONTENT */}
              {activeFinanceAppModal === 'expense' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/70">
                      <span className="text-[10px] font-bold text-rose-800 uppercase block">Inward Purchases</span>
                      <span className="text-lg font-extrabold text-rose-900 mt-1 block">₹98,400</span>
                      <span className="text-[10px] text-rose-600 mt-0.5 block">Vendor Bills</span>
                    </div>
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/70">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Eligible ITC (Table 4)</span>
                      <span className="text-lg font-extrabold text-emerald-700 mt-1 block">₹17,176.15</span>
                      <span className="text-[10px] text-emerald-600 mt-0.5 block">Claimable in GSTR-3B</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">GSTR-2B Matching</span>
                      <span className="text-lg font-extrabold text-slate-900 mt-1 block">100% Match</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Zero ITC Leakage</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Expense Categories Breakdown</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-600">Digital Ads & Marketing:</span>
                        <span className="font-bold text-slate-900">₹64,200</span>
                      </div>
                      <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-600">Web Hosting & SaaS Tools:</span>
                        <span className="font-bold text-slate-900">₹18,500</span>
                      </div>
                      <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-600">Professional & Audit Fees:</span>
                        <span className="font-bold text-slate-900">₹10,000</span>
                      </div>
                      <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-600">Office Utilities:</span>
                        <span className="font-bold text-slate-900">₹5,700</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* INVENTORY APP CONTENT */}
              {activeFinanceAppModal === 'inventory' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">Active HSN Slabs</span>
                      <span className="text-lg font-extrabold text-amber-900 mt-1 block">2 Slabs</span>
                      <span className="text-[10px] text-amber-700 mt-0.5 block">Service Accounting Codes</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Quantity</span>
                      <span className="text-lg font-extrabold text-slate-900 mt-1 block">7 NOS</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">UQC Standard</span>
                    </div>
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/70">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">GSTR-1 Table 12</span>
                      <span className="text-lg font-extrabold text-emerald-700 mt-1 block">Reconciled</span>
                      <span className="text-[10px] text-emerald-600 mt-0.5 block">Zero Mismatch</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="py-2.5 px-3">HSN / SAC</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3">UQC</th>
                          <th className="py-2.5 px-3">Qty</th>
                          <th className="py-2.5 px-3">Taxable Value</th>
                          <th className="py-2.5 px-3 text-right">Tax (18%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        <tr className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-amber-700">998361</td>
                          <td className="py-2.5 px-3 font-sans text-slate-800">Social Media Marketing + Meta Ads</td>
                          <td className="py-2.5 px-3 text-slate-600">NOS</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">6</td>
                          <td className="py-2.5 px-3">₹1,04,000</td>
                          <td className="py-2.5 px-3 font-bold text-right text-slate-900">₹18,720</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-amber-700">998314</td>
                          <td className="py-2.5 px-3 font-sans text-slate-800">Website Development Charges</td>
                          <td className="py-2.5 px-3 text-slate-600">NOS</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">1</td>
                          <td className="py-2.5 px-3">₹5,000</td>
                          <td className="py-2.5 px-3 font-bold text-right text-slate-900">₹900</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Live Practice Database • Multi-Module Integration
              </span>
              <button
                onClick={() => setActiveFinanceAppModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          COMPOSE EMAIL MODAL
         ========================================================================= */}
      {isComposeEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Compose Outbound Email</h3>
              </div>
              <button onClick={() => setIsComposeEmailModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">To Recipient</label>
                  <input
                    type="email"
                    required
                    value={composeEmailForm.to}
                    onChange={e => setComposeEmailForm({ ...composeEmailForm, to: e.target.value })}
                    placeholder="client@company.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">CC (Optional)</label>
                  <input
                    type="text"
                    value={composeEmailForm.cc}
                    onChange={e => setComposeEmailForm({ ...composeEmailForm, cc: e.target.value })}
                    placeholder="accounts@firm.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Email Template</label>
                <select
                  value={composeEmailForm.template}
                  onChange={e => {
                    const t = e.target.value;
                    let subj = '';
                    let body = '';
                    let atts: string[] = [];

                    if (t === 'gst_reminder') {
                      subj = `[GST-COMPLIANCE] Monthly GST Document Upload Reminder - ${selectedClient.businessName}`;
                      body = `Dear ${selectedClient.businessName},\n\nKindly note that document collection for the current tax period is open. Please upload your monthly sales registers, purchase invoices, and bank statements to the QuinceCA portal before the due date.\n\nFiling Deadlines:\n• GSTR-1: 11th\n• GSTR-3B: 20th\n\nDirect Portal Access: https://quinceca.quinceautomation.com/portal\n\nPlease reach out if you have any questions.\n\nWarm regards,\nCA Practice Office`;
                      atts = ['Monthly_GST_Document_Checklist.pdf'];
                    } else if (t === 'challan') {
                      subj = `[TAX-CHALLAN] GSTR-3B Draft Tax Liability & Payment Challan - ${selectedClient.businessName}`;
                      body = `Dear ${selectedClient.businessName},\n\nPlease find attached the draft computation of tax liability for GSTR-3B after setting off Input Tax Credit (ITC) from GSTR-2B.\n\nPlease review and approve the figures so we can generate the CPIN payment challan.\n\nBest regards,\nPooja Verma\nSenior Tax Associate`;
                      atts = ['GSTR3B_Draft_Tax_Computation.pdf', 'PMT06_Challan_Draft.pdf'];
                    } else if (t === 'itr') {
                      subj = `[ITR-VERIFICATION] Income Tax Return Acknowledgement & ITR-V Form`;
                      body = `Dear ${selectedClient.businessName},\n\nYour Income Tax Return has been successfully submitted to the Income Tax Department. Kindly find the ITR-V verification acknowledgement attached.\n\nWarm regards,\nCA Suraj Dutta, FCA`;
                      atts = ['ITR_Acknowledgement_Receipt.pdf'];
                    } else {
                      subj = `Important Statutory Notice - ${selectedClient.businessName}`;
                      body = `Dear ${selectedClient.businessName},\n\nWe would like to bring the following statutory matter to your attention:\n\n\nWarm regards,\nCA Practice Team`;
                      atts = [];
                    }

                    setComposeEmailForm({
                      ...composeEmailForm,
                      template: t,
                      subject: subj,
                      body,
                      attachments: atts,
                    });
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                >
                  <option value="gst_reminder">Monthly GST Document Upload Reminder</option>
                  <option value="challan">GSTR-3B Tax Liability Computation & Challan</option>
                  <option value="itr">Income Tax Return Verification / ITR-V</option>
                  <option value="custom">Custom Notice / Communication</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={composeEmailForm.subject}
                  onChange={e => setComposeEmailForm({ ...composeEmailForm, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Body</label>
                <textarea
                  rows={6}
                  required
                  value={composeEmailForm.body}
                  onChange={e => setComposeEmailForm({ ...composeEmailForm, body: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-sans resize-none leading-relaxed"
                />
              </div>

              {composeEmailForm.attachments.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Attached Files:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {composeEmailForm.attachments.map((att, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono flex items-center gap-1">
                        <Paperclip className="w-2.5 h-2.5" />
                        {att}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  Dispatched via AWS SES / SendGrid with open-rate tracking.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComposeEmailModalOpen(false)}
                    className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1565c0] hover:bg-[#0d47a1] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW EMAIL PREVIEW MODAL
         ========================================================================= */}
      {selectedEmailPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedEmailPreview.subject}</h3>
                <span className="text-[11px] text-slate-400">
                  Sent {selectedEmailPreview.sentAt} • Status: <strong className="text-emerald-600">{selectedEmailPreview.status}</strong>
                </span>
              </div>
              <button onClick={() => setSelectedEmailPreview(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1 font-mono text-[11px]">
              <div><strong className="text-slate-500 font-sans">To:</strong> {selectedEmailPreview.to}</div>
              <div><strong className="text-slate-500 font-sans">From:</strong> {selectedEmailPreview.senderName} &lt;noreply@quinceca.com&gt;</div>
              <div><strong className="text-slate-500 font-sans">Tag:</strong> {selectedEmailPreview.tag}</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl max-h-60 overflow-y-auto whitespace-pre-line text-slate-800 leading-relaxed">
              {selectedEmailPreview.body}
            </div>

            {selectedEmailPreview.attachments && selectedEmailPreview.attachments.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="font-bold text-slate-700 block">Attachments ({selectedEmailPreview.attachments.length}):</span>
                <div className="flex flex-wrap gap-2">
                  {selectedEmailPreview.attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>{att}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  handleResendEmail(selectedEmailPreview);
                  setSelectedEmailPreview(null);
                }}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Resend Copy</span>
              </button>
              <button
                onClick={() => setSelectedEmailPreview(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          UPLOAD DOCUMENT MODAL
         ========================================================================= */}
      {isUploadDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Upload to Document Vault</h3>
              </div>
              <button onClick={() => setIsUploadDocModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadDoc} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={uploadDocForm.docName}
                  onChange={e => setUploadDocForm({ ...uploadDocForm, docName: e.target.value })}
                  placeholder="e.g. GST Registration Certificate (REG-06)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={uploadDocForm.category}
                    onChange={e => setUploadDocForm({ ...uploadDocForm, category: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="kyc">KYC & Incorporation</option>
                    <option value="gst">GST & Indirect Tax</option>
                    <option value="itr">ITR & Financials</option>
                    <option value="banking">Banking & Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Verification Status</label>
                  <select
                    value={uploadDocForm.status}
                    onChange={e => setUploadDocForm({ ...uploadDocForm, status: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="verified">Verified</option>
                    <option value="pending">Pending Verification</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">File Name / File</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={uploadDocForm.fileName}
                    onChange={e => setUploadDocForm({ ...uploadDocForm, fileName: e.target.value })}
                    placeholder="e.g. REG_06_Certificate.pdf"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px]"
                  />
                  <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold cursor-pointer transition flex items-center gap-1">
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Browse</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                          setUploadDocForm({
                            ...uploadDocForm,
                            fileName: file.name,
                            fileSize: `${sizeMB} MB`,
                            docName: uploadDocForm.docName || file.name.replace(/\.[^/.]+$/, ''),
                          });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes / Registration ID (Optional)</label>
                <input
                  type="text"
                  value={uploadDocForm.notes}
                  onChange={e => setUploadDocForm({ ...uploadDocForm, notes: e.target.value })}
                  placeholder="e.g. Verified with MCA / GSTIN portal"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadDocModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1565c0] hover:bg-[#0d47a1] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Save to Vault</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DOCUMENT PREVIEW MODAL
         ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{previewDoc.docName}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{previewDoc.fileName} • {previewDoc.fileSize}</span>
                </div>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Verification Status:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  previewDoc.status === 'verified'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {previewDoc.status === 'verified' ? '✓ Verified by Practice' : '⏳ Pending Review'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Uploaded Date:</span>
                <span className="font-mono text-slate-800">{previewDoc.uploadedAt || '2026-08-15'}</span>
              </div>
              {previewDoc.notes && (
                <div className="pt-2 border-t border-slate-200/60 text-slate-700">
                  <strong className="text-slate-500 block text-[10px] uppercase">Notes:</strong>
                  {previewDoc.notes}
                </div>
              )}
            </div>

            <div className="p-8 text-center bg-slate-100/70 rounded-xl border border-dashed border-slate-300 text-slate-400 space-y-1">
              <FileCheck className="w-8 h-8 mx-auto text-slate-400" />
              <div className="font-bold text-slate-700">Digital Copy in Cloud Vault</div>
              <p className="text-[11px] text-slate-500">256-bit AES encrypted statutory file.</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  handleToggleVerifyDoc(previewDoc.id);
                  setPreviewDoc(null);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
              >
                Toggle Verify Status
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleDownloadDoc(previewDoc);
                    setPreviewDoc(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
