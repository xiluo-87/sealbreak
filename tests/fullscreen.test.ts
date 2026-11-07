import { describe, expect, it } from 'vitest';
import { fullscreenAdvice } from '../src/ui/fullscreen';

describe('full screen advice', () => {
  it('offers the button where the browser can go full screen', () => {
    expect(fullscreenAdvice({ canFullscreen: true, installed: false, apple: false })).toBe('button');
    expect(fullscreenAdvice({ canFullscreen: true, installed: false, apple: true })).toBe('button');
  });

  it('points iPhone players to the Home Screen, where Safari’s bars go away', () => {
    expect(fullscreenAdvice({ canFullscreen: false, installed: false, apple: true })).toBe('home-screen');
  });

  it('says nothing once the game runs as an installed app', () => {
    expect(fullscreenAdvice({ canFullscreen: false, installed: true, apple: true })).toBeNull();
    expect(fullscreenAdvice({ canFullscreen: true, installed: true, apple: false })).toBeNull();
  });

  it('says nothing on other browsers that cannot go full screen', () => {
    expect(fullscreenAdvice({ canFullscreen: false, installed: false, apple: false })).toBeNull();
  });
});
