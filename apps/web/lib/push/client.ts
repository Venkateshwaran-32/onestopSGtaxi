'use client';

import { urlBase64ToUint8Array } from './vapid';

const OWNER_KEY_STORAGE = 'onestopsgtaxi-push-owner';

function getOrCreateOwnerKey(): string {
  if (typeof window === 'undefined') return '';
  let key = window.localStorage.getItem(OWNER_KEY_STORAGE);
  if (!key) {
    key = crypto.randomUUID();
    window.localStorage.setItem(OWNER_KEY_STORAGE, key);
  }
  return key;
}

export function pushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function ensureRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register('/sw.js');
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await ensureRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

interface SubscribeServerInfo {
  ok: boolean;
  publicKey: string | null;
  enabled: boolean;
}

async function fetchServerKey(): Promise<SubscribeServerInfo> {
  const res = await fetch('/api/push/subscribe');
  return (await res.json()) as SubscribeServerInfo;
}

export async function subscribe(pinTags: string[]): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };
  const info = await fetchServerKey();
  if (!info.enabled || !info.publicKey) {
    return { ok: false, reason: 'server_not_configured' };
  }
  const reg = await ensureRegistration();
  if (!reg) return { ok: false, reason: 'no_sw_registration' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'permission_denied' };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const keyBytes = urlBase64ToUint8Array(info.publicKey);
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes.buffer.slice(
        keyBytes.byteOffset,
        keyBytes.byteOffset + keyBytes.byteLength,
      ) as ArrayBuffer,
    });
  }

  const ownerKey = getOrCreateOwnerKey();
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ownerKey,
      subscription: sub.toJSON(),
      pinTags,
    }),
  });
  if (!res.ok) return { ok: false, reason: 'server_rejected' };
  return { ok: true };
}

export async function unsubscribe(): Promise<{ ok: boolean }> {
  const sub = await currentSubscription();
  if (sub) {
    await sub.unsubscribe();
    const ownerKey = getOrCreateOwnerKey();
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerKey, endpoint: sub.endpoint }),
    });
  }
  return { ok: true };
}
