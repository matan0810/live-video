/**
 * Watching several channels at once: which channels are on screen, in order, and which one
 * is heard (only one plays sound). Plain data, so the rules are testable apart from the UI.
 */
export interface MultiView {
  channelIds: readonly string[];
  /** The channel whose sound plays; always one of `channelIds`. */
  focusedId: string;
}

/** Wide screens fit four channels; a phone two, one above the other. */
export const MAX_CHANNELS_WIDE = 4;
export const MAX_CHANNELS_NARROW = 2;

export function startMultiView(currentId: string): MultiView {
  return { channelIds: [currentId], focusedId: currentId };
}

/**
 * A channel picked from the list while watching several: one already on screen gets the
 * sound; a new one joins and gets the sound; when the screen is full it takes the place of
 * the channel being heard, the one the viewer is done with.
 */
export function pickChannel(view: MultiView, channelId: string, max: number): MultiView {
  if (view.channelIds.includes(channelId)) return { ...view, focusedId: channelId };
  const channelIds =
    view.channelIds.length < max
      ? [...view.channelIds, channelId]
      : view.channelIds.map((id) => (id === view.focusedId ? channelId : id));
  return { channelIds, focusedId: channelId };
}

/** Takes a channel off the screen; the sound moves to the first one left. Null when none is. */
export function removeChannel(view: MultiView, channelId: string): MultiView | null {
  const channelIds = view.channelIds.filter((id) => id !== channelId);
  const [first] = channelIds;
  if (first === undefined) return null;
  return { channelIds, focusedId: view.focusedId === channelId ? first : view.focusedId };
}

/** When the screen narrows, keeps as many as fit, the heard channel among them. */
export function fitTo(view: MultiView, max: number): MultiView {
  if (view.channelIds.length <= max) return view;
  const others = view.channelIds.filter((id) => id !== view.focusedId).slice(0, max - 1);
  const channelIds = view.channelIds.filter((id) => id === view.focusedId || others.includes(id));
  return { ...view, channelIds };
}

/** Keeps only channels that still exist; null when nothing is left to show. */
export function withExisting(view: MultiView, exists: (id: string) => boolean): MultiView | null {
  if (view.channelIds.every(exists)) return view;
  const channelIds = view.channelIds.filter(exists);
  const [first] = channelIds;
  if (first === undefined) return null;
  return { channelIds, focusedId: channelIds.includes(view.focusedId) ? view.focusedId : first };
}

const MAX_ID_LENGTH = 100;

/** Reads a stored view, or null when there is none or it is not well formed. */
export function parseMultiView(raw: unknown): MultiView | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const channelIds = 'channelIds' in raw ? raw.channelIds : undefined;
  const focusedId = 'focusedId' in raw ? raw.focusedId : undefined;
  if (!Array.isArray(channelIds) || typeof focusedId !== 'string') return null;
  const ids = channelIds.filter(
    (id): id is string => typeof id === 'string' && id.length > 0 && id.length <= MAX_ID_LENGTH,
  );
  const unique = ids.filter((id, index) => ids.indexOf(id) === index).slice(0, MAX_CHANNELS_WIDE);
  if (unique.length === 0 || !unique.includes(focusedId)) return null;
  return { channelIds: unique, focusedId };
}
