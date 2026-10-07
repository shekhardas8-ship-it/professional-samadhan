import fs from 'fs';
import path from 'path';

const targetFiles = [
  'index.html',
  'package.json',
  'Dockerfile',
  'server.ts',
  'src/services/brandingService.ts',
  'src/services/messagingService.ts',
  'src/services/portalSettingsService.ts',
  'src/services/serverMonitor.ts',
  'src/services/clientAiSettingsService.ts',
  'src/services/baileysService.ts',
  'src/services/excelGenerator.ts',
  'src/services/htmlReportGenerator.ts',
  'src/middleware/auth.ts',
  'src/types/index.ts',
  'src/components/Header.tsx',
  'src/components/LoginPage.tsx',
  'src/components/layout/PracticeLayout.tsx',
  'src/components/dashboard/PracticeOverviewDashboard.tsx',
  'src/components/CaDashboard.tsx',
  'src/components/CaExecutiveCockpit.tsx',
  'src/components/ClientPortalView.tsx',
  'src/components/common/BrandingCustomizerModal.tsx',
  'src/components/ai/AiCopilotView.tsx',
  'src/components/ComplianceCalendarView.tsx',
  'src/components/Next7DaysPendingTaxView.tsx',
  'src/components/HtmlReportModal.tsx',
  'src/components/SetupGuideView.tsx',
  'src/components/tasks/TasksView.tsx',
  'src/components/WhatsAppDeviceLinkModal.tsx',
  'src/components/WhatsAppSenderModal.tsx',
  'src/components/settings/AllSettingsView.tsx',
  'src/components/settings/ClientDataManagementView.tsx',
  'src/components/settings/OrganizationProfileView.tsx',
  'src/components/settings/SelfServicePortalSettingsView.tsx',
  'src/components/settings/UsersManagementView.tsx',
  'src/components/settings/WhatsAppIntegrationView.tsx',
  'src/components/superadmin/SuperAdminConsoleView.tsx',
  'scripts/export_html.py',
  'scripts/extract_documents.py',
  'scripts/generate_excel.py',
  'scripts/test_platform.js',
  'scripts/test_quinceca_platform.js',
];

let totalReplacements = 0;

for (const relPath of targetFiles) {
  const fullPath = path.resolve('d:/MyProject/CA tools', relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${relPath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  const original = content;

  // Exact casing replacements
  content = content.replace(/PROFESSIONAL SAMADHAN/g, 'QUINCECA');
  content = content.replace(/Professional Samadhan/g, 'QuinceCA');
  content = content.replace(/professional-samadhan/g, 'quinceca');
  content = content.replace(/professional_samadhan/g, 'quinceca');
  content = content.replace(/professionalSamadhan/g, 'quinceCA');
  content = content.replace(/professionalsamadhan\.in/g, 'quinceca.com');

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    totalReplacements++;
    console.log(`Updated: ${relPath}`);
  }
}

console.log(`\nSuccessfully updated ${totalReplacements} files to QuinceCA!`);
