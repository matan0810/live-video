/** Formats seconds as m:ss, or h:mm:ss from one hour up. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const pad = (value: number) => String(value).padStart(2, '0');
  const tail = `${pad(seconds % 60)}`;
  return hours > 0 ? `${hours}:${pad(minutes)}:${tail}` : `${minutes}:${tail}`;
}
