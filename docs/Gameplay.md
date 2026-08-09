# Gameplay — Alpha 1.6.0

## Needs and social intelligence

Every living inhabitant has Hunger, Safety, and Happiness on an internal `0.0` (critical) to `1.0` (excellent) scale. Active time slowly reduces satiety, meals restore it, danger harms Safety, peace and Shields restore Safety, and family events influence Happiness. Normal play presents qualitative states and contextual speech rather than raw numbers; starvation death is not part of this milestone.

Inhabitants remember important births, deaths, thefts, journeys, reveals, and Divine interventions. Knowledge records whether a fact was witnessed, told by another inhabitant, shared as a major Settlement fact, or merely assumed. Consequently, dialogue can report evidence or uncertainty without consulting omniscient world state. Relationships range internally from hostility to affection and supplement—not replace—Partner and genealogy data.

Speech is scheduled by priority. Desktop permits three ordinary world-anchored bubbles and Mobile one; Critical speech can briefly exceed that limit. Per-speaker cooldowns, semantic signatures and worsening-urgency checks suppress unchanged repetition. Text remains on screen for roughly 2.2–4.7 seconds according to length.

## Central dwelling consolidation

The fourth completed Home or Den in a growing Settlement triggers one explicit consolidation. The exact four registered qualifying dwellings are removed from rendering, collision, and interaction; their average position becomes the Castle or Great Den position. Every household remains distinct but its `homeBuildingId`, and every member's home reference, changes to the shared central structure. Wood, Water, and Food are independently summed into capacity 30 storage.

Version 1 saves remain valid. An established legacy Settlement is repaired only when it contains one registered central structure and exactly three registered, completed, occupied obsolete dwellings. Unregistered, vacant, or later structures are not consumed.


Alpha 0.0.4 advances through four player-controlled
Italian `INTRO` pages and then to `WORLD_SELECTION`. Human, Beast, and Plant are
presented as three equal choices; a separate confirmation is required before the
stable world ID is saved. A cinematic reveal then uncovers the generated world.
Human and Beast worlds request an Italian name and appropriate independent traits,
spawn one Chosen One on valid grass, and enter `PLAYING`. Plant enters `PLAYING`
without a character.

The original world foundation defined the ten divine powers centrally in `src/data/Powers.js`; Alpha 0.0.9 now completes their interaction, effects and targeting. The visible water, meadow motion, and character idle bob are rendering
only. Continue regenerates identical terrain from the saved seed and restores the
same optional character without duplication.

## Alpha 0.0.5 — Divine actions and survival

During **PLAYING**, the permanent Divine Power toolbar presents the ten canonical powers. All ten powers are available in Human and Beast worlds; Plant remains the sole Plant World power to preserve that completed world. Selecting an available power arms it, and the next world click is transformed from canvas space to world space before grass and collision validation. A gold or coral transient ring communicates success or refusal.

In Human and Beast worlds, the Chosen One autonomously seeks three player-created trees. Each harvested tree yields one Wood and becomes a stump; the first three units are carried internally until a valid nearby Hut site is found. After the short construction action, the Hut stores at most 6 Wood, 6 Water and 6 Food.

The Chosen One then chooses an available resource with the lowest stored quantity, travels to it, performs a short action, returns, and deposits it. Freshwater sources yield repeatedly; cows yield one Food and are consumed non-graphically. Missing resources produce a safe idle state. Plant World tracks created trees but has no Chosen One, Hut, AI, or meteorite event.

## Alpha 0.0.9 divine powers
The ten powers are **Plant, Water, Flower, Food Manifestation, Lightning, Blessing, Ray of Light, Change Sex, Give Weapons, and Shield**. Flower matures after one complete Elysia cycle; Apple Trees provide renewable food with a cooldown. Three direct Lightning strikes kill a character, while the fifth Blessing grants Exalted status and future settlement-founding eligibility. Shield does not block divine Lightning.

Ray of Light temporarily rallies every living inhabitant by navigation to spaced walkable positions. Rally paths are deliberately not saved; Continue safely restores ordinary AI.


## Alpha 0.0.10 theft and divine teaching
During daytime autonomous decision intervals, a needy adult may choose theft according to a persistent, usually low preference. The inhabitant approaches another occupied Home, House, Castle, Den, or Great Den with the needed resource, removes exactly one unit, carries it visibly under a cross-shaped misconduct indicator, and deposits it at their own home. Humans hesitate with a restrained sneaking posture; Beasts retain species movement. Inspection reports “Sta rubando cibo/acqua/legna.” A cooldown prevents immediate repetition. Night, meals, intimacy, death, childhood, sleep, and Ray of Light take priority.

Lightning applied during the observable sequence decreases the preference and immediately cancels theft. If a unit was already removed, cancellation restores it to the victim deterministically. Blessing increases the preference without stopping theft and still increments Blessing count, so an Exalted thief is valid. The same powers outside theft do not teach about theft. The player is not enforcing a predefined morality; inhabitants learn what the Omnipotent approves or disapproves through divine intervention.

## Alpha 1.1.0 — The Rival Omnipotent & First Attack

The completed registration of Elysia's second Settlement begins a unique hostile encounter after a three-second founding pause. A cosmic Rival manifests and accuses the player—without making that accusation objective truth—of using arrivals from other worlds. After the warning, **“Proteggi chi vuoi salvare.”**, normal WorldTime and autonomous inhabitants pause for a ten-second preparation window while direct miracle input remains available.

The meteor always targets the oldest Settlement. Every living member, Adult or Child, is resolved independently: an active semantic Divine Shield saves only its bearer and is consumed on impact; age and Weapons provide no protection. The ordinary death pipeline handles everyone else in a stable snapshot. The second Settlement, all Homes, and the original Castle storage and identity remain untouched. A rainbow and cosmic unicorn visibly absorb the force around the Castle. This first attack never enters `GAME_OVER`, and normal simulation resumes after the aftermath.


## Events and Divine Choice

After cycle 3, eligible Human and Beast settlements may face a paced local event every 2–4 cycles. World visuals and contextual dialogue identify the crisis. WATER restores dry springs and extinguishes fire, BLESSING heals injuries and purifies unsafe food, RAY OF LIGHT helps rally a lost child, and non-intervention remains valid because events have natural outcomes.

## Faith, interpretation and Divine will

Adults describe faith as skeptical, uncertain, believing, or devoted without exposing numbers. Repeated witnessed interventions, crisis outcomes, contradictions, and meaningful abandonment can alter faith and support personal beliefs. One ambiguous event remains uncertain. Exalted inhabitants teach only beliefs they actually hold; listeners can agree, doubt, reject, or reinterpret them. Player inspection shows concise personal beliefs and Castle/Great Den inspection derives uncertain settlement trends. The same bounded dialogue scheduler protects Mobile density and the same language filter remains active in Family Mode.
