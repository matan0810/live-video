import { describe, expect, it, vi } from 'vitest';
import { STRINGS } from '../i18n/strings';
import { menuSettings, type MenuState } from './menuSettings';

const t = STRINGS.he;
const bare: MenuState = {
  captions: { options: [], selected: null, choose: vi.fn() },
  speed: null,
  quality: { options: [], chosen: null, playingHeight: null, choose: vi.fn() },
  sleep: { minutesLeft: null, start: vi.fn() },
};

describe('menuSettings', () => {
  it('always offers the sleep timer, and nothing that has no real choice', () => {
    const settings = menuSettings(
      { ...bare, quality: { ...bare.quality, options: [{ height: 720, levelIndex: 0 }] } },
      t,
    );
    expect(settings.map(({ id }) => id)).toEqual(['sleep']);
    expect(settings[0]?.value).toBe(t.sleepOff);
  });

  it('lists every setting in order, with its current value', () => {
    const settings = menuSettings(
      {
        captions: {
          options: [{ id: 'sub-0', label: 'אנגלית' }],
          selected: 'sub-0',
          choose: vi.fn(),
        },
        speed: { value: 1, isLive: true, choose: vi.fn() },
        quality: {
          options: [
            { height: 1080, levelIndex: 1 },
            { height: 720, levelIndex: 0 },
          ],
          chosen: null,
          playingHeight: 720,
          choose: vi.fn(),
        },
        sleep: { minutesLeft: 23, start: vi.fn() },
      },
      t,
    );
    expect(settings.map(({ id, value }) => [id, value])).toEqual([
      ['captions', 'אנגלית'],
      ['speed', t.speedNormal],
      ['quality', t.qualityAutoNow(720)],
      ['sleep', t.sleepLeft(23)],
    ]);
    const speed = settings.find(({ id }) => id === 'speed');
    expect(speed?.choices.filter((choice) => choice.isDisabled).map(({ key }) => key)).toEqual([
      '1.25',
      '1.5',
      '2',
    ]);
  });

  it('passes the choice on', () => {
    const start = vi.fn();
    const sleep = menuSettings({ ...bare, sleep: { minutesLeft: null, start } }, t)[0];
    sleep?.choices.find(({ key }) => key === '30')?.onChoose();
    expect(start).toHaveBeenCalledWith(30);
  });
});
