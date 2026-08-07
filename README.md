# Elysia

**Alpha 0.0.3 — Introduction & World Selection**

Elysia is being rebuilt as a vanilla JavaScript, ES-module, HTML5 Canvas game. This
current milestone adds a four-page Italian introduction, the Circle of the
Omnipotents, Elysia, and a confirmed choice between Human, Beast, and Plant worlds.
Progress is saved across the introduction and selection. It intentionally contains
no terrain, inhabitants, miracles, or playable gameplay.

## Run

Serve the repository with any static web server, then open `index.html`:

```sh
python3 -m http.server 8000
```

Visit <http://localhost:8000>. Run the lightweight foundation tests with:

```sh
node --test
```

Version 1 saves now store `state`, `introPage`, and `worldType`; valid Alpha 0.0.2
minimal saves remain compatible. Project direction and technical boundaries are
recorded in [`docs/`](docs/).
