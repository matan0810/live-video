import type Hls from 'hls.js';
import { useMemo, type RefObject } from 'react';
import { useI18n } from '../i18n/context';
import { menuSettings } from './menuSettings';
import { useCaptions } from './useCaptions';
import { usePlaybackSpeed } from './usePlaybackSpeed';
import { useQuality } from './useQuality';
import { useSleepTimer } from './useSleepTimer';

/**
 * Everything the "⋮" menu controls (captions, speed, quality, the sleep timer), kept
 * together so the player itself only places the menu.
 */
export function usePlayerMenu(
  videoRef: RefObject<HTMLVideoElement | null>,
  hlsRef: RefObject<Hls | null>,
  channelKey: string,
  dvr: { canRewind: boolean; isLive: boolean },
) {
  const { t } = useI18n();
  const captions = useCaptions(videoRef, hlsRef, channelKey);
  const speed = usePlaybackSpeed(videoRef, dvr.isLive, channelKey);
  const quality = useQuality(hlsRef, channelKey);
  const sleep = useSleepTimer(videoRef);

  return useMemo(
    () =>
      menuSettings(
        {
          captions,
          speed: dvr.canRewind
            ? { value: speed.speed, isLive: dvr.isLive, choose: speed.setSpeed }
            : null,
          quality,
          sleep,
        },
        t,
      ),
    [captions, speed.speed, speed.setSpeed, dvr.canRewind, dvr.isLive, quality, sleep, t],
  );
}
