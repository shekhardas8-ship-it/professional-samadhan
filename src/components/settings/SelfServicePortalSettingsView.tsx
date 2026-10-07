// src/components/settings/SelfServicePortalSettingsView.tsx
import React, { useState } from 'react';
import {
  Copy,
  Check,
  Edit2,
  ExternalLink,
  Shield,
  Eye,
  Info,
  Save,
  CheckSquare,
  Lock,
  MessageSquare,
  Sliders,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  PortalPreferencesConfig,
  getStoredPortalPreferences,
  saveStoredPortalPreferences,
} from '../../services/portalSettingsService';
import { FirmBrandingConfig } from '../../services/brandingService';

interface SelfServicePortalSettingsViewProps {
  firmBranding: FirmBrandingConfig;
  currentUser?: any;
  onSavedNotification?: (msg: string) => void;
  onClose?: () => void;
}

export const SelfServicePortalSettingsView: React.FC<SelfServicePortalSettingsViewProps> = ({
  firmBranding,
  currentUser,
  onSavedNotification,
  onClose,
}) => {
  const userName = currentUser?.displayName || currentUser?.username || 'shekhar';
  const defaultSlug = userName.toLowerCase().replace(/[^a-z0-9]/g, '') + '60090767342';

  const [preferences, setPreferences] = useState<PortalPreferencesConfig>(() =>
    getStoredPortalPreferences(defaultSlug)
  );

  const [activeTab, setActiveTab] = useState<'preferences' | 'custom_modules'>('preferences');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isEditingPortalName, setIsEditingPortalName] = useState(false);
  const [editedName, setEditedName] = useState(preferences.portalName);
  const [showBannerPreview, setShowBannerPreview] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(preferences.portalUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSavePortalName = () => {
    if (!editedName.trim()) return;
    const cleanSlug = editedName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const newUrl = `https://portal.quinceca.com/portal/${cleanSlug}`;

    const updated: PortalPreferencesConfig = {
      ...preferences,
      portalName: editedName.trim(),
      portalSlug: cleanSlug,
      portalUrl: newUrl,
    };

    setPreferences(updated);
    saveStoredPortalPreferences(updated);
    setIsEditingPortalName(false);
  };

  const handleToggleModule = (moduleId: string, field: 'enabled' | 'allowDownload') => {
    setPreferences(prev => {
      const updatedModules = prev.customModules.map(mod => {
        if (mod.id === moduleId) {
          return {
            ...mod,
            [field]: !mod[field],
          };
        }
        return mod;
      });
      return {
        ...prev,
        customModules: updatedModules,
      };
    });
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveStoredPortalPreferences(preferences);
    setIsSaved(true);
    if (onSavedNotification) {
      onSavedNotification('Self Service Portal preferences saved successfully!');
    }
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex-1 bg-white min-h-screen overflow-y-auto">
      {/* Top Header Bar matching Screenshot */}
      <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Self Service Portal</h1>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium cursor-pointer"
          >
            <span>Close Settings</span>
            <span className="text-rose-500 font-bold">✕</span>
          </button>
        )}
      </div>

      {/* Sub-tabs: Preferences | Custom Modules */}
      <div className="px-8 border-b border-slate-200 bg-white">
        <nav className="flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`py-3 text-xs font-semibold transition border-b-2 cursor-pointer ${
              activeTab === 'preferences'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Preferences
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom_modules')}
            className={`py-3 text-xs font-semibold transition border-b-2 cursor-pointer ${
              activeTab === 'custom_modules'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Custom Modules
          </button>
        </nav>
      </div>

      {isSaved && (
        <div className="mx-8 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">
            Portal configuration saved! Client intake link is active.
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PREFERENCES (EXACT REPLICA OF SCREENSHOT)                          */}
      {/* ========================================================================= */}
      {activeTab === 'preferences' && (
        <form onSubmit={handleSaveAll} className="p-8 max-w-4xl space-y-7 text-xs text-slate-700">
          {/* Portal Name & URL Section */}
          <div className="space-y-4">
            {/* Portal Name */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <span className="w-28 font-medium text-slate-700 shrink-0">Portal Name :</span>
              {isEditingPortalName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                    className="px-2.5 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSavePortalName}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditedName(preferences.portalName);
                      setIsEditingPortalName(false);
                    }}
                    className="px-2 py-1 text-slate-500 hover:text-slate-700 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-800">{preferences.portalName}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingPortalName(true)}
                    className="px-2.5 py-0.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded hover:bg-slate-50 transition cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Portal URL */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <span className="w-28 font-medium text-slate-700 shrink-0">Portal URL :</span>
              <div className="flex items-center gap-2 font-mono text-slate-700 select-all overflow-x-auto">
                <a
                  href={preferences.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 truncate"
                >
                  <span>{preferences.portalUrl}</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer shrink-0 ml-1"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Banner Message Section */}
          <div className="space-y-2 pt-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Banner Message</span>
              <button
                type="button"
                onClick={() => setShowBannerPreview(!showBannerPreview)}
                className="text-blue-600 hover:underline font-medium cursor-pointer"
              >
                {showBannerPreview ? 'Hide Preview' : 'Preview'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              This message will be displayed right on top of the 'Home' page of the portal.
            </p>

            <textarea
              rows={4}
              value={preferences.bannerMessage}
              onChange={e => setPreferences({ ...preferences, bannerMessage: e.target.value })}
              placeholder="Enter announcement banner message for your clients..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs resize-y"
            />

            {/* Banner Preview simulation */}
            {showBannerPreview && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5 mt-2 animate-in fade-in">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed flex-1">
                  <span className="font-bold block mb-0.5">Live Client Portal Preview:</span>
                  <span>{preferences.bannerMessage || 'No banner message set.'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Checkboxes Group */}
          <div className="space-y-5 pt-3">
            {/* Checkbox 1: MFA */}
            <div className="space-y-1">
              <label className="flex items-center space-x-2.5 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={preferences.enableMfa}
                  onChange={e =>
                    setPreferences({ ...preferences, enableMfa: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>Enable multi-factor authentication (MFA)</span>
              </label>
              <p className="pl-6 text-[11px] text-slate-500 leading-relaxed max-w-3xl">
                Add an extra layer of security to the customer portal by enabling Multi-Factor Authentication (MFA). Once enabled, your customer will need to verify their identity with a code using an authenticator app, in addition to a password. This helps prevent unauthorized access, even if their password is compromised.
              </p>
            </div>

            {/* Checkbox 2: Allow clients to upload documents and edit their information */}
            <div className="space-y-1">
              <label className="flex items-center space-x-2.5 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={preferences.allowDocUploadAndEdit}
                  onChange={e =>
                    setPreferences({ ...preferences, allowDocUploadAndEdit: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>Allow clients to upload documents and edit their information in the portal</span>
              </label>
              <p className="pl-6 text-[11px] text-slate-500 leading-relaxed max-w-3xl">
                Your clients will be able to upload documents and edit their basic details, such as their address and display name.
              </p>
            </div>

            {/* Checkbox 3: Bulk payments for invoices */}
            <div className="space-y-1">
              <label className="flex items-center space-x-2.5 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={preferences.enableBulkPayments}
                  onChange={e =>
                    setPreferences({ ...preferences, enableBulkPayments: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>Enable customers to make bulk payments for invoices</span>
              </label>
              <p className="pl-6 text-[11px] text-slate-500 leading-relaxed max-w-3xl">
                Your customers can select multiple invoices and make a single payment for the selected invoices.
              </p>
            </div>

            {/* Checkbox 4: Client reviews */}
            <div className="space-y-1">
              <label className="flex items-center space-x-2.5 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={preferences.enableClientReviews}
                  onChange={e =>
                    setPreferences({ ...preferences, enableClientReviews: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>Enable client reviews for my service</span>
              </label>
              <p className="pl-6 text-[11px] text-slate-500 leading-relaxed max-w-3xl">
                Your clients can rate your service and provide feedback. These reviews are not public.
              </p>
            </div>
          </div>

          {/* Secure Public Links Section */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="font-bold text-slate-800 text-xs">Secure Public Links</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-3xl">
              When you share invoices or estimates through public links, anyone with the link could access them. To protect your customers' data, you can add an extra layer of security with identity verification.
            </p>

            <div className="space-y-1">
              <label className="flex items-center space-x-2.5 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={preferences.enableIdentityVerification}
                  onChange={e =>
                    setPreferences({ ...preferences, enableIdentityVerification: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>Enable identity verification to view invoices and estimates</span>
              </label>
              <p className="pl-6 text-[11px] text-slate-500 leading-relaxed max-w-3xl">
                Require customers to verify their email address or contact number to view or download invoice and estimate PDFs. This keeps their data secure and is recommended when sharing transactions outside the Customer Portal.
              </p>
            </div>
          </div>

          {/* Action Button: Save matching Screenshot */}
          <div className="pt-6 border-t border-slate-200">
            <button
              type="submit"
              className="px-6 py-2 bg-[#00c073] hover:bg-[#00ab66] text-white text-xs font-semibold rounded-md shadow-xs transition cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CUSTOM MODULES                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'custom_modules' && (
        <div className="p-8 max-w-4xl space-y-6 text-xs text-slate-700">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Client Portal Modules & Visibility
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Control which CA practice services and compliance records are accessible to your clients when they log into the portal.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <th className="py-3 px-4">Module Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Portal Visibility</th>
                  <th className="py-3 px-4 text-center">Client Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preferences.customModules.map(mod => (
                  <tr key={mod.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{mod.name}</div>
                      <div className="text-[11px] text-slate-500">{mod.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {mod.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={mod.enabled}
                        onChange={() => handleToggleModule(mod.id, 'enabled')}
                        className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        disabled={!mod.enabled}
                        checked={mod.allowDownload}
                        onChange={() => handleToggleModule(mod.id, 'allowDownload')}
                        className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer disabled:opacity-40"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Changes take effect immediately for active client web links.
            </span>
            <button
              type="button"
              onClick={() => handleSaveAll()}
              className="px-6 py-2 bg-[#00c073] hover:bg-[#00ab66] text-white text-xs font-semibold rounded-md shadow-xs transition cursor-pointer"
            >
              Save Modules
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
