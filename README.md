# Elysia

**Alpha 0.0.2 — Title Screen & Game Start Foundation**

Elysia is being rebuilt as a vanilla JavaScript, ES-module, HTML5 Canvas game. This
current milestone adds an Italian title screen, safe New Game confirmation, and
validated Continue flow to the Alpha 0.0.1 technical foundation. It intentionally
contains no playable world or gameplay.

## Run

Serve the repository with any static web server, then open `index.html`:

```sh
python3 -m http.server 8000
```

Visit <http://localhost:8000>. Run the lightweight foundation tests with:

```sh
node --test
```

Tests may create a supported save through `SaveManager.save({ state: 'INTRO' })` to
verify Continue without exposing player-facing debug controls. Project direction
and technical boundaries are recorded in [`docs/`](docs/).
