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
 * blob: media, runs a blob: worker, and gives each caption track an empty data: address. Only in the build: the dev server injects inline
 * scripts of its own.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self' data:",
  "img-src 'self' data: https:",
  "media-src 'self' blob: data: https:",
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

/** Where the site lives, and how a link to it introduces it. */
const SITE_URL = 'https://matan0810.github.io/live-video/';
const DESCRIPTION = 'ערוצי חדשות ותחנות רדיו בשידור חי, במקום אחד';

/**
 * The page's description and its share card: what WhatsApp, Telegram and the like show for a
 * link to the site (public/og-image.png). Their crawlers need an absolute address.
 */
function shareMeta(): Plugin {
  const meta = (key: 'name' | 'property', name: string, content: string) => ({
    tag: 'meta',
    attrs: { [key]: name, content },
    injectTo: 'head' as const,
  });
  return {
    name: 'share-meta',
    transformIndexHtml: () => [
      meta('name', 'description', DESCRIPTION),
      meta('property', 'og:type', 'website'),
      meta('property', 'og:site_name', 'OnAir'),
      meta('property', 'og:title', 'OnAir'),
      meta('property', 'og:description', DESCRIPTION),
      meta('property', 'og:url', SITE_URL),
      meta('property', 'og:locale', 'he_IL'),
      meta('property', 'og:image', `${SITE_URL}og-image.png`),
      meta('property', 'og:image:width', '1200'),
      meta('property', 'og:image:height', '630'),
      meta('property', 'og:image:alt', `OnAir: ${DESCRIPTION}`),
      meta('name', 'twitter:card', 'summary_large_image'),
    ],
  };
}

export default defineConfig({
  plugins: [react(), securityMeta(), shareMeta()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  base: '/live-video/',
  test: {
    environment: 'node',
  },
});
