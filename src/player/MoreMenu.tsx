import { useEffect, useRef, useState } from 'react';
import { MoreIcon } from '../components/icons';
import { useI18n } from '../i18n/context';
import type { CaptionOption } from './captionOptions';
import styles from './PlayerControls.module.css';

interface MoreMenuProps {
  captions: readonly CaptionOption[];
  selectedCaption: string | null;
  onChooseCaption: (id: string | null) => void;
}

/**
 * The "⋮" menu for settings few viewers need, so they take no room in the bar. It holds the
 * captions, and appears only on channels that carry them.
 */
export function MoreMenu({ captions, selectedCaption, onChooseCaption }: MoreMenuProps) {
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

  if (captions.length === 0) return null;

  const choose = (id: string | null) => {
    onChooseCaption(id);
    setIsOpen(false);
  };
  const item = (id: string | null, label: string) => (
    <button
      key={id ?? 'off'}
      type="button"
      role="menuitemradio"
      aria-checked={selectedCaption === id}
      className={styles.menuItem}
      onClick={() => choose(id)}
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
        <div role="menu" aria-label={t.captions} className={styles.menu} dir={t.dir}>
          <div className={styles.menuTitle}>{t.captions}</div>
          {item(null, t.captionsOff)}
          {captions.map((option) => item(option.id, option.label))}
        </div>
      )}
    </div>
  );
}
