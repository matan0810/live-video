import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/**
 * What the built page may load and run. GitHub Pages cannot send headers, so the policy is a
 * <meta> tag (which cannot carry frame-ancestors). Scripts, styles and fonts come from the
 * site only, with no inline script; Trusted Types refuse any HTML written from script
 * (src/trustedTypes.ts). Video, playlists and logos may come from any https host, because
 * viewers add their own channels and the admin can point a logo anywhere until it is copied
 * in; the Worker and mako are https hosts too (SECURITY.md lists them). hls.js plays through
 * blob: media and runs a blob: worker. Only in the build: the dev server injects inline
 * scripts of its own.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self' data:",
  "img-src 'self' data: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
  "require-trusted-types-for 'script'",
  'trusted-types default',
].join('; ');

function securityMeta(): Plugin {
  return {
    name: 'security-meta',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
        injectTo: 'head-prepend',
      },
    ],
  };
}

export default defineConfig({
  plugins: [react(), securityMeta()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  base: '/live-video/',
  test: {
    environment: 'node',
  },
});
