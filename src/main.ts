import { FixedStepClock } from './game/clock';
import { parseDebugOptions } from './game/debugOptions';
import { startLoop } from './game/loop';
import { Rng } from './game/rng';
import { Keyboard } from './input/keyboard';
import { Screen } from './render/screen';
import { App } from './ui/app';
import { DebugOverlay } from './ui/debugOverlay';

function startGame(root: HTMLElement): void {
  const options = parseDebugOptions(window.location.search);
  document.body.classList.add('game');
  const screen = new Screen(root);
  const overlay = new DebugOverlay(root, options.overlay);
  const input = new Keyboard();
  input.attach(window);
  const rng = new Rng(options.seed);
  const clock = new FixedStepClock({ speed: options.speed });
  const app = new App(screen.ui, options.seed);
  const ctx = { input, rng, stepMs: clock.stepMs };

  startLoop(clock, {
    update() {
      if (input.wasPressed('debug')) overlay.toggle();
      app.update(ctx);
      input.endStep();
    },
    render(alpha, now) {
      const g = screen.ctx;
      g.imageSmoothingEnabled = false;
      app.scene.render(g, alpha);
      overlay.frame(now, {
        steps: clock.steps,
        speed: `${clock.speed}x`,
        scale: `${screen.current.scale}x (${window.devicePixelRatio || 1} dpr)`,
        seed: options.seed,
        ...app.debugInfo(),
      });
    },
  });
}

const root = document.getElementById('app');
if (!root) throw new Error('Missing #app');
if (parseDebugOptions(window.location.search).sprites) {
  void import('./ui/spriteGallery').then((m) => m.startSpriteGallery(root));
} else {
  startGame(root);
}
