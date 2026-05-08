'use client';

import * as React from 'react';
import { Camera, Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SGD = (n: number) =>
  n.toLocaleString('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 2 });

const FARE_PATTERN = /(?:S\$|SGD|\$)\s*([0-9]{1,3}(?:[.,][0-9]{2}))/gi;

function extractAmounts(raw: string): number[] {
  const matches: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = FARE_PATTERN.exec(raw)) !== null) {
    const num = parseFloat(m[1]!.replace(',', '.'));
    if (Number.isFinite(num) && num > 0) matches.push(num);
  }
  return matches;
}

function pickBestAmount(amounts: number[], estimated: number): number | null {
  if (amounts.length === 0) return null;
  const plausible = amounts.filter((a) => a >= estimated * 0.3 && a <= estimated * 4);
  if (plausible.length === 0) {
    const sorted = [...amounts].sort((a, b) => b - a);
    return sorted[0] ?? null;
  }
  const sorted = [...plausible].sort(
    (a, b) => Math.abs(a - estimated) - Math.abs(b - estimated),
  );
  return sorted[0] ?? null;
}

interface ReceiptOcrProps {
  estimatedFareSGD: number;
  onExtract: (amountSGD: number) => void;
}

export function ReceiptOcr({ estimatedFareSGD, onExtract }: ReceiptOcrProps) {
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [extracted, setExtracted] = React.useState<number | null>(null);
  const [allCandidates, setAllCandidates] = React.useState<number[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const onFile = async (file: File) => {
    setError(null);
    setExtracted(null);
    setAllCandidates([]);
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    setProgress(0);

    let Tesseract: typeof import('tesseract.js');
    try {
      Tesseract = await import('tesseract.js');
    } catch (err) {
      setBusy(false);
      setError('OCR engine could not load. Install tesseract.js or paste manually.');
      return;
    }

    try {
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: (msg: { status?: string; progress?: number }) => {
          if (typeof msg.progress === 'number') {
            setProgress(Math.round(msg.progress * 100));
          }
        },
      });
      const amounts = extractAmounts(data.text ?? '');
      setAllCandidates(amounts);
      const best = pickBestAmount(amounts, estimatedFareSGD);
      if (best == null) {
        setError(
          'No fare-looking number found in the image. Try a tighter crop on the total.',
        );
      } else {
        setExtracted(best);
      }
    } catch (err) {
      setError('OCR failed. Try a clearer screenshot.');
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = () => {
    if (extracted != null) onExtract(extracted);
  };

  return (
    <div className="space-y-2">
      {!preview && (
        <label
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 text-sm',
            'hover:border-primary hover:bg-secondary',
          )}
        >
          <Camera className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-muted-foreground">
            Pick a receipt screenshot — runs locally, never uploads
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </label>
      )}

      {preview && (
        <div className="relative overflow-hidden rounded-lg border">
          <img
            src={preview}
            alt="Receipt preview"
            className="h-32 w-full object-cover opacity-90"
          />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setExtracted(null);
              setError(null);
            }}
            aria-label="Clear preview"
            className="absolute right-2 top-2 rounded-md bg-background/80 p-1 backdrop-blur"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {busy && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Reading the image… {progress}%
        </div>
      )}

      {error && (
        <p className="rounded-md border border-amber-200 bg-amber-50/60 px-2 py-1.5 text-[11px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {error}
        </p>
      )}

      {extracted != null && !busy && (
        <div className="flex items-center justify-between rounded-md border bg-card px-3 py-2">
          <div>
            <p className="text-xs font-semibold">Detected: {SGD(extracted)}</p>
            {allCandidates.length > 1 && (
              <p className="text-[10px] text-muted-foreground">
                Other candidates: {allCandidates.slice(0, 4).map((n) => SGD(n)).join(', ')}
              </p>
            )}
          </div>
          <Button type="button" size="sm" onClick={onConfirm} className="gap-1">
            <Check className="size-3.5" />
            Use
          </Button>
        </div>
      )}
    </div>
  );
}
