export class IntroScreen {
  static Pages = Object.freeze([
    Object.freeze({ title: 'Sei venuto al mondo da poco.', text: 'Non sei mortale. Sei un Onnipotente.' }),
    Object.freeze({ title: 'IL CIRCOLO DEGLI ONNIPOTENTI', text: 'Da tempo immemorabile, il Circolo affida un mondo a ogni nuova divinità. Quel mondo diventa la sua responsabilità.' }),
    Object.freeze({ title: 'ELYSIA', text: 'Il mondo affidato a te si chiama Elysia. È giovane. Vuoto. In attesa.' }),
    Object.freeze({ title: 'Il suo destino è nelle tue mani.', text: 'Sta a te decidere quale forma di vita dominerà Elysia.' }),
  ]);

  constructor(documentObject = globalThis.document) { this.document = documentObject; }

  show(root, pageIndex, onAdvance) {
    const page = IntroScreen.Pages[pageIndex];
    const finalPage = pageIndex === IntroScreen.Pages.length - 1;
    const screen = this.document.createElement('section');
    screen.className = 'intro-screen celestial-screen';
    screen.setAttribute('aria-labelledby', 'intro-title');
    screen.innerHTML = `<article class="intro-panel"><p class="screen-kicker">${pageIndex + 1} / ${IntroScreen.Pages.length}</p><h1 id="intro-title">${page.title}</h1><p>${page.text}</p><button type="button" data-action="advance">${finalPage ? 'SCEGLI IL DESTINO DI ELYSIA' : 'CONTINUA'}</button></article>`;
    screen.querySelector('[data-action="advance"]').onclick = onAdvance;
    root.append(screen);
  }
}
