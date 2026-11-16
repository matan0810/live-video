import { useRef, useState, type FormEvent } from 'react';
import { REPORT_LIMITS, REPORT_REASONS, type ReportReason } from '../../shared/reports';
import { REASON_LABELS } from '../reports/reasonLabels';
import { submitReport } from '../api/client';
import type { Channel } from '../channels';
import { IconButton } from './IconButton';
import { FlagIcon } from './icons';
import styles from './ReportButton.module.css';

type SubmitState = 'editing' | 'sending' | 'sent' | 'failed';

interface ReportButtonProps {
  channel: Channel;
}

/** Lets a viewer tell the admin that something is wrong with the current channel. */
export function ReportButton({ channel }: ReportButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState<ReportReason>('not-working');
  const [suggestedUrl, setSuggestedUrl] = useState('');
  const [note, setNote] = useState('');
  const [state, setState] = useState<SubmitState>('editing');

  const open = () => {
    setState('editing');
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setState('sending');
    try {
      await submitReport({
        channelId: channel.id,
        channelName: channel.name,
        reason,
        note: note.trim(),
        suggestedUrl: suggestedUrl.trim(),
      });
      setState('sent');
      setNote('');
      setSuggestedUrl('');
    } catch {
      setState('failed');
    }
  };

  return (
    <>
      <IconButton label="דיווח על בעיה בערוץ" onClick={open}>
        <FlagIcon />
      </IconButton>

      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="report-title">
        {state === 'sent' ? (
          <div className={styles.body}>
            <h2 id="report-title" className={styles.title}>
              תודה, הדיווח נשלח
            </h2>
            <button type="button" className={styles.primary} onClick={close}>
              סגירה
            </button>
          </div>
        ) : (
          <form className={styles.body} onSubmit={(event) => void handleSubmit(event)}>
            <h2 id="report-title" className={styles.title}>
              דיווח על {channel.name}
            </h2>

            <fieldset className={styles.reasons}>
              <legend className={styles.label}>מה הבעיה?</legend>
              {REPORT_REASONS.map((option) => (
                <label key={option} className={styles.reason}>
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === option}
                    onChange={() => setReason(option)}
                  />
                  {REASON_LABELS[option]}
                </label>
              ))}
            </fieldset>

            <label className={styles.field}>
              <span className={styles.label}>קישור מעודכן (לא חובה)</span>
              <input
                className={styles.input}
                type="url"
                dir="ltr"
                placeholder="https://"
                pattern="https://.+"
                maxLength={REPORT_LIMITS.suggestedUrl}
                required={reason === 'new-link'}
                value={suggestedUrl}
                onChange={(event) => setSuggestedUrl(event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>פרטים נוספים (לא חובה)</span>
              <textarea
                className={styles.input}
                rows={3}
                maxLength={REPORT_LIMITS.note}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>

            {state === 'failed' && (
              <p className={styles.error} role="alert">
                השליחה נכשלה. נסו שוב בעוד רגע.
              </p>
            )}

            <div className={styles.buttons}>
              <button type="submit" className={styles.primary} disabled={state === 'sending'}>
                {state === 'sending' ? 'שולח…' : 'שליחה'}
              </button>
              <button type="button" className={styles.secondary} onClick={close}>
                ביטול
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
