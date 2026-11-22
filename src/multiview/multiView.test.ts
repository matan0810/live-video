import { describe, expect, it } from 'vitest';
import {
  fitTo,
  parseMultiView,
  pickChannel,
  removeChannel,
  startMultiView,
  withExisting,
} from './multiView';

const view = (focusedId: string, ...channelIds: string[]) => ({ channelIds, focusedId });

describe('pickChannel', () => {
  it('adds a new channel and gives it the sound', () => {
    expect(pickChannel(startMultiView('a'), 'b', 4)).toEqual(view('b', 'a', 'b'));
  });

  it('gives the sound to a channel already on screen', () => {
    expect(pickChannel(view('b', 'a', 'b'), 'a', 4)).toEqual(view('a', 'a', 'b'));
  });

  it('when full, replaces the channel being heard', () => {
    expect(pickChannel(view('b', 'a', 'b', 'c', 'd'), 'e', 4)).toEqual(
      view('e', 'a', 'e', 'c', 'd'),
    );
    expect(pickChannel(view('a', 'a', 'b'), 'c', 2)).toEqual(view('c', 'c', 'b'));
  });
});

describe('removeChannel', () => {
  it('moves the sound to the first channel left', () => {
    expect(removeChannel(view('b', 'a', 'b', 'c'), 'b')).toEqual(view('a', 'a', 'c'));
    expect(removeChannel(view('c', 'a', 'b', 'c'), 'a')).toEqual(view('c', 'b', 'c'));
  });

  it('ends when the last channel goes', () => {
    expect(removeChannel(view('a', 'a'), 'a')).toBeNull();
  });
});

describe('fitTo', () => {
  it('keeps the heard channel when the screen narrows', () => {
    expect(fitTo(view('c', 'a', 'b', 'c', 'd'), 2)).toEqual(view('c', 'a', 'c'));
    expect(fitTo(view('a', 'a', 'b'), 2)).toEqual(view('a', 'a', 'b'));
  });
});

describe('withExisting', () => {
  it('drops channels no longer on the list', () => {
    expect(withExisting(view('b', 'a', 'b'), (id) => id !== 'b')).toEqual(view('a', 'a'));
    expect(withExisting(view('a', 'a'), () => false)).toBeNull();
  });
});

describe('parseMultiView', () => {
  it('reads a stored view', () => {
    expect(parseMultiView(view('b', 'a', 'b'))).toEqual(view('b', 'a', 'b'));
  });

  it('refuses or trims anything else', () => {
    expect(parseMultiView(null)).toBeNull();
    expect(parseMultiView({ channelIds: [], focusedId: 'a' })).toBeNull();
    expect(parseMultiView(view('z', 'a'))).toBeNull();
    expect(
      parseMultiView({ channelIds: ['a', 'a', 7, 'b', 'c', 'd', 'e'], focusedId: 'a' }),
    ).toEqual(view('a', 'a', 'b', 'c', 'd'));
  });
});
