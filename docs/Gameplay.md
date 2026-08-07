# Gameplay

Alpha 0.0.3 has no world gameplay. New Game advances through four player-controlled
Italian `INTRO` pages and then to `WORLD_SELECTION`. Human, Beast, and Plant are
presented as three equal choices; a separate confirmation is required before the
stable world ID is saved. Human and Beast end at a character-creation placeholder.
Plant ends at a harmless `PLAYING` placeholder; `World` remains empty.

Ten divine powers are defined centrally as future design data in `src/data/Powers.js`.
They have no interaction, toolbar, effects, targeting, movement, or pathfinding in
this milestone. Continue restores the saved intro page, selection screen, or
post-selection placeholder. Future gameplay must follow `GameDesign.md` and the staged roadmap.
