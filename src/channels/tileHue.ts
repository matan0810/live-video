/** Gives every channel its own stable tile colour without storing one per channel. */
export function tileHue(channelId: string) {
  let hash = 0;
  for (const char of channelId) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}
