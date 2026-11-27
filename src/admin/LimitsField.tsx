import { CHANNEL_LIMITS, type ChannelLimit } from '../../shared/channels/types';
import { STRINGS } from '../i18n/strings';
import styles from './Admin.module.css';

interface LimitsFieldProps {
  limits: readonly ChannelLimit[];
  onChange: (limits: ChannelLimit[]) => void;
}

/** In the admin's words: what each tag means, not what a viewer is told. */
const ADMIN_LABELS: Record<ChannelLimit, string> = {
  'no-sound': STRINGS.he.limits['no-sound'],
  'low-quality': STRINGS.he.limits['low-quality'],
  hevc: 'HEVC בלבד (מוצג רק בדפדפן שלא מנגן אותו)',
};

/** Tags for a channel that works only in part; viewers see them beside its name. */
export function LimitsField({ limits, onChange }: LimitsFieldProps) {
  return (
    <fieldset className={styles.limits}>
      <legend className={styles.label}>עובד חלקית (לא חובה)</legend>
      {CHANNEL_LIMITS.map((limit) => (
        <label key={limit} className={styles.limit}>
          <input
            type="checkbox"
            checked={limits.includes(limit)}
            onChange={(event) =>
              onChange(
                CHANNEL_LIMITS.filter((known) =>
                  known === limit ? event.target.checked : limits.includes(known),
                ),
              )
            }
          />
          {ADMIN_LABELS[limit]}
        </label>
      ))}
    </fieldset>
  );
}
