import Hls from 'hls.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveStreamUrl } from '../../shared/channels/sources';

export type PlayerStatus = 'loading' | 'playing' | 'error';

/** The part of a live stream that can currently be seeked, in media time (seconds). */
export interface LiveWindow {
  start: number;
  end: number;
}

const NATIVE_HLS_TYPE = 'application/vnd.apple.mpegurl';
/** A source that has not started playing by then is treated as failed, e.g. an unsupported codec. */
const START_TIMEOUT_MS = 20_000;

/**
 * Plays the first working HLS source on a <video> element.
 *
 * Sources are tried in order; when one fails fatally the next is loaded, and only
 * when all of them fail does the status become `error`. Uses hls.js where Media
 * Source Extensions exist and the browser's built-in HLS support otherwise (iOS Safari).
 */
export function useHlsPlayer(sources: readonly string[]) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<PlayerStatus>('loading');
  const [attempt, setAttempt] = useState(0);
  const [isAutoMuted, setIsAutoMuted] = useState(false);
  /** Why the last source failed, shown under the error message to help diagnose a channel. */
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  // Reset the status during render when the channel changes, so the previous
  // channel's status is never shown for the new one.
  const [activeSources, setActiveSources] = useState(sources);
  if (activeSources !== sources) {
    setActiveSources(sources);
    setStatus('loading');
    setErrorDetail(null);
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let sourceIndex = 0;
    let isDisposed = false;
    let startTimeout: ReturnType<typeof setTimeout> | undefined;

    const play = () => {
      video.play().catch((error: unknown) => {
        const isAutoplayBlocked = error instanceof DOMException && error.name === 'NotAllowedError';
        if (isDisposed || !isAutoplayBlocked) return;
        // Browsers only allow autoplay without a user gesture when muted.
        video.muted = true;
        setIsAutoMuted(true);
        video.play().catch(() => undefined);
      });
    };

    const unload = () => {
      clearTimeout(startTimeout);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.removeAttribute('src');
      video.load();
    };

    const loadNextSource = (detail: string) => {
      if (isDisposed) return;
      setErrorDetail(detail);
      unload();
      sourceIndex += 1;
      setStatus('loading');
      void load();
    };

    const load = async () => {
      const source = sources[sourceIndex];
      if (source === undefined) {
        setStatus('error');
        return;
      }

      let url: string;
      try {
        url = await resolveStreamUrl(source);
      } catch (error) {
        loadNextSource(error instanceof Error ? error.message : 'Could not resolve the stream');
        return;
      }
      if (isDisposed) return;
      startTimeout = setTimeout(() => loadNextSource('did not start in time'), START_TIMEOUT_MS);

      if (Hls.isSupported()) {
        const hls = new Hls();
        let hasTriedMediaRecovery = false;
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !hasTriedMediaRecovery) {
            hasTriedMediaRecovery = true;
            hls.recoverMediaError();
            return;
          }
          const code = data.response?.code;
          loadNextSource(code ? `${data.details} (HTTP ${code})` : data.details);
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } else if (video.canPlayType(NATIVE_HLS_TYPE)) {
        video.src = url;
      } else {
        setStatus('error');
        return;
      }
      play();
    };

    const handlePlaying = () => {
      clearTimeout(startTimeout);
      setStatus('playing');
    };
    const handleVolumeChange = () => {
      if (!video.muted) setIsAutoMuted(false);
    };
    const handleNativeError = () => {
      // With hls.js, failures are reported through its own ERROR event instead.
      if (!hlsRef.current && video.error) loadNextSource(`media error ${video.error.code}`);
    };

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('error', handleNativeError);
    void load();

    return () => {
      isDisposed = true;
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('error', handleNativeError);
      unload();
    };
  }, [sources, attempt]);

  const retry = useCallback(() => {
    setStatus('loading');
    setAttempt((current) => current + 1);
  }, []);

  const unmute = useCallback(() => {
    if (videoRef.current) videoRef.current.muted = false;
  }, []);

  const getLiveWindow = useCallback((): LiveWindow | null => {
    const video = videoRef.current;
    if (!video) return null;

    const hls = hlsRef.current;
    if (hls) {
      const details = hls.latestLevelDetails;
      if (!details?.live) return null;
      return { start: details.fragmentStart, end: hls.liveSyncPosition ?? details.edge };
    }

    const { seekable } = video;
    const isLive = !Number.isFinite(video.duration);
    if (!isLive || seekable.length === 0) return null;
    return { start: seekable.start(0), end: seekable.end(seekable.length - 1) };
  }, []);

  return { videoRef, status, errorDetail, retry, isAutoMuted, unmute, getLiveWindow };
}
