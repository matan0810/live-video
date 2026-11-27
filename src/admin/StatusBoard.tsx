import { useState } from 'react';
import {
  describeSourceProblem,
  type ChannelVerdict,
  type LinkStatus,
} from '../../shared/linkStatus';
import { StatusDot, StatusLegend } from './StatusDot';
import {
  groupByVerdict,
  isStale,
  NEEDS_OWNER,
  SOURCE_TONE,
  VERDICT_TEXT,
  VERDICT_TONE,
} from './statusBoard';
import styles from './StatusBoard.module.css';

interface StatusBoardProps {
  /** undefined while loading; 'unavailable' when the Worker could not answer. */
  status: LinkStatus | null | undefined | 'unavailable';
}

const relativeTime = new Intl.RelativeTimeFormat('he', { numeric: 'auto' });

function ago(checkedAt: string, now: number) {
  const hours = Math.round((Date.parse(checkedAt) - now) / (60 * 60 * 1000));
  return Math.abs(hours) < 48
    ? relativeTime.format(hours, 'hour')
    : relativeTime.format(Math.round(hours / 24), 'day');
}

/**
 * What the daily link check found, per channel, worst first: the owner sees at a glance
 * which channels need a new link, without opening GitHub.
 */
export function StatusBoard({ status }: StatusBoardProps) {
  const [openVerdicts, setOpenVerdicts] = useState<ReadonlySet<ChannelVerdict>>(
    () => new Set(NEEDS_OWNER),
  );
  const toggle = (verdict: ChannelVerdict) =>
    setOpenVerdicts((current) => {
      const next = new Set(current);
      if (!next.delete(verdict)) next.add(verdict);
      return next;
    });
  // The page is opened fresh for each visit, so the time it was opened is close enough.
  const [now] = useState(() => Date.now());

  if (status === undefined) return null;

  const body = (() => {
    if (status === 'unavailable') {
      return <p className={styles.muted}>לא ניתן לטעון את תוצאות הבדיקה כרגע.</p>;
    }
    if (status === null) {
      return (
        <p className={styles.muted}>
          עוד אין תוצאות. הבדיקה היומית תתחיל לשלוח אותן לכאן אחרי שהגרסה הבאה תעלה.
        </p>
      );
    }
    const groups = groupByVerdict(status.channels);
    return (
      <>
        <p className={styles.muted}>
          נבדק {ago(status.checkedAt, now)}, מ{status.from}.
          {isStale(status.checkedAt, now) && (
            <strong className={styles.stale}>
              {' '}
              הבדיקה היומית לא רצה מאז: כדאי להציץ ב-Actions.
            </strong>
          )}
        </p>
        <div className={styles.chips}>
          {groups.map(({ verdict, channels }) => (
            <button
              key={verdict}
              type="button"
              className={styles.chip}
              data-verdict={verdict}
              aria-pressed={openVerdicts.has(verdict)}
              onClick={() => toggle(verdict)}
            >
              <StatusDot tone={VERDICT_TONE[verdict]} />
              <span className={styles.count}>{channels.length}</span> {VERDICT_TEXT[verdict]}
            </button>
          ))}
        </div>
        <StatusLegend />
        {groups
          // What needs the owner starts open; every group opens and closes from its chip.
          .filter(({ verdict }) => openVerdicts.has(verdict))
          .map(({ verdict, channels }) => (
            <div key={verdict} className={styles.group}>
              <h3 className={styles.groupTitle}>
                <StatusDot tone={VERDICT_TONE[verdict]} />
                {VERDICT_TEXT[verdict]}
              </h3>
              <ul className={styles.channels}>
                {channels.map((channel) => (
                  <li key={channel.id} className={styles.channel}>
                    <strong>{channel.name}</strong>
                    {channel.sources.length === 0 && (
                      <span className={styles.sourceLabel}>אין קישור; מוצג לצופים כלא זמין.</span>
                    )}
                    {channel.sources.length > 0 && (
                      <ul className={styles.sources}>
                        {channel.sources.map((source, index) => (
                          <li key={source.url}>
                            <span className={styles.sourceLabel}>
                              {index === 0 ? 'ראשי' : `גיבוי ${index}`}:
                            </span>{' '}
                            <span className={styles.state}>
                              <StatusDot tone={SOURCE_TONE[source.state]} />
                              {describeSourceProblem(source)}
                            </span>
                            <div className={styles.url} dir="ltr">
                              {source.url}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </>
    );
  })();

  return (
    <section className={styles.board} aria-labelledby="status-title">
      <h2 id="status-title" className={styles.title}>
        מצב הערוצים
      </h2>
      {body}
    </section>
  );
}
