export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.pointer = { x: 0, y: 0, pressed: false };
    this.keys = new Set();
    this.handlePointer = this.handlePointer.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.onWorldPointer = null;
  }

  connect() {
    this.canvas.addEventListener('pointermove', this.handlePointer);
    this.canvas.addEventListener('pointerdown', this.handlePointer);
    this.canvas.addEventListener('pointerup', this.handlePointer);
    globalThis.window?.addEventListener('keydown', this.handleKeyDown);
    globalThis.window?.addEventListener('keyup', this.handleKeyUp);
  }

  toCanvasCoordinates(clientX, clientY) {
    const bounds = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - bounds.left) * (this.canvas.width / bounds.width),
      y: (clientY - bounds.top) * (this.canvas.height / bounds.height),
    };
  }

  handlePointer(event) {
    Object.assign(this.pointer, this.toCanvasCoordinates(event.clientX, event.clientY));
    this.pointer.pressed = event.type === 'pointerdown' ||
      (event.type === 'pointermove' && event.buttons > 0);
    if (event.type === 'pointerdown') this.onWorldPointer?.({ ...this.pointer });
  }

  handleKeyDown(event) { this.keys.add(event.code); }
  handleKeyUp(event) { this.keys.delete(event.code); }
}
