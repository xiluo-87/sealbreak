/**
 * Full screen, and what to tell the player when the browser can't do it.
 * Safari on iPhone only lets videos go full screen, so there the way to lose
 * the browser's bars is to add the game to the Home Screen, where it opens on
 * its own as an app.
 */

/** How the player can get the game full screen. */
export type FullscreenAdvice = 'button' | 'home-screen' | null;

/**
 * Pure, so it can be tested: a full screen button where the browser allows
 * it, the Home Screen tip on Apple phones that don't, and nothing once the
 * game is already running as an installed app.
 */
export function fullscreenAdvice(env: { canFullscreen: boolean; installed: boolean; apple: boolean }): FullscreenAdvice {
  if (env.installed) return null;
  if (env.canFullscreen) return 'button';
  return env.apple ? 'home-screen' : null;
}

export const HOME_SCREEN_TIP = 'To play full screen, tap Share, then Add to Home Screen.';

interface WebkitDocument {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

interface WebkitElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

interface OrientationLock {
  lock?: (orientation: string) => Promise<void>;
}

const doc = (): Document & WebkitDocument => document as Document & WebkitDocument;

export function canFullscreen(): boolean {
  const d = doc();
  const el = document.documentElement as HTMLElement & WebkitElement;
  return (typeof el.requestFullscreen === 'function' && d.fullscreenEnabled === true) || (typeof el.webkitRequestFullscreen === 'function' && d.webkitFullscreenEnabled === true);
}

export function isFullscreen(): boolean {
  const d = doc();
  return !!(d.fullscreenElement ?? d.webkitFullscreenElement);
}

/** True when the game was opened from the Home Screen or installed as an app. */
export function isInstalledApp(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || !!window.matchMedia?.('(display-mode: standalone), (display-mode: fullscreen)').matches;
}

export function currentAdvice(): FullscreenAdvice {
  // Only Apple's WebKit browsers have `navigator.standalone`.
  return fullscreenAdvice({ canFullscreen: canFullscreen(), installed: isInstalledApp(), apple: 'standalone' in navigator });
}

export async function toggleFullscreen(): Promise<void> {
  const d = doc();
  const el = document.documentElement as HTMLElement & WebkitElement;
  try {
    if (isFullscreen()) {
      if (d.exitFullscreen) await d.exitFullscreen();
      else await d.webkitExitFullscreen?.();
      return;
    }
    if (typeof el.requestFullscreen === 'function') await el.requestFullscreen({ navigationUI: 'hide' });
    else await el.webkitRequestFullscreen?.();
    await (screen.orientation as unknown as OrientationLock | undefined)?.lock?.('landscape');
  } catch {
    // Not every browser allows full screen or an orientation lock; the game works without them.
  }
}

/** Calls `fn` whenever the page goes into or out of full screen. */
export function onFullscreenChange(fn: () => void): void {
  document.addEventListener('fullscreenchange', fn);
  document.addEventListener('webkitfullscreenchange', fn);
}
