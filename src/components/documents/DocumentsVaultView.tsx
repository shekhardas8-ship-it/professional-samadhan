// src/components/documents/DocumentsVaultView.tsx
import React, { useState } from 'react';
import {
  Folder,
  FileText,
  Search,
  Upload,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Lock,
  Layers,
  HardDrive,
} from 'lucide-react';
import { ATTACHED_DOC_TEMPLATES } from '../../services/frontPageDataService.ts';

export const DocumentsVaultView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample verified vault records
  const sampleVaultDocs = [
    {
      id: 'doc_01',
      client: 'Briopox Pvt Ltd',
      gstin: '07AABCB9123D1ZX',
      category: 'Sales Invoices',
      filename: 'September_Sales_Register_142_Invoices.pdf',
      size: '4.2 MB',
      uploadDate: '2026-10-02',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      aiStatus: 'AI Extracted (98% Confidence)',
      storage: 'Neon DB (Base64) + Google Drive',
    },
    {
      id: 'doc_02',
      client: 'Briopox Pvt Ltd',
      gstin: '07AABCB9123D1ZX',
      category: 'Bank Statements',
      filename: 'HDFC_Current_Account_Sept_2026.pdf',
      size: '1.8 MB',
      uploadDate: '2026-10-03',
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      aiStatus: 'AI Reconciled (100% Matched)',
      storage: 'Neon DB (Base64) + Local Ephemeral',
    },
    {
      id: 'doc_03',
      client: 'Aggarwal & Sons Trading Co.',
      gstin: '07AAACA4491E1ZQ',
      category: 'Purchase Invoices',
      filename: 'Raw_Material_Purchase_Bills_Batch1.pdf',
      size: '8.4 MB',
      uploadDate: '2026-10-04',
      sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      aiStatus: 'AI Extracted (95% Confidence)',
      storage: 'Neon DB (Base64) + Google Drive',
    },
    {
      id: 'doc_04',
      client: 'Apex Healthtech LLP',
      gstin: '07AABFA8941N1Z3',
      category: 'GST Registration',
      filename: 'GST_REG_06_Registration_Certificate.pdf',
      size: '640 KB',
      uploadDate: '2026-09-15',
      sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      aiStatus: 'Statutory Verified',
      storage: 'Neon DB (Base64) + Google Drive',
    },
  ];

  const filteredDocs = sampleVaultDocs.filter(d => {
    const matchesCat = selectedCategory === 'all' || d.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      d.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Enterprise Document Vault & AI Intelligence</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Zero-Loss Storage
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            256-bit encrypted statutory document repository with SHA-256 deduplication, Google Drive mirror, and Gemini Multimodal AI extraction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Drag and drop files to upload directly or share unique token with client.')}
            className="px-3.5 py-2 bg-[#00c073] hover:bg-[#00a864] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Cloud Preservation Badge */}
      <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-300 block">Dual-Preservation Architecture</span>
            <p className="text-[11px] text-slate-400">
              All files are stored permanently in Neon PostgreSQL (Base64) + Google Drive. 100% immune to container restarts and ephemeral disk wipes.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
          142 Files Preserved
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by client, file name, or category..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Folder className="w-3.5 h-3.5 text-slate-400" />
          <span>Category:</span>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="sales">Sales Invoices</option>
            <option value="purchase">Purchase Invoices</option>
            <option value="bank">Bank Statements</option>
            <option value="gst">GST Registration</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Document Name</th>
                <th className="p-3.5">Client & Entity</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">AI Intelligence Status</th>
                <th className="p-3.5">Storage Tier</th>
                <th className="p-3.5">Size & Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">{doc.filename}</span>
                        <span className="font-mono text-[9px] text-slate-400 truncate max-w-[200px] block" title={doc.sha256}>
                          SHA: {doc.sha256.substring(0, 16)}...
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-bold text-slate-800">
                    {doc.client}
                    <span className="block font-mono text-[10px] text-slate-400 font-normal">{doc.gstin}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {doc.category}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 w-max">
                      <Sparkles className="w-3 h-3 text-emerald-600" /> {doc.aiStatus}
                    </span>
                  </td>
                  <td className="p-3.5 text-[11px] text-slate-600 font-medium">
                    {doc.storage}
                  </td>
                  <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                    {doc.size} <span className="block text-slate-400">{doc.uploadDate}</span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => alert(`Opening secure document viewer for ${doc.filename}`)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
