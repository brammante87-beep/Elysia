# Elysia

**Alpha 0.0.5 — First Divine Actions, Resources & Chosen One Survival**

Elysia is being rebuilt as a vanilla JavaScript, ES-module, HTML5 Canvas game. This
current milestone adds the first playable dependency between divinity and inhabitant.
The player places polished Tree, freshwater and Cow entities through the permanent
ten-power toolbar. In Human and Beast worlds, the autonomous Prescelto gathers three
Wood, constructs a Hut, then balances Wood, Water and Food storage. Plant World remains
a separate tree-creation experience without a character or settlement AI.

## Run

Serve the repository with any static web server, then open `index.html`:

```sh
python3 -m http.server 8000
```

Visit <http://localhost:8000>. Run the lightweight foundation tests with:

```sh
node --test
```

Version 1 saves now store semantic world entities, Hut storage, carried resources and
recoverable AI state alongside `worldType`, `worldSeed`, and the optional Chosen One;
terrain and transient paths/animation remain regenerated. Earlier minimal saves remain
compatible. Project direction and technical boundaries are
recorded in [`docs/`](docs/).
