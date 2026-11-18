import type { Report } from '../../shared/reports';
import { STRINGS } from '../i18n/strings';
import { CheckBadge } from './CheckBadge';
import { useStreamChecks } from './useStreamChecks';
import styles from './Admin.module.css';

interface ReportsPanelProps {
  reports: readonly Report[];
  /** Tells whether a reported channel still exists in the list being edited. */
  hasChannel: (channelId: string) => boolean;
  onUseSuggestion: (channelId: string, url: string) => void;
  onDismiss: (reportId: string) => void;
}

const dateFormat = new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' });

export function ReportsPanel({
  reports,
  hasChannel,
  onUseSuggestion,
  onDismiss,
}: ReportsPanelProps) {
  const { results, check } = useStreamChecks();

  return (
    <section className={styles.section}>
      <h2 className={styles.subheading}>דיווחים ({reports.length})</h2>
      {reports.length === 0 && <p className={styles.muted}>אין דיווחים פתוחים.</p>}

      <ul className={styles.list}>
        {reports.map((report) => {
          const { suggestedUrl } = report;
          return (
            <li key={report.id} className={styles.card}>
              <div className={styles.reportTitle}>
                <strong>{report.channelName}</strong>
                <span className={styles.muted}>
                  {STRINGS.he.reportReasons[report.reason]} ·{' '}
                  {dateFormat.format(new Date(report.createdAt))}
                </span>
              </div>
              {report.note && <p className={styles.note}>{report.note}</p>}
              {suggestedUrl && (
                <p className={styles.url} dir="ltr">
                  {suggestedUrl} <CheckBadge state={results.get(suggestedUrl)} />
                </p>
              )}
              <div className={styles.actions}>
                {suggestedUrl && (
                  <>
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={() => check([suggestedUrl])}
                    >
                      בדיקת הקישור
                    </button>
                    {hasChannel(report.channelId) && (
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() => onUseSuggestion(report.channelId, suggestedUrl)}
                      >
                        הגדרה כקישור הראשי
                      </button>
                    )}
                  </>
                )}
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => onDismiss(report.id)}
                >
                  טופל
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
