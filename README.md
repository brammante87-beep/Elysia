# Elysia

**Alpha 0.0.1 — Foundation Reset**

Elysia is being rebuilt as a vanilla JavaScript, ES-module, HTML5 Canvas game. This
milestone contains only the application, timing, state, input, rendering, and
persistence foundations. It intentionally contains no playable world or gameplay.

## Run

Serve the repository with any static web server, then open `index.html`:

```sh
python3 -m http.server 8000
```

Visit <http://localhost:8000>. Run the lightweight foundation tests with:

```sh
node --test
```

Project direction and technical boundaries are recorded in [`docs/`](docs/).
