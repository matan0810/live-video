// Finds the Cloudflare KV namespace with the given title, creating it if it does not
// exist, and writes its id into the Worker config in place of the placeholder.
//
//   CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… node scripts/ensure-kv.mjs <title> <config>
//
// Used by the Deploy Worker workflow, so the id never has to be copied by hand.

import { readFile, writeFile } from 'node:fs/promises';

const PLACEHOLDER = 'REPLACE_WITH_KV_NAMESPACE_ID';
const API = 'https://api.cloudflare.com/client/v4';

const [title, configPath] = process.argv.slice(2);
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: accountId } = process.env;
if (!title || !configPath || !token || !accountId) {
  throw new Error('Usage: node scripts/ensure-kv.mjs <title> <config>, with Cloudflare env vars');
}

async function cloudflare(path, init = {}) {
  const response = await fetch(`${API}/accounts/${accountId}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const body = await response.json();
  if (!body.success) {
    const reasons = (body.errors ?? []).map((error) => error.message).join('; ');
    throw new Error(`Cloudflare API ${path} failed: ${reasons || response.status}`);
  }
  return body.result;
}

const namespaces = await cloudflare('/storage/kv/namespaces?per_page=100');
let namespace = namespaces.find((entry) => entry.title === title);
if (namespace) {
  console.log(`Using the existing KV namespace "${title}".`);
} else {
  namespace = await cloudflare('/storage/kv/namespaces', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  console.log(`Created the KV namespace "${title}".`);
}

const config = await readFile(configPath, 'utf8');
if (!config.includes(PLACEHOLDER)) throw new Error(`${configPath} has no ${PLACEHOLDER}`);
await writeFile(configPath, config.replace(PLACEHOLDER, namespace.id));
