# Architecture

## Alpha 1.4 social-intelligence boundary

`Character` owns four bounded, serializable value objects: `CharacterNeeds`, deterministic `CharacterPersonality`, `CharacterMemory` (24 entries), and `CharacterKnowledge` (32 compact facts). Missing legacy fields receive stable defaults; personality derives from the persistent character ID and therefore does not change after Continue. Pair scores live in `RelationshipSystem` and remain separate from semantic Partner, parent, child and Household links.

Gameplay events create semantic `CommunicationIntent` objects. `CharacterDialogueSystem` evaluates knowledge, emotion, relationship and information value; replaceable `LocalDialogueRealizer` then composes Italian from evidence, action, object, urgency and address components. `DialogueScheduler` owns priority, cooldown, repetition and density. Only `Renderer` calculates transient bubble geometry. No network, backend, API key, external generator, pixel position, or stale active bubble enters persistence.

Memory is pruned by importance and recency at 24 entries per Character. Knowledge is compacted by semantic key and capped at 32 facts per Character. Conversation threads accept two to four turns and transfer answered facts as `TOLD_BY_OTHER`, never as witnessed truth.

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

`HumanVisualProfileResolver` is the single boundary between independent semantic
identity data and adult Human game art. Its current expandable presets are
`human.base`, `human.masculine`, `human.femaleWomanLongHair`,
`human.femaleWomanShortHair`, `human.femaleWomanTiedHair`, `human.intersexMan`,
`human.intersexWoman`, `human.intersexNonBinary`, and `human.nonBinary`. These are
stylized Elysia cosmetic mappings, not claims about how real people look. A future
variant ID or appearance seed can choose more art within a profile without changing
identity or save mechanics. Children keep `human.child` until maturation.

Every adult profile implements the same authored idle, walk, work, and three-frame
arm-gesture contract. `HumanIdleAnimation` independently schedules a 1.35-second
lift/hold/lower gesture after visual-only intervals of four to nine seconds while a
Human is genuinely idle. It neither consumes simulation randomness nor mutates the
Character. Exalted mantle, weapon, and Shield remain renderer layers over the chosen
profile, and art dimensions remain independent of collision and interaction geometry.

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

## Parallel civilizations (Alpha 0.0.8)

Human and Beast worlds are parallel civilizations, not graphical reskins. They share semantic simulation concepts—characters, households, FOOD/WOOD/WATER, time, relationships, settlements and fixed divine-power slots—while `PowerManifestations`, semantic AI tasks and dwelling variants select fiction-appropriate presentation and behavior. Humans hunt summoned Cows and raise Houses into a Castle; Beasts gather finite natural nourishment and raise Dens into a Great Den. Plant World remains isolated and frozen.

Homes keep household-local storage. When two single homeowners pair, the lexicographically first eligible home becomes their shared home and the empty home remains vacant; newcomers prefer a vacant completed home before building. Four completed homes are retained even when the founding home becomes the central structure.

## Power targeting
`PowerManager` centralizes three target categories: **placement** (Plant, Water, Flower, Food), **Character** (Lightning, Blessing, Change Sex, Give Weapons, Shield), and **rally/world position** (Ray of Light). `Miracles` creates/casts miracles, while `World` owns validation and semantic results. Miracle input is consumed before inspection. Persistent entities and character statuses serialize semantically; transient effects and rally paths do not.


## Behaviour and theft boundary
`BehaviourMemory` owns the character's normalized, serializable preference for the only implemented learned behaviour, theft. `DivineTeachingSystem` is the contextual boundary used by miracles; Lightning and Blessing do not contain behaviour-weight rules. `TheftSystem`, owned by each `CharacterAI`, controls eligibility, need/target selection, reservation, navigated approach, one-unit withdrawal, return, deposit, cooldown, and deterministic cancellation. `World` remains the gameplay owner and `Renderer` only draws the semantic indicator. This boundary can accept later observable behaviours without introducing a universal alignment score, but Alpha 0.0.10 deliberately implements no unused behaviours.

Saves persist behaviour preferences and theft cooldown. They never serialize path nodes. An in-progress saved theft restores its removed carried unit to the victim and resumes ordinary AI, preventing duplication or phantom inventory. Ray of Light, night, Lightning cancellation, and death use the same cleanup path.

## First hostile-event architecture (Alpha 1.1.0)

`FirstRivalAttack` owns the unique persisted phase machine (`DORMANT`, founding `DELAY`, `MANIFESTATION`, `DIALOGUE`, `WARNING`, `PREPARATION`, `METEOR`, `CASTLE_RESCUE`, `IMPACT`, `AFTERMATH`, `COMPLETE`). `ExaltedFoundingSystem` notifies it only after the second founding Home and Settlement have been registered. While active it freezes `World` simulation; `Game` blocks saves, except that Shield casts remain player-controlled during preparation. Completed state persists so Continue and later settlements cannot repeat it.

`RivalMeteorAttack` selects casualties from authoritative current Settlement membership and delegates deaths to `World.killCharacter`; it neither damages buildings nor invokes Plant World's ending. `RivalEventRenderer` exclusively paints the rift, apparition, meteor, warning, impact, shield reaction, rainbow, unicorn asset, and aftermath. Future audio may bind to manifestation, meteor, impact, and rescue phase transitions; Alpha 1.1.0 adds no audio engine. Theft, contextual behaviour memory, and divine teaching remain unchanged. Character combat, weapon damage, armies, and attacks on the Rival remain deliberately outside this release.


## WorldEventSystem

`WorldEventSystem` owns all non-combat event scheduling, eligibility, lifecycle, density, intervention, local knowledge, semantic resolution history and serialization. `WorldEvent` is the persisted semantic record and `WorldEventConfig` centralizes pacing, durations and bounded fire spread. `World.update()` delegates once to this system; invasions remain independent.

## Alpha 1.6 faith and interpretation boundary

Every adult `Character` owns persistent `PersonalFaith` and bounded `PersonalBeliefs` value objects. `BeliefSystem` interprets only compact references to memories the character experienced or heard about; it never reads a hidden divine intention. Knowledge continues to record observable facts, while beliefs contain subjective meaning, confidence, source, and at most five supporting and contradicting memory references. Social teaching preserves attribution and admits acceptance, doubt, partial acceptance, and rejection.

`SettlementBeliefSummary` recalculates trends from current residents and never stores an official doctrine or overwrites a founder's beliefs. Consequently each of the three supported settlements can develop a different interpretation. There are no religions, commandments, clergy, temples, conversion rules, or divine answer menus.


## Alpha 1.7.0 — Culture architecture

Each Settlement owns a persistent multidimensional `SettlementCulture`. Aggregate event signals change it gradually with inertia; stable dimensions form probabilistic Customs. Founder personality, faith and Exalted status provide only an initial bias. Culture remains separate from personal belief and informal: it creates no laws, government or organized religion. Bounded, observer-local reputation evidence and culture memories preserve social knowledge without omniscience. `CultureSystem` updates periodically rather than scanning inhabitants every frame, while `CultureBehaviorSystem` performs conservative within-settlement sharing and assistance. Human and Beast worlds use the same semantics with community-appropriate realization.
