export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.pointer = { x: 0, y: 0, pressed: false };
    this.keys = new Set();
    this.handlePointer = this.handlePointer.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.onWorldPointer = null;
    this.onPan = null; this.onZoom = null; this.onGesture = null; this.onDoubleTap = null;
    this.activePointers = new Map(); this.dragThreshold = 8; this.pinching = false;
    this.lastTapAt = 0;
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
    const point = this.toCanvasCoordinates(event.clientX, event.clientY);
    Object.assign(this.pointer, point);
    this.pointer.pressed = event.type === 'pointerdown' ||
      (event.type === 'pointermove' && event.buttons > 0);
    if (event.type === 'pointerdown') {
      this.canvas.setPointerCapture?.(event.pointerId);
      this.activePointers.set(event.pointerId, { ...point, startX: point.x, startY: point.y, dragged: false });
      return;
    }
    const previous = this.activePointers.get(event.pointerId);
    if (!previous) return;
    if (event.type === 'pointermove') {
      const before = [...this.activePointers.values()];
      this.activePointers.set(event.pointerId, { ...previous, ...point });
      const after = [...this.activePointers.values()];
      if (after.length === 2) {
        const oldDistance=Math.hypot(before[0].x-before[1].x,before[0].y-before[1].y);
        const newDistance=Math.hypot(after[0].x-after[1].x,after[0].y-after[1].y);
        if (oldDistance > 0) this.onZoom?.(newDistance/oldDistance, { x:(after[0].x+after[1].x)/2, y:(after[0].y+after[1].y)/2 });
        this.pinching = true; return;
      }
      const threshold=this.dragThreshold*this.canvas.width/this.canvas.getBoundingClientRect().width;
      if (Math.hypot(point.x-previous.startX,point.y-previous.startY)>=threshold) previous.dragged=true;
      if (previous.dragged) this.onPan?.(point.x-previous.x,point.y-previous.y);
      Object.assign(previous,point); return;
    }
    if (event.type === 'pointerup' || event.type === 'pointercancel') {
      this.activePointers.delete(event.pointerId);
      if (this.pinching) { if (!this.activePointers.size) this.pinching=false; this.onGesture?.('pinch'); return; }
      if (previous.dragged) this.onGesture?.('drag');
      else if (event.type === 'pointerup') {
        const now=event.timeStamp ?? Date.now();
        if (now-this.lastTapAt<320) { this.lastTapAt=0; this.onDoubleTap?.(); }
        else { this.lastTapAt=now; this.onGesture?.('tap'); this.onWorldPointer?.({ ...point }); }
      }
    }
  }

  handleKeyDown(event) { this.keys.add(event.code); }
  handleKeyUp(event) { this.keys.delete(event.code); }
}
