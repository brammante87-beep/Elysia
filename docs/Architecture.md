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

## Visual Asset Architecture

Canvas is Elysia's production rendering surface. Characters are original,
project-owned SVG artwork selected through `CharacterAssetRegistry` by semantic IDs
(`human.base`, `beast.deer`, `beast.cat`, and `beast.dog`); save records never contain
file paths. `AssetLoader` preloads every idle frame required by the selected world,
exposes loading and failure state, and prevents `PLAYING` until those assets are
ready. Plant World has no character preload.

`CharacterRenderer` selects the registered animation and frame, converts centralized
world-space visual dimensions to canvas pixels, and adds the reusable contact shadow,
subtle Chosen One light, and name. Artwork contains the species silhouette; renderer
code contains no species anatomy. Each current idle state has two authored frames,
while the registry reserves the natural `walk`, `work`, `attack`, `sleep`, `hurt`,
and `death` state vocabulary for additive animation work.

Every sprite source is 160 × 200 SVG units for high-DPI clarity and modest zoom.
Intended world-space dimensions are Human 4.2 × 5.2, Deer 5.8 × 4.8, Cat 4.8 × 3.8,
and Dog 5.2 × 4.0 units. Character collision and interaction radii live on the
simulation entity and never derive from these visual dimensions. Art therefore
evolves through registry entries and asset additions, not renderer rewrites.

The seeded terrain renderer is likewise an intentional production procedural art
system: the high-resolution cached color field, organic island coast, beach band,
grass detail, and animated sea highlights are designed to remain and develop in
place. Procedural generation describes how the art is made, not its level of finish.

## Character model

`CharacterCreator` validates creation choices and constructs the shared `Character`
model with a seed-stable ID, world position, life flags, and only world-appropriate
fields. Human sex characteristics, gender identity, and orientation are deliberately
independent. Beast species use the stable `deer`, `cat`, and `dog` IDs. Explicit
`collisionRadius` and `interactionRadius` values keep gameplay geometry independent
from appearance and source resolution.

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

## Alpha 0.0.5 simulation architecture

`DIVINE_POWERS` is the single ordered registry used by `DivineToolbar` and `Miracles`. Input converts client coordinates to canvas coordinates; `Renderer.screenToWorld` performs the camera-compatible canvas-to-world transform; `Miracles` delegates validated creation to `World`.

`WorldEntity` supplies semantic identity, position, life and explicit simulation radius. `Tree`, `WaterSource`, `Cow`, and `Hut` are stored in collections. Art dimensions never define collision. `ResourceStorage` centralizes Wood, Water and Food with a uniform capacity of six.

`CharacterAI` owns task decisions and semantic carried resources. `Pathfinder` performs terrain-only grid search without modifying terrain, while `CharacterMovement` follows world-space waypoints smoothly using delta time. Saves contain semantic entities, Hut storage and recoverable AI intent; paths, effects, and animation frames remain transient and are safely recalculated after Continue.
