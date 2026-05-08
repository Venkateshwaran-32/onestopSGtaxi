'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function Popover({ trigger, children, align = 'start', className }: PopoverProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const alignClass =
    align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0';

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="dialog"
          className={cn(
            'absolute top-full z-30 mt-2 w-64 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg',
            alignClass,
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
