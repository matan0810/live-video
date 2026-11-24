import { readPlaylistInfo } from './playlistInfo.ts';

/** Ways a stream that answers can still be useless to a viewer. */
export type StreamProblem = 'no-audio' | 'low-quality' | 'hevc-only' | 'recording' | 'blocks-site';

/** Below this height a picture is too blurry to watch. */
const MIN_HEIGHT = 360;
const AUDIO_CODEC = /^(mp4a|ac-3|ec-3|opus|flac)/i;
const HEVC_CODEC = /^(hvc1|hev1|dvh1|dvhe)/i;

function variantCodecs(playlist: string): string[][] {
  return [...playlist.matchAll(/#EXT-X-STREAM-INF:[^\n]*/g)].map((match) => {
    const codecs = /CODECS="([^"]*)"/.exec(match[0])?.[1];
    return codecs ? codecs.split(',').map((codec) => codec.trim()) : [];
  });
}

/**
 * What is wrong with a stream, judged from its first playlist and the CORS header it was
 * served with. Only what the playlist states is judged: a missing CODECS list proves nothing.
 */
export function findStreamProblems(
  playlist: string,
  allowedOrigin: string | null,
  siteOrigin: string,
): StreamProblem[] {
  const problems: StreamProblem[] = [];
  const info = readPlaylistInfo(playlist);
  const variants = variantCodecs(playlist);
  const described = variants.filter((codecs) => codecs.length > 0);
  const hasSeparateAudio = /#EXT-X-MEDIA:[^\n]*TYPE=AUDIO/.test(playlist);

  if (
    described.length > 0 &&
    described.length === variants.length &&
    !hasSeparateAudio &&
    described.every((codecs) => !codecs.some((codec) => AUDIO_CODEC.test(codec)))
  ) {
    problems.push('no-audio');
  }
  if (info.maxHeight !== null && info.maxHeight < MIN_HEIGHT) problems.push('low-quality');
  if (
    described.length > 0 &&
    described.every((codecs) => codecs.some((codec) => HEVC_CODEC.test(codec)))
  ) {
    problems.push('hevc-only');
  }
  if (!info.isLive) problems.push('recording');
  if (allowedOrigin !== '*' && allowedOrigin !== siteOrigin) problems.push('blocks-site');
  return problems;
}

/** Whether a response is a plain audio stream (a radio station over Icecast: MP3, AAC, Ogg). */
export function isAudioContentType(contentType: string): boolean {
  return /^(audio\/|application\/ogg)/i.test(contentType.trim());
}
