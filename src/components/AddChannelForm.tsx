import { useId, useState, type FormEvent } from 'react';
import type { Channel } from '../channels';
import type { ChannelKind } from '../channels/channelKinds';
import { createCustomChannel, type CustomChannelError } from '../channels/customChannels';
import { useI18n } from '../i18n/context';
import { PlusIcon } from './icons';
import styles from './AddChannelForm.module.css';

interface AddChannelFormProps {
  /** The tab the viewer is on: a new channel is of that kind unless they choose otherwise. */
  defaultKind: ChannelKind;
  onAdd: (channel: Channel, kind: ChannelKind) => void;
}

const KINDS = [
  { id: 'tv', label: 'tabTv' },
  { id: 'radio', label: 'tabRadio' },
] as const;

export function AddChannelForm({ defaultKind, onAdd }: AddChannelFormProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<CustomChannelError | null>(null);
  // Follows the open tab until the viewer picks a kind for this channel.
  const [chosenKind, setChosenKind] = useState<ChannelKind | null>(null);
  const kind = chosenKind ?? defaultKind;
  const nameId = useId();
  const urlId = useId();
  const errorId = useId();

  const close = () => {
    setIsOpen(false);
    setName('');
    setUrl('');
    setError(null);
    setChosenKind(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = createCustomChannel(name, url, kind);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onAdd(result.channel, kind);
    close();
  };

  if (!isOpen) {
    return (
      <button type="button" className={styles.open} onClick={() => setIsOpen(true)}>
        <PlusIcon />
        {t.addOwnChannel}
      </button>
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      // Enter adds from either field; Ctrl+Enter (⌘+Enter on a Mac) too, as in chat boxes.
      onKeyDown={(event) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          event.currentTarget.requestSubmit();
        }
      }}
      noValidate
    >
      <div className={styles.kinds} role="radiogroup" aria-label={t.channelKind}>
        {KINDS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={kind === id}
            className={styles.kind}
            onClick={() => setChosenKind(id)}
          >
            {t[label]}
          </button>
        ))}
      </div>

      <label className={styles.label} htmlFor={nameId}>
        {t.channelName}
      </label>
      <input
        id={nameId}
        className={styles.input}
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoFocus
      />

      <label className={styles.label} htmlFor={urlId}>
        {t.streamLink}
      </label>
      <input
        id={urlId}
        className={styles.input}
        type="url"
        dir="ltr"
        inputMode="url"
        placeholder="https://"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        aria-describedby={error ? errorId : undefined}
      />

      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {t.customChannelErrors[error]}
        </p>
      )}

      <div className={styles.buttons}>
        <button type="submit" className={styles.submit}>
          {t.add}
        </button>
        <button type="button" className={styles.cancel} onClick={close}>
          {t.cancel}
        </button>
      </div>
      <p className={styles.note}>{t.savedInBrowser}</p>
    </form>
  );
}
