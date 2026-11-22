/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base address of the Cloudflare Worker API. Optional: without it the site is fully static. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** The version in package.json, injected at build time. */
declare const __APP_VERSION__: string;

/** The part of Trusted Types the site uses (not yet in TypeScript's DOM types). */
interface TrustedTypePolicyFactory {
  createPolicy(name: string, rules: { createScriptURL?: (input: string) => string }): unknown;
}

interface Window {
  readonly trustedTypes?: TrustedTypePolicyFactory;
}
