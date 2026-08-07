# Gameplay

Alpha 0.0.2 has no world gameplay. It opens on an Italian title screen instead of
entering the world. New Game advances to an `INTRO` placeholder, asking for
confirmation before replacing a valid save. Continue appears only for a save that
passes `SaveManager` validation and loads that save before showing its placeholder.

Ten divine powers are defined centrally as future design data in `src/data/Powers.js`.
They have no interaction, toolbar, effects, targeting, movement, or pathfinding in
this milestone. The introduction and world selection remain planned for Alpha
0.0.3. Future gameplay must follow `GameDesign.md` and the staged roadmap.
