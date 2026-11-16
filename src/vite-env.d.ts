/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base address of the Cloudflare Worker API. Optional: without it the site is fully static. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
