export class WorldRevealScreen {
  constructor(documentObject = globalThis.document, windowObject = globalThis.window) {
    this.document = documentObject;
    this.window = windowObject;
  }

  show(root, onComplete) {
    const screen = this.document.createElement('section');
    screen.className = 'world-reveal-screen';
    screen.innerHTML = '<div class="reveal-orbit"><span></span></div><p>IL MONDO SI RISVEGLIA</p><h1>ELYSIA</h1>';
    root.append(screen);
    const reduced = this.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.window?.setTimeout(() => { screen.remove(); onComplete(); }, reduced ? 50 : 2700);
  }
}
