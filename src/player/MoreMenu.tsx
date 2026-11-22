import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoreIcon } from '../components/icons';
import { useI18n } from '../i18n/context';
import type { CaptionOption } from './captionOptions';
import { isSpeedAllowed, SPEEDS, type Speed } from './playbackSpeed';
import styles from './MoreMenu.module.css';

interface MoreMenuProps {
  captions: readonly CaptionOption[];
  selectedCaption: string | null;
  onChooseCaption: (id: string | null) => void;
  /** Offered only on channels that keep past minutes; null hides it. */
  speed: { value: Speed; isLive: boolean; onChoose: (speed: Speed) => void } | null;
  /** Shown in the menu only on the smallest screens, where the bar has no room for it. */
  onPictureInPicture: (() => void) | null;
}

type Page = 'main' | 'captions' | 'speed';

function Chevron() {
  return (
    <svg className={styles.chevron} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/**
 * The "⋮" menu, as in YouTube: one short row per setting with its current value, opening a
 * list of choices. A small pop-up by the button with a mouse; a sheet from the bottom of the
 * screen on touch screens. Always in the bar, so it does not shift between channels.
 */
export function MoreMenu({
  captions,
  selectedCaption,
  onChooseCaption,
  speed,
  onPictureInPicture,
}: MoreMenuProps) {
  const { t } = useI18n();
  const [page, setPage] = useState<Page | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = () => setPage(null);

  useEffect(() => {
    if (page === null) return;
    const onEvent = (event: Event) => {
      const isEscape = event instanceof KeyboardEvent && event.key === 'Escape';
      const isOutside =
        event instanceof PointerEvent &&
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target);
      if (isEscape || isOutside) setPage(null);
    };
    document.addEventListener('pointerdown', onEvent);
    document.addEventListener('keydown', onEvent);
    return () => {
      document.removeEventListener('pointerdown', onEvent);
      document.removeEventListener('keydown', onEvent);
    };
  }, [page]);

  const speedLabel = (value: Speed) => (value === 1 ? t.speedNormal : `×${value}`);
  const captionLabel =
    captions.find((option) => option.id === selectedCaption)?.label ?? t.captionsOff;

  const row = (label: string, value: string, target: Page) => (
    <button type="button" role="menuitem" className={styles.row} onClick={() => setPage(target)}>
      <span>{label}</span>
      <span className={styles.value}>
        <bdi>{value}</bdi>
        <Chevron />
      </span>
    </button>
  );

  const choice = (
    key: string,
    label: string,
    isChecked: boolean,
    onChoose: () => void,
    isDisabled = false,
  ) => (
    <button
      key={key}
      type="button"
      role="menuitemradio"
      aria-checked={isChecked}
      disabled={isDisabled}
      className={styles.choice}
      onClick={() => {
        onChoose();
        close();
      }}
    >
      <bdi>{label}</bdi>
    </button>
  );

  const subPage = (title: string, choices: ReactNode) => (
    <>
      <button type="button" className={styles.back} onClick={() => setPage('main')}>
        <Chevron />
        {title}
      </button>
      <div role="group" aria-label={title}>
        {choices}
      </div>
    </>
  );

  return (
    <div ref={rootRef} className={styles.more} data-open={page !== null}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={t.moreOptions}
        title={t.moreOptions}
        aria-haspopup="menu"
        aria-expanded={page !== null}
        onClick={() => setPage((current) => (current === null ? 'main' : null))}
      >
        <MoreIcon />
      </button>
      {page !== null && (
        <>
          <button type="button" className={styles.backdrop} aria-label={t.close} onClick={close} />
          <div role="menu" aria-label={t.moreOptions} className={styles.menu} dir={t.dir}>
            {page === 'main' && (
              <>
                {captions.length > 0 && row(t.captions, captionLabel, 'captions')}
                {speed && row(t.speed, speedLabel(speed.value), 'speed')}
                {captions.length === 0 && !speed && <p className={styles.empty}>{t.moreNothing}</p>}
                {onPictureInPicture && (
                  <button
                    type="button"
                    role="menuitem"
                    className={`${styles.row} ${styles.pip}`}
                    onClick={() => {
                      onPictureInPicture();
                      close();
                    }}
                  >
                    {t.pictureInPicture}
                  </button>
                )}
              </>
            )}
            {page === 'captions' &&
              subPage(t.captions, [
                choice('off', t.captionsOff, selectedCaption === null, () => onChooseCaption(null)),
                ...captions.map((option) =>
                  choice(option.id, option.label, selectedCaption === option.id, () =>
                    onChooseCaption(option.id),
                  ),
                ),
              ])}
            {page === 'speed' &&
              speed &&
              subPage(
                t.speed,
                SPEEDS.map((value) =>
                  choice(
                    String(value),
                    speedLabel(value),
                    speed.value === value,
                    () => speed.onChoose(value),
                    !isSpeedAllowed(value, speed.isLive),
                  ),
                ),
              )}
          </div>
        </>
      )}
    </div>
  );
}
