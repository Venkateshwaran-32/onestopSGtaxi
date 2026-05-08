'use client';

import * as React from 'react';
import { Check, Palette } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { THEMES, applyTheme, type ThemeId } from '@/lib/themes';
import { cn } from '@/lib/utils';

export function ThemeSwitcher() {
  const themeId = useAppStore((s) => s.themeId);
  const setTheme = useAppStore((s) => s.setTheme);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const handleSelect = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change theme"
        aria-expanded={open}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
      >
        <Palette className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-lg border bg-popover p-1.5 shadow-lg">
          <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Theme
          </p>
          <ul>
            {THEMES.map((theme) => {
              const active = themeId === theme.id;
              return (
                <li key={theme.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(theme.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition',
                      'hover:bg-secondary',
                      active && 'bg-secondary',
                    )}
                    aria-current={active}
                  >
                    <span
                      className="flex size-6 shrink-0 items-center overflow-hidden rounded-full border"
                      aria-hidden
                    >
                      <span
                        className="h-full flex-1"
                        style={{ backgroundColor: theme.swatch.bg }}
                      />
                      <span
                        className="h-full flex-1"
                        style={{ backgroundColor: theme.swatch.primary }}
                      />
                      <span
                        className="h-full flex-1"
                        style={{ backgroundColor: theme.swatch.accent }}
                      />
                    </span>
                    <span className="flex-1 truncate font-medium">{theme.name}</span>
                    {active && <Check className="size-4 text-muted-foreground" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
