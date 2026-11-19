import { useEffect, useState } from 'react';
import { dominantHue } from '../channels/logoTint';

const STORAGE_KEY = 'live-video:logo-tints';
const SAMPLE_SIZE = 32;

/** Hue per logo address; null means "no clear colour". Shared by every tile on the page. */
const memory = new Map<string, number | null>(readStored());

function readStored(): [string, number | null][] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (typeof stored !== 'object' || stored === null) return [];
    return Object.entries(stored).filter(
      (entry): entry is [string, number | null] =>
        entry[1] === null || (typeof entry[1] === 'number' && entry[1] >= 0 && entry[1] <= 360),
    );
  } catch {
    return [];
  }
}

function remember(url: string, hue: number | null) {
  memory.set(url, hue);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(memory)));
  } catch {
    // Remembering is a convenience; the hue is simply worked out again next time.
  }
}

/** Reads a small copy of the image. Needs the host to allow it (CORS); otherwise null. */
function sampleHue(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onerror = () => resolve(null);
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return resolve(null);
        context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        resolve(dominantHue(context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data));
      } catch {
        resolve(null);
      }
    };
    image.src = url;
  });
}

/**
 * The dominant hue of a channel's logo, worked out once in the browser and remembered,
 * so every channel (including ones added later) gets a matching tint without anyone
 * choosing colours. `undefined` while unknown, null when the logo has no clear colour.
 */
export function useLogoTint(url: string | null): number | null | undefined {
  // The memory is the source of truth; this counter only re-renders once a sample lands.
  const [, setSamplesDone] = useState(0);

  useEffect(() => {
    if (url === null || memory.has(url)) return;
    let isCurrent = true;
    void sampleHue(url).then((sampled) => {
      remember(url, sampled);
      if (isCurrent) setSamplesDone((count) => count + 1);
    });
    return () => {
      isCurrent = false;
    };
  }, [url]);

  return url === null ? null : memory.get(url);
}
