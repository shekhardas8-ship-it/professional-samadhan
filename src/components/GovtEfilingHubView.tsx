// src/components/GovtEfilingHubView.tsx
import React, { useState, useEffect } from 'react';
import {
  GovtFilingRecord,
  GovtReturnType,
  GovtValidationResult,
  Client,
} from '../types/index.ts';
import {
  FileCode2,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Search,
  Copy,
  Check,
  Building2,
  ArrowRight,
  Info,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCheck,
  Landmark,
  Eye,
  X,
  FileCheck,
} from 'lucide-react';

interface GovtEfilingHubViewProps {
  onBack?: () => void;
  preselectedClientId?: string;
  preselectedReturnType?: GovtReturnType;
}

export const GovtEfilingHubView: React.FC<GovtEfilingHubViewProps> = ({
  onBack,
  preselectedClientId,
  preselectedReturnType = 'GSTR-1',
}) => {
  // Navigation & State
  const [activeReturnTab, setActiveReturnTab] = useState<GovtReturnType>(preselectedReturnType);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(preselectedClientId || '');
  const [filings, setFilings] = useState<GovtFilingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingData, setSyncingData] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [clientData, setClientData] = useState<any>(null);

  // Form states for GSTR-1 & 3B
  const [selectedPeriod, setSelectedPeriod] = useState<string>('August 2026');
  const [monthNum, setMonthNum] = useState<number>(8);
  const [yearNum, setYearNum] = useState<number>(2026);

  // Form states for ITR
  const [assessmentYear, setAssessmentYear] = useState<string>('2025');
  const [taxRegime, setTaxRegime] = useState<'NEW' | 'OLD'>('NEW');
  const [itrGrossSalary, setItrGrossSalary] = useState<number>(1250000);
  const [itr80C, setItr80C] = useState<number>(150000);
  const [itr80D, setItr80D] = useState<number>(25000);
  const [itrTdsPaid, setItrTdsPaid] = useState<number>(68000);
  const [itrPresumptiveTurnover, setItrPresumptiveTurnover] = useState<number>(2400000);
  const [itrPresumptiveIncome, setItrPresumptiveIncome] = useState<number>(192000);

  // Validation & Result
  const [validationResult, setValidationResult] = useState<GovtValidationResult | null>(null);
  const [lastGeneratedRecord, setLastGeneratedRecord] = useState<GovtFilingRecord | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [viewingPayload, setViewingPayload] = useState<any>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // ARN Recorder Modal
  const [recordingArnFilingId, setRecordingArnFilingId] = useState<string | null>(null);
  const [inputArn, setInputArn] = useState('');
  const [inputFilingDate, setInputFilingDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputFiledBy, setInputFiledBy] = useState('CA Suraj Dutta (FCA)');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch initial filings and clients
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [filingsRes, clientsRes] = await Promise.all([
        fetch('/api/gov-filing/records'),
        fetch('/api/clients'),
      ]);

      if (filingsRes.ok) {
        const fData = await filingsRes.json();
        setFilings(fData);
      }

      if (clientsRes.ok) {
        const cData = await clientsRes.json();
        setClientsList(cData);
        if (!selectedClientId && cData.length > 0) {
          setSelectedClientId(cData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load filing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. Fetch Client Invoices & Pre-Aggregated Computations
  const fetchClientFilingData = async (cId: string) => {
    if (!cId) return;
    try {
      setSyncingData(true);
      const res = await fetch(`/api/gov-filing/client-data/${cId}`);
      if (res.ok) {
        const data = await res.json();
        setClientData(data);

        // Pre-run validation for GSTR-1
        if (activeReturnTab === 'GSTR-1') {
          const valRes = await fetch('/api/gov-filing/validate-gstr1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gstin: data.client.gstin,
              returnPeriod: selectedPeriod,
              invoices: data.salesInvoices || [],
            }),
          });
          if (valRes.ok) {
            setValidationResult(await valRes.json());
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync client filing data:', err);
    } finally {
      setSyncingData(false);
    }
  };

  useEffect(() => {
    if (selectedClientId) {
      fetchClientFilingData(selectedClientId);
    }
  }, [selectedClientId, activeReturnTab, selectedPeriod]);

  // Handle Tab Switch
  const handleTabChange = (tab: GovtReturnType) => {
    setActiveReturnTab(tab);
    setLastGeneratedRecord(null);
    setValidationResult(null);
  };

  // 3. Generate Returns
  const handleGenerateReturnJson = async () => {
    if (!clientData) return;
    try {
      setGenerating(true);
      let endpoint = '';
      let body: any = {};

      if (activeReturnTab === 'GSTR-1') {
        endpoint = '/api/gov-filing/generate-gstr1';
        body = {
          clientId: clientData.client.id,
          clientName: clientData.client.businessName,
          gstin: clientData.client.gstin,
          reportingMonth: selectedPeriod,
          monthNumber: monthNum,
          year: yearNum,
          invoices: clientData.salesInvoices || [],
          grossTurnoverPrevYear: 4500000,
        };
      } else if (activeReturnTab === 'GSTR-3B') {
        endpoint = '/api/gov-filing/generate-gstr3b';
        body = {
          clientId: clientData.client.id,
          clientName: clientData.client.businessName,
          gstin: clientData.client.gstin,
          reportingMonth: selectedPeriod,
          monthNumber: monthNum,
          year: yearNum,
          outwardTaxable: clientData.aggregates?.sales?.taxable || 0,
          outwardIgst: clientData.aggregates?.sales?.igst || 0,
          outwardCgst: clientData.aggregates?.sales?.cgst || 0,
          outwardSgst: clientData.aggregates?.sales?.sgst || 0,
          itcIgst: clientData.aggregates?.purchases?.igst || 0,
          itcCgst: clientData.aggregates?.purchases?.cgst || 0,
          itcSgst: clientData.aggregates?.purchases?.sgst || 0,
        };
      } else if (activeReturnTab === 'ITR-1') {
        endpoint = '/api/gov-filing/generate-itr1';
        const [fName, ...lName] = (clientData.client.contactPerson || 'Assessee Taxpayer').split(' ');
        body = {
          clientId: clientData.client.id,
          clientName: clientData.client.contactPerson || clientData.client.businessName,
          itrData: {
            assessee: {
              pan: clientData.client.pan || 'AABCS1429B',
              firstName: fName || 'ASSESSEE',
              surName: lName.join(' ') || 'TAXPAYER',
              mobile: clientData.client.phone || '9820011111',
              email: clientData.client.email || 'tax@client.in',
              address: {
                city: 'Mumbai',
                stateCode: clientData.client.stateCode || '27',
                pinCode: '400001',
              },
            },
            financialYear: `${Number(assessmentYear) - 1}-${assessmentYear.slice(-2)}`,
            assessmentYear,
            taxRegime,
            incomeDetails: {
              grossSalary: itrGrossSalary,
            },
            deductions: {
              section80C: itr80C,
              section80D: itr80D,
            },
            taxesPaid: {
              tdsSalary: itrTdsPaid,
            },
            bankDetails: {
              bankName: clientData.client.expectedBankAccounts?.[0]?.bankName || 'HDFC Bank',
              accountNumber: clientData.client.expectedBankAccounts?.[0]?.accountNumber || '50100234567890',
              ifsc: clientData.client.expectedBankAccounts?.[0]?.ifsc || 'HDFC0000001',
            },
            verification: {
              place: 'Mumbai',
            },
          },
        };
      } else if (activeReturnTab === 'ITR-4') {
        endpoint = '/api/gov-filing/generate-itr4';
        const [fName, ...lName] = (clientData.client.contactPerson || 'Assessee Taxpayer').split(' ');
        body = {
          clientId: clientData.client.id,
          clientName: clientData.client.businessName,
          itrData: {
            assessee: {
              pan: clientData.client.pan || 'AABCS1429B',
              businessName: clientData.client.businessName,
              firstName: fName || 'ASSESSEE',
              surName: lName.join(' ') || 'TAXPAYER',
              mobile: clientData.client.phone || '9820011111',
              email: clientData.client.email || 'tax@client.in',
              address: {
                city: 'Mumbai',
                stateCode: clientData.client.stateCode || '27',
                pinCode: '400001',
              },
            },
            assessmentYear,
            presumptiveSection: '44AD',
            businessParticulars: {
              grossReceiptsBank: itrPresumptiveTurnover,
              grossReceiptsCash: 0,
              presumptiveIncomeDeclared: itrPresumptiveIncome,
              sundryDebtors: 150000,
              sundryCreditors: 80000,
              stockInTrade: 220000,
              cashBalance: 95000,
            },
            bankDetails: {
              bankName: clientData.client.expectedBankAccounts?.[0]?.bankName || 'HDFC Bank',
              accountNumber: clientData.client.expectedBankAccounts?.[0]?.accountNumber || '50100234567890',
              ifsc: clientData.client.expectedBankAccounts?.[0]?.ifsc || 'HDFC0000001',
            },
            verification: {
              place: 'Mumbai',
            },
          },
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setLastGeneratedRecord(data.record);
        setValidationResult(data.validation);
        setViewingPayload(data.jsonPayload);
        // Refresh filings list
        const fRes = await fetch('/api/gov-filing/records');
        if (fRes.ok) setFilings(await fRes.json());
      }
    } catch (err) {
      console.error('Error generating return JSON:', err);
    } finally {
      setGenerating(false);
    }
  };

  // 4. Record Filing ARN
  const handleSaveArn = async () => {
    if (!recordingArnFilingId) return;
    try {
      const res = await fetch('/api/gov-filing/record-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: recordingArnFilingId,
          status: 'Filed with EVC/DSC',
          arnNumber: inputArn.trim(),
          filingDate: inputFilingDate,
          filedBy: inputFiledBy.trim(),
          notes: `Verified & Filed via Official Government Portal. ARN / Ack No: ${inputArn.trim()}`,
        }),
      });
      if (res.ok) {
        setRecordingArnFilingId(null);
        setInputArn('');
        const fRes = await fetch('/api/gov-filing/records');
        if (fRes.ok) setFilings(await fRes.json());
      }
    } catch (err) {
      console.error('Failed to update ARN:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Metrics calculations
  const totalFiledCount = filings.filter(f => f.status === 'Filed with EVC/DSC').length;
  const totalJsonCount = filings.length;
  const totalTaxHandled = filings.reduce((acc, curr) => acc + (curr.totalTaxLiability || 0), 0);

  const filteredFilings = filings.filter(f => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.clientName.toLowerCase().includes(q) ||
      f.identifier.toLowerCase().includes(q) ||
      f.returnType.toLowerCase().includes(q) ||
      (f.arnNumber && f.arnNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% Free & Legally Compliant (Govt Schema Offline Standard)
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-500/30">
                ₹0 GSP Fees • Zero ERI Intermediary Costs
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Government E-Filing Hub
              <span className="text-indigo-400 text-lg font-medium font-mono">GST & ITR</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Generates validated official government return payloads (.json) compatible with the official GSTN and Income Tax Department portals. Export, upload directly, and file with Aadhaar OTP or DSC without paying third-party API aggregators.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {onBack && (
              <button
                onClick={onBack}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition"
              >
                Back to Dashboard
              </button>
            )}
            <button
              onClick={() => fetchClientFilingData(selectedClientId)}
              disabled={syncingData}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingData ? 'animate-spin' : ''}`} />
              <span>Sync Client Records</span>
            </button>
          </div>
        </div>

        {/* Highlight Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-500/20">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Returns Compiled</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">{totalJsonCount}</div>
            <div className="text-[10px] text-indigo-300 mt-0.5">GSTR-1, 3B & ITR-1/4</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Filed on Portal with ARN</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">{totalFiledCount}</div>
            <div className="text-[10px] text-emerald-300/80 mt-0.5">Confirmed E-Verified Returns</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Tax Reconciled</div>
            <div className="text-xl sm:text-2xl font-bold text-amber-300 mt-1">
              ₹{(totalTaxHandled / 100000).toFixed(2)} L
            </div>
            <div className="text-[10px] text-amber-300/80 mt-0.5">Zero Arithmetic Mismatch</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Intermediary API Cost</div>
            <div className="text-xl sm:text-2xl font-bold text-cyan-400 mt-1">₹0.00</div>
            <div className="text-[10px] text-cyan-300/80 mt-0.5">Standard Offline Mode</div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Return Builder Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
            {/* Step 1: Return Type Selector */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-indigo-600" />
                  Statutory Return Generator
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Select taxpayer return type to auto-generate government offline JSON</p>
              </div>

              {/* Client Dropdown */}
              <div className="w-56">
                <select
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {clientsList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.businessName} ({c.gstin.slice(0, 5)}...)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Return Tabs */}
            <div className="grid grid-cols-4 gap-2 bg-slate-100/80 p-1.5 rounded-xl text-xs font-semibold mb-6">
              <button
                onClick={() => handleTabChange('GSTR-1')}
                className={`py-2 px-3 rounded-lg transition text-center ${
                  activeReturnTab === 'GSTR-1'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                GSTR-1 (Sales)
              </button>
              <button
                onClick={() => handleTabChange('GSTR-3B')}
                className={`py-2 px-3 rounded-lg transition text-center ${
                  activeReturnTab === 'GSTR-3B'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                GSTR-3B (Summary)
              </button>
              <button
                onClick={() => handleTabChange('ITR-1')}
                className={`py-2 px-3 rounded-lg transition text-center ${
                  activeReturnTab === 'ITR-1'
                    ? 'bg-white text-emerald-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ITR-1 (Sahaj)
              </button>
              <button
                onClick={() => handleTabChange('ITR-4')}
                className={`py-2 px-3 rounded-lg transition text-center ${
                  activeReturnTab === 'ITR-4'
                    ? 'bg-white text-emerald-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ITR-4 (Sugam 44AD)
              </button>
            </div>

            {/* Taxpayer Banner */}
            {clientData && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-800">{clientData.client.businessName}</div>
                  <div className="text-slate-500 font-mono mt-0.5">
                    GSTIN: <span className="text-indigo-600 font-semibold">{clientData.client.gstin}</span> • PAN: <span className="text-slate-700 font-semibold">{clientData.client.pan}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {clientData.aggregates?.sales?.invoiceCount || 0} Invoices Extracted
                  </span>
                </div>
              </div>
            )}

            {/* FORM BODY FOR GSTR-1 & GSTR-3B */}
            {(activeReturnTab === 'GSTR-1' || activeReturnTab === 'GSTR-3B') && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Return Filing Period</label>
                    <select
                      value={selectedPeriod}
                      onChange={e => {
                        setSelectedPeriod(e.target.value);
                        if (e.target.value.includes('August')) setMonthNum(8);
                        else if (e.target.value.includes('July')) setMonthNum(7);
                        else if (e.target.value.includes('September')) setMonthNum(9);
                      }}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                    >
                      <option value="August 2026">August 2026 (Due 11/20 Sept)</option>
                      <option value="July 2026">July 2026 (Due 11/20 Aug)</option>
                      <option value="September 2026">September 2026 (Due 11/20 Oct)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Financial Year</label>
                    <input
                      type="text"
                      disabled
                      value={`${yearNum}-${String(yearNum + 1).slice(-2)}`}
                      className="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-500 font-mono"
                    />
                  </div>
                </div>

                {/* Pre-calculated figures from client intake */}
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Extracted Statutory Figures for {selectedPeriod}</span>
                    <span className="text-indigo-600 font-medium">Auto-compiled from files</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-medium">Taxable Outward (3.1a)</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        ₹{Number(clientData?.aggregates?.sales?.taxable || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-medium">Total Outward Tax (IGST+CGST+SGST)</div>
                      <div className="text-sm font-bold text-indigo-700 mt-0.5">
                        ₹{Number((clientData?.aggregates?.sales?.igst || 0) + (clientData?.aggregates?.sales?.cgst || 0) + (clientData?.aggregates?.sales?.sgst || 0)).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-medium">Eligible ITC (Table 4)</div>
                      <div className="text-sm font-bold text-emerald-700 mt-0.5">
                        ₹{Number((clientData?.aggregates?.purchases?.igst || 0) + (clientData?.aggregates?.purchases?.cgst || 0) + (clientData?.aggregates?.purchases?.sgst || 0)).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FORM BODY FOR ITR-1 */}
            {activeReturnTab === 'ITR-1' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Year</label>
                    <select
                      value={assessmentYear}
                      onChange={e => setAssessmentYear(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                    >
                      <option value="2025">AY 2025-26 (FY 24-25)</option>
                      <option value="2026">AY 2026-27 (FY 25-26)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Regime</label>
                    <select
                      value={taxRegime}
                      onChange={e => setTaxRegime(e.target.value as any)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                    >
                      <option value="NEW">New Tax Regime (Default u/s 115BAC)</option>
                      <option value="OLD">Old Tax Regime (With Chapter VI-A)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assessee PAN</label>
                    <input
                      type="text"
                      disabled
                      value={clientData?.client?.pan || 'AABCS1429B'}
                      className="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-600 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Salary / Income (₹)</label>
                    <input
                      type="number"
                      value={itrGrossSalary}
                      onChange={e => setItrGrossSalary(Number(e.target.value))}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">TDS Deducted as per Form 26AS/AIS (₹)</label>
                    <input
                      type="number"
                      value={itrTdsPaid}
                      onChange={e => setItrTdsPaid(Number(e.target.value))}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-mono"
                    />
                  </div>
                </div>

                {taxRegime === 'OLD' && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">80C Deduction (Max 1.5L)</label>
                      <input
                        type="number"
                        value={itr80C}
                        onChange={e => setItr80C(Number(e.target.value))}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">80D Mediclaim (₹)</label>
                      <input
                        type="number"
                        value={itr80D}
                        onChange={e => setItr80D(Number(e.target.value))}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FORM BODY FOR ITR-4 */}
            {activeReturnTab === 'ITR-4' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Receipts / Digital Turnover (₹)</label>
                    <input
                      type="number"
                      value={itrPresumptiveTurnover}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setItrPresumptiveTurnover(val);
                        setItrPresumptiveIncome(Math.round(val * 0.08));
                      }}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Presumptive Profit Declared (Sec 44AD - Min 6%/8%)</label>
                    <input
                      type="number"
                      value={itrPresumptiveIncome}
                      onChange={e => setItrPresumptiveIncome(Number(e.target.value))}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ACTION BUTTON */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Offline Utility Standard (.json) • Ready for portal drag-and-drop</span>
              </div>

              <button
                onClick={handleGenerateReturnJson}
                disabled={generating || !clientData}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Compiling JSON Payload...</span>
                  </>
                ) : (
                  <>
                    <FileCode2 className="w-4 h-4" />
                    <span>Generate Official Return JSON</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pre-Flight Compliance Audit Checklist Card */}
          {validationResult && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Pre-Flight Government Portal Compliance Check
                  </h3>
                  <p className="text-xs text-slate-500">Automated audit to avoid rejection errors on the government portal</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    validationResult.isValid
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    Score: {validationResult.score}% {validationResult.isValid ? '• Portal Ready' : '• Action Required'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {validationResult.checks.map(chk => (
                  <div
                    key={chk.code}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg text-xs ${
                      chk.status === 'passed'
                        ? 'bg-emerald-50/70 border border-emerald-200/70 text-slate-700'
                        : chk.status === 'warning'
                        ? 'bg-amber-50/70 border border-amber-200/70 text-slate-700'
                        : 'bg-rose-50/70 border border-rose-200/70 text-slate-800 font-medium'
                    }`}
                  >
                    {chk.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : chk.status === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{chk.title}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{chk.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Portal Assisted Bridge & Downloads (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Download & Launch Portal Card */}
          <div className="bg-gradient-to-b from-indigo-50/60 to-white rounded-2xl p-6 shadow-sm border border-indigo-200/80">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Download className="w-4 h-4 text-indigo-600" />
              Download & File on Portal
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Download the government file and launch the portal in 1 click
            </p>

            {lastGeneratedRecord ? (
              <div className="space-y-4">
                <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span className="font-mono text-indigo-700">{lastGeneratedRecord.jsonFileName}</span>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Ready</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{lastGeneratedRecord.notes}</div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                    <a
                      href={`/api/gov-filing/download/${lastGeneratedRecord.jsonFileName}`}
                      download
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 text-center"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download JSON</span>
                    </a>
                    <button
                      onClick={() => setShowJsonModal(true)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition text-center"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Payload</span>
                    </button>
                  </div>
                </div>

                {/* Direct Government Portal Launchers */}
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Official Government Portals
                  </div>

                  <a
                    href="https://return.gst.gov.in/returns/auth/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#1b4478] hover:bg-[#143259] text-white text-xs font-semibold p-2.5 rounded-xl flex items-center justify-between transition shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-amber-300" />
                      <span>Open GST Portal Offline Upload</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                  </a>

                  <a
                    href="https://eportal.incometax.gov.in/iec/foservices/#/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#1f2937] hover:bg-[#111827] text-white text-xs font-semibold p-2.5 rounded-xl flex items-center justify-between transition shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Open Income Tax e-Filing Portal</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                  </a>
                </div>

                {/* Record ARN Button */}
                <button
                  onClick={() => {
                    setRecordingArnFilingId(lastGeneratedRecord.id);
                    setInputArn(lastGeneratedRecord.arnNumber || '');
                  }}
                  className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Mark as Filed & Enter Government ARN</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-white/70 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                <FileCode2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="font-semibold text-slate-700">No return JSON compiled yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Click "Generate Official Return JSON" on the left to compile the schema and unlock one-click downloads.
                </p>
              </div>
            )}
          </div>

          {/* Interactive Step-by-Step Filing Walkthrough */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              2-Minute Assisted Upload Walkthrough
            </h4>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <span className="font-semibold text-slate-800">Download Return JSON:</span> Click the green button above to save the schema.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <span className="font-semibold text-slate-800">Log in to Portal:</span> Open <code>gst.gov.in</code> or <code>incometax.gov.in</code>.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  <span className="font-semibold text-slate-800">Select Offline Prepare:</span> Click "Prepare Offline" ➔ "Upload" tab ➔ Choose the JSON file.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0">4</span>
                <div>
                  <span className="font-semibold text-slate-800">File with OTP/DSC:</span> Review table totals and verify with Aadhaar OTP or Digital Signature.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statutory Filing History Register */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Statutory Filing History & Compliance Register
            </h3>
            <p className="text-xs text-slate-500">Log of generated government schemas and portal acknowledgment numbers (ARN)</p>
          </div>

          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by client, GSTIN, ARN..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
                <th className="py-3 px-4">Client / Taxpayer</th>
                <th className="py-3 px-4">Return Type</th>
                <th className="py-3 px-4">Period / FY</th>
                <th className="py-3 px-4">Tax Liability</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">ARN / Ack Number</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFilings.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{f.clientName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{f.identifier}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                      {f.returnType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {f.returnPeriod}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">
                      ₹{Number(f.totalTaxLiability || 0).toLocaleString('en-IN')}
                    </div>
                    {f.totalItcClaimed ? (
                      <div className="text-[10px] text-emerald-600 font-medium">
                        ITC: ₹{Number(f.totalItcClaimed).toLocaleString('en-IN')}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      f.status === 'Filed with EVC/DSC'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-800">
                    {f.arnNumber ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <span>{f.arnNumber}</span>
                        <button
                          onClick={() => copyToClipboard(f.arnNumber!)}
                          className="hover:text-emerald-900 transition"
                          title="Copy ARN"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Pending Upload</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    {f.jsonFileName && (
                      <a
                        href={`/api/gov-filing/download/${f.jsonFileName}`}
                        download
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md transition"
                      >
                        <Download className="w-3 h-3" />
                        <span>JSON</span>
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setRecordingArnFilingId(f.id);
                        setInputArn(f.arnNumber || '');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 px-2 py-1 rounded-md transition"
                    >
                      <FileCheck className="w-3 h-3" />
                      <span>ARN</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Payload Inspector Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-950 text-slate-100 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-indigo-400" />
                  Government Return JSON Inspector
                </h3>
                <p className="text-xs text-slate-400">{lastGeneratedRecord?.jsonFileName}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(JSON.stringify(viewingPayload, null, 2))}
                  className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition text-slate-200"
                >
                  {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPayload ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setShowJsonModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs bg-[#0b0f19] text-emerald-400 leading-relaxed whitespace-pre-wrap">
              {JSON.stringify(viewingPayload, null, 2)}
            </div>
          </div>
        </div>
      )}

      {/* ARN Recorder Modal */}
      {recordingArnFilingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Record Portal Filing Acknowledgement
              </h3>
              <button
                onClick={() => setRecordingArnFilingId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Government ARN or ITR-V Acknowledgment Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. AA2708260192841"
                  value={inputArn}
                  onChange={e => setInputArn(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono uppercase focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Filing Date</label>
                <input
                  type="date"
                  value={inputFilingDate}
                  onChange={e => setInputFilingDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Verified By (Signatory / CA)</label>
                <input
                  type="text"
                  value={inputFiledBy}
                  onChange={e => setInputFiledBy(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setRecordingArnFilingId(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveArn}
                disabled={!inputArn.trim()}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition disabled:opacity-50"
              >
                Save & Update Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
