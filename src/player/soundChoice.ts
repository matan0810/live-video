interface Sound {
  muted: boolean;
  volume: number;
}

/**
 * The viewer's sound for this visit. TV and radio play in different elements, so it is
 * kept here and given to each new one: muted stays muted on switching between them.
 * Not stored: a new visit starts with sound, as the browser allows.
 */
let current: Sound = { muted: false, volume: 1 };

export function rememberSound({ muted, volume }: Sound) {
  current = { muted, volume };
}

export function applySound(media: Sound) {
  media.muted = current.muted;
  media.volume = current.volume;
}
