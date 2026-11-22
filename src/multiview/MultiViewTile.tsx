import { useEffect } from 'react';
import { CloseIcon, ExpandIcon, SpeakerIcon } from '../components/icons';
import type { Channel } from '../channels';
import { displayName } from '../channels/displayName';
import { useI18n } from '../i18n/context';
import { useHlsPlayer, type PlayerStatus } from '../player/useHlsPlayer';
import styles from './MultiViewGrid.module.css';

interface MultiViewTileProps {
  channel: Channel;
  /** The heard channel; every other tile plays without sound. */
  isFocused: boolean;
  onFocus: () => void;
  onExpand: () => void;
  onRemove: () => void;
  onStatusChange: (channelId: string, status: PlayerStatus) => void;
}

/** One channel in the grid: the picture, its name, and buttons to hear, enlarge or remove it. */
export function MultiViewTile({
  channel,
  isFocused,
  onFocus,
  onExpand,
  onRemove,
  onStatusChange,
}: MultiViewTileProps) {
  const { t, language } = useI18n();
  const { videoRef, status, isAutoMuted, unmute } = useHlsPlayer(channel.sources);
  const name = displayName(channel, language);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = !isFocused;
  }, [isFocused, videoRef]);

  useEffect(() => {
    onStatusChange(channel.id, status);
  }, [channel.id, status, onStatusChange]);

  return (
    <div className={styles.tile} data-focused={isFocused}>
      <video ref={videoRef} className={styles.video} playsInline muted />
      {/* The whole picture is the button that brings this channel's sound. */}
      <button
        type="button"
        className={styles.hear}
        aria-label={t.multiViewHear(name)}
        aria-pressed={isFocused}
        onClick={onFocus}
        onDoubleClick={onExpand}
      />
      {status !== 'playing' && (
        <p className={styles.status} role={status === 'error' ? 'alert' : undefined}>
          {status === 'error'
            ? channel.sources.length === 0
              ? t.noLinkTitle(name)
              : t.channelUnavailable(name)
            : t.loading(name)}
        </p>
      )}
      {isFocused && isAutoMuted && status === 'playing' && (
        <button type="button" className={styles.unmute} onClick={unmute}>
          {t.autoMuted}
        </button>
      )}
      <div className={styles.label}>
        {isFocused && <SpeakerIcon />}
        <span>{name}</span>
      </div>
      <div className={styles.tools}>
        <button
          type="button"
          className={styles.tool}
          aria-label={t.multiViewExpand(name)}
          title={t.multiViewExpand(name)}
          onClick={onExpand}
        >
          <ExpandIcon />
        </button>
        <button
          type="button"
          className={styles.tool}
          aria-label={t.multiViewRemove(name)}
          title={t.multiViewRemove(name)}
          onClick={onRemove}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
