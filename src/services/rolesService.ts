// src/services/rolesService.ts

export interface RolePermissions {
  clients: {
    full: boolean;
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    managedClientsOnly: boolean;
  };
  tasks: {
    full: boolean;
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  clientRequest: {
    full: boolean;
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  workPaper: {
    full: boolean;
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  documents: {
    full: boolean;
    view: boolean;
    upload: boolean;
    delete: boolean;
    manageFolder: boolean;
  };
  settings: {
    full: boolean;
    updateOrgProfile: boolean;
    users: boolean;
    exportData: boolean;
    emailTemplate: boolean;
    automation: boolean;
    generalPreferences: boolean;
  };
}

export interface PracticeRole {
  id: string;
  name: string;
  description: string;
  isSystem?: boolean;
  userCount?: number;
  permissions: RolePermissions;
}

export const DEFAULT_FULL_PERMISSIONS: RolePermissions = {
  clients: {
    full: true,
    view: true,
    create: true,
    edit: true,
    delete: true,
    managedClientsOnly: false,
  },
  tasks: {
    full: true,
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  clientRequest: {
    full: true,
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  workPaper: {
    full: true,
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  documents: {
    full: true,
    view: true,
    upload: true,
    delete: true,
    manageFolder: true,
  },
  settings: {
    full: true,
    updateOrgProfile: true,
    users: true,
    exportData: true,
    emailTemplate: true,
    automation: true,
    generalPreferences: true,
  },
};

export const DEFAULT_PRACTICE_ROLES: PracticeRole[] = [
  {
    id: 'role_partner',
    name: 'Managing Partner (CA Admin)',
    description: 'Full statutory sign-off authority, access to all practice client dossiers, billing, and settings.',
    isSystem: true,
    userCount: 1,
    permissions: DEFAULT_FULL_PERMISSIONS,
  },
  {
    id: 'role_senior_associate',
    name: 'Senior Associate (Reviewer)',
    description: 'Senior tax and audit associate responsible for 3-way reconciliation review and client follow-ups.',
    isSystem: true,
    userCount: 2,
    permissions: {
      clients: { full: true, view: true, create: true, edit: true, delete: false, managedClientsOnly: false },
      tasks: { full: true, view: true, create: true, edit: true, delete: true },
      clientRequest: { full: true, view: true, create: true, edit: true, delete: false },
      workPaper: { full: true, view: true, create: true, edit: true, delete: false },
      documents: { full: true, view: true, upload: true, delete: true, manageFolder: true },
      settings: { full: false, updateOrgProfile: false, users: false, exportData: true, emailTemplate: true, automation: false, generalPreferences: true },
    },
  },
  {
    id: 'role_article_clerk',
    name: 'Article Clerk (Assistant)',
    description: 'Handles monthly data intake, document uploads, and basic ledger checking for assigned clients only.',
    isSystem: true,
    userCount: 3,
    permissions: {
      clients: { full: false, view: true, create: false, edit: true, delete: false, managedClientsOnly: true },
      tasks: { full: false, view: true, create: true, edit: true, delete: false },
      clientRequest: { full: false, view: true, create: false, edit: true, delete: false },
      workPaper: { full: false, view: true, create: true, edit: true, delete: false },
      documents: { full: false, view: true, upload: true, delete: false, manageFolder: false },
      settings: { full: false, updateOrgProfile: false, users: false, exportData: false, emailTemplate: false, automation: false, generalPreferences: false },
    },
  },
];

const STORAGE_KEY = 'ps_practice_roles_config';

export function getStoredRoles(): PracticeRole[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRACTICE_ROLES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRACTICE_ROLES;
  } catch {
    return DEFAULT_PRACTICE_ROLES;
  }
}

export function saveStoredRoles(roles: PracticeRole[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  } catch (err) {
    console.warn('Could not save roles to localStorage:', err);
  }
}
