# Elysia

**Alpha 0.0.6 — First Household**

Elysia is being rebuilt as a vanilla JavaScript, ES-module, HTML5 Canvas game. This
current milestone adds the first household while preserving the 0.0.5 divine-action loop.
The player places polished Tree, freshwater and Cow entities through the permanent
ten-power toolbar. In Human and Beast worlds, the autonomous Prescelto gathers three
Wood, constructs a Hut, then balances Wood, Water and Food storage. Plant World remains
a separate tree-creation experience without a character or settlement AI. Its tenth
successful player-created Tree now begins a short rival-omnipotent and meteorite ending
before the centralized `GAME_OVER` screen.

When the first Hut reaches 6 Wood, 6 Water, and 6 Food, one mutually compatible Partner
walks to the Chosen One. After their greeting they form an explicit Household, and the
same Hut evolves into a House with shared capped storage. Both founders then use the
existing `CharacterAI`; lightweight target reservations encourage different available
resources. Human attraction uses gender identity and orientation independently from sex
characteristics, while Beast partners retain the Chosen One's species.

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
