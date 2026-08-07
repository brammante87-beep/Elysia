# Elysia

**Alpha 0.0.7 — Day, Night & First Generation**

Elysia is being rebuilt as a vanilla JavaScript, ES-module, HTML5 Canvas game. This
milestone gives Human and Beast households a five-minute simulation-time day/night cycle,
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
parentage through saves, and mature in place after the complete cycle following birth.

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
seconds of active daytime simulation. The timer pauses at night and whenever gameplay is
not in `PLAYING`; a failed atomic meal leaves the family waiting at home until night, and
normal gathering resumes at dawn. The semantic timer and in-progress meal state are saved.

## Alpha 0.0.8 — Settlement Growth & First Castle

A stable food-provision slot now manifests as a Cow for Humans and a finite natural food cache for Beasts. After each completed Elysia cycle, one newcomer can arrive from a reachable edge, gather three units of shared shelter material, and establish an independent household in the first settlement. Unrelated mutually compatible adults can pair; Beast pairs are same-species. At four completed homes the founding dwelling autonomously transforms into a 30/30/30 Castle or Great Den while preserving resources, residents, surrounding homes, and its generated settlement name. Arrival-cycle, household, settlement, occupancy, relationship, food-yield, and central-structure state are semantic save data.

## Alpha 0.0.9 — Complete Divine Power Set
All ten fixed toolbar powers are functional in Human and Beast worlds. Placement miracles create Plants, Water, gameplay Flowers and world-specific food; character miracles apply Lightning, Blessing, Change Sex, Weapons and Shield; Ray of Light issues a temporary navigated rally. Flowers mature into renewable Apple Trees after one simulation cycle.
