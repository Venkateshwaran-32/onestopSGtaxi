/**
 * Subscription persistence.
 * - When SUPABASE_SERVICE_ROLE_KEY is set: writes to push_subscriptions table.
 * - Otherwise: in-memory map (lost on deploy; fine for dev).
 *
 * The Supabase table is created lazily by the API on first call when env is
 * configured. Add it to docs/migrations/0002_push_subscriptions.sql when the
 * user provisions Supabase.
 */

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  ownerKey: string;
  createdAt: string;
  pinTags: string[];
}

const memory = new Map<string, PushSubscriptionRecord>();

function memoryKey(endpoint: string, ownerKey: string): string {
  return `${ownerKey}|${endpoint}`;
}

export interface SubscriptionStore {
  upsert(record: PushSubscriptionRecord): Promise<void>;
  remove(endpoint: string, ownerKey: string): Promise<void>;
  listAll(): Promise<PushSubscriptionRecord[]>;
  listForOwner(ownerKey: string): Promise<PushSubscriptionRecord[]>;
  setPinTags(endpoint: string, ownerKey: string, tags: string[]): Promise<void>;
}

const memoryStore: SubscriptionStore = {
  async upsert(record) {
    memory.set(memoryKey(record.endpoint, record.ownerKey), record);
  },
  async remove(endpoint, ownerKey) {
    memory.delete(memoryKey(endpoint, ownerKey));
  },
  async listAll() {
    return Array.from(memory.values());
  },
  async listForOwner(ownerKey) {
    return Array.from(memory.values()).filter((r) => r.ownerKey === ownerKey);
  },
  async setPinTags(endpoint, ownerKey, tags) {
    const k = memoryKey(endpoint, ownerKey);
    const existing = memory.get(k);
    if (!existing) return;
    memory.set(k, { ...existing, pinTags: tags });
  },
};

const SUPABASE_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabaseFetch(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${SUPABASE_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
  });
}

const supabaseStore: SubscriptionStore = {
  async upsert(record) {
    await supabaseFetch('/rest/v1/push_subscriptions', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        endpoint: record.endpoint,
        owner_key: record.ownerKey,
        keys: record.keys,
        pin_tags: record.pinTags,
        created_at: record.createdAt,
      }),
    });
  },
  async remove(endpoint, ownerKey) {
    const url = `/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(
      endpoint,
    )}&owner_key=eq.${encodeURIComponent(ownerKey)}`;
    await supabaseFetch(url, { method: 'DELETE' });
  },
  async listAll() {
    const res = await supabaseFetch(`/rest/v1/push_subscriptions?select=*`, { method: 'GET' });
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{
      endpoint: string;
      owner_key: string;
      keys: { p256dh: string; auth: string };
      pin_tags: string[];
      created_at: string;
    }>;
    return rows.map((r) => ({
      endpoint: r.endpoint,
      ownerKey: r.owner_key,
      keys: r.keys,
      pinTags: r.pin_tags ?? [],
      createdAt: r.created_at,
    }));
  },
  async listForOwner(ownerKey) {
    const url = `/rest/v1/push_subscriptions?owner_key=eq.${encodeURIComponent(ownerKey)}&select=*`;
    const res = await supabaseFetch(url, { method: 'GET' });
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{
      endpoint: string;
      owner_key: string;
      keys: { p256dh: string; auth: string };
      pin_tags: string[];
      created_at: string;
    }>;
    return rows.map((r) => ({
      endpoint: r.endpoint,
      ownerKey: r.owner_key,
      keys: r.keys,
      pinTags: r.pin_tags ?? [],
      createdAt: r.created_at,
    }));
  },
  async setPinTags(endpoint, ownerKey, tags) {
    const url = `/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(
      endpoint,
    )}&owner_key=eq.${encodeURIComponent(ownerKey)}`;
    await supabaseFetch(url, {
      method: 'PATCH',
      body: JSON.stringify({ pin_tags: tags }),
    });
  },
};

export function getSubscriptionStore(): SubscriptionStore {
  if (SUPABASE_BASE && SUPABASE_KEY) return supabaseStore;
  return memoryStore;
}
