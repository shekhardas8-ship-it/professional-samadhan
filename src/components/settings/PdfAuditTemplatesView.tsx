// src/components/settings/PdfAuditTemplatesView.tsx
import React, { useState } from 'react';
import {
  FileText,
  Stamp,
  ShieldCheck,
  QrCode,
  Eye,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Check,
  Sliders,
  Palette,
  FileCheck,
  Building2,
  Printer,
} from 'lucide-react';
import { FirmBrandingConfig } from '../../services/brandingService';

export interface PdfTemplateConfig {
  letterheadStyle: 'icai_formal' | 'modern_minimal' | 'executive_border';
  firmHeaderTitle: string;
  firmRegistrationNumber: string;
  officeAddress: string;
  partnerName: string;
  membershipNumber: string;
  udinFormatPlaceholder: string;
  enableQrCodeVerification: boolean;
  enableWatermark: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  includeExecutiveSummary: boolean;
  includeB2bSalesSchedule: boolean;
  includeInwardItcRegister: boolean;
  includeBankStatementContra: boolean;
  includeExceptionsTrail: boolean;
  includeStatutoryDisclaimer: boolean;
  disclaimerText: string;
}

const DEFAULT_PDF_CONFIG: PdfTemplateConfig = {
  letterheadStyle: 'icai_formal',
  firmHeaderTitle: 'SURAG DUTTA & ASSOCIATES | CHARTERED ACCOUNTANTS',
  firmRegistrationNumber: 'FRN: 104523W',
  officeAddress: 'Suite 402, Express Towers, Nariman Point, Mumbai - 400021',
  partnerName: 'CA Suraj Dutta',
  membershipNumber: 'FCA 089452',
  udinFormatPlaceholder: '26089452AAAAAB1234',
  enableQrCodeVerification: true,
  enableWatermark: true,
  watermarkText: 'CONFIDENTIAL - CA WORKING PAPER',
  watermarkOpacity: 15,
  includeExecutiveSummary: true,
  includeB2bSalesSchedule: true,
  includeInwardItcRegister: true,
  includeBankStatementContra: true,
  includeExceptionsTrail: true,
  includeStatutoryDisclaimer: true,
  disclaimerText:
    'This statutory verification paper and audit dossier is compiled based on electronic invoices and bank statements provided by client management. Issued in compliance with Standards on Auditing (SA) and relevant provisions of the Central Goods and Services Tax Act, 2017.',
};

interface PdfAuditTemplatesViewProps {
  firmBranding: FirmBrandingConfig;
  currentUser?: any;
  onSavedNotification?: (msg: string) => void;
  onClose?: () => void;
  isDialogMode?: boolean;
}

export const PdfAuditTemplatesView: React.FC<PdfAuditTemplatesViewProps> = ({
  firmBranding,
  currentUser,
  onSavedNotification,
  onClose,
  isDialogMode = false,
}) => {
  const [config, setConfig] = useState<PdfTemplateConfig>(() => {
    try {
      const stored = localStorage.getItem('quinceca_pdf_template_config');
      if (stored) return { ...DEFAULT_PDF_CONFIG, ...JSON.parse(stored) };
    } catch (e) {
      // fallback
    }
    return {
      ...DEFAULT_PDF_CONFIG,
      firmHeaderTitle: `${firmBranding.firmName.toUpperCase()} | CHARTERED ACCOUNTANTS`,
    };
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'visual' | 'code'>('visual');

  const handleSave = (updated: PdfTemplateConfig) => {
    setConfig(updated);
    try {
      localStorage.setItem('quinceca_pdf_template_config', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
    setSaveSuccessMsg('PDF Dossier & Audit Report template saved successfully.');
    if (onSavedNotification) onSavedNotification('PDF Dossier template saved.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset PDF template to standard ICAI formal letterhead format?')) {
      handleSave(DEFAULT_PDF_CONFIG);
    }
  };

  return (
    <div className={`${isDialogMode ? 'p-2' : 'p-6 max-w-6xl mx-auto'} space-y-6 animate-in fade-in duration-150`}>
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-xl shadow-md shadow-orange-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-800">PDF Dossier & Audit Report Templates</h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                ICAI Formal Layout
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize practice letterhead seal, CA digital signature block, UDIN placeholder, and report watermark.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave(config)}
            className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Template</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg transition"
            >
              Back
            </button>
          )}
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs animate-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Config, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-5 text-xs">
          {/* Section 1: Letterhead Style & Practice Title */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Practice Letterhead & Header Layout</span>
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'icai_formal', label: 'ICAI Formal', desc: 'Centered seal & FRN header' },
                { id: 'modern_minimal', label: 'Corporate Modern', desc: 'Left aligned minimal header' },
                { id: 'executive_border', label: 'Executive Border', desc: 'Formal double hairline border' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setConfig({ ...config, letterheadStyle: opt.id as any })}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    config.letterheadStyle === opt.id
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="font-bold block text-xs">{opt.label}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Firm Header Letterhead Text</label>
                <input
                  type="text"
                  value={config.firmHeaderTitle}
                  onChange={e => setConfig({ ...config, firmHeaderTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ICAI Firm Reg. No. (FRN)</label>
                  <input
                    type="text"
                    value={config.firmRegistrationNumber}
                    onChange={e => setConfig({ ...config, firmRegistrationNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Head Office Address Summary</label>
                  <input
                    type="text"
                    value={config.officeAddress}
                    onChange={e => setConfig({ ...config, officeAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: CA Digital Signature & UDIN Block */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>CA Digital Signature & UDIN Block</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Partner In-Charge Name</label>
                <input
                  type="text"
                  value={config.partnerName}
                  onChange={e => setConfig({ ...config, partnerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Membership Number</label>
                <input
                  type="text"
                  value={config.membershipNumber}
                  onChange={e => setConfig({ ...config, membershipNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">UDIN Block Placeholder</label>
                <input
                  type="text"
                  value={config.udinFormatPlaceholder}
                  onChange={e => setConfig({ ...config, udinFormatPlaceholder: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                  placeholder="26089452AAAAAB1234"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableQrCodeVerification}
                  onChange={e => setConfig({ ...config, enableQrCodeVerification: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-700">Include Instant Verification QR Code Badge</span>
              </label>
            </div>
          </div>

          {/* Section 3: Watermark & Statutory Disclaimer */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Stamp className="w-4 h-4 text-purple-600" />
              <span>Dossier Watermark & Compliance Disclaimer</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableWatermark}
                    onChange={e => setConfig({ ...config, enableWatermark: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">Print Diagonal Background Watermark</span>
                </label>
                <span className="text-[11px] text-slate-500">Opacity: {config.watermarkOpacity}%</span>
              </div>

              {config.enableWatermark && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <input
                      type="text"
                      value={config.watermarkText}
                      onChange={e => setConfig({ ...config, watermarkText: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="range"
                      min={5}
                      max={35}
                      value={config.watermarkOpacity}
                      onChange={e => setConfig({ ...config, watermarkOpacity: Number(e.target.value) })}
                      className="w-full mt-2 accent-purple-600"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Statutory Disclaimer (Standards on Auditing SA 580)
                </label>
                <textarea
                  rows={3}
                  value={config.disclaimerText}
                  onChange={e => setConfig({ ...config, disclaimerText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[11px] leading-relaxed text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Visual PDF Mockup (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Dossier Preview</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">A4 Portrait (Print Ready)</span>
          </div>

          {/* Interactive Document Preview Canvas */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-300 relative overflow-hidden text-slate-800 text-[10px] space-y-4 select-none min-h-[580px]">
            {/* Background Watermark */}
            {config.enableWatermark && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none -rotate-30 select-none z-0"
                style={{ opacity: config.watermarkOpacity / 100 }}
              >
                <span className="text-3xl font-black text-slate-900 tracking-widest uppercase border-4 border-slate-900 px-6 py-2 rounded-xl">
                  {config.watermarkText}
                </span>
              </div>
            )}

            {/* Letterhead Header */}
            <div
              className={`pb-3 border-b-2 border-slate-800 relative z-10 ${
                config.letterheadStyle === 'icai_formal'
                  ? 'text-center space-y-1'
                  : 'text-left flex justify-between items-start'
              }`}
            >
              <div>
                <h1 className="font-extrabold text-xs tracking-tight text-slate-900">
                  {config.firmHeaderTitle}
                </h1>
                <p className="text-[9px] text-slate-600 font-mono mt-0.5">
                  {config.firmRegistrationNumber} • {config.officeAddress}
                </p>
              </div>
              {config.letterheadStyle !== 'icai_formal' && (
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  CA
                </div>
              )}
            </div>

            {/* Report Title */}
            <div className="text-center relative z-10 py-1 bg-slate-50 rounded border border-slate-200">
              <span className="font-bold text-[11px] text-slate-900 uppercase tracking-wider">
                STATUTORY GST RETURN & TAX RECONCILIATION DOSSIER
              </span>
              <p className="text-[9px] text-slate-500">
                Period: September 2026 | Client: social Corn (07DWAPK0131H1Z1)
              </p>
            </div>

            {/* Mock Tax Table */}
            <div className="relative z-10 space-y-1.5">
              <span className="font-bold text-slate-800 uppercase text-[9px]">1. Tax Liability & ITC Summary</span>
              <table className="w-full border border-slate-300 text-left text-[9px]">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                  <tr>
                    <th className="p-1">Description</th>
                    <th className="p-1 text-right">Taxable</th>
                    <th className="p-1 text-right">CGST</th>
                    <th className="p-1 text-right">SGST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-1">GSTR-1 Outward Supplies</td>
                    <td className="p-1 text-right font-mono">₹40,000.00</td>
                    <td className="p-1 text-right font-mono">₹3,600.00</td>
                    <td className="p-1 text-right font-mono">₹3,600.00</td>
                  </tr>
                  <tr>
                    <td className="p-1">GSTR-3B Eligible ITC</td>
                    <td className="p-1 text-right font-mono">₹1,025.42</td>
                    <td className="p-1 text-right font-mono">₹92.29</td>
                    <td className="p-1 text-right font-mono">₹92.29</td>
                  </tr>
                  <tr className="font-bold bg-slate-50">
                    <td className="p-1">Net Cash Tax Payable</td>
                    <td className="p-1 text-right font-mono">-</td>
                    <td className="p-1 text-right font-mono text-emerald-800">₹3,507.71</td>
                    <td className="p-1 text-right font-mono text-emerald-800">₹3,507.71</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Disclaimer Block */}
            {config.includeStatutoryDisclaimer && (
              <div className="relative z-10 p-2 bg-slate-50 border border-slate-200 rounded text-[8px] text-slate-600 leading-relaxed italic">
                {config.disclaimerText}
              </div>
            )}

            {/* Partner Signature & UDIN Block */}
            <div className="relative z-10 pt-4 border-t border-slate-200 flex items-end justify-between">
              {config.enableQrCodeVerification ? (
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-12 bg-slate-100 border border-slate-300 rounded flex items-center justify-center">
                    <QrCode className="w-9 h-9 text-slate-800" />
                  </div>
                  <div>
                    <span className="font-mono text-[8px] text-slate-500 block">UDIN VERIFIED</span>
                    <span className="font-mono font-bold text-[9px] text-slate-800 block">
                      {config.udinFormatPlaceholder}
                    </span>
                  </div>
                </div>
              ) : (
                <div />
              )}

              <div className="text-right space-y-0.5">
                <span className="font-serif italic text-slate-500 text-[10px] block mb-1">
                  [Digitally Signed by Partner]
                </span>
                <span className="font-bold text-slate-900 block">{config.partnerName}</span>
                <span className="text-[9px] text-slate-600 block">{config.membershipNumber}</span>
                <span className="text-[8px] text-slate-500 block">For {firmBranding.firmName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
