export type ThemeId = 'default' | 'redblack' | 'bumblebee' | 'ladybug' | 'raccoon';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  className: string;
  swatch: { primary: string; bg: string; accent: string };
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'default',
    name: 'Default',
    className: '',
    swatch: { primary: '#0a0a0a', bg: '#ffffff', accent: '#f5f5f5' },
  },
  {
    id: 'redblack',
    name: 'Red & Black',
    className: 'theme-redblack',
    swatch: { primary: '#dc2626', bg: '#1a0e0e', accent: '#3a1a1a' },
  },
  {
    id: 'bumblebee',
    name: 'Bumblebee',
    className: 'theme-bumblebee',
    swatch: { primary: '#facc15', bg: '#0e0a00', accent: '#facc15' },
  },
  {
    id: 'ladybug',
    name: 'Ladybug',
    className: 'theme-ladybug',
    swatch: { primary: '#dc2626', bg: '#fdf2f2', accent: '#0a0a0a' },
  },
  {
    id: 'raccoon',
    name: 'Raccoon',
    className: 'theme-raccoon',
    swatch: { primary: '#262626', bg: '#e7e5e4', accent: '#737373' },
  },
];

export const ALL_THEME_CLASSES = THEMES.map((t) => t.className).filter(Boolean);

export function applyTheme(themeId: ThemeId): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const cls of ALL_THEME_CLASSES) {
    root.classList.remove(cls);
  }
  const theme = THEMES.find((t) => t.id === themeId);
  if (theme && theme.className) {
    root.classList.add(theme.className);
  }
}
