export class TutorialManager {
    constructor(ui, onComplete, storage = window.localStorage) {
        this.ui = ui;
        this.onComplete = onComplete;
        this.storage = storage;
        this.storageKey = "tutorialSeen";
        this.currentPage = 0;
        this.pages = [
            {
                title: "Benvenuto su Elysia",
                text: "Per molto tempo questo mondo è rimasto silenzioso.\n\nLe foreste sono cresciute.\nLe acque hanno scavato la terra.\nGli animali hanno percorso le pianure.\n\nMa nessuno ricordava il nome degli Dei."
            },
            {
                title: "Il tuo risveglio",
                text: "Oggi qualcosa è cambiato.\n\nTu hai aperto gli occhi.\n\nSei una giovane divinità,\ngiunta su Elysia per osservare,\nguidare e proteggere.\n\nNon controllerai ogni cosa.\n\nDarai soltanto piccoli miracoli.\n\nIl resto sarà affidato agli abitanti."
            },
            {
                title: "Il Prescelto",
                text: "Tra tutti gli esseri di questo mondo,\nuno ascolterà la tua voce più chiaramente.\n\nÈ il tuo Prescelto.\n\nLe scelte fatte poco fa\ndefiniscono chi sarà.\n\nAttraverso lui inizierà la storia del tuo popolo."
            },
            {
                title: "Una nuova tribù",
                text: "Aiutalo a costruire una casa.\n\nTrova un compagno.\n\nFai crescere una famiglia.\n\nCon il tempo nasceranno figli.\n\nI figli diventeranno adulti.\n\nCostruiranno nuove case.\n\nFormeranno nuove famiglie.\n\nCosì nascerà la tua tribù."
            },
            {
                title: "Il tuo compito",
                text: "Non vincerai guerre.\n\nNon conquisterai terre.\n\nLa tua missione è diversa.\n\nAiutare una piccola comunità\na crescere,\nvivere\ne prosperare.\n\nOgni abitante avrà una propria vita.\n\nTu offrirai soltanto opportunità."
            },
            {
                title: "Elysia ti attende",
                text: ""
            }
        ];
    }

    hasBeenSeen() {
        return this.storage.getItem(this.storageKey) === "true";
    }

    start() {
        this.currentPage = 0;
        this.showCurrentPage();
    }

    showCurrentPage() {
        this.ui.showTutorial({
            page: this.pages[this.currentPage],
            pageNumber: this.currentPage + 1,
            pageCount: this.pages.length,
            onBack: () => this.back(),
            onNext: () => this.next(),
            onSkip: () => this.complete()
        });
    }

    back() {
        if (this.currentPage === 0) {
            return;
        }

        this.currentPage -= 1;
        this.showCurrentPage();
    }

    next() {
        if (this.currentPage === this.pages.length - 1) {
            this.complete();
            return;
        }

        this.currentPage += 1;
        this.showCurrentPage();
    }

    complete() {
        this.storage.setItem(this.storageKey, "true");
        this.onComplete();
    }
}
