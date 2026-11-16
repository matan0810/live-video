import { useId, useState, type FormEvent } from 'react';
import type { Channel } from '../channels';
import { createCustomChannel, type CustomChannelError } from '../channels/customChannels';
import { PlusIcon } from './icons';
import styles from './AddChannelForm.module.css';

const ERROR_MESSAGES: Record<CustomChannelError, string> = {
  'missing-name': 'צריך לתת לערוץ שם',
  'invalid-url': 'הקישור צריך להיות כתובת https מלאה לקובץ m3u8',
};

interface AddChannelFormProps {
  onAdd: (channel: Channel) => void;
}

export function AddChannelForm({ onAdd }: AddChannelFormProps) {
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
        הוספת ערוץ משלך
      </button>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label className={styles.label} htmlFor={nameId}>
        שם הערוץ
      </label>
      <input
        id={nameId}
        className={styles.input}
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoFocus
      />

      <label className={styles.label} htmlFor={urlId}>
        קישור לשידור (m3u8)
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
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <div className={styles.buttons}>
        <button type="submit" className={styles.submit}>
          הוספה
        </button>
        <button type="button" className={styles.cancel} onClick={close}>
          ביטול
        </button>
      </div>
      <p className={styles.note}>הערוץ נשמר רק בדפדפן הזה.</p>
    </form>
  );
}
