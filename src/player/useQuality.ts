import type Hls from 'hls.js';
import { useCallback, useEffect, useState, type RefObject } from 'react';
import { qualityOptions, type QualityOption } from './qualityOptions';

/**
 * The picture heights a stream offers and the one chosen (null: automatic, which follows
 * the connection and never exceeds the player's size). Only with hls.js: the browser's own
 * HLS player (Safari) chooses by itself and offers nothing to pick.
 */
export function useQuality(hlsRef: RefObject<Hls | null>, channelKey: string) {
  const [options, setOptions] = useState<QualityOption[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  /** The height playing now, shown beside "Auto" as YouTube does. */
  const [playingHeight, setPlayingHeight] = useState<number | null>(null);

  // A new channel starts automatic, with its own list (reset during render).
  const [shownFor, setShownFor] = useState(channelKey);
  if (shownFor !== channelKey) {
    setShownFor(channelKey);
    setOptions([]);
    setChosen(null);
    setPlayingHeight(null);
  }

  useEffect(() => {
    // hls.js learns the levels from the playlist after the element exists, and swaps them
    // when it moves to a backup link, so they are read again now and then.
    const read = () => {
      const hls = hlsRef.current;
      setOptions(hls ? qualityOptions(hls.levels) : []);
      const playing = hls?.levels[hls.currentLevel]?.height;
      setPlayingHeight(playing && playing > 0 ? playing : null);
    };
    read();
    const poll = setInterval(read, 1500);
    return () => clearInterval(poll);
  }, [hlsRef, channelKey]);

  const choose = useCallback(
    (height: number | null) => {
      const hls = hlsRef.current;
      if (!hls) return;
      const option = qualityOptions(hls.levels).find((entry) => entry.height === height);
      // -1 hands the choice back to hls.js.
      hls.currentLevel = option ? option.levelIndex : -1;
      setChosen(option ? option.height : null);
    },
    [hlsRef],
  );

  return { options, chosen, playingHeight, choose };
}
