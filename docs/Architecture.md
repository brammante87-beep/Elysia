# Architecture

## Application boot

`index.html` loads `src/main.js` as an ES module. `main.js` creates `Game`, the
application coordinator. `UI` creates the canvas; `Game` constructs the other
systems, performs the initial resize, connects input, and starts `Engine`.

## Game loop and clock

`Engine` only executes `requestAnimationFrame`. It converts timestamps to seconds,
clamps the delta using `Config`, then calls separate `Game.update(deltaTime)` and
`Game.render()` methods. `GameClock` independently tracks future simulation elapsed
time and supports pause, resume, and reset. Day/night behavior is intentionally absent.

## State transitions

`GameState` is the single high-level state holder. Transitions accept only a member
of its fixed state registry, avoiding unrelated boolean flags. Alpha 0.0.1 remains
in `BOOT`; later screens will explicitly transition it.

## Input flow

`Input` owns pointer and keyboard listeners. Browser client coordinates are scaled
from the canvas CSS rectangle into backing-buffer coordinates before being exposed.
It does not invoke gameplay.

## World generation and queries

`WorldGenerator` uses `SeededRandom` to build compact `TerrainMap` data. Human maps
derive an irregular island, sand transition, and surrounding sea from the seed;
Beast and Plant maps are gameplay grass. `World` owns the generated result and
characters, and exposes bounded `getTerrainAt`, `isTerrainType`, and `isWalkable`
queries. Save records keep the seed, not thousands of cells.

## Rendering flow

`Game.render()` delegates to `Renderer`, which only draws. `Renderer` owns backing
resolution, caches the static terrain canvas, and draws ordered terrain, decoration,
future-object, character, effect, and UI layers. Only water highlights, grass sway,
and character idle details are recomputed per frame; none alters world data.

## Character model

`CharacterCreator` validates creation choices and constructs the shared `Character`
model with a seed-stable ID, world position, life flags, and only world-appropriate
fields. Human sex characteristics, gender identity, and orientation are deliberately
independent. Beast species use the stable `deer`, `cat`, and `dog` IDs.

## Future world, entities, AI, and systems

`World` owns gameplay orchestration but **World must not become a god object**.
Entities will hold identity and local state; reusable systems will implement focused
rules. **Character AI must not become one enormous `update()` method.** Perception,
decision, navigation, and actions should remain separate systems. Human and Beast
gameplay should share common systems wherever possible.

## Persistence

`SaveManager` is the only local-storage boundary. It writes a versioned envelope,
returns `null` for missing, malformed, or unsupported records, and deliberately does
not inspect or migrate abandoned prototype keys.

## Central configuration

`Config` owns application version, maximum frame delta, presentation constants, and
save schema settings. Future gameplay tuning constants belong there rather than in
rendering or orchestration code.
