import { describe, expect, it } from 'vitest';
import { scrollToShow } from '../src/ui/scroll';

describe('keeping the highlighted row in view', () => {
  const view = { top: 100, bottom: 200 };

  it('leaves the list alone when the row is already visible', () => {
    expect(scrollToShow(40, view, { top: 120, bottom: 140 })).toBe(40);
    expect(scrollToShow(40, view, { top: 100, bottom: 200 })).toBe(40);
  });

  it('scrolls down just far enough for a row below the view', () => {
    expect(scrollToShow(40, view, { top: 190, bottom: 215 })).toBe(55);
  });

  it('scrolls up just far enough for a row above the view', () => {
    expect(scrollToShow(40, view, { top: 80, bottom: 105 })).toBe(20);
  });

  it('shows the top of a row taller than the view', () => {
    expect(scrollToShow(0, view, { top: 150, bottom: 400 })).toBe(50);
  });
});
