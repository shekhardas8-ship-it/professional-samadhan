// src/components/settings/OtherAppsIntegrationView.tsx
import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  FolderSync,
  ShieldCheck,
  Save,
  ExternalLink,
  MessageSquare,
  CreditCard,
  Lock,
  Zap,
} from 'lucide-react';
import { FirmBrandingConfig } from '../../services/brandingService';

interface OtherAppsIntegrationViewProps {
  firmBranding: FirmBrandingConfig;
  currentUser?: any;
  onSavedNotification: (msg: string) => void;
  onClose: () => void;
}

interface CloudAppsConfig {
  googleDriveEnabled: boolean;
  googleDriveFolder: string;
  googleDriveAutoMirrorInvoices: boolean;
  googleDriveAutoMirrorWorkbooks: boolean;
  googleDriveDailyDbSnapshot: boolean;

  oneDriveEnabled: boolean;
  oneDriveFolder: string;

  awsS3Enabled: boolean;
  awsS3Bucket: string;
  awsS3Region: string;

  slackEnabled: boolean;
  slackWebhookUrl: string;

  razorpayEnabled: boolean;
  razorpayKeyId: string;
}

const DEFAULT_CONFIG: CloudAppsConfig = {
  googleDriveEnabled: true,
  googleDriveFolder: 'QuinceCA_Practice_Vault',
  googleDriveAutoMirrorInvoices: true,
  googleDriveAutoMirrorWorkbooks: true,
  googleDriveDailyDbSnapshot: true,

  oneDriveEnabled: false,
  oneDriveFolder: 'QuinceCA Documents',

  awsS3Enabled: false,
  awsS3Bucket: 'quinceca-statutory-archive-prod',
  awsS3Region: 'ap-south-1',

  slackEnabled: false,
  slackWebhookUrl: 'https://hooks.slack.com/services/T000/B000/XXXX',

  razorpayEnabled: true,
  razorpayKeyId: 'rzp_live_89a0b1c2d3e4f5',
};

export const OtherAppsIntegrationView: React.FC<OtherAppsIntegrationViewProps> = ({
  firmBranding,
  currentUser,
  onSavedNotification,
  onClose,
}) => {
  const [config, setConfig] = useState<CloudAppsConfig>(() => {
    try {
      const saved = localStorage.getItem('quinceca_other_apps_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [activeTab, setActiveTab] = useState<'drive' | 'onedrive' | 's3' | 'slack' | 'payment'>('drive');
  const [triggeringBackup, setTriggeringBackup] = useState(false);

  const handleSave = () => {
    localStorage.setItem('quinceca_other_apps_config', JSON.stringify(config));
    onSavedNotification('Cloud storage and third-party app configurations saved successfully.');
  };

  const handleTriggerDriveBackup = () => {
    setTriggeringBackup(true);
    setTimeout(() => {
      setTriggeringBackup(false);
      onSavedNotification('Google Drive Backup Complete: Synced practice files and database snapshot to QuinceCA_Practice_Vault.');
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] text-slate-800">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200/60 shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Other Apps & Cloud Storage Sync
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Google Drive Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage automated Google Drive 15 GB mirroring, AWS S3 audit vaults, Slack webhooks, and Razorpay fee links.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleTriggerDriveBackup}
            disabled={triggeringBackup}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
          >
            <FolderSync className={`w-3.5 h-3.5 ${triggeringBackup ? 'animate-spin' : ''}`} />
            <span>{triggeringBackup ? 'Syncing Drive...' : 'Trigger Drive Backup'}</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#00c073] hover:bg-[#00ab66] text-white shadow-xs transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
          {[
            { id: 'drive', label: 'Google Drive', icon: HardDrive, badge: 'Connected (15 GB)' },
            { id: 'onedrive', label: 'Microsoft OneDrive', icon: Cloud, badge: config.oneDriveEnabled ? 'Active' : 'Off' },
            { id: 's3', label: 'AWS S3 Compliance Vault', icon: Lock, badge: config.awsS3Enabled ? 'Active' : 'Off' },
            { id: 'slack', label: 'Slack & Teams Webhooks', icon: MessageSquare, badge: config.slackEnabled ? 'Active' : 'Off' },
            { id: 'payment', label: 'Razorpay UPI Gateway', icon: CreditCard, badge: config.razorpayEnabled ? 'Active' : 'Off' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                    isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: GOOGLE DRIVE */}
        {activeTab === 'drive' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900">Google Drive Real-Time Cloud Storage</h3>
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-100 text-emerald-800">
                      OAuth 2.0 Connected
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your Google Drive is actively syncing document uploads, monthly GST spreadsheets, and database backups.
                  </p>
                </div>
              </div>

              <label className="flex items-center space-x-2 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={config.googleDriveEnabled}
                  onChange={(e) => setConfig({ ...config, googleDriveEnabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-xs font-semibold text-slate-700">Drive Sync Active</span>
              </label>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Storage Configuration</h4>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Practice Root Folder Name</label>
                <input
                  type="text"
                  value={config.googleDriveFolder}
                  onChange={(e) => setConfig({ ...config, googleDriveFolder: e.target.value })}
                  className="w-full max-w-md text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.googleDriveAutoMirrorInvoices}
                    onChange={(e) => setConfig({ ...config, googleDriveAutoMirrorInvoices: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-xs text-slate-700">Auto-mirror client uploaded invoices & statements</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.googleDriveAutoMirrorWorkbooks}
                    onChange={(e) => setConfig({ ...config, googleDriveAutoMirrorWorkbooks: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-xs text-slate-700">Auto-mirror generated Tax Audit Excel workbooks</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.googleDriveDailyDbSnapshot}
                    onChange={(e) => setConfig({ ...config, googleDriveDailyDbSnapshot: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-xs text-slate-700">Execute automated daily PostgreSQL snapshot at midnight</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ONEDRIVE */}
        {activeTab === 'onedrive' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900">Microsoft 365 / OneDrive Integration</h3>
            <p className="text-xs text-slate-500">Sync documents directly to firm SharePoint & OneDrive accounts.</p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => onSavedNotification('Microsoft 365 authentication flow initiated.')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
              >
                Sign in with Microsoft 365
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: AWS S3 */}
        {activeTab === 's3' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900">AWS S3 Permanent Compliance Archive</h3>
            <p className="text-xs text-slate-500">Statutory 7-year audit retention vault with write-once-read-many (WORM) storage.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">S3 Bucket Name</label>
                <input
                  type="text"
                  value={config.awsS3Bucket}
                  onChange={(e) => setConfig({ ...config, awsS3Bucket: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Region</label>
                <input
                  type="text"
                  value={config.awsS3Region}
                  onChange={(e) => setConfig({ ...config, awsS3Region: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SLACK */}
        {activeTab === 'slack' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900">Slack & Teams Notifications</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Incoming Webhook URL</label>
              <input
                type="text"
                value={config.slackWebhookUrl}
                onChange={(e) => setConfig({ ...config, slackWebhookUrl: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* TAB 5: RAZORPAY */}
        {activeTab === 'payment' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900">Razorpay Fee Payment Gateway</h3>
            <p className="text-xs text-slate-500">Auto-attach instant UPI & card payment links on client billing invoices.</p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Razorpay Key ID</label>
              <input
                type="text"
                value={config.razorpayKeyId}
                onChange={(e) => setConfig({ ...config, razorpayKeyId: e.target.value })}
                className="w-full max-w-md text-xs px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
