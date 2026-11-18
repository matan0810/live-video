import { useId, useState, type FormEvent } from 'react';
import type { Channel } from '../channels';
import { createCustomChannel, type CustomChannelError } from '../channels/customChannels';
import { useI18n } from '../i18n/context';
import { PlusIcon } from './icons';
import styles from './AddChannelForm.module.css';

interface AddChannelFormProps {
  onAdd: (channel: Channel) => void;
}

export function AddChannelForm({ onAdd }: AddChannelFormProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<CustomChannelError | null>(null);
  const nameId = useId();
  const urlId = useId();
  const errorId = useId();

  const close = () => {
    setIsOpen(false);
    setName('');
    setUrl('');
    setError(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = createCustomChannel(name, url);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onAdd(result.channel);
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
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
