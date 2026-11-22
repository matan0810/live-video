import { useCallback, useState } from 'react';
import {
  fitTo,
  parseMultiView,
  pickChannel,
  removeChannel,
  startMultiView,
  withExisting,
  type MultiView,
} from './multiView';

const STORAGE_KEY = 'live-video:multi-view';

function load(): MultiView | null {
  try {
    return parseMultiView(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return null;
  }
}

function save(view: MultiView | null) {
  try {
    if (view) localStorage.setItem(STORAGE_KEY, JSON.stringify(view));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Remembering it across a refresh is a convenience; the view still works.
  }
}

/**
 * Watching several channels at once, kept across a refresh. What is shown always fits the
 * screen (`maxChannels`) and holds only channels still on the list; the stored choice is
 * left as it was, so turning a phone sideways and back loses nothing.
 */
export function useMultiView(maxChannels: number, exists: (channelId: string) => boolean) {
  const [stored, setStored] = useState<MultiView | null>(load);
  const existing = stored && withExisting(stored, exists);
  const view = existing && fitTo(existing, maxChannels);

  const update = useCallback((next: MultiView | null) => {
    setStored(next);
    save(next);
  }, []);

  return {
    view,
    start: (channelId: string) => update(startMultiView(channelId)),
    pick: (channelId: string) => view && update(pickChannel(view, channelId, maxChannels)),
    focus: (channelId: string) => view && update({ ...view, focusedId: channelId }),
    remove: (channelId: string) => view && update(removeChannel(view, channelId)),
    exit: () => update(null),
  };
}
