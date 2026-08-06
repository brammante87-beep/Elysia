# Game Design

Elysia is planned as a god-game village simulation. The player will eventually influence a small world through miracles and observe villagers responding to the environment.

## Era progression

Progression uses stable internal Era keys. The three planned Eras are `tribe`
(**L'Alba della Vita**), `village` (**La Comunità**) and `faith` (**La Fede**).
The current Alpha 1.3 milestone implements only the permanent Tribe-to-Village
transition, triggered when the living population reaches 32.

Entering the Village Era currently records the milestone, gives temporary
feedback, and saves the game. It deliberately does not transform buildings or
unlock new miracles.

## Settlement shape

The Prescelto's House is the permanent center of the settlement. Autonomous
Houses are placed organically in concentric bands no farther than 420 world
pixels from it, with safe spacing from Houses, resources, and inhabitants.
Rectangular settlement bounds are derived from all House collision areas for
future Village systems.

Palisade, gate, well, Faith, toolbar replacement, and raiders are not implemented.

## Alpha 1.5: trasformazione in Villaggio
A 32 abitanti viventi la trasformazione avviene una sola volta: il perimetro stabile dell'insediamento riceve una palizzata con un unico cancello aperto e un Pozzo permanente. Le Case esistenti diventano strutture migliorate e passano da 4 a 6 posti senza espellere occupanti legacy.
