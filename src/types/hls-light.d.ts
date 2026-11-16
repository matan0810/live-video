// hls.js ships its "light" build (no subtitles, alternate audio or DRM) without
// type declarations. Its API is the same as the full build's.
declare module 'hls.js/light' {
  export * from 'hls.js';
  export { default } from 'hls.js';
}
