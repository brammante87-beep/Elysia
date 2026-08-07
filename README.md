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

When the first Hut or Beast Den reaches 6 Wood, 6 Water, and 6 Food, one mutually compatible Partner
walks to the Chosen One. After their greeting they form an explicit Household, and the
same dwelling evolves into a Human House or an Established Beast Den with shared capped storage. Both founders then use the
existing `CharacterAI`; lightweight target reservations encourage different available
resources. Human attraction uses gender identity and orientation independently from sex
characteristics, while natural conception uses reproductive biology independently. Beast
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
