import type Hls from 'hls.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveStreamUrl } from '../../shared/channels/sources';
import { networkRetryDelay, RestartBudget, StallWatch } from './recovery';

export type PlayerStatus = 'loading' | 'playing' | 'error';

/** The part of a live stream that can currently be seeked, in media time (seconds). */
export interface LiveWindow {
  start: number;
  end: number;
}

const NATIVE_HLS_TYPE = 'application/vnd.apple.mpegurl';
/** A source that has not started playing by then is treated as failed, e.g. an unsupported codec. */
const START_TIMEOUT_MS = 20_000;
/** Video that should be playing but has not moved for this long is restarted. */
const STALL_MS = 15_000;
const WATCH_INTERVAL_MS = 2000;
/** More restarts than this within the window and the source is considered broken. */
const MAX_RESTARTS = 2;
const RESTART_WINDOW_MS = 5 * 60_000;

// hls.js is most of the site's weight; it loads after the page shows, and only once.
let hlsModule: Promise<typeof Hls> | null = null;
function loadHls() {
  hlsModule ??= import('hls.js').then((module) => module.default);
  return hlsModule;
}

function hasMediaSource() {
  return 'MediaSource' in window || 'ManagedMediaSource' in window;
}

/**
 * Plays the first working HLS source on a <video> element.
 *
 * Sources are tried in order; when one fails before playing, the next is loaded, and only
 * when all of them fail does the status become `error`. A source that has played is kept
 * through network drops (retried with back-off, and at once when the device is back
 * online) and through freezes (restarted), and dropped only when that keeps failing.
 * Uses hls.js where Media Source Extensions exist and the browser's own HLS otherwise.
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
    let hasPlayed = false;
    let networkAttempts = 0;
    let startTimeout: ReturnType<typeof setTimeout> | undefined;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;
    let isWaitingForNetwork = false;
    const stallWatch = new StallWatch(STALL_MS);
    let restarts = new RestartBudget(MAX_RESTARTS, RESTART_WINDOW_MS);

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
      clearTimeout(retryTimeout);
      isWaitingForNetwork = false;
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
      hasPlayed = false;
      restarts = new RestartBudget(MAX_RESTARTS, RESTART_WINDOW_MS);
      setStatus('loading');
      void load();
    };

    /** Loads the same source again from scratch, or gives up on it when that keeps happening. */
    const restart = (detail: string) => {
      if (isDisposed) return;
      if (!restarts.take(Date.now())) {
        loadNextSource(detail);
        return;
      }
      unload();
      // Until it plays again, the start timeout watches it, not the stall watch.
      hasPlayed = false;
      setStatus('loading');
      void load();
    };

    /** A source that has played lost the network: try it again rather than drop it. */
    const recoverNetwork = (hls: Hls, detail: string) => {
      if (navigator.onLine === false) {
        // Nothing to retry until the device is back online; the `online` handler resumes.
        isWaitingForNetwork = true;
        setStatus('loading');
        return;
      }
      const delay = networkRetryDelay(networkAttempts);
      if (delay === null) {
        loadNextSource(detail);
        return;
      }
      networkAttempts += 1;
      setStatus('loading');
      clearTimeout(retryTimeout);
      retryTimeout = setTimeout(() => hls.startLoad(), delay);
    };

    const load = async () => {
      const source = sources[sourceIndex];
      if (source === undefined) {
        setStatus('error');
        return;
      }

      let url: string;
      let HlsClass: typeof Hls | null = null;
      try {
        [url, HlsClass] = await Promise.all([
          resolveStreamUrl(source),
          hasMediaSource() ? loadHls() : null,
        ]);
      } catch (error) {
        loadNextSource(error instanceof Error ? error.message : 'Could not resolve the stream');
        return;
      }
      if (isDisposed) return;
      startTimeout = setTimeout(() => loadNextSource('did not start in time'), START_TIMEOUT_MS);

      if (HlsClass?.isSupported()) {
        // Never fetch more pixels than the player shows: a small player on a phone
        // otherwise downloads full HD it cannot display. Beyond double density the
        // difference is not visible, so very dense phone screens count as double.
        const hls = new HlsClass({ capLevelToPlayerSize: true, maxDevicePixelRatio: 2 });
        let hasTriedMediaRecovery = false;
        hls.on(HlsClass.Events.FRAG_LOADED, () => {
          networkAttempts = 0;
        });
        hls.on(HlsClass.Events.ERROR, (_event, data) => {
          if (!data.fatal || !HlsClass) return;
          if (data.type === HlsClass.ErrorTypes.MEDIA_ERROR && !hasTriedMediaRecovery) {
            hasTriedMediaRecovery = true;
            hls.recoverMediaError();
            return;
          }
          const code = data.response?.code;
          const detail = code ? `${data.details} (HTTP ${code})` : data.details;
          if (hasPlayed && data.type === HlsClass.ErrorTypes.NETWORK_ERROR) {
            recoverNetwork(hls, detail);
          } else {
            loadNextSource(detail);
          }
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
      hasPlayed = true;
      setStatus('playing');
    };
    const handleVolumeChange = () => {
      if (!video.muted) setIsAutoMuted(false);
    };
    const handleNativeError = () => {
      // With hls.js, failures are reported through its own ERROR event instead.
      if (hlsRef.current || !video.error) return;
      const detail = `media error ${video.error.code}`;
      if (hasPlayed) restart(detail);
      else loadNextSource(detail);
    };
    const handleOnline = () => {
      if (!hasPlayed) return;
      // Back online: retry now instead of waiting out the back-off.
      clearTimeout(retryTimeout);
      networkAttempts = 0;
      if (hlsRef.current) {
        if (isWaitingForNetwork || video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
          isWaitingForNetwork = false;
          hlsRef.current.startLoad();
        }
      } else if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
        restart('network lost');
      }
    };

    const watch = setInterval(() => {
      const shouldBeMoving = hasPlayed && !video.paused && !video.ended && !isWaitingForNetwork;
      if (stallWatch.isStalled(Date.now(), video.currentTime, shouldBeMoving)) {
        restart('stopped moving');
      }
    }, WATCH_INTERVAL_MS);

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('error', handleNativeError);
    window.addEventListener('online', handleOnline);
    void load();

    return () => {
      isDisposed = true;
      clearInterval(watch);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('error', handleNativeError);
      window.removeEventListener('online', handleOnline);
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
