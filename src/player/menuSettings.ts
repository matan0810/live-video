import type { Strings } from '../i18n/strings';
import type { CaptionOption } from './captionOptions';
import { isSpeedAllowed, SPEEDS, type Speed } from './playbackSpeed';
import type { QualityOption } from './qualityOptions';
import { SLEEP_MINUTES, type SleepMinutes } from './sleepTimer';

export interface MenuChoice {
  key: string;
  label: string;
  isChecked: boolean;
  isDisabled?: boolean;
  onChoose: () => void;
}

/** One row of the "⋮" menu: its name, its current value, and the list it opens. */
export interface MenuSetting {
  id: string;
  label: string;
  value: string;
  choices: MenuChoice[];
}

export interface MenuState {
  captions: {
    options: readonly CaptionOption[];
    selected: string | null;
    choose: (id: string | null) => void;
  };
  /** Null on channels without rewind, where speed means nothing. */
  speed: { value: Speed; isLive: boolean; choose: (speed: Speed) => void } | null;
  quality: {
    options: readonly QualityOption[];
    chosen: number | null;
    playingHeight: number | null;
    choose: (height: number | null) => void;
  };
  sleep: { minutesLeft: number | null; start: (minutes: SleepMinutes | null) => void };
}

/**
 * The menu's rows, in YouTube's order, each only when it offers a real choice: captions on
 * channels that carry them, speed with rewind, quality when the stream has more than one.
 * The sleep timer is always there.
 */
export function menuSettings(state: MenuState, t: Strings): MenuSetting[] {
  const { captions, speed, quality, sleep } = state;
  const settings: MenuSetting[] = [];

  if (captions.options.length > 0) {
    settings.push({
      id: 'captions',
      label: t.captions,
      value:
        captions.options.find((option) => option.id === captions.selected)?.label ?? t.captionsOff,
      choices: [
        {
          key: 'off',
          label: t.captionsOff,
          isChecked: captions.selected === null,
          onChoose: () => captions.choose(null),
        },
        ...captions.options.map((option) => ({
          key: option.id,
          label: option.label,
          isChecked: captions.selected === option.id,
          onChoose: () => captions.choose(option.id),
        })),
      ],
    });
  }

  if (speed) {
    const label = (value: Speed) => (value === 1 ? t.speedNormal : `×${value}`);
    settings.push({
      id: 'speed',
      label: t.speed,
      value: label(speed.value),
      choices: SPEEDS.map((value) => ({
        key: String(value),
        label: label(value),
        isChecked: speed.value === value,
        isDisabled: !isSpeedAllowed(value, speed.isLive),
        onChoose: () => speed.choose(value),
      })),
    });
  }

  if (quality.options.length > 1) {
    const auto = quality.playingHeight ? t.qualityAutoNow(quality.playingHeight) : t.qualityAuto;
    settings.push({
      id: 'quality',
      label: t.quality,
      value: quality.chosen === null ? auto : `${quality.chosen}p`,
      choices: [
        ...quality.options.map(({ height }) => ({
          key: String(height),
          label: `${height}p`,
          isChecked: quality.chosen === height,
          onChoose: () => quality.choose(height),
        })),
        {
          key: 'auto',
          label: auto,
          isChecked: quality.chosen === null,
          onChoose: () => quality.choose(null),
        },
      ],
    });
  }

  settings.push({
    id: 'sleep',
    label: t.sleepTimer,
    value: sleep.minutesLeft === null ? t.sleepOff : t.sleepLeft(sleep.minutesLeft),
    choices: [
      {
        key: 'off',
        label: t.sleepOff,
        isChecked: sleep.minutesLeft === null,
        onChoose: () => sleep.start(null),
      },
      ...SLEEP_MINUTES.map((minutes) => ({
        key: String(minutes),
        label: t.sleepMinutes(minutes),
        // A running timer counts down, so no fixed choice is marked as chosen.
        isChecked: false,
        onChoose: () => sleep.start(minutes),
      })),
    ],
  });

  return settings;
}
