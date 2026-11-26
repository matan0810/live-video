/** iPhone and iPad (an iPad says it is a Mac, but a Mac has no touch screen). */
export const isAppleMobile = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
