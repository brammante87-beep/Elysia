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

## Alpha 0.0.5 — Divine actions and survival

During **PLAYING**, the permanent Divine Power toolbar presents the ten canonical powers. Plant, Water and Cow are available in Human and Beast worlds; Plant alone is available in Plant World. Selecting an available power arms it, and the next world click is transformed from canvas space to world space before grass and collision validation. A gold or coral transient ring communicates success or refusal.

In Human and Beast worlds, the Chosen One autonomously seeks three player-created trees. Each harvested tree yields one Wood and becomes a stump; the first three units are carried internally until a valid nearby Hut site is found. After the short construction action, the Hut stores at most 6 Wood, 6 Water and 6 Food.

The Chosen One then chooses an available resource with the lowest stored quantity, travels to it, performs a short action, returns, and deposits it. Freshwater sources yield repeatedly; cows yield one Food and are consumed non-graphically. Missing resources produce a safe idle state. Plant World tracks created trees but has no Chosen One, Hut, AI, or meteorite event.
