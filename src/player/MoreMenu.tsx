import { useEffect, useRef, useState } from 'react';
import { MoreIcon } from '../components/icons';
import { useI18n } from '../i18n/context';
import type { CaptionOption } from './captionOptions';
import { isSpeedAllowed, SPEEDS, type Speed } from './playbackSpeed';
import styles from './PlayerControls.module.css';

interface MoreMenuProps {
  captions: readonly CaptionOption[];
  selectedCaption: string | null;
  onChooseCaption: (id: string | null) => void;
  /** Offered only on channels that keep past minutes; null hides it. */
  speed: { value: Speed; isLive: boolean; onChoose: (speed: Speed) => void } | null;
}

/**
 * The "⋮" menu for settings few viewers need, so they take no room in the bar: captions on
 * channels that carry them, speed on channels with rewind. Hidden when it would be empty.
 */
export function MoreMenu({ captions, selectedCaption, onChooseCaption, speed }: MoreMenuProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const close = (event: Event) => {
      const isEscape = event instanceof KeyboardEvent && event.key === 'Escape';
      const isOutside =
        event instanceof PointerEvent &&
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target);
      if (isEscape || isOutside) setIsOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [isOpen]);

  if (captions.length === 0 && !speed) return null;

  const item = (
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
      className={styles.menuItem}
      onClick={() => {
        onChoose();
        setIsOpen(false);
      }}
    >
      {label}
    </button>
  );

  return (
    <div ref={rootRef} className={styles.more} data-open={isOpen}>
      <button
        type="button"
        className={styles.button}
        aria-label={t.moreOptions}
        title={t.moreOptions}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <MoreIcon />
      </button>
      {isOpen && (
        <div role="menu" aria-label={t.moreOptions} className={styles.menu} dir={t.dir}>
          {captions.length > 0 && (
            <div role="group" aria-label={t.captions}>
              <div className={styles.menuTitle}>{t.captions}</div>
              {item('off', t.captionsOff, selectedCaption === null, () => onChooseCaption(null))}
              {captions.map((option) =>
                item(option.id, option.label, selectedCaption === option.id, () =>
                  onChooseCaption(option.id),
                ),
              )}
            </div>
          )}
          {speed && (
            <div role="group" aria-label={t.speed}>
              <div className={styles.menuTitle}>{t.speed}</div>
              {SPEEDS.map((value) =>
                item(
                  String(value),
                  value === 1 ? t.speedNormal : `×${value}`,
                  speed.value === value,
                  () => speed.onChoose(value),
                  !isSpeedAllowed(value, speed.isLive),
                ),
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
