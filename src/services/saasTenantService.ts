// src/services/saasTenantService.ts

export type SaasPlanTier = 'starter' | 'growth' | 'automation_pro' | 'enterprise';
export type StorageProviderType = 'managed_local' | 'tenant_google_drive' | 'tenant_aws_s3' | 'tenant_r2';

export interface SaasModuleConfig {
  gst_filing_pipeline: boolean;
  ai_vision_ocr: boolean;
  whatsapp_automation: boolean;
  notices_scrutiny_counsel: boolean;
  itr_tax_audit: boolean;
  mca_roc_compliance: boolean;
  billing_timesheets: boolean;
  multi_user_staff_review: boolean;
}

export interface SaasPlanMetadata {
  id: SaasPlanTier;
  name: string;
  tagline: string;
  badge: string;
  monthlyBasePriceInr: number;
  annualDiscountPercent: number;
  includedStorageGb: number;
  includedUsers: number;
  includedClients: number;
  defaultModules: SaasModuleConfig;
  highlights: string[];
}

export interface TenantSaaSSettings {
  tenantId: string;
  firmName: string;
  firmType: 'sole_practitioner' | 'partnership_firm' | 'llp' | 'multi_branch';
  slug: string;
  ownerEmail: string;
  ownerName: string;
  contactPhone: string;
  planTier: SaasPlanTier;
  billingCycle: 'monthly' | 'annual';
  modules: SaasModuleConfig;
  storageQuotaGb: number;
  storageUsedBytes: number;
  storageProvider: StorageProviderType;
  customDomain?: string;
  // Dedicated Cloud Storage Config
  googleDriveFolderId?: string;
  googleDriveClientEmail?: string;
  s3BucketName?: string;
  s3Region?: string;
  s3Endpoint?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKeyMasked?: string;
  calculatedMonthlyInr: number;
  status: 'active' | 'trial' | 'past_due' | 'cancelled';
}

export const SAAS_PLANS: Record<SaasPlanTier, SaasPlanMetadata> = {
  starter: {
    id: 'starter',
    name: 'Individual Practitioner',
    tagline: 'For sole proprietorship CAs & independent tax advocates',
    badge: 'Essential',
    monthlyBasePriceInr: 1499,
    annualDiscountPercent: 20,
    includedStorageGb: 5,
    includedUsers: 1,
    includedClients: 25,
    defaultModules: {
      gst_filing_pipeline: true,
      ai_vision_ocr: false,
      whatsapp_automation: false,
      notices_scrutiny_counsel: false,
      itr_tax_audit: true,
      mca_roc_compliance: false,
      billing_timesheets: false,
      multi_user_staff_review: false,
    },
    highlights: [
      'GSTR-1, 3B preparation & 2B reconciler',
      '5 GB dedicated isolated cloud storage',
      'Single user CA Partner cockpit',
      'Client document upload portal',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth CA Firm',
    tagline: 'For small-to-medium practices with articled staff',
    badge: 'Most Popular',
    monthlyBasePriceInr: 3999,
    annualDiscountPercent: 20,
    includedStorageGb: 25,
    includedUsers: 5,
    includedClients: 100,
    defaultModules: {
      gst_filing_pipeline: true,
      ai_vision_ocr: true,
      whatsapp_automation: true,
      notices_scrutiny_counsel: false,
      itr_tax_audit: true,
      mca_roc_compliance: false,
      billing_timesheets: true,
      multi_user_staff_review: true,
    },
    highlights: [
      'Everything in Starter + 5 Staff logins',
      '25 GB isolated storage partition',
      'Google Gemini Multimodal AI invoice OCR',
      'Automated client WhatsApp document chaser',
      'Practice timesheets & billing invoicing',
    ],
  },
  automation_pro: {
    id: 'automation_pro',
    name: 'Automation Pro Firm',
    tagline: 'For high-volume audit firms automating client compliance',
    badge: 'High Automation',
    monthlyBasePriceInr: 7999,
    annualDiscountPercent: 20,
    includedStorageGb: 100,
    includedUsers: 15,
    includedClients: 350,
    defaultModules: {
      gst_filing_pipeline: true,
      ai_vision_ocr: true,
      whatsapp_automation: true,
      notices_scrutiny_counsel: true,
      itr_tax_audit: true,
      mca_roc_compliance: true,
      billing_timesheets: true,
      multi_user_staff_review: true,
    },
    highlights: [
      'Everything in Growth + 15 Staff review seats',
      '100 GB dedicated isolated storage',
      'AI Statutory Notice & Scrutiny Legal Counsel',
      'MCA / ROC Company secretarial suite',
      'WhatsApp interactive 24/7 client assistant',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Multi-Branch',
    tagline: 'For large multi-partner CA firms & corporate audit practices',
    badge: 'Custom BYOS',
    monthlyBasePriceInr: 14999,
    annualDiscountPercent: 25,
    includedStorageGb: 500,
    includedUsers: 50,
    includedClients: 1500,
    defaultModules: {
      gst_filing_pipeline: true,
      ai_vision_ocr: true,
      whatsapp_automation: true,
      notices_scrutiny_counsel: true,
      itr_tax_audit: true,
      mca_roc_compliance: true,
      billing_timesheets: true,
      multi_user_staff_review: true,
    },
    highlights: [
      'Unlimited partners & staff review desks',
      '500 GB or Bring-Your-Own Google Drive / AWS S3',
      'White-label portal with custom firm domain',
      'Private air-gapped on-premise AI models',
      'Dedicated 99.9% SLA & relationship manager',
    ],
  },
};

export const MODULE_CATALOG: Array<{
  id: keyof SaasModuleConfig;
  name: string;
  description: string;
  standalonePriceInr: number;
  iconName: string;
}> = [
  {
    id: 'gst_filing_pipeline',
    name: 'GST Return Hub & 2B Reconciler',
    description: 'Automated GSTR-1, GSTR-3B JSON generation, 2B vs Purchase register audit reconciliation.',
    standalonePriceInr: 999,
    iconName: 'Receipt',
  },
  {
    id: 'ai_vision_ocr',
    name: 'Multimodal AI Invoice & Bank OCR',
    description: 'Instant line-item and GSTIN extraction from scanned multi-page bills, challans, and PDFs.',
    standalonePriceInr: 1299,
    iconName: 'Sparkles',
  },
  {
    id: 'whatsapp_automation',
    name: 'WhatsApp Automated Document Chaser',
    description: 'Personalized WhatsApp reminders with secure upload tokens; auto-acknowledges client submissions.',
    standalonePriceInr: 1499,
    iconName: 'MessageSquare',
  },
  {
    id: 'notices_scrutiny_counsel',
    name: 'AI Notice Scrutiny & Reply Drafter',
    description: 'Automated DRC-01A, Sec 148, TRACES notice analysis, circular citations, and formal defense letters.',
    standalonePriceInr: 1999,
    iconName: 'Scale',
  },
  {
    id: 'itr_tax_audit',
    name: 'ITR Filing & Tax Audit (3CD)',
    description: 'Computation of total income, presumptive 44AD/ADA, official government ITR JSON generator.',
    standalonePriceInr: 999,
    iconName: 'FileText',
  },
  {
    id: 'mca_roc_compliance',
    name: 'MCA & ROC Compliance Suite',
    description: 'Company incorporation tracking, DIR-3 KYC, annual AOC-4 & MGT-7 workflow management.',
    standalonePriceInr: 1299,
    iconName: 'Building2',
  },
  {
    id: 'billing_timesheets',
    name: 'Billing, Retainers & Staff Timesheets',
    description: 'Practice invoice generation, UPI QR integration, unbilled revenue radar, and employee logs.',
    standalonePriceInr: 799,
    iconName: 'CreditCard',
  },
  {
    id: 'multi_user_staff_review',
    name: 'Staff Review & Maker-Checker Workflow',
    description: 'Delegated task queues for articled assistants with Senior CA Partner sign-off locks.',
    standalonePriceInr: 999,
    iconName: 'Users',
  },
];

export const STORAGE_ADDONS: Array<{
  quotaGb: number;
  label: string;
  addonPriceInr: number;
  isPopular?: boolean;
}> = [
  { quotaGb: 5, label: '5 GB Partition', addonPriceInr: 0 },
  { quotaGb: 25, label: '25 GB Secure Partition', addonPriceInr: 499, isPopular: true },
  { quotaGb: 100, label: '100 GB High-Volume Storage', addonPriceInr: 1299 },
  { quotaGb: 500, label: '500 GB Practice Vault', addonPriceInr: 3499 },
  { quotaGb: 1000, label: '1 TB Enterprise Cloud', addonPriceInr: 5999 },
];

/**
 * Calculates dynamic monthly subscription total based on firm's custom preferences
 */
export function calculateTenantMonthlyPrice(
  planId: SaasPlanTier,
  customModules: SaasModuleConfig,
  storageQuotaGb: number,
  storageProvider: StorageProviderType,
  billingCycle: 'monthly' | 'annual'
): number {
  const plan = SAAS_PLANS[planId];
  let total = plan.monthlyBasePriceInr;

  // Additional storage fees (if beyond plan baseline)
  if (storageProvider === 'managed_local') {
    if (storageQuotaGb > plan.includedStorageGb) {
      const extraGb = storageQuotaGb - plan.includedStorageGb;
      // ₹15 per extra GB
      total += Math.ceil(extraGb * 15);
    }
  } else {
    // BYOS (Bring Your Own Storage) has 0 platform storage cost!
    total += 0;
  }

  // Any extra modules toggled on that weren't in the base plan
  MODULE_CATALOG.forEach(mod => {
    const isSelected = customModules[mod.id];
    const isDefaultInPlan = plan.defaultModules[mod.id];
    if (isSelected && !isDefaultInPlan) {
      total += Math.round(mod.standalonePriceInr * 0.7); // 30% bundle discount
    }
  });

  if (billingCycle === 'annual') {
    const discount = (total * plan.annualDiscountPercent) / 100;
    total -= discount;
  }

  return Math.max(Math.round(total), 499);
}
