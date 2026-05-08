import type { OperatorId } from '@onestopsgtaxi/shared';
import { getStoreUrl } from '@onestopsgtaxi/operators';

function detectPlatform(): 'ios' | 'android' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export function launchDeeplink(operatorId: OperatorId, deeplink: string): void {
  if (typeof window === 'undefined') return;
  const platform = detectPlatform();

  if (platform === 'desktop') {
    window.open(getStoreUrl(operatorId, 'ios'), '_blank', 'noopener,noreferrer');
    return;
  }

  const fallbackUrl = getStoreUrl(operatorId, platform);
  const start = Date.now();

  const fallbackTimer = window.setTimeout(() => {
    if (Date.now() - start < 2200) {
      window.location.href = fallbackUrl;
    }
  }, 1200);

  window.addEventListener(
    'pagehide',
    () => {
      window.clearTimeout(fallbackTimer);
    },
    { once: true },
  );

  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        window.clearTimeout(fallbackTimer);
      }
    },
    { once: true },
  );

  window.location.href = deeplink;
}
