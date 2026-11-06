import { FixedStepClock } from './game/clock';
import { parseDebugOptions } from './game/debugOptions';
import { startLoop } from './game/loop';
import { Rng } from './game/rng';
import type { Scene } from './game/scene';
import { YardScene } from './game/yardScene';
import { Keyboard } from './input/keyboard';
import { Screen } from './render/screen';
import { DebugOverlay } from './ui/debugOverlay';

function startGame(app: HTMLElement): void {
  const options = parseDebugOptions(window.location.search);
  document.body.classList.add('game');
  const screen = new Screen(app);
  const overlay = new DebugOverlay(app, options.overlay);
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.innerHTML = 'Arrow keys or WASD to walk, Shift to run, backtick for debug. <a href="?sprites">Sprite gallery</a>';
  app.appendChild(hint);
  const input = new Keyboard();
  input.attach(window);
  const rng = new Rng(options.seed);
  const clock = new FixedStepClock({ speed: options.speed });
  const scene: Scene = new YardScene();
  const ctx = { input, rng, stepMs: clock.stepMs };

  startLoop(clock, {
    update() {
      if (input.wasPressed('debug')) overlay.toggle();
      scene.update(ctx);
      input.endStep();
    },
    render(alpha, now) {
      const g = screen.ctx;
      g.imageSmoothingEnabled = false;
      scene.render(g, alpha);
      overlay.frame(now, {
        steps: clock.steps,
        speed: `${clock.speed}x`,
        scale: `${screen.current.scale}x (${window.devicePixelRatio || 1} dpr)`,
        seed: options.seed,
        ...scene.debugInfo?.(),
      });
    },
  });
}

const app = document.getElementById('app');
if (!app) throw new Error('Missing #app');
if (parseDebugOptions(window.location.search).sprites) {
  void import('./ui/spriteGallery').then((m) => m.startSpriteGallery(app));
} else {
  startGame(app);
}
