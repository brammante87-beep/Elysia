# Architecture

Elysia Alpha 0.1 is a vanilla JavaScript HTML5 Canvas game built with ES modules and object-oriented classes. The runtime starts in `index.html`, loads `js/core/Game.js`, and lets `Game` compose the engine, world, renderer, input, UI, and future miracle subsystem.

## Subsystems

- **Core**: owns application startup and the fixed requestAnimationFrame loop.
- **World**: owns terrain and entity state.
- **Terrain**: generates tile data for sea, beach, and grass.
- **Entities**: model visible world actors with one class per actor type.
- **Renderer**: draws terrain and entities to the canvas.
- **Input**: reserves desktop/mobile input wiring for future milestones.
- **UI**: reserves DOM UI ownership for future milestones.
- **Miracles**: reserved as an explicit subsystem boundary for later alpha releases.

## Data Flow

`Game` creates all subsystems, calls `World.initialize()`, then starts `Engine`. Each frame, `Engine` calls `Game.update(delta)` and `Game.render()`. `Game.update()` delegates to `World`; `Game.render()` delegates to `Renderer`, which reads immutable frame state from `World`.
