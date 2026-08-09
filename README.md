# Elysia

**Alpha 1.4.0 — Needs, Social Memory & Intelligent Dialogue**

Alpha 1.4.0 gives every inhabitant normalized Hunger, Safety and Happiness; persistent pair-specific relationships, deterministic continuous personality, bounded memories and source-aware knowledge; and a completely local semantic dialogue pipeline. Characters choose a `CommunicationIntent` before `LocalDialogueRealizer` composes readable Italian. Short conversations can transfer knowledge without omniscience, while cooldowns, information-value suppression, priorities, and Desktop/Mobile density limits keep world-anchored speech useful. The same system runs offline in Standard and Family Mode, where presentation-sensitive identity language is filtered.

Elysia is being rebuilt as a vanilla JavaScript, ES-module, HTML5 Canvas game. Built on Alpha 1.0.0 civilization and migration, this milestone introduces the Rival Omnipotent’s first hostile act when the second Settlement is registered. A cinematic warning and ten-second Shield preparation window precede a meteor strike on the original Settlement; an unexplained rainbow and unicorn preserve its Castle while unshielded inhabitants face the established death rules. The game continues after the attack. The foundation also gives Human and Beast households a 90-second active-simulation day/night cycle,
nighttime rest, deterministic intimacy and the first generation of children while preserving
the established divine-action loop.
The player places polished Tree, freshwater and Cow entities through the permanent
ten-power toolbar. In Human and Beast worlds, the autonomous Prescelto gathers three
Wood, constructs a Hut, then balances Wood, Water and Food storage. Plant World remains
a separate tree-creation experience without a character or settlement AI. Its tenth
successful player-created Tree now begins a short rival-omnipotent and meteorite ending
before the centralized `GAME_OVER` screen.

When the first Hut or Beast Den reaches 3 Wood, 3 Water, and 3 Food, one mutually compatible Partner
walks to the Chosen One. After their greeting they form an explicit Household, and the
same dwelling evolves into a Human House or an Established Beast Den with shared capped storage. Both founders then use the
existing `CharacterAI`; lightweight target reservations encourage different available
resources. Human attraction uses gender identity and orientation independently from sex
characteristics. Elysia's supernatural new-life law gives every established compatible couple equal
eligibility, independently of sex characteristics or orientation. Beast
partners retain the Chosen One's species. Children remain near home, preserve semantic
parentage through saves, and mature in place after exactly 90 elapsed simulation seconds.

One Human or Beast Elysia day is exactly 90 seconds of active `PLAYING` simulation:
5 seconds of Dawn (ALBA), 55 seconds of Day (GIORNO), 10 seconds of Dusk
(TRAMONTO), and 20 seconds of Night (NOTTE). Plant World has no WorldTime.

## Run

Serve the repository with any static web server, then open `index.html`:

```sh
python3 -m http.server 8000
```

Visit <http://localhost:8000>. Run the lightweight foundation tests with:

```sh
node --test
```

Version 1 saves now store semantic world entities, Hut/House storage, carried resources and
recoverable AI state alongside `worldType`, `worldSeed`, and the optional Chosen One;
terrain and transient paths/animation remain regenerated. Earlier minimal saves remain
compatible. A completed Plant ending is saved as `GAME_OVER`, so Continue restores the
ending screen rather than a destroyed playable world. Project direction and technical boundaries are
recorded in [`docs/`](docs/).

Established households schedule one fixed 2 Wood, 2 Water and 2 Food meal for every 60
seconds accumulated across active Dawn, Day, and Dusk simulation. The accumulator is not
reset at Dawn; it pauses at night and whenever gameplay is
not in `PLAYING`; a failed atomic meal leaves the family waiting at home until night, and
normal gathering resumes at dawn. The semantic timer and in-progress meal state are saved.

## Alpha 0.0.8 — Settlement Growth & First Castle

A stable food-provision slot now manifests as a Cow for Humans and a finite natural food cache for Beasts. After each completed Elysia cycle (approximately every 90 active seconds), one newcomer can arrive from a reachable edge, gather three units of shared shelter material, and establish an independent household in the first settlement. Unrelated mutually compatible adults can pair; Beast pairs are same-species. At four completed homes the founding dwelling autonomously transforms into a 30/30/30 Castle or Great Den while preserving distinct households, residents, relationships, summed resources, and its generated settlement name; the four obsolete dwellings are removed. Arrival-cycle, household, settlement, occupancy, relationship, food-yield, and central-structure state are semantic save data.

## Alpha 0.0.9 — Complete Divine Power Set
All ten fixed toolbar powers are functional in Human and Beast worlds. Placement miracles create Plants, Water, gameplay Flowers and world-specific food; character miracles apply Lightning, Blessing, Change Sex, Weapons and Shield; Ray of Light issues a temporary navigated rally. Flowers mature into renewable Apple Trees after exactly 90 elapsed simulation seconds, independently of cycle boundaries.


## Alpha 0.0.10 — Emergent Behaviour, Theft & Divine Teaching
Adult Human and Beast inhabitants whose household is short of Wood, Water, or Food can now occasionally choose `STEAL_RESOURCE` instead of honest gathering. They navigate to another occupied household, take exactly one unit, carry it home, and deposit it. A restrained painted cross above the inhabitant and an Italian intention line make the act observable. Children, dead inhabitants, meal participants, sleepers, nighttime inhabitants, and characters obeying Ray of Light cannot begin theft.

Every adult has a persistent, low initial theft preference. Lightning during theft lowers that behaviour-specific preference and cancels the act; Blessing during theft raises it while retaining the normal Blessing/Exalted progression. Outside theft neither power changes the preference. This is contextual divine teaching, not a universal good/evil, karma, sin, or virtue score: the player is not enforcing a predefined morality. Inhabitants learn what the Omnipotent approves or disapproves through divine intervention. Plant World remains unchanged.

## Settlement layout compatibility repair

Settlement dwellings now use explicit simulation footprints and a deterministic, organic ring search around the founding home. A selected construction slot is reserved until its home is completed or cancelled, and Human candidates require the complete footprint to remain on grass. Version 1 saves remain compatible: on Continue, any overlapping or coastline-invalid dwelling positions are repaired once into the nearest safe settlement slots. The repair moves only world positions; building IDs, household and occupant references, relationships, settlement membership, and stored resource amounts are retained.


## Alpha 1.0.0 — Civilizations, Migration & New Settlements

Elysia belongs to a larger, still-mysterious universe of inhabited worlds. External newcomers are refugees, exiles, survivors, explorers and wanderers. Their generated origin and compatible story persist as character history; other planets remain narrative background rather than playable maps.

Each settlement begins `GROWING`, accepts at most four external arrivals, and becomes `ESTABLISHED` when its fourth completed Home creates a Castle or Great Den. Establishment immediately closes external immigration and ordinary Home construction, including unused arrival capacity, while vacant Homes, births, families, meals and relationships continue. Exalted adults visibly travel with a living partner and minor children to found distant settlements. Every settlement shares this lifecycle, and founding reservations enforce an absolute maximum of three.


## Alpha 1.1.0 — The Rival Omnipotent & First Attack

Registering the second Settlement triggers one persisted Rival encounter after the new-settlement announcement. The cosmic manifestation delivers three concise Italian threats, marks the oldest Settlement, freezes WorldTime and AI, and leaves ten seconds of player control for individual Shield miracles—including generous Child targeting. At impact, active Shields flare, save only their bearers, and are consumed; Weapons cannot stop the meteor. All unshielded members use the normal mass-safe death and relationship cleanup, while the second Settlement and every building remain safe.

The Castle retains its exact identity, ownership, storage, position, and capacity beneath a large rainbow as a project-owned illustrated unicorn crosses the arc and absorbs the blast. The aftermath fades back into normal play, persists completion for Continue safety, and never enters `GAME_OVER`. Theft, `BehaviourMemory`, `DivineTeachingSystem`, and contextual Lightning/Blessing teaching were preserved; inter-character combat and Alpha 1.2.0 systems are not included.
