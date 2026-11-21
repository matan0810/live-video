import type Hls from 'hls.js';
import { useCallback, useEffect, useState, type RefObject } from 'react';
import { useI18n } from '../i18n/context';
import { trackLabel, uniqueByLabel, type CaptionOption } from './captionOptions';

const TEXT_KINDS = new Set(['captions', 'subtitles']);

/**
 * The captions a channel offers and the one shown. Subtitle tracks are loaded by hls.js
 * (it fetches them only once one is chosen); captions carried inside the video (CEA-608)
 * and, without hls.js, the browser's own tracks are text tracks on the element.
 */
export function useCaptions(
  videoRef: RefObject<HTMLVideoElement | null>,
  hlsRef: RefObject<Hls | null>,
  channelKey: string,
) {
  const { t, language } = useI18n();
  const [options, setOptions] = useState<CaptionOption[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const read = useCallback(() => {
    const video = videoRef.current;
    const hls = hlsRef.current;
    const found: CaptionOption[] = [];
    hls?.subtitleTracks.forEach((track, index) => {
      found.push({
        id: `sub-${index}`,
        label: trackLabel(track.name, track.lang, index, t.captionTrack, language),
      });
    });
    if (video) {
      [...video.textTracks].forEach((track, index) => {
        // hls.js mirrors its subtitle tracks here too; those are listed above already.
        if (!TEXT_KINDS.has(track.kind) || (hls && track.kind === 'subtitles')) return;
        found.push({
          id: `text-${index}`,
          label: trackLabel(track.label, track.language, index, t.captionTrack, language),
        });
      });
    }
    setOptions(uniqueByLabel(found));
  }, [videoRef, hlsRef, t, language]);

  // A new channel starts with captions off and its own list (reset during render, so the
  // previous channel's list never shows for the new one).
  const [shownFor, setShownFor] = useState(channelKey);
  if (shownFor !== channelKey) {
    setShownFor(channelKey);
    setSelected(null);
    setOptions([]);
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const tracks = video.textTracks;
    tracks.addEventListener('addtrack', read);
    tracks.addEventListener('removetrack', read);
    // hls.js learns its subtitle tracks from the playlist, after the element exists.
    const poll = setInterval(read, 1500);
    return () => {
      tracks.removeEventListener('addtrack', read);
      tracks.removeEventListener('removetrack', read);
      clearInterval(poll);
    };
  }, [videoRef, read, channelKey]);

  const choose = useCallback(
    (id: string | null) => {
      const video = videoRef.current;
      const hls = hlsRef.current;
      if (hls) {
        const subtitle = id?.startsWith('sub-') ? Number(id.slice(4)) : -1;
        hls.subtitleTrack = subtitle;
        hls.subtitleDisplay = subtitle !== -1;
      }
      if (video) {
        [...video.textTracks].forEach((track, index) => {
          if (!TEXT_KINDS.has(track.kind)) return;
          if (hls && track.kind === 'subtitles') return; // hls.js shows its own
          track.mode = id === `text-${index}` ? 'showing' : 'disabled';
        });
      }
      setSelected(id);
    },
    [videoRef, hlsRef],
  );

  return { options, selected, choose };
}
