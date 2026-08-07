export class RivalWorlds {
  static Definitions = Object.freeze([
    Object.freeze({ id:'rivalWorld1', worldName:'Varkesh', rivalOmnipotentName:'Aurek Vael', visualIdentity:'bronze, red-earth and muted gold', enemySpecies:'Sahran lionfolk', combatStyle:'deliberate long-range archery', dialogueProfile:'proud aristocratic predator; strength establishes ownership', meteorAttacker:true }),
    Object.freeze({ id:'rivalWorld2', worldName:'Ilyrion', rivalOmnipotentName:'Serath Vey', visualIdentity:'pale white, steel and glacial blue', enemySpecies:'Ilyri human', combatStyle:'disciplined spear melee', dialogueProfile:'cold, controlled and certain of Ilyri superiority', meteorAttacker:false }),
    Object.freeze({ id:'rivalWorld3', worldName:'Pelagion-9', rivalOmnipotentName:'Quillix', visualIdentity:'cyan, magenta and electric violet', enemySpecies:'Pelagic dolphins', combatStyle:'mobile hover-gunnery', dialogueProfile:'eccentric technologist; playful, experimental and lethal', meteorAttacker:false }),
  ]);
  static all() { return RivalWorlds.Definitions; }
  static get(id) { return RivalWorlds.Definitions.find(world => world.id === id) ?? null; }
  static meteorAttacker() { return RivalWorlds.Definitions.find(world => world.meteorAttacker); }
}
