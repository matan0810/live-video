import { useCallback, useState } from 'react';
import { checkStream, type StreamCheck } from './checkStream';

export type StreamCheckState = StreamCheck | 'checking';

/** Runs stream checks and remembers the latest result per address. */
export function useStreamChecks() {
  const [results, setResults] = useState<ReadonlyMap<string, StreamCheckState>>(() => new Map());

  const check = useCallback((urls: readonly string[]) => {
    const setResult = (url: string, state: StreamCheckState) =>
      setResults((current) => new Map(current).set(url, state));

    for (const url of urls) {
      setResult(url, 'checking');
      void checkStream(url).then((result) => setResult(url, result));
    }
  }, []);

  return { results, check };
}
