import { useEffect, useRef, useState } from 'react';
import { MoreIcon } from '../components/icons';
import { useI18n } from '../i18n/context';
import type { MenuSetting } from './menuSettings';
import styles from './MoreMenu.module.css';

interface MoreMenuProps {
  settings: readonly MenuSetting[];
  /** Shown in the menu only on the smallest screens, where the bar has no room for it. */
  onPictureInPicture: (() => void) | null;
}

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
 * screen on touch screens. The rows come from menuSettings.ts.
 */
export function MoreMenu({ settings, onPictureInPicture }: MoreMenuProps) {
  const { t } = useI18n();
  /** null: closed; 'main': the rows; otherwise the id of the setting whose list is open. */
  const [page, setPage] = useState<string | null>(null);
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

  const open = settings.find((setting) => setting.id === page);

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
            {open ? (
              <>
                <button type="button" className={styles.back} onClick={() => setPage('main')}>
                  <Chevron />
                  {open.label}
                </button>
                <div role="group" aria-label={open.label}>
                  {open.choices.map((choice) => (
                    <button
                      key={choice.key}
                      type="button"
                      role="menuitemradio"
                      aria-checked={choice.isChecked}
                      disabled={choice.isDisabled}
                      className={styles.choice}
                      onClick={() => {
                        choice.onChoose();
                        close();
                      }}
                    >
                      <bdi>{choice.label}</bdi>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {settings.map((setting) => (
                  <button
                    key={setting.id}
                    type="button"
                    role="menuitem"
                    className={styles.row}
                    onClick={() => setPage(setting.id)}
                  >
                    <span>{setting.label}</span>
                    <span className={styles.value}>
                      <bdi>{setting.value}</bdi>
                      <Chevron />
                    </span>
                  </button>
                ))}
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
          </div>
        </>
      )}
    </div>
  );
}
