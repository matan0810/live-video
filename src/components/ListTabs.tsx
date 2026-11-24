import type { ChannelKind } from '../channels/channelKinds';
import { useI18n } from '../i18n/context';
import { RadioIcon, TvIcon } from './icons';
import styles from './ListTabs.module.css';

interface ListTabsProps {
  kind: ChannelKind;
  onChange: (kind: ChannelKind) => void;
}

/** TV or radio, above the list: the two never mix. */
export function ListTabs({ kind, onChange }: ListTabsProps) {
  const { t } = useI18n();
  const tabs = [
    { id: 'tv', label: t.tabTv, icon: <TvIcon /> },
    { id: 'radio', label: t.tabRadio, icon: <RadioIcon /> },
  ] as const;
  return (
    <div className={styles.tabs} role="tablist" aria-label={t.listTabs}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={kind === tab.id}
          className={styles.tab}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
