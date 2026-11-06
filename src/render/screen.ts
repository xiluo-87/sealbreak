import { computeScale, LOGICAL_HEIGHT, LOGICAL_WIDTH, type ScaleResult } from './scale';

/** The game canvas: a 640x360 backing store shown at an integer scale. */
export class Screen {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly host: HTMLDivElement;
  current: ScaleResult = { scale: 1, cssWidth: LOGICAL_WIDTH, cssHeight: LOGICAL_HEIGHT };

  constructor(parent: HTMLElement) {
    this.host = document.createElement('div');
    this.host.className = 'screen-host';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'screen';
    this.canvas.width = LOGICAL_WIDTH;
    this.canvas.height = LOGICAL_HEIGHT;
    this.canvas.setAttribute('aria-label', 'Sealbreak game screen');
    this.host.appendChild(this.canvas);
    parent.appendChild(this.host);
    const ctx = this.canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const rect = this.host.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight;
    this.current = computeScale(width, height, window.devicePixelRatio || 1);
    this.canvas.style.width = `${this.current.cssWidth}px`;
    this.canvas.style.height = `${this.current.cssHeight}px`;
  }
}
