'use client';

import * as React from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  currentSubscription,
  pushSupported,
  subscribe,
  unsubscribe,
} from '@/lib/push/client';
import { useAppStore } from '@/lib/store';
import { track } from '@/lib/analytics';

export function PushToggle() {
  const [supported, setSupported] = React.useState<boolean | null>(null);
  const [enabled, setEnabled] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [serverConfigured, setServerConfigured] = React.useState<boolean | null>(null);
  const [hint, setHint] = React.useState<string | null>(null);
  const savedRoutes = useAppStore((s) => s.savedRoutes);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const supp = pushSupported();
      if (cancelled) return;
      setSupported(supp);
      if (!supp) return;

      try {
        const res = await fetch('/api/push/subscribe');
        const data = (await res.json()) as { enabled: boolean };
        if (!cancelled) setServerConfigured(data.enabled);
      } catch {
        if (!cancelled) setServerConfigured(false);
      }

      const sub = await currentSubscription();
      if (!cancelled) setEnabled(!!sub);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (supported === false) return null;
  if (serverConfigured === false) return null;

  const onClick = async () => {
    setBusy(true);
    setHint(null);
    if (enabled) {
      await unsubscribe();
      setEnabled(false);
      track('push_unsubscribed');
    } else {
      const pinTags = savedRoutes
        .filter((r) => r.targetSGD != null)
        .map((r) => r.id);
      const result = await subscribe(pinTags);
      if (result.ok) {
        setEnabled(true);
        track('push_subscribed', { pin_count: pinTags.length });
      } else {
        if (result.reason === 'permission_denied')
          setHint('Notification permission denied. Allow it in browser settings to enable.');
        else if (result.reason === 'server_not_configured')
          setHint('Server not configured for push yet.');
        else if (result.reason === 'unsupported') setHint('Browser does not support push.');
        else setHint('Could not enable push.');
      }
    }
    setBusy(false);
  };

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant={enabled ? 'default' : 'outline'}
        size="sm"
        onClick={onClick}
        disabled={busy}
        className="w-full gap-2"
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : enabled ? (
          <Bell className="size-3.5" />
        ) : (
          <BellOff className="size-3.5" />
        )}
        {enabled ? 'Notifications on — tap to disable' : 'Turn on price-drop alerts'}
      </Button>
      {hint && <p className="px-1 text-[11px] text-amber-700 dark:text-amber-300">{hint}</p>}
    </div>
  );
}
