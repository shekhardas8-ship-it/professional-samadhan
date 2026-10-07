// src/lib/theme.ts
export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  colors: string[]; // 5-swatch palette display (like PaletteMaker)
  vars: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    primaryBorder: string;
    accent: string;
    headerBg: string;
    headerBorder: string;
    subHeaderBg: string;
    bannerFrom: string;
    bannerVia: string;
    bannerTo: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    activeTabBg: string;
    activeTabText: string;
    watermarkFilter: string;
  };
}

export const PALETTES: ColorPalette[] = [
  {
    id: 'professional-teal',
    name: 'Professional Teal',
    description: 'Official brand palette matching the QuinceCA emblem',
    colors: ['#052528', '#0B4D53', '#117077', '#14B8A6', '#F0FDFA'],
    vars: {
      primary: '#0B4D53',
      primaryHover: '#07363A',
      primaryLight: '#F0FDFA',
      primaryBorder: '#14747D',
      accent: '#14B8A6',
      headerBg: '#052326',
      headerBorder: '#0A393E',
      subHeaderBg: '#031719',
      bannerFrom: '#041F21',
      bannerVia: '#0B454A',
      bannerTo: '#041F21',
      badgeBg: 'rgba(20, 184, 166, 0.15)',
      badgeText: '#5EEAD4',
      badgeBorder: 'rgba(20, 184, 166, 0.4)',
      activeTabBg: '#0B4D53',
      activeTabText: '#FFFFFF',
      watermarkFilter: 'contrast-125',
    },
  },
  {
    id: 'executive-slate',
    name: 'Executive Slate & Cyan',
    description: 'Fintech corporate styling with high contrast and cobalt highlights',
    colors: ['#0F172A', '#1E293B', '#0284C7', '#38BDF8', '#F8FAFC'],
    vars: {
      primary: '#0284C7',
      primaryHover: '#0369A1',
      primaryLight: '#F0F9FF',
      primaryBorder: '#0EA5E9',
      accent: '#38BDF8',
      headerBg: '#0B1325',
      headerBorder: '#1E293B',
      subHeaderBg: '#070C18',
      bannerFrom: '#0B1325',
      bannerVia: '#1E293B',
      bannerTo: '#0B1325',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      badgeText: '#7DD3FC',
      badgeBorder: 'rgba(56, 189, 248, 0.4)',
      activeTabBg: '#0284C7',
      activeTabText: '#FFFFFF',
      watermarkFilter: 'contrast-125 grayscale',
    },
  },
  {
    id: 'emerald-statutory',
    name: 'Statutory Emerald',
    description: 'Crisp compliance & audit green evoking trust and precision',
    colors: ['#062D23', '#064E3B', '#059669', '#10B981', '#ECFDF5'],
    vars: {
      primary: '#059669',
      primaryHover: '#047857',
      primaryLight: '#ECFDF5',
      primaryBorder: '#10B981',
      accent: '#34D399',
      headerBg: '#05251C',
      headerBorder: '#064E3B',
      subHeaderBg: '#021611',
      bannerFrom: '#05251C',
      bannerVia: '#064E3B',
      bannerTo: '#05251C',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeText: '#6EE7B7',
      badgeBorder: 'rgba(16, 185, 129, 0.4)',
      activeTabBg: '#059669',
      activeTabText: '#FFFFFF',
      watermarkFilter: 'contrast-125',
    },
  },
  {
    id: 'royal-navy',
    name: 'Royal Navy & Gold',
    description: 'Prestigious chartered accountant heritage and advisory tone',
    colors: ['#0E1428', '#1E1B4B', '#4338CA', '#F59E0B', '#FEF3C7'],
    vars: {
      primary: '#4338CA',
      primaryHover: '#3730A3',
      primaryLight: '#EEF2FF',
      primaryBorder: '#6366F1',
      accent: '#F59E0B',
      headerBg: '#0D1124',
      headerBorder: '#1E1B4B',
      subHeaderBg: '#070914',
      bannerFrom: '#0D1124',
      bannerVia: '#1E1B4B',
      bannerTo: '#0D1124',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeText: '#FCD34D',
      badgeBorder: 'rgba(245, 158, 11, 0.4)',
      activeTabBg: '#4338CA',
      activeTabText: '#FFFFFF',
      watermarkFilter: 'contrast-125 grayscale',
    },
  },
  {
    id: 'midnight-obsidian',
    name: 'Midnight Obsidian',
    description: 'Modern luxury dark aesthetic with vivid cyan and neon accents',
    colors: ['#09090B', '#18181B', '#27272A', '#06B6D4', '#22D3EE'],
    vars: {
      primary: '#0891B2',
      primaryHover: '#0E7490',
      primaryLight: '#ECFEFF',
      primaryBorder: '#06B6D4',
      accent: '#22D3EE',
      headerBg: '#09090B',
      headerBorder: '#27272A',
      subHeaderBg: '#000000',
      bannerFrom: '#09090B',
      bannerVia: '#18181B',
      bannerTo: '#09090B',
      badgeBg: 'rgba(6, 182, 212, 0.15)',
      badgeText: '#67E8F9',
      badgeBorder: 'rgba(6, 182, 212, 0.4)',
      activeTabBg: '#0891B2',
      activeTabText: '#FFFFFF',
      watermarkFilter: 'contrast-150 grayscale',
    },
  },
];

const THEME_STORAGE_KEY = 'ps_selected_theme_palette';

export function getActivePalette(): ColorPalette {
  if (typeof window === 'undefined') return PALETTES[0];
  const savedId = localStorage.getItem(THEME_STORAGE_KEY);
  const found = PALETTES.find(p => p.id === savedId);
  return found || PALETTES[0];
}

export function applyTheme(palette: ColorPalette) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;

  root.style.setProperty('--theme-primary', palette.vars.primary);
  root.style.setProperty('--theme-primary-hover', palette.vars.primaryHover);
  root.style.setProperty('--theme-primary-light', palette.vars.primaryLight);
  root.style.setProperty('--theme-primary-border', palette.vars.primaryBorder);
  root.style.setProperty('--theme-accent', palette.vars.accent);
  root.style.setProperty('--theme-header-bg', palette.vars.headerBg);
  root.style.setProperty('--theme-header-border', palette.vars.headerBorder);
  root.style.setProperty('--theme-subheader-bg', palette.vars.subHeaderBg);
  root.style.setProperty('--theme-banner-from', palette.vars.bannerFrom);
  root.style.setProperty('--theme-banner-via', palette.vars.bannerVia);
  root.style.setProperty('--theme-banner-to', palette.vars.bannerTo);
  root.style.setProperty('--theme-badge-bg', palette.vars.badgeBg);
  root.style.setProperty('--theme-badge-text', palette.vars.badgeText);
  root.style.setProperty('--theme-badge-border', palette.vars.badgeBorder);
  root.style.setProperty('--theme-active-tab-bg', palette.vars.activeTabBg);
  root.style.setProperty('--theme-active-tab-text', palette.vars.activeTabText);

  root.setAttribute('data-theme', palette.id);
  localStorage.setItem(THEME_STORAGE_KEY, palette.id);
}
