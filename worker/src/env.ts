export interface Env {
  /** Stores the channel list, viewer reports and the long-window rate-limit counters. */
  KV: KVNamespace;
  /** Secret. The only credential for the admin API. */
  ADMIN_PASSWORD: string;
  /** Comma-separated origins allowed to call the API from a browser. */
  ALLOWED_ORIGINS: string;
  /**
   * Cloudflare Browser Run (formerly Browser Rendering), used by the link finder for players that fetch their
   * stream address only at run time. Optional: without it the finder scans pages only.
   */
  BROWSER?: Fetcher;
  /** Cloudflare rate limiters (per address, per minute); see wrangler.jsonc. */
  LOGIN_LIMITER: RateLimit;
  REPORT_LIMITER: RateLimit;
  EXTRACT_LIMITER: RateLimit;
}

export const KV_KEYS = {
  channels: 'channels',
  previousChannels: 'channels:previous',
  /** The site version the list was saved on. */
  channelsVersion: 'channels:version',
  /** The latest daily link check, written by the Check links workflow (shared/linkStatus.ts). */
  linkStatus: 'links:status',
} as const;
