/** Keeping the highlighted row of a scrolling list on screen. */

interface Span {
  top: number;
  bottom: number;
}

/**
 * The scroll offset that brings `item` fully into `view`, moving as little
 * as possible. Pure, so it can be tested without a browser.
 */
export function scrollToShow(scrollTop: number, view: Span, item: Span): number {
  if (item.top < view.top) return scrollTop - (view.top - item.top);
  if (item.bottom > view.bottom) {
    // An item taller than the view shows its top.
    const by = Math.min(item.bottom - view.bottom, item.top - view.top);
    return scrollTop + by;
  }
  return scrollTop;
}

/** Scrolls `box` (and nothing else) so that `item` is visible. */
export function keepInView(box: HTMLElement, item: HTMLElement | null | undefined): void {
  if (!item) return;
  const next = scrollToShow(box.scrollTop, box.getBoundingClientRect(), item.getBoundingClientRect());
  if (next !== box.scrollTop) box.scrollTop = next;
}
