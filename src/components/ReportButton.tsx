import { useRef, useState, type FormEvent } from 'react';
import { REPORT_LIMITS, REPORT_REASONS, type ReportReason } from '../../shared/reports';
import { ApiError, submitReport } from '../api/client';
import type { Channel } from '../channels';
import { displayName } from '../channels/displayName';
import { useI18n } from '../i18n/context';
import type { Strings } from '../i18n/strings';
import { IconButton } from './IconButton';
import { FlagIcon } from './icons';
import styles from './ReportButton.module.css';

type SubmitState = 'editing' | 'sending' | 'sent' | 'failed';

/** Says why a report did not go through, so a blocked network is told apart from a refusal. */
function describeFailure(error: unknown, t: Strings) {
  if (!(error instanceof ApiError)) return t.reportFailed;
  if (error.status === 429) return t.reportTooMany;
  if (error.status === 0) return t.reportNoConnection;
  return t.reportFailedCode(error.status);
}

interface ReportButtonProps {
  channel: Channel;
}

/** Lets a viewer tell the admin that something is wrong with the current channel. */
export function ReportButton({ channel }: ReportButtonProps) {
  const { t, language } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState<ReportReason>('not-working');
  const [suggestedUrl, setSuggestedUrl] = useState('');
  const [failure, setFailure] = useState<unknown>(null);
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
    } catch (caught) {
      setFailure(caught);
      setState('failed');
    }
  };

  return (
    <>
      <IconButton label={t.report} onClick={open}>
        <FlagIcon />
      </IconButton>

      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="report-title">
        {state === 'sent' ? (
          <div className={styles.body}>
            <h2 id="report-title" className={styles.title}>
              {t.reportSent}
            </h2>
            <button type="button" className={styles.primary} onClick={close}>
              {t.close}
            </button>
          </div>
        ) : (
          <form className={styles.body} onSubmit={(event) => void handleSubmit(event)}>
            <h2 id="report-title" className={styles.title}>
              {t.reportTitle(displayName(channel, language))}
            </h2>

            <fieldset className={styles.reasons}>
              <legend className={styles.label}>{t.reportQuestion}</legend>
              {REPORT_REASONS.map((option) => (
                <label key={option} className={styles.reason}>
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === option}
                    onChange={() => setReason(option)}
                  />
                  {t.reportReasons[option]}
                </label>
              ))}
            </fieldset>

            <label className={styles.field}>
              <span className={styles.label}>{t.reportLink}</span>
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
              <span className={styles.label}>{t.reportDetails}</span>
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
                {describeFailure(failure, t)}
              </p>
            )}

            <div className={styles.buttons}>
              <button type="submit" className={styles.primary} disabled={state === 'sending'}>
                {state === 'sending' ? t.sending : t.send}
              </button>
              <button type="button" className={styles.secondary} onClick={close}>
                {t.cancel}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
