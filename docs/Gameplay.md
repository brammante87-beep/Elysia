# Gameplay

Alpha 0.0.4 advances through four player-controlled
Italian `INTRO` pages and then to `WORLD_SELECTION`. Human, Beast, and Plant are
presented as three equal choices; a separate confirmation is required before the
stable world ID is saved. A cinematic reveal then uncovers the generated world.
Human and Beast worlds request an Italian name and appropriate independent traits,
spawn one Chosen One on valid grass, and enter `PLAYING`. Plant enters `PLAYING`
without a character.

Ten divine powers are defined centrally as future design data in `src/data/Powers.js`.
They have no interaction, toolbar, effects, targeting, movement, or pathfinding in
this milestone. The visible water, meadow motion, and character idle bob are rendering
only. Continue regenerates identical terrain from the saved seed and restores the
same optional character without duplication.
