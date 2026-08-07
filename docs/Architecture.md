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

## Rendering flow

`Game.render()` delegates to `Renderer`, which only draws. `Renderer` owns backing
resolution and the neutral foundation view. Later world, camera, and entity render
components can be composed behind this boundary without moving drawing into boot code.

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
