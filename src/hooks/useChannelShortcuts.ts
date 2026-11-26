import { useMemo, type RefObject } from 'react';
import type { Channel } from '../channels';
import { useKeyboardShortcuts, type KeyboardShortcuts } from './useKeyboardShortcuts';

const DIGIT_SHORTCUT_COUNT = 9;

interface ChannelShortcuts {
  channels: readonly Channel[];
  onChoose: (channelId: string) => void;
  onStep: (offset: 1 | -1) => void;
  onToggleTheater: () => void;
  /** Between the TV and radio tabs. */
  onToggleTab: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
}

/**
 * The site's keys (the player has its own): 1–9, ↑ / ↓, T theatre mode, R TV or radio,
 * / search.
 */
export function useChannelShortcuts({
  channels,
  onChoose,
  onStep,
  onToggleTheater,
  onToggleTab,
  searchRef,
}: ChannelShortcuts) {
  const shortcuts = useMemo<KeyboardShortcuts>(() => {
    const digitShortcuts = Object.fromEntries(
      channels
        .slice(0, DIGIT_SHORTCUT_COUNT)
        .map((channel, index) => [`Digit${index + 1}`, () => onChoose(channel.id)]),
    );
    return {
      ...digitShortcuts,
      ArrowDown: () => onStep(1),
      ArrowUp: () => onStep(-1),
      KeyT: onToggleTheater,
      KeyR: onToggleTab,
      Slash: () => searchRef.current?.focus(),
    };
  }, [channels, onChoose, onStep, onToggleTheater, onToggleTab, searchRef]);
  useKeyboardShortcuts(shortcuts);
}
