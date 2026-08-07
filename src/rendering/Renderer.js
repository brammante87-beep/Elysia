import { Config } from '../core/Config.js';

export class Renderer {
  constructor(canvas, windowObject = globalThis.window) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.window = windowObject;
  }

  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    const pixelRatio = Math.max(1, this.window?.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(bounds.width * pixelRatio));
    const height = Math.max(1, Math.round(bounds.height * pixelRatio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  render() {
    const { context, canvas } = this;
    context.fillStyle = Config.BACKGROUND_COLOR;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#e8e4dc';
    context.textAlign = 'center';
    context.font = `${Math.max(18, canvas.height * 0.035)}px system-ui, sans-serif`;
    context.fillText('ELYSIA', canvas.width / 2, canvas.height / 2);
    context.font = `${Math.max(11, canvas.height * 0.018)}px system-ui, sans-serif`;
    context.fillText(Config.VERSION, canvas.width / 2, canvas.height / 2 + canvas.height * 0.05);
  }
}
