import type { Tone } from './channelHealth';
import styles from './StatusDot.module.css';

/** A coloured dot: green works, amber works with something to know, red does not, grey unknown. */
export function StatusDot({ tone }: { tone: Tone }) {
  return <i className={styles.dot} data-tone={tone} aria-hidden="true" />;
}

const MEANINGS: readonly { tone: Tone; text: string }[] = [
  { tone: 'good', text: 'תקין' },
  { tone: 'warn', text: 'עובד, עם משהו לדעת (גיבוי שבור, בלי קול…)' },
  { tone: 'bad', text: 'לא עובד או בלי קישור' },
  { tone: 'unknown', text: 'לא נבדק' },
];

/** What each dot means, said once beside the lists that use them. */
export function StatusLegend() {
  return (
    <ul className={styles.legend} aria-label="מקרא">
      {MEANINGS.map(({ tone, text }) => (
        <li key={tone}>
          <StatusDot tone={tone} />
          {text}
        </li>
      ))}
    </ul>
  );
}
