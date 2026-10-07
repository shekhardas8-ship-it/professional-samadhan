// src/components/settings/OrganizationProfileView.tsx
import React, { useState, useRef } from 'react';
import {
  Upload,
  Trash2,
  AlertTriangle,
  Check,
  Building,
  Mail,
  Phone,
  Globe,
  HelpCircle,
  ShieldCheck,
  Save,
  RotateCcw,
} from 'lucide-react';
import { FirmBrandingConfig, saveStoredFirmBranding } from '../../services/brandingService';

interface OrganizationProfileViewProps {
  firmBranding: FirmBrandingConfig;
  onUpdateBranding?: (b: FirmBrandingConfig) => void;
  currentUser?: any;
  onSavedNotification?: (msg: string) => void;
}

export const OrganizationProfileView: React.FC<OrganizationProfileViewProps> = ({
  firmBranding,
  onUpdateBranding,
  currentUser,
  onSavedNotification,
}) => {
  const [logoPreview, setLogoPreview] = useState<string>(firmBranding.logoUrl || '/logo.jpg');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    orgName: firmBranding.firmName || 'QuinceCA',
    orgLocation: 'India',
    street1: 'Suite 402, Express Towers, Nariman Point',
    street2: 'Financial District, South Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400021',
    phone: '+91 98200 11111',
    fax: '',
    website: 'https://quinceca.com',
    primaryContactName: currentUser?.displayName || currentUser?.username || 'shekhar',
    primaryContactEmail: currentUser?.email || 'das.shekhar93@gmail.com',
    currency: '₹ - INR',
    language: 'English',
    timeZone: '(GMT 5:30) India Standard Time (Asia/Calcutta)',
  });

  const [isSaved, setIsSaved] = useState(false);
  const [showDomainAuthModal, setShowDomainAuthModal] = useState(false);

  const indianStates = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Delhi',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('File size exceeds 1MB limit. Please choose a file smaller than 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = event => {
        const result = event.target?.result as string;
        if (result) {
          setLogoPreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const updatedBranding: FirmBrandingConfig = {
      ...firmBranding,
      firmName: formData.orgName,
      logoUrl: logoPreview || firmBranding.logoUrl,
    };

    saveStoredFirmBranding(updatedBranding);
    if (onUpdateBranding) {
      onUpdateBranding(updatedBranding);
    }

    try {
      localStorage.setItem('ps_org_profile_data', JSON.stringify(formData));
    } catch (err) {
      console.warn('Could not save org profile to localStorage', err);
    }

    setIsSaved(true);
    if (onSavedNotification) {
      onSavedNotification('Organization Profile updated successfully!');
    }
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex-1 bg-white min-h-screen overflow-y-auto">
      {/* Header bar */}
      <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Organization Profile</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your firm's statutory branding, communication credentials, and registered office.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer">
          <HelpCircle className="w-4 h-4" />
          <span className="font-medium">Need help? Read documentation</span>
        </div>
      </div>

      {isSaved && (
        <div className="mx-8 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">Organization Profile saved successfully! Changes are now active.</span>
        </div>
      )}

      {/* Main Content Form */}
      <form onSubmit={handleSave} className="p-8 max-w-5xl space-y-8 text-xs">
        {/* Top Grid: Logo Upload Container + Org Name & Location */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Logo Upload Box (Preferred size 240px x 240px @ 72 DPI | Max Size 1MB) */}
          <div className="md:col-span-4 flex flex-col items-center sm:items-start space-y-3">
            <div className="w-56 h-56 border-2 border-dashed border-slate-300 rounded-2xl p-2 bg-slate-50/60 flex flex-col items-center justify-center text-center relative group overflow-hidden">
              {logoPreview ? (
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  <img
                    src={logoPreview}
                    alt="Organization Logo"
                    className="max-w-full max-h-40 object-contain rounded-lg"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-2 rounded-xl">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-white text-slate-700 rounded-lg hover:bg-slate-100 transition shadow"
                      title="Replace Logo"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="p-2 bg-white text-rose-600 rounded-lg hover:bg-rose-50 transition shadow"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex flex-col items-center justify-center text-slate-400">
                  <Building className="w-12 h-12 text-slate-300 mb-2" />
                  <span className="text-xs font-semibold text-slate-600">Upload Logo</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition"
                  >
                    Select Image
                  </button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/svg+xml, image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />

            <div className="text-[11px] text-slate-400 text-center sm:text-left leading-relaxed">
              <span className="font-semibold text-slate-600 block">Preferred size:</span>
              240px x 240px @ 72 DPI | Max Size 1MB
            </div>

            {logoPreview && (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition"
                >
                  Change Logo
                </button>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Right: Organization Name & Location */}
          <div className="md:col-span-8 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Organization Name<span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.orgName}
                onChange={e => setFormData({ ...formData, orgName: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
                placeholder="e.g. QuinceCA"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Organization Location<span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <select
                value={formData.orgLocation}
                onChange={e => setFormData({ ...formData, orgLocation: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
              >
                <option value="India">India</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
                <option value="Singapore">Singapore</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: Organization Address */}
        <div className="pt-6 border-t border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Organization Address</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Street 1</label>
              <input
                type="text"
                value={formData.street1}
                onChange={e => setFormData({ ...formData, street1: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="Street address line 1"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Street 2</label>
              <input
                type="text"
                value={formData.street2}
                onChange={e => setFormData({ ...formData, street2: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="Street address line 2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">State/Province</label>
              <select
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {indianStates.map(st => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Zip/Postal Code</label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                placeholder="400001"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="+91 98200 11111"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fax</label>
              <input
                type="text"
                value={formData.fax}
                onChange={e => setFormData({ ...formData, fax: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="Fax number (optional)"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Website</label>
              <input
                type="text"
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="https://yourfirm.com"
              />
            </div>
          </div>
        </div>

        {/* Section: Primary Contact Box with Domain Auth Warning Callout */}
        <div className="pt-6 border-t border-slate-200 space-y-3">
          <h2 className="text-sm font-bold text-slate-800">Primary Contact</h2>

          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs uppercase">
                {formData.primaryContactName.charAt(0) || 'S'}
              </div>
              <div>
                <div className="font-semibold text-slate-800 flex items-center gap-2">
                  <span>{formData.primaryContactName}</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    Primary Contact
                  </span>
                </div>
                <div className="text-slate-500 font-medium text-[11px] mt-0.5">
                  {formData.primaryContactEmail}
                </div>
              </div>
            </div>

            {/* Warning callout matching Screenshot */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed flex-1">
                <span>
                  Your primary contact email address is not domain authenticated. Authenticate to increase email delivery rates.
                </span>{' '}
                <button
                  type="button"
                  onClick={() => setShowDomainAuthModal(true)}
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer ml-1 inline-flex items-center gap-1"
                >
                  Configure Now &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Other Details */}
        <div className="pt-6 border-t border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Other Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="₹ - INR">₹ - INR (Indian Rupee)</option>
                <option value="$ - USD">$ - USD (US Dollar)</option>
                <option value="€ - EUR">€ - EUR (Euro)</option>
                <option value="£ - GBP">£ - GBP (British Pound)</option>
                <option value="AED - AED">AED - AED (UAE Dirham)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Language</label>
              <select
                value={formData.language}
                onChange={e => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                <option value="Marathi">Marathi (मराठी)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Time Zone</label>
              <select
                value={formData.timeZone}
                onChange={e => setFormData({ ...formData, timeZone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white truncate"
              >
                <option value="(GMT 5:30) India Standard Time (Asia/Calcutta)">
                  (GMT 5:30) India Standard Time (Asia/Calcutta)
                </option>
                <option value="(GMT 4:00) Gulf Standard Time (Asia/Dubai)">
                  (GMT 4:00) Gulf Standard Time (Asia/Dubai)
                </option>
                <option value="(GMT 0:00) Western European Time (Europe/London)">
                  (GMT 0:00) Western European Time (Europe/London)
                </option>
                <option value="(GMT -5:00) Eastern Time (America/New_York)">
                  (GMT -5:00) Eastern Time (America/New_York)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons: Save & Cancel */}
        <div className="pt-6 border-t border-slate-200 flex items-center space-x-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#00c073] hover:bg-[#00ab66] text-white text-xs font-semibold rounded-lg shadow-sm transition inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({
                orgName: firmBranding.firmName,
                orgLocation: 'India',
                street1: 'Suite 402, Express Towers, Nariman Point',
                street2: 'Financial District, South Mumbai',
                city: 'Mumbai',
                state: 'Maharashtra',
                zipCode: '400021',
                phone: '+91 98200 11111',
                fax: '',
                website: 'https://quinceca.com',
                primaryContactName: currentUser?.displayName || 'shekhar',
                primaryContactEmail: currentUser?.email || 'das.shekhar93@gmail.com',
                currency: '₹ - INR',
                language: 'English',
                timeZone: '(GMT 5:30) India Standard Time (Asia/Calcutta)',
              });
            }}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-300 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Domain Authentication Modal */}
      {showDomainAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Authenticate Email Domain (SPF / DKIM)</h3>
              </div>
              <button
                onClick={() => setShowDomainAuthModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Add the following DNS records to your domain host (Cloudflare, GoDaddy, or Namecheap) to ensure firm compliance notices and GST invoices never land in client spam folders.
            </p>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block text-[10px]">TXT Record (SPF)</span>
                <span className="text-slate-700 select-all">v=spf1 include:mail.quinceca.com ~all</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block text-[10px]">CNAME (DKIM)</span>
                <span className="text-slate-700 select-all">ps._domainkey.quinceca.com</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowDomainAuthModal(false)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                Verify & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
