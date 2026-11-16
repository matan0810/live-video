export interface StreamCheck {
  isWorking: boolean;
  detail: string;
}

const TIMEOUT_MS = 10_000;
const HLS_SIGNATURE = '#EXTM3U';

/**
 * Checks a stream the same way the player will reach it: from this browser, with CORS.
 * A stream that fails here will not play on the site either.
 */
export async function checkStream(url: string): Promise<StreamCheck> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return { isWorking: false, detail: `HTTP ${response.status}` };
    const body = await response.text();
    return body.trimStart().startsWith(HLS_SIGNATURE)
      ? { isWorking: true, detail: 'תקין' }
      : { isWorking: false, detail: 'לא פלייליסט HLS' };
  } catch {
    return { isWorking: false, detail: 'לא נגיש (חסום, לא קיים או בלי CORS)' };
  }
}
