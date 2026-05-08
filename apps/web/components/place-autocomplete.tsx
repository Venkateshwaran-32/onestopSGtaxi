'use client';

import * as React from 'react';
import { MapPin, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Place } from '@onestopsgtaxi/shared';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PlaceAutocompleteProps {
  label: string;
  placeholder: string;
  value: Place | null;
  onChange: (place: Place | null) => void;
  className?: string;
}

async function fetchPlaces(query: string): Promise<Place[]> {
  const url = new URL('/api/places', window.location.origin);
  url.searchParams.set('q', query);
  const res = await fetch(url);
  if (!res.ok) throw new Error('places lookup failed');
  const data = (await res.json()) as { places: Place[] };
  return data.places;
}

export function PlaceAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  className,
}: PlaceAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState(value?.label ?? '');
  const [debounced, setDebounced] = React.useState(input);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setInput(value?.label ?? '');
  }, [value]);

  React.useEffect(() => {
    const handle = setTimeout(() => setDebounced(input), 180);
    return () => clearTimeout(handle);
  }, [input]);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const { data: places, isLoading } = useQuery({
    queryKey: ['places', debounced],
    queryFn: () => fetchPlaces(debounced),
    enabled: open,
  });

  const handleSelect = (place: Place) => {
    onChange(place);
    setInput(place.label);
    setOpen(false);
    inputRef.current?.blur();
  };

  const clear = () => {
    onChange(null);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        aria-label={label}
        className="pl-10 pr-10"
        value={input}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setInput(e.target.value);
          setOpen(true);
          if (value) onChange(null);
        }}
      />
      {input.length > 0 && (
        <button
          type="button"
          aria-label={`Clear ${label}`}
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg">
          {isLoading && (
            <div className="px-3 py-3 text-sm text-muted-foreground">Searching…</div>
          )}
          {!isLoading && places && places.length === 0 && (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              No matches in Singapore
            </div>
          )}
          {!isLoading &&
            places?.map((place) => (
              <button
                key={`${place.placeId ?? place.label}-${place.coords.lat}`}
                type="button"
                onClick={() => handleSelect(place)}
                className="flex w-full items-start gap-2 rounded-md px-3 py-2.5 text-left text-sm transition hover:bg-secondary"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="flex flex-col">
                  <span className="font-medium leading-tight">{place.label}</span>
                  <span className="text-xs text-muted-foreground">{place.address}</span>
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
