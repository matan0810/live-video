export interface Env {
  /** Stores the channel list, viewer reports and rate-limit counters. */
  KV: KVNamespace;
  /** Secret. The only credential for the admin API. */
  ADMIN_PASSWORD: string;
  /** Comma-separated origins allowed to call the API from a browser. */
  ALLOWED_ORIGINS: string;
}

export const KV_KEYS = {
  channels: 'channels',
  previousChannels: 'channels:previous',
  reports: 'reports',
} as const;
