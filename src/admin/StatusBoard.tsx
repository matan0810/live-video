import { useState } from 'react';
import type { ChannelVerdict, LinkStatus } from '../../shared/linkStatus';
import type { DraftChannel } from './drafts';
import { StatusChannel } from './StatusChannel';
import { StatusCounts } from './StatusCounts';
import { StatusDot, StatusLegend } from './StatusDot';
import { groupByVerdict, isStale, OPEN_AT_FIRST, VERDICT_TEXT, VERDICT_TONE } from './statusBoard';
import styles from './StatusBoard.module.css';

interface StatusBoardProps {
  /** undefined while loading; 'unavailable' when the Worker could not answer. */
  status: LinkStatus | null | undefined | 'unavailable';
  /** The channels as the admin has them, for their logos. */
  drafts: readonly DraftChannel[];
}

const relativeTime = new Intl.RelativeTimeFormat('he', { numeric: 'auto' });

function ago(checkedAt: string, now: number) {
  const hours = Math.round((Date.parse(checkedAt) - now) / (60 * 60 * 1000));
  return Math.abs(hours) < 48
    ? relativeTime.format(hours, 'hour')
    : relativeTime.format(Math.round(hours / 24), 'day');
}

/**
 * What the daily link check found: how many channels stand where, as plain words, and
 * under them the channels that need a look, each with its logo and one line.
 */
export function StatusBoard({ status, drafts }: StatusBoardProps) {
  const [openVerdicts, setOpenVerdicts] = useState<ReadonlySet<ChannelVerdict>>(
    () => new Set(OPEN_AT_FIRST),
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
        <StatusCounts groups={groups} open={openVerdicts} onToggle={toggle} />
        {groups
          .filter(({ verdict }) => openVerdicts.has(verdict))
          .map(({ verdict, channels }) => (
            <div key={verdict} className={styles.group}>
              <h3 className={styles.groupTitle}>
                <StatusDot tone={VERDICT_TONE[verdict]} />
                {VERDICT_TEXT[verdict]} ({channels.length})
              </h3>
              <div className={styles.channels}>
                {channels.map((channel) => (
                  <StatusChannel
                    key={channel.id}
                    result={channel}
                    verdict={verdict}
                    draft={drafts.find((draft) => draft.id === channel.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        <StatusLegend />
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
