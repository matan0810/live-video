import { useI18n } from '../i18n/context';
import type { PlayerStatus } from './useHlsPlayer';
import styles from './Player.module.css';

interface PlayerStatusOverlayProps {
  status: PlayerStatus;
  name: string;
  /** Kept on the list with no link: nothing to retry. */
  hasNoLink: boolean;
  /** The browser cannot play the stream's format: retrying would not help. */
  isUnsupportedFormat: boolean;
  errorDetail: string | null;
  onRetry: () => void;
  /** False for radio, whose card says it is connecting by itself. */
  showsLoading: boolean;
}

/** What the player says over the video while loading or when a channel cannot play. */
export function PlayerStatusOverlay({
  status,
  name,
  hasNoLink,
  isUnsupportedFormat,
  errorDetail,
  onRetry,
  showsLoading,
}: PlayerStatusOverlayProps) {
  const { t } = useI18n();
  const retry = onRetry;
  return (
    <>
      {status === 'loading' && showsLoading && (
        <div className={styles.overlay} data-passive="true" role="status">
          <span className={styles.spinner} aria-hidden="true" />
          <span>{t.loading(name)}</span>
        </div>
      )}

      {status === 'error' && hasNoLink && (
        <div className={styles.overlay} role="alert">
          <strong className={styles.errorTitle}>{t.noLinkTitle(name)}</strong>
          <span className={styles.errorHint}>{t.noLinkHint}</span>
        </div>
      )}

      {status === 'error' && !hasNoLink && (
        <div className={styles.overlay} role="alert">
          <strong className={styles.errorTitle}>{t.channelUnavailable(name)}</strong>
          <span className={styles.errorHint}>
            {isUnsupportedFormat ? t.unsupportedFormat : t.retryingSoon}
          </span>
          {errorDetail && !isUnsupportedFormat && (
            <span className={styles.errorDetail} dir="ltr">
              {errorDetail}
            </span>
          )}
          {!isUnsupportedFormat && (
            <button type="button" className={styles.primaryButton} onClick={retry}>
              {t.retryNow}
            </button>
          )}
        </div>
      )}
    </>
  );
}
