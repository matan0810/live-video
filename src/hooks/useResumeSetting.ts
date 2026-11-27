import { DEFAULT_RESUME, parseResumeChoice, RESUME_KEY } from '../player/resumeSetting';
import { useLocalStorage } from './useLocalStorage';

/** How long a place in a live stream is kept, remembered on this device. */
export function useResumeSetting() {
  return useLocalStorage(RESUME_KEY, DEFAULT_RESUME, parseResumeChoice);
}
