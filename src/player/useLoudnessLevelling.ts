import { useEffect, useState, type RefObject } from 'react';
import { levelDb, nextGainDb, smoothedLevel } from './loudness';

const TICK_MS = 250;

/** One audio context for the site, started on the viewer's first gesture (browsers require it). */
let context: AudioContext | null = null;

interface Graph {
  gain: GainNode;
  analyser: AnalyserNode;
}

/** An element can be routed through Web Audio only once; its graph is kept for it. */
const graphs = new WeakMap<HTMLMediaElement, Graph>();

function graphFor(audio: AudioContext, video: HTMLMediaElement): Graph {
  const existing = graphs.get(video);
  if (existing) return existing;
  const source = audio.createMediaElementSource(video);
  const analyser = audio.createAnalyser();
  analyser.fftSize = 2048;
  const gain = audio.createGain();
  // Catches the peaks of a channel that was turned up, so it never clips.
  const limiter = audio.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 6;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  source.connect(analyser);
  source.connect(gain);
  gain.connect(limiter);
  limiter.connect(audio.destination);
  const graph = { gain, analyser };
  graphs.set(video, graph);
  return graph;
}

/**
 * Levels loudness between channels (loudness.ts). Only where it is safe: `isEnabled` is
 * true only while hls.js plays a TV channel, whose audio the page may process; a stream the
 * browser plays by itself from another site would come out silent once routed here. Radio
 * has an element of its own, which is never routed.
 */
export function useLoudnessLevelling(
  videoRef: RefObject<HTMLVideoElement | null>,
  isEnabled: boolean,
  channelKey: string,
) {
  const [isReady, setIsReady] = useState(() => context?.state === 'running');

  // Until the viewer touches the page, audio processing cannot start; audio routed into a
  // stopped context would be silent, so nothing is routed before then.
  useEffect(() => {
    if (isReady) return;
    const start = () => {
      context ??= new AudioContext();
      context
        .resume()
        .then(() => setIsReady(true))
        .catch(() => undefined);
    };
    document.addEventListener('pointerdown', start, true);
    document.addEventListener('keydown', start, true);
    return () => {
      document.removeEventListener('pointerdown', start, true);
      document.removeEventListener('keydown', start, true);
    };
  }, [isReady]);

  useEffect(() => {
    const video = videoRef.current;
    const audio = context;
    if (!video || !audio || !isReady || !isEnabled) return;
    const graph = graphFor(audio, video);
    const samples = new Float32Array(graph.analyser.fftSize);
    // Each channel is measured afresh, from the gain the last one left.
    let level: number | null = null;
    let gainDb = 20 * Math.log10(graph.gain.gain.value || 1);
    const tick = setInterval(() => {
      // Paused or muted: nothing to measure, and the gain stays where it is.
      if (video.paused || video.muted || video.volume === 0) return;
      graph.analyser.getFloatTimeDomainData(samples);
      // The element's own volume is the viewer's choice: measured past it, never fought.
      level = smoothedLevel(level, levelDb(samples) - 20 * Math.log10(video.volume));
      gainDb = nextGainDb(gainDb, level);
      graph.gain.gain.setTargetAtTime(10 ** (gainDb / 20), audio.currentTime, 0.1);
    }, TICK_MS);
    return () => clearInterval(tick);
  }, [videoRef, isReady, isEnabled, channelKey]);
}
