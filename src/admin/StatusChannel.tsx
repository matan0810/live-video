import { describeSourceProblem, type ChannelResult } from '../../shared/linkStatus';
import { ChannelTile } from '../components/ChannelTile';
import type { DraftChannel } from './drafts';
import { StatusDot } from './StatusDot';
import { SOURCE_TONE, summaryLine, VERDICT_TONE } from './statusBoard';
import type { ChannelVerdict } from '../../shared/linkStatus';
import styles from './StatusBoard.module.css';

interface StatusChannelProps {
  result: ChannelResult;
  verdict: ChannelVerdict;
  /** The channel as the admin has it, for its logo. */
  draft: DraftChannel | undefined;
}

/** A channel: its tile, name and one line on what is wrong; its links open beneath. */
export function StatusChannel({ result, verdict, draft }: StatusChannelProps) {
  const logo = draft?.logo.trim();
  return (
    <details className={styles.channel}>
      <summary className={styles.channelSummary}>
        <ChannelTile
          className={styles.tile}
          channel={{
            id: result.id,
            name: result.name,
            short: draft?.short || [...result.name].slice(0, 3).join(''),
            sources: [],
            ...(logo ? { logo } : {}),
          }}
        />
        <span className={styles.channelText}>
          <strong>{result.name}</strong>
          <span className={styles.channelLine}>
            <StatusDot tone={VERDICT_TONE[verdict]} />
            {summaryLine(result)}
          </span>
        </span>
      </summary>
      {result.sources.length > 0 && (
        <ul className={styles.sources}>
          {result.sources.map((source, index) => (
            <li key={source.url}>
              <span className={styles.sourceLabel}>{index === 0 ? 'ראשי' : `גיבוי ${index}`}:</span>{' '}
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
    </details>
  );
}
