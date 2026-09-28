// src/components/SetupGuideView.tsx
import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  Server,
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Layers,
  Code2,
} from 'lucide-react';

export const SetupGuideView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'architecture' | 'costs' | 'samples' | 'n8n' | 'ocr'>('architecture');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sampleFiles = [
    {
      name: 'Sample_Sales_Invoice_Mahindra.txt',
      type: 'Sales Invoice',
      desc: 'Synthetic sales tax invoice from client to buyer with 18% GST and HSN 8483.',
      path: '/synthetic_samples/Sample_Sales_Invoice_Mahindra.txt',
    },
    {
      name: 'Sample_Purchase_Invoice_Reliance.txt',
      type: 'Purchase Invoice',
      desc: 'Interstate purchase bill with IGST 18% from Gujarat vendor.',
      path: '/synthetic_samples/Sample_Purchase_Invoice_Reliance.txt',
    },
    {
      name: 'Sample_Bank_Statement_HDFC.csv',
      type: 'Bank Statement CSV',
      desc: 'HDFC current account statement with withdrawals, deposits, and opening/closing balances.',
      path: '/synthetic_samples/Sample_Bank_Statement_HDFC.csv',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <h2 className="text-xl font-bold">Architecture, Paid vs Free Costs & Setup Manual</h2>
        <p className="text-xs text-slate-300 mt-1">
          Beginner-friendly deployment guide for Chartered Accountants, IT administrators, and staff.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSection('architecture')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSection === 'architecture' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          System Architecture
        </button>
        <button
          onClick={() => setActiveSection('costs')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSection === 'costs' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Free vs. Paid Costs
        </button>
        <button
          onClick={() => setActiveSection('samples')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSection === 'samples' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Synthetic Test Documents
        </button>
        <button
          onClick={() => setActiveSection('n8n')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSection === 'n8n' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          n8n Workflow JSON
        </button>
        <button
          onClick={() => setActiveSection('ocr')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSection === 'ocr' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Local PaddleOCR & Python
        </button>
      </div>

      {/* SECTION 1: ARCHITECTURE */}
      {activeSection === 'architecture' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Database as Single Source of Truth</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            In accordance with statutory CA auditing standards, the primary PostgreSQL database remains the immutable single source of truth. Excel workbooks are generated outputs compiled from validated database snapshots, never the primary storage.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-xs text-blue-700 flex items-center space-x-1.5">
                <Server className="w-4 h-4" />
                <span>1. PostgreSQL Database</span>
              </div>
              <p className="text-[11px] text-slate-500">
                10 relational tables managed via Drizzle ORM. Stores clients, monthly requests, SHA-256 hashes, extracted invoice headers, line items, bank transactions, and audit records.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-xs text-emerald-700 flex items-center space-x-1.5">
                <Layers className="w-4 h-4" />
                <span>2. Local File & OCR Storage</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Stores original unchanged documents under <code>/local_storage/uploads</code>. Local PaddleOCR runs on-premise without cloud API dependencies or per-page costs.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-xs text-purple-700 flex items-center space-x-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                <span>3. 10-Sheet Excel Working Papers</span>
              </div>
              <p className="text-[11px] text-slate-500">
                ExcelJS compiles versioned workbooks (v1, v2) with formula injection protection (escaped =, +, -, @), frozen headers, and explicit exception trackers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: COSTS */}
      {activeSection === 'costs' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Cost Transparency & Paid vs. Free Breakdown</h3>
          <p className="text-xs text-slate-600">
            Professional Samadhan was architected specifically to eliminate mandatory monthly SaaS subscription fees.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Component</th>
                  <th className="p-3">Pricing Tier</th>
                  <th className="p-3">Operational Cost</th>
                  <th className="p-3">Activation Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-semibold">Web Application & API</td>
                  <td className="p-3 text-emerald-700 font-bold">100% Free / Open Source</td>
                  <td className="p-3">₹0 / month</td>
                  <td className="p-3">Active by default</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">PaddleOCR & Native PDF</td>
                  <td className="p-3 text-emerald-700 font-bold">100% Free (Apache 2.0)</td>
                  <td className="p-3">₹0 per page</td>
                  <td className="p-3">Runs locally on CPU/GPU</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">WhatsApp Mode A (Manual)</td>
                  <td className="p-3 text-emerald-700 font-bold">100% Free</td>
                  <td className="p-3">₹0 (Uses staff WhatsApp Web)</td>
                  <td className="p-3">Active by default</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">n8n Orchestration</td>
                  <td className="p-3 text-emerald-700 font-bold">Free Community Edition</td>
                  <td className="p-3">₹0 (Self-hosted)</td>
                  <td className="p-3">Permitted deployment</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">WhatsApp Mode B (Meta Cloud API)</td>
                  <td className="p-3 text-amber-700 font-bold">Optional Paid (Meta)</td>
                  <td className="p-3">~₹0.35 per utility message</td>
                  <td className="p-3 text-slate-500">Disabled until API keys provided</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Cloud AI OCR (e.g. Google Vision / GPT)</td>
                  <td className="p-3 text-rose-700 font-bold">Optional Paid</td>
                  <td className="p-3">~₹0.15 - ₹1.50 per image</td>
                  <td className="p-3 text-slate-500">Disabled by default (Zero cloud lock-in)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: SAMPLES */}
      {activeSection === 'samples' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Synthetic Test Documents</h3>
          <p className="text-xs text-slate-600">
            Download these synthetic test files to test multi-page invoice intake, bank statement CSV reconciliation, and duplicate detection:
          </p>

          <div className="space-y-3">
            {sampleFiles.map((file, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900">{file.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                      {file.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{file.desc}</p>
                </div>
                <a
                  href={file.path}
                  download
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center space-x-1.5 self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: N8N WORKFLOW */}
      {activeSection === 'n8n' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Self-Hosted n8n Community Edition Workflow</h3>
            <a
              href="/n8n/gst_orchestration_workflow.json"
              download
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Workflow</span>
            </a>
          </div>
          <p className="text-xs text-slate-600">
            Import this workflow into your self-hosted n8n Community Edition instance. It configures the 1st of month 9:00 AM IST cron job, daily reminder checks, and Meta webhook attachment forwarding.
          </p>

          <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto space-y-2">
            <div className="text-slate-400 text-[11px]">// n8n Workflow File Location:</div>
            <div className="text-blue-400">./n8n/gst_orchestration_workflow.json</div>
            <div className="text-slate-400 text-[11px] mt-2">// Steps to import:</div>
            <div className="text-slate-300">1. Open self-hosted n8n dashboard (e.g. http://localhost:5678)</div>
            <div className="text-slate-300">2. Click &quot;Workflows&quot; &gt; &quot;Import from file&quot; &gt; select gst_orchestration_workflow.json</div>
            <div className="text-slate-300">3. Activate workflow. Nodes will trigger /api/scheduler/run-monthly every 1st of month at 9:00 AM IST.</div>
          </div>
        </div>
      )}

      {/* SECTION 5: LOCAL PADDLEOCR */}
      {activeSection === 'ocr' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Local PaddleOCR & Python Extraction Engine</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The Python document extractor located at <code>scripts/extract_documents.py</code> processes scanned PDFs, receipts, and images on your local machine using PaddleOCR. No document data leaves your server.
          </p>

          <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span>Terminal Setup Commands</span>
              <button
                onClick={() => handleCopy('pip install paddlepaddle paddleocr pypdf openpyxl\npython3 scripts/extract_documents.py --file synthetic_samples/Sample_Sales_Invoice_Mahindra.txt --client-gstin 27AAACA1234A1Z5', 'ocr_cmd')}
                className="text-blue-400 hover:text-blue-300 text-[11px] flex items-center space-x-1"
              >
                {copiedCode === 'ocr_cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode === 'ocr_cmd' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="text-emerald-400 overflow-x-auto text-[11px]">
{`# 1. Install local OCR packages (One-time setup)
pip install paddlepaddle paddleocr pypdf openpyxl

# 2. Test extraction against sample document
python3 scripts/extract_documents.py \\
  --file synthetic_samples/Sample_Sales_Invoice_Mahindra.txt \\
  --client-gstin 27AAACA1234A1Z5`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
