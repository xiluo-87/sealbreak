import { computeScale, LOGICAL_HEIGHT, LOGICAL_WIDTH, type ScaleResult } from './scale';

/** The game canvas: a 640x360 backing store shown at an integer scale. */
export class Screen {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly host: HTMLDivElement;
  /** Sits exactly over the canvas; HTML UI goes in here. `--u` is one logical pixel in CSS px. */
  readonly ui: HTMLDivElement;
  private readonly frame: HTMLDivElement;
  current: ScaleResult = { scale: 1, integer: true, cssWidth: LOGICAL_WIDTH, cssHeight: LOGICAL_HEIGHT };

  constructor(parent: HTMLElement) {
    this.host = document.createElement('div');
    this.host.className = 'screen-host';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'screen';
    this.canvas.width = LOGICAL_WIDTH;
    this.canvas.height = LOGICAL_HEIGHT;
    this.canvas.setAttribute('aria-label', 'Sealbreak game screen');
    this.frame = document.createElement('div');
    this.frame.className = 'screen-frame';
    this.ui = document.createElement('div');
    this.ui.className = 'ui-layer';
    this.frame.append(this.canvas, this.ui);
    this.host.appendChild(this.frame);
    parent.appendChild(this.host);
    const ctx = this.canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.visualViewport?.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));
  }

  resize(): void {
    const rect = this.host.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight;
    this.current = computeScale(width, height, window.devicePixelRatio || 1);
    this.canvas.style.width = `${this.current.cssWidth}px`;
    this.canvas.style.height = `${this.current.cssHeight}px`;
    this.frame.style.width = `${this.current.cssWidth}px`;
    this.frame.style.height = `${this.current.cssHeight}px`;
    this.frame.style.setProperty('--u', `${this.current.cssWidth / LOGICAL_WIDTH}px`);
    this.canvas.classList.toggle('fractional', !this.current.integer);
  }
}
