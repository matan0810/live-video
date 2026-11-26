/** iPhone and iPad (an iPad says it is a Mac, but a Mac has no touch screen). */
export const isAppleMobile = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const HEVC = 'video/mp4; codecs="hvc1.1.6.L120.90"';
let hevcSupport: boolean | undefined;

/** Whether this browser plays HEVC video (Safari, and Chrome or Edge with hardware for it). */
export function canPlayHevc() {
  hevcSupport ??=
    (typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported(HEVC)) ||
    document.createElement('video').canPlayType(HEVC) !== '';
  return hevcSupport;
}
