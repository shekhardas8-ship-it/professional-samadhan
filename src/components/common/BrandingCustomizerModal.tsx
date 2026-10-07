// src/components/common/BrandingCustomizerModal.tsx
import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Check,
  RotateCcw,
  Shield,
  Palette,
  X,
  Building2,
  Crown,
  Globe,
  Sliders,
  CheckCircle2,
  Image,
} from 'lucide-react';
import {
  FirmBrandingConfig,
  PRESET_FIRM_BRANDINGS,
  DEFAULT_FIRM_BRANDING,
} from '../../services/brandingService.ts';

interface BrandingCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBranding: FirmBrandingConfig;
  onSaveBranding: (updated: FirmBrandingConfig) => void;
  onResetBranding: () => void;
}

const COLOR_SWATCHES = [
  { name: 'Emerald', hex: '#00c073', label: 'PS Classic' },
  { name: 'Royal Blue', hex: '#2563eb', label: 'Apex Blue' },
  { name: 'Amber Gold', hex: '#d97706', label: 'Sharma Gold' },
  { name: 'Violet', hex: '#8b5cf6', label: 'Vanguard' },
  { name: 'Cyan Tech', hex: '#06b6d4', label: 'Cyber Teal' },
  { name: 'Rose Ruby', hex: '#f43f5e', label: 'Ruby Trust' },
];

export const BrandingCustomizerModal: React.FC<BrandingCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentBranding,
  onSaveBranding,
  onResetBranding,
}) => {
  const [draft, setDraft] = useState<FirmBrandingConfig>({ ...currentBranding });
  const [selectedPresetId, setSelectedPresetId] = useState<string>(currentBranding.id);
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: FirmBrandingConfig) => {
    setSelectedPresetId(preset.id);
    setDraft({ ...preset });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo image should be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = evt => {
        const base64 = evt.target?.result as string;
        setDraft(prev => ({
          ...prev,
          logoUrl: base64,
          id: 'custom_firm',
        }));
        setSelectedPresetId('custom_firm');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSaveBranding(draft);
    onClose();
  };

  const handleReset = () => {
    onResetBranding();
    setDraft({ ...DEFAULT_FIRM_BRANDING });
    setSelectedPresetId(DEFAULT_FIRM_BRANDING.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Firm White-Label & Branding Customizer
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {draft.planName} Plan
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize your firm name, logo emblem, theme color, and team personas based on your subscription.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
          {/* 1. Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>One-Click Firm Presets</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESET_FIRM_BRANDINGS.map(preset => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col items-center text-center relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/30 shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                        ✓
                      </span>
                    )}
                    <img
                      src={preset.logoUrl}
                      alt={preset.firmName}
                      className="w-10 h-10 rounded-xl object-cover mb-2 border border-white/20 shadow-xs bg-slate-900"
                    />
                    <span className="font-bold text-white text-[11px] line-clamp-1">
                      {preset.firmName}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{preset.planName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Live Brand Customization */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-4">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Firm Details & Logo Emblem</span>
            </h4>

            {/* Firm Name */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Firm / Practice Name
              </label>
              <input
                type="text"
                value={draft.firmName}
                onChange={e => {
                  setDraft({ ...draft, firmName: e.target.value, id: 'custom_firm' });
                  setSelectedPresetId('custom_firm');
                }}
                placeholder="e.g. QuinceCA or Sharma & Co."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Subtitle / Tagline */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Practice Tagline / Subtitle
              </label>
              <input
                type="text"
                value={draft.subtitle}
                onChange={e => {
                  setDraft({ ...draft, subtitle: e.target.value });
                  setSelectedPresetId('custom_firm');
                }}
                placeholder="e.g. Chartered Accountants • Practice System"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Logo Emblem Upload & Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium text-slate-400">Firm Logo Emblem</label>
                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setLogoInputMode('upload')}
                    className={`px-2 py-0.5 rounded ${
                      logoInputMode === 'upload' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    File Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoInputMode('url')}
                    className={`px-2 py-0.5 rounded ${
                      logoInputMode === 'url' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative group shrink-0">
                  <img
                    src={draft.logoUrl}
                    alt="Logo Preview"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md bg-slate-900"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition pointer-events-none">
                    <span className="text-[9px] text-white font-bold">Preview</span>
                  </div>
                </div>

                <div className="flex-1">
                  {logoInputMode === 'upload' ? (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-600 hover:border-emerald-500 rounded-xl text-slate-300 hover:text-white flex items-center justify-center gap-2 transition"
                      >
                        <Upload className="w-4 h-4 text-emerald-400" />
                        <span>Upload Custom Logo (.png, .jpg, .svg)</span>
                      </button>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Square 1:1 image recommended. Instantly preserved in local storage.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        value={draft.logoUrl}
                        onChange={e => {
                          setDraft({ ...draft, logoUrl: e.target.value });
                          setSelectedPresetId('custom_firm');
                        }}
                        placeholder="https://example.com/logo.png or /logo.jpg"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Direct image URL</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Brand Accent Color */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>Primary Accent Theme</span>
              </label>
              <div className="flex items-center gap-2">
                {COLOR_SWATCHES.map(swatch => {
                  const isSelected = draft.themeColor === swatch.hex;
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => setDraft({ ...draft, themeColor: swatch.hex })}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-medium transition ${
                        isSelected
                          ? 'border-white bg-slate-800 text-white font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      <span>{swatch.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Subscription Plan & White-Label Capabilities */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Subscription Plan Tier</span>
              </h4>
              <span className="text-[10px] text-slate-400">Controls White-Label capabilities</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Starter', 'Professional', 'AI Automation', 'Enterprise'] as const).map(plan => {
                const isSelected = draft.planName === plan;
                return (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => {
                      setDraft({
                        ...draft,
                        planName: plan,
                        whiteLabelEnabled: plan === 'Enterprise' || plan === 'AI Automation',
                        watermarkVisible: plan !== 'Enterprise',
                      });
                    }}
                    className={`py-2 px-3 rounded-xl border text-center transition ${
                      isSelected
                        ? 'border-amber-500 bg-amber-950/30 text-amber-200 font-bold'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-[11px]">{plan}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {plan === 'Enterprise' ? 'Full White-Label' : plan === 'AI Automation' ? 'Custom Theme' : 'Standard'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Partner & Staff Persona Setup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Managing Partner Persona
                </label>
                <input
                  type="text"
                  value={draft.partnerName}
                  onChange={e => setDraft({ ...draft, partnerName: e.target.value })}
                  placeholder="CA Suraj Dutta (FCA)"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  CA Staff Associate Persona
                </label>
                <input
                  type="text"
                  value={draft.staffName}
                  onChange={e => setDraft({ ...draft, staffName: e.target.value })}
                  placeholder="Pooja Verma (Associate)"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            title="Reset to default QuinceCA"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to QuinceCA</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-[#00c073] hover:bg-[#00ab66] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Save Branding</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
