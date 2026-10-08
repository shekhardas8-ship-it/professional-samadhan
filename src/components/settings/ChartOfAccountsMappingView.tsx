// src/components/settings/ChartOfAccountsMappingView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Save,
  RotateCcw,
  Download,
  Filter,
  CheckCircle2,
  Sliders,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  Building,
  Tag,
  Percent,
  Check,
  FileCode,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { FirmBrandingConfig } from '../../services/brandingService';

export interface AccountLedger {
  id: string;
  code: string;
  name: string;
  category: 'Revenue' | 'Expense' | 'Asset' | 'Liability';
  scheduleThreeHead: string;
  defaultGstRate: number;
  gstClassification: 'Taxable' | 'Nil Rated' | 'Exempt' | 'Non-GST' | 'RCM';
  tallyLedgerName: string;
  tallyGroup: string;
  isSystemDefault: boolean;
}

export interface GstTaxGroup {
  id: string;
  name: string;
  rate: number;
  cgstLedger: string;
  sgstLedger: string;
  igstLedger: string;
  rcmLedger?: string;
  isItcEligible: boolean;
}

export interface AutoMappingRule {
  id: string;
  ruleType: 'hsn' | 'narration';
  matcher: string;
  targetLedgerId: string;
  targetLedgerName: string;
  priority: number;
}

interface ChartOfAccountsMappingViewProps {
  firmBranding?: FirmBrandingConfig;
  currentUser?: any;
  onSavedNotification?: (msg: string) => void;
  isDialogMode?: boolean;
}

const STORAGE_KEY = 'quinceca_chart_of_accounts_v1';

const DEFAULT_LEDGERS: AccountLedger[] = [
  // Revenue
  {
    id: 'rev_01',
    code: 'REV-18',
    name: 'Domestic Sales (GST 18%)',
    category: 'Revenue',
    scheduleThreeHead: 'Revenue from Operations',
    defaultGstRate: 18,
    gstClassification: 'Taxable',
    tallyLedgerName: 'Sales - Domestic 18%',
    tallyGroup: 'Sales Accounts',
    isSystemDefault: true,
  },
  {
    id: 'rev_02',
    code: 'REV-12',
    name: 'Domestic Sales (GST 12%)',
    category: 'Revenue',
    scheduleThreeHead: 'Revenue from Operations',
    defaultGstRate: 12,
    gstClassification: 'Taxable',
    tallyLedgerName: 'Sales - Domestic 12%',
    tallyGroup: 'Sales Accounts',
    isSystemDefault: true,
  },
  {
    id: 'rev_03',
    code: 'REV-05',
    name: 'Domestic Sales (GST 5%)',
    category: 'Revenue',
    scheduleThreeHead: 'Revenue from Operations',
    defaultGstRate: 5,
    gstClassification: 'Taxable',
    tallyLedgerName: 'Sales - Domestic 5%',
    tallyGroup: 'Sales Accounts',
    isSystemDefault: true,
  },
  {
    id: 'rev_04',
    code: 'REV-LUT',
    name: 'Export of Services / Goods (Zero Rated under LUT)',
    category: 'Revenue',
    scheduleThreeHead: 'Revenue from Operations',
    defaultGstRate: 0,
    gstClassification: 'Exempt',
    tallyLedgerName: 'Export Sales under LUT',
    tallyGroup: 'Sales Accounts',
    isSystemDefault: true,
  },
  {
    id: 'rev_05',
    code: 'REV-OTH',
    name: 'Interest & Other Financial Income',
    category: 'Revenue',
    scheduleThreeHead: 'Other Income',
    defaultGstRate: 0,
    gstClassification: 'Non-GST',
    tallyLedgerName: 'Interest Received',
    tallyGroup: 'Indirect Incomes',
    isSystemDefault: true,
  },

  // Expenses
  {
    id: 'exp_01',
    code: 'EXP-RAW',
    name: 'Purchase of Raw Materials / Stock-in-Trade',
    category: 'Expense',
    scheduleThreeHead: 'Cost of Materials Consumed',
    defaultGstRate: 18,
    gstClassification: 'Taxable',
    tallyLedgerName: 'Purchase Account 18%',
    tallyGroup: 'Purchase Accounts',
    isSystemDefault: true,
  },
  {
    id: 'exp_02',
    code: 'EXP-RNT',
    name: 'Office Rent & Commercial Premises',
    category: 'Expense',
    scheduleThreeHead: 'Other Expenses - Rent',
    defaultGstRate: 18,
    gstClassification: 'Taxable',
    tallyLedgerName: 'Rent Expense A/c',
    tallyGroup: 'Indirect Expenses',
    isSystemDefault: true,
  },
  {
    id: 'exp_03',
    code: 'EXP-PRF',
    name: 'Professional, Audit & Legal Fees (Sec 194J)',
    category: 'Expense',
    scheduleThreeHead: 'Other Expenses - Legal & Professional',
    defaultGstRate: 18,
    gstClassification: 'Taxable',
    tallyLedgerName: 'Legal & Professional Charges',
    tallyGroup: 'Indirect Expenses',
    isSystemDefault: true,
  },
  {
    id: 'exp_04',
    code: 'EXP-CON',
    name: 'Contractor & Technical Services (Sec 194C)',
    category: 'Expense',
    scheduleThreeHead: 'Other Expenses - Subcontracting',
    defaultGstRate: 18,
    gstClassification: 'Taxable',
    tallyLedgerName: 'Contractor Expenses A/c',
    tallyGroup: 'Direct Expenses',
    isSystemDefault: true,
  },
  {
    id: 'exp_05',
    code: 'EXP-FRG',
    name: 'Freight, Logistics & Courier (GTA RCM)',
    category: 'Expense',
    scheduleThreeHead: 'Other Expenses - Freight Inward',
    defaultGstRate: 5,
    gstClassification: 'RCM',
    tallyLedgerName: 'Freight Inward (GTA RCM)',
    tallyGroup: 'Direct Expenses',
    isSystemDefault: true,
  },
  {
    id: 'exp_06',
    code: 'EXP-SAL',
    name: 'Salaries, Wages & Staff Welfare',
    category: 'Expense',
    scheduleThreeHead: 'Employee Benefits Expense',
    defaultGstRate: 0,
    gstClassification: 'Non-GST',
    tallyLedgerName: 'Salaries & Wages A/c',
    tallyGroup: 'Indirect Expenses',
    isSystemDefault: true,
  },
  {
    id: 'exp_07',
    code: 'EXP-CLD',
    name: 'Software, Cloud Infrastructure & SaaS',
    category: 'Expense',
    scheduleThreeHead: 'Other Expenses - IT Subscriptions',
    defaultGstRate: 18,
    gstClassification: 'Taxable',
    tallyLedgerName: 'Software & Hosting Expenses',
    tallyGroup: 'Indirect Expenses',
    isSystemDefault: true,
  },
  {
    id: 'exp_08',
    code: 'EXP-POW',
    name: 'Electricity & Utility Charges',
    category: 'Expense',
    scheduleThreeHead: 'Other Expenses - Power & Fuel',
    defaultGstRate: 0,
    gstClassification: 'Exempt',
    tallyLedgerName: 'Electricity Charges A/c',
    tallyGroup: 'Indirect Expenses',
    isSystemDefault: true,
  },
  {
    id: 'exp_09',
    code: 'EXP-BNK',
    name: 'Bank Charges & Financial Processing',
    category: 'Expense',
    scheduleThreeHead: 'Finance Costs',
    defaultGstRate: 18,
    gstClassification: 'Taxable',
    tallyLedgerName: 'Bank Charges A/c',
    tallyGroup: 'Indirect Expenses',
    isSystemDefault: true,
  },

  // Assets & Liabilities
  {
    id: 'ast_01',
    code: 'AST-DRS',
    name: 'Trade Receivables (Sundry Debtors)',
    category: 'Asset',
    scheduleThreeHead: 'Current Assets - Trade Receivables',
    defaultGstRate: 0,
    gstClassification: 'Non-GST',
    tallyLedgerName: 'Sundry Debtors',
    tallyGroup: 'Sundry Debtors',
    isSystemDefault: true,
  },
  {
    id: 'ast_02',
    code: 'AST-BNK',
    name: 'HDFC / ICICI Current Account',
    category: 'Asset',
    scheduleThreeHead: 'Current Assets - Cash and Cash Equivalents',
    defaultGstRate: 0,
    gstClassification: 'Non-GST',
    tallyLedgerName: 'Bank Accounts',
    tallyGroup: 'Bank Accounts',
    isSystemDefault: true,
  },
  {
    id: 'lia_01',
    code: 'LIA-CRS',
    name: 'Trade Payables (Sundry Creditors)',
    category: 'Liability',
    scheduleThreeHead: 'Current Liabilities - Trade Payables',
    defaultGstRate: 0,
    gstClassification: 'Non-GST',
    tallyLedgerName: 'Sundry Creditors',
    tallyGroup: 'Sundry Creditors',
    isSystemDefault: true,
  },
];

const DEFAULT_GST_GROUPS: GstTaxGroup[] = [
  {
    id: 'tax_18',
    name: 'GST 18% (Standard Rate)',
    rate: 18,
    cgstLedger: 'Input CGST 9%',
    sgstLedger: 'Input SGST 9%',
    igstLedger: 'Input IGST 18%',
    isItcEligible: true,
  },
  {
    id: 'tax_12',
    name: 'GST 12% (Merchandising & Processing)',
    rate: 12,
    cgstLedger: 'Input CGST 6%',
    sgstLedger: 'Input SGST 6%',
    igstLedger: 'Input IGST 12%',
    isItcEligible: true,
  },
  {
    id: 'tax_05',
    name: 'GST 5% (Essential Goods / Transportation)',
    rate: 5,
    cgstLedger: 'Input CGST 2.5%',
    sgstLedger: 'Input SGST 2.5%',
    igstLedger: 'Input IGST 5%',
    isItcEligible: true,
  },
  {
    id: 'tax_rcm',
    name: 'GST Reverse Charge (RCM Sec 9(3)/9(4))',
    rate: 18,
    cgstLedger: 'RCM Input CGST',
    sgstLedger: 'RCM Input SGST',
    igstLedger: 'RCM Input IGST',
    rcmLedger: 'Output RCM Liability A/c',
    isItcEligible: true,
  },
  {
    id: 'tax_inelig',
    name: 'Blocked / Ineligible ITC (Sec 17(5))',
    rate: 18,
    cgstLedger: 'Ineligible CGST Expense',
    sgstLedger: 'Ineligible SGST Expense',
    igstLedger: 'Ineligible IGST Expense',
    isItcEligible: false,
  },
];

const DEFAULT_AUTO_RULES: AutoMappingRule[] = [
  { id: 'rule_01', ruleType: 'hsn', matcher: '9983', targetLedgerId: 'exp_03', targetLedgerName: 'Professional, Audit & Legal Fees (Sec 194J)', priority: 1 },
  { id: 'rule_02', ruleType: 'hsn', matcher: '9972', targetLedgerId: 'exp_02', targetLedgerName: 'Office Rent & Commercial Premises', priority: 2 },
  { id: 'rule_03', ruleType: 'hsn', matcher: '9965', targetLedgerId: 'exp_05', targetLedgerName: 'Freight, Logistics & Courier (GTA RCM)', priority: 3 },
  { id: 'rule_04', ruleType: 'hsn', matcher: '9985', targetLedgerId: 'exp_04', targetLedgerName: 'Contractor & Technical Services (Sec 194C)', priority: 4 },
  { id: 'rule_05', ruleType: 'narration', matcher: 'SALARY', targetLedgerId: 'exp_06', targetLedgerName: 'Salaries, Wages & Staff Welfare', priority: 5 },
  { id: 'rule_06', ruleType: 'narration', matcher: 'RENT', targetLedgerId: 'exp_02', targetLedgerName: 'Office Rent & Commercial Premises', priority: 6 },
  { id: 'rule_07', ruleType: 'narration', matcher: 'ELECTRICITY', targetLedgerId: 'exp_08', targetLedgerName: 'Electricity & Utility Charges', priority: 7 },
  { id: 'rule_08', ruleType: 'narration', matcher: 'AWS', targetLedgerId: 'exp_07', targetLedgerName: 'Software, Cloud Infrastructure & SaaS', priority: 8 },
  { id: 'rule_09', ruleType: 'narration', matcher: 'GOOGLE', targetLedgerId: 'exp_07', targetLedgerName: 'Software, Cloud Infrastructure & SaaS', priority: 9 },
  { id: 'rule_10', ruleType: 'narration', matcher: 'CHALLAN', targetLedgerId: 'ast_02', targetLedgerName: 'HDFC / ICICI Current Account', priority: 10 },
];

export const ChartOfAccountsMappingView: React.FC<ChartOfAccountsMappingViewProps> = ({
  onSavedNotification,
  isDialogMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'ledgers' | 'gst_tax' | 'tally_mapping' | 'ai_rules'>('ledgers');
  const [ledgers, setLedgers] = useState<AccountLedger[]>(DEFAULT_LEDGERS);
  const [gstGroups, setGstGroups] = useState<GstTaxGroup[]>(DEFAULT_GST_GROUPS);
  const [autoRules, setAutoRules] = useState<AutoMappingRule[]>(DEFAULT_AUTO_RULES);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Revenue' | 'Expense' | 'Asset' | 'Liability'>('ALL');
  const [presetProfile, setPresetProfile] = useState<'SCHEDULE_III' | 'SERVICE_FIRMS' | 'TRADING_MFG'>('SCHEDULE_III');
  const [showAddLedgerModal, setShowAddLedgerModal] = useState(false);
  const [newLedger, setNewLedger] = useState<Partial<AccountLedger>>({
    code: '',
    name: '',
    category: 'Expense',
    scheduleThreeHead: 'Other Expenses',
    defaultGstRate: 18,
    gstClassification: 'Taxable',
    tallyLedgerName: '',
    tallyGroup: 'Indirect Expenses',
  });
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.ledgers) setLedgers(parsed.ledgers);
        if (parsed.gstGroups) setGstGroups(parsed.gstGroups);
        if (parsed.autoRules) setAutoRules(parsed.autoRules);
        if (parsed.presetProfile) setPresetProfile(parsed.presetProfile);
      }
    } catch (e) {
      console.warn('Failed to load chart of accounts config from localStorage', e);
    }
  }, []);

  const handleSaveAll = () => {
    try {
      const dataToSave = {
        ledgers,
        gstGroups,
        autoRules,
        presetProfile,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      const msg = 'Chart of Accounts & GST Ledger mappings saved successfully!';
      setStatusNotice(msg);
      if (onSavedNotification) {
        onSavedNotification(msg);
      }
      setTimeout(() => setStatusNotice(null), 3500);
    } catch (e) {
      console.error(e);
      alert('Failed to save configuration');
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all Chart of Accounts mappings back to ICAI Schedule III default standards?')) {
      setLedgers(DEFAULT_LEDGERS);
      setGstGroups(DEFAULT_GST_GROUPS);
      setAutoRules(DEFAULT_AUTO_RULES);
      setPresetProfile('SCHEDULE_III');
      localStorage.removeItem(STORAGE_KEY);
      setStatusNotice('Reset to default Schedule III Chart of Accounts');
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  const handleAddLedger = () => {
    if (!newLedger.name || !newLedger.code) {
      alert('Please provide a ledger code and name.');
      return;
    }

    const created: AccountLedger = {
      id: `usr_${Date.now()}`,
      code: newLedger.code.toUpperCase().trim(),
      name: newLedger.name.trim(),
      category: (newLedger.category as any) || 'Expense',
      scheduleThreeHead: newLedger.scheduleThreeHead || 'Other Expenses',
      defaultGstRate: Number(newLedger.defaultGstRate ?? 18),
      gstClassification: (newLedger.gstClassification as any) || 'Taxable',
      tallyLedgerName: newLedger.tallyLedgerName || newLedger.name,
      tallyGroup: newLedger.tallyGroup || 'Indirect Expenses',
      isSystemDefault: false,
    };

    setLedgers(prev => [created, ...prev]);
    setShowAddLedgerModal(false);
    setNewLedger({
      code: '',
      name: '',
      category: 'Expense',
      scheduleThreeHead: 'Other Expenses',
      defaultGstRate: 18,
      gstClassification: 'Taxable',
      tallyLedgerName: '',
      tallyGroup: 'Indirect Expenses',
    });
    setStatusNotice(`Added ledger "${created.name}"`);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handleDeleteLedger = (id: string) => {
    setLedgers(prev => prev.filter(l => l.id !== id));
  };

  const handleExportTallyXml = () => {
    const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
${ledgers
  .map(
    l => `        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="${l.tallyLedgerName}" ACTION="Create">
            <NAME>${l.tallyLedgerName}</NAME>
            <PARENT>${l.tallyGroup}</PARENT>
            <ISBILLWISEON>Yes</ISBILLWISEON>
            <AFFECTSSTOCK>No</AFFECTSSTOCK>
            <GSTDETAILS.LIST>
              <APPLICABLEFROM>20260401</APPLICABLEFROM>
              <GSTCALCULATIONTYPE>On Value</GSTCALCULATIONTYPE>
              <GSTRATE>${l.defaultGstRate}</GSTRATE>
            </GSTDETAILS.LIST>
          </LEDGER>
        </TALLYMESSAGE>`
  )
  .join('\n')}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QuinceCA_Tally_ChartOfAccounts_${presetProfile}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusNotice('Exported Tally Prime Chart of Accounts XML');
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const filteredLedgers = useMemo(() => {
    return ledgers.filter(l => {
      const matchCat = categoryFilter === 'ALL' || l.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        l.scheduleThreeHead.toLowerCase().includes(q) ||
        l.tallyLedgerName.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [ledgers, categoryFilter, searchQuery]);

  return (
    <div className={`space-y-4 ${isDialogMode ? 'p-1' : 'p-6 max-w-6xl mx-auto'}`}>
      {/* Top Banner / Preset Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Chart of Accounts & GST Ledger Mapping Engine
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Schedule III Indian Accounting Standards compliant classification with automated GST tax group resolution, Tally XML syncing, and AI bank narration rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">Preset Profile:</span>
            <select
              value={presetProfile}
              onChange={e => setPresetProfile(e.target.value as any)}
              className="bg-transparent text-emerald-400 font-bold outline-none cursor-pointer text-xs"
            >
              <option value="SCHEDULE_III" className="bg-slate-900 text-white">Schedule III (Companies Act)</option>
              <option value="SERVICE_FIRMS" className="bg-slate-900 text-white">Services & IT/Consulting</option>
              <option value="TRADING_MFG" className="bg-slate-900 text-white">Trading & Manufacturing</option>
            </select>
          </div>

          <button
            onClick={handleExportTallyXml}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Download XML file to import into Tally Prime / ERP 9"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Tally XML</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {statusNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusNotice}</span>
          </div>
          <span className="text-[10px] text-emerald-600">Active</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'ledgers', label: 'Schedule III Ledgers', icon: BookOpen, count: ledgers.length },
            { id: 'gst_tax', label: 'GST Tax Groups & RCM', icon: Percent, count: gstGroups.length },
            { id: 'tally_mapping', label: 'Tally / ERP Sync Schema', icon: Database },
            { id: 'ai_rules', label: 'AI Narration & HSN Rules', icon: Sparkles, count: autoRules.length },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleResetDefaults}
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset to ICAI Standards</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SCHEDULE III LEDGERS */}
      {/* ========================================================================= */}
      {activeTab === 'ledgers' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search ledger by name, code, or Schedule III head..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value as any)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="Revenue">Revenue (Income)</option>
                <option value="Expense">Expense</option>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddLedgerModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Ledger</span>
            </button>
          </div>

          {/* Ledgers Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">Code</th>
                    <th className="px-4 py-2.5">Ledger Name</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Schedule III Head</th>
                    <th className="px-4 py-2.5">GST Rate</th>
                    <th className="px-4 py-2.5">Tally Master & Group</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLedgers.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-800 text-[11px]">
                        {l.code}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">
                        {l.name}
                        {l.isSystemDefault && (
                          <span className="ml-2 text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-normal">
                            ICAI Default
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            l.category === 'Revenue'
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.category === 'Expense'
                              ? 'bg-rose-100 text-rose-800'
                              : l.category === 'Asset'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {l.category}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 text-[11px]">
                        {l.scheduleThreeHead}
                      </td>
                      <td className="px-4 py-2.5 font-semibold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${l.defaultGstRate > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600'}`}>
                          {l.defaultGstRate > 0 ? `${l.defaultGstRate}% (${l.gstClassification})` : l.gstClassification}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[11px]">
                        <div className="font-semibold text-slate-800">{l.tallyLedgerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">&rarr; {l.tallyGroup}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {!l.isSystemDefault ? (
                          <button
                            onClick={() => handleDeleteLedger(l.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Delete custom ledger"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">Locked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredLedgers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                        No accounting ledgers match your search or filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GST TAX GROUPS & RCM */}
      {/* ========================================================================= */}
      {activeTab === 'gst_tax' && (
        <div className="space-y-4">
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
            <Percent className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Statutory GST Split Rules: </span>
              Invoices extracted from vendors and clients automatically split tax liabilities and Input Tax Credit (ITC) into the following CGST, SGST, IGST, and RCM ledgers based on place of supply (POS).
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gstGroups.map(group => (
              <div key={group.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs text-slate-900">{group.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${group.isItcEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {group.isItcEligible ? 'Eligible ITC' : 'Blocked Sec 17(5)'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">CGST Ledger</span>
                    <span className="font-bold text-slate-800 mt-0.5 block truncate">{group.cgstLedger}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">SGST Ledger</span>
                    <span className="font-bold text-slate-800 mt-0.5 block truncate">{group.sgstLedger}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">IGST Ledger</span>
                    <span className="font-bold text-slate-800 mt-0.5 block truncate">{group.igstLedger}</span>
                  </div>
                </div>

                {group.rcmLedger && (
                  <div className="text-[10px] text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-200 flex items-center justify-between">
                    <span>Reverse Charge Output Ledger:</span>
                    <span className="font-bold font-mono">{group.rcmLedger}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TALLY / ERP SYNC SCHEMA */}
      {/* ========================================================================= */}
      {activeTab === 'tally_mapping' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Tally Prime / ERP 9 XML Integration Specs</span>
            </h4>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              When pushing Day Book vouchers, purchase bills, and sales invoices to Tally via the ODBC / XML Server, QuinceCA uses these mapped parent groups. If a ledger is absent in Tally, it is auto-created with the specified statutory group.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Default Cash Ledger</span>
              <input
                type="text"
                defaultValue="Cash A/c"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
              />
              <span className="text-[10px] text-slate-400">Tally Group: Cash-in-hand</span>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Default Bank Account</span>
              <input
                type="text"
                defaultValue="Bank Accounts"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
              />
              <span className="text-[10px] text-slate-400">Tally Group: Bank Accounts</span>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Round-off Ledger</span>
              <input
                type="text"
                defaultValue="Rounding Off (+/-)"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
              />
              <span className="text-[10px] text-slate-400">Tally Group: Indirect Expenses</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono space-y-2 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[10px] pb-1 border-b border-slate-800">
              <span>Sample Generated Tally XML Voucher Header</span>
              <span className="text-emerald-400">Live Engine Ready</span>
            </div>
            <pre className="text-[11px] text-emerald-400 overflow-x-auto">
{`<VOUCHER VCHTYPE="Purchase" ACTION="Create">
  <DATE>20260824</DATE>
  <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
  <PARTYLEDGERNAME>Apex Innovations Pvt Ltd</PARTYLEDGERNAME>
  <ALLLEDGERENTRIES.LIST>
    <LEDGERNAME>Purchase Account 18%</LEDGERNAME>
    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
    <AMOUNT>-50000.00</AMOUNT>
  </ALLLEDGERENTRIES.LIST>
</VOUCHER>`}
            </pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AI AUTO-CATEGORIZATION RULES */}
      {/* ========================================================================= */}
      {activeTab === 'ai_rules' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Autonomous Document Intelligence Matcher: </span>
              Extracted vendor bills and bank statement lines automatically map to these ledgers by matching HSN/SAC codes or narration keywords.
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Rule Match Type</th>
                  <th className="px-4 py-2.5">Pattern / Matcher</th>
                  <th className="px-4 py-2.5">Target Schedule III Ledger</th>
                  <th className="px-4 py-2.5">Priority</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {autoRules.map(rule => (
                  <tr key={rule.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rule.ruleType === 'hsn' ? 'bg-indigo-100 text-indigo-800' : 'bg-cyan-100 text-cyan-800'}`}>
                        {rule.ruleType === 'hsn' ? 'HSN / SAC Code' : 'Bank Narration'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                      {rule.matcher}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">
                      {rule.targetLedgerName}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                      #{rule.priority}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Custom Ledger Modal */}
      {showAddLedgerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Add Custom Schedule III Ledger</span>
              </h3>
              <button
                onClick={() => setShowAddLedgerModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Ledger Code</label>
                  <input
                    type="text"
                    value={newLedger.code}
                    onChange={e => setNewLedger(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="e.g. EXP-SUB"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg uppercase font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Category</label>
                  <select
                    value={newLedger.category}
                    onChange={e => setNewLedger(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Expense">Expense</option>
                    <option value="Revenue">Revenue (Income)</option>
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Ledger Display Name</label>
                <input
                  type="text"
                  value={newLedger.name}
                  onChange={e => setNewLedger(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Annual Audit & Assurance Fees"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Schedule III Head</label>
                  <input
                    type="text"
                    value={newLedger.scheduleThreeHead}
                    onChange={e => setNewLedger(prev => ({ ...prev, scheduleThreeHead: e.target.value }))}
                    placeholder="e.g. Other Expenses"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Default GST Rate</label>
                  <select
                    value={newLedger.defaultGstRate}
                    onChange={e => setNewLedger(prev => ({ ...prev, defaultGstRate: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value={18}>18% Standard</option>
                    <option value={12}>12%</option>
                    <option value={5}>5%</option>
                    <option value={28}>28%</option>
                    <option value={0}>0% (Exempt / Nil)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tally Ledger Name</label>
                  <input
                    type="text"
                    value={newLedger.tallyLedgerName}
                    onChange={e => setNewLedger(prev => ({ ...prev, tallyLedgerName: e.target.value }))}
                    placeholder="e.g. Audit Fees A/c"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tally Group</label>
                  <input
                    type="text"
                    value={newLedger.tallyGroup}
                    onChange={e => setNewLedger(prev => ({ ...prev, tallyGroup: e.target.value }))}
                    placeholder="e.g. Indirect Expenses"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddLedgerModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg border border-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLedger}
                className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shadow-xs"
              >
                Save Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
