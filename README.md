# Elysia

**Alpha 0.0.4 — The World Awakens & Chosen One Creation**

Elysia is being rebuilt as a vanilla JavaScript, ES-module, HTML5 Canvas game. This
current milestone reveals a deterministic, procedurally illustrated Elysia after the
Italian introduction and world choice. Human worlds are organic islands with animated
sea, beach, and grass; Beast and Plant worlds are distinct textured grasslands. Human
and Beast paths shape and place one persistent Prescelto, while Plant enters the calm
world view without a character. Miracles, resources, movement, and AI remain absent.

## Run

Serve the repository with any static web server, then open `index.html`:

```sh
python3 -m http.server 8000
```

Visit <http://localhost:8000>. Run the lightweight foundation tests with:

```sh
node --test
```

Version 1 saves store minimal progress, `worldType`, `worldSeed`, and the optional
Chosen One; terrain is regenerated rather than serialized. Earlier minimal saves
remain compatible. Project direction and technical boundaries are
recorded in [`docs/`](docs/).
