import { DIVINE_POWERS } from '../data/Powers.js';
import { Pathfinder } from '../world/Pathfinder.js';

export class PowerManager {
  static TargetTypes = Object.freeze({ PLACEMENT: 'placement', CHARACTER: 'character', RALLY: 'rally' });

  constructor(world) { this.world = world; }
  definition(id) { return DIVINE_POWERS.find(power => power.id === id) ?? null; }
  targetType(id) { return this.definition(id)?.targetType ?? null; }
  cast(id, position, choice = null) {
    const type = this.targetType(id);
    if (type === PowerManager.TargetTypes.PLACEMENT) return this.world.placeEntity(id, position);
    if (type === PowerManager.TargetTypes.RALLY) return this.rally(position);
    if (type === PowerManager.TargetTypes.CHARACTER) return this.affectCharacter(id, position, choice);
    return false;
  }
  livingCharacterAt(position) { return this.world.characters.find(character => character.alive && Math.hypot(character.position.x-position.x, character.position.y-position.y) <= character.interactionRadius) ?? null; }
  affectCharacter(id, position, choice) {
    if (id === 'lightning') { const enemy=this.world.invasions?.lightningAt(position); if (enemy) return enemy; }
    const character = this.livingCharacterAt(position);
    if (!character) { this.world.addEffect(position, 'invalid'); return false; }
    if (id === 'changeSex' && !choice) return { requiresChoice: true, character };
    if (id === 'lightning') this.strike(character);
    if (id === 'blessing') this.bless(character);
    if (id === 'changeSex') character.sexCharacteristics = choice;
    if (id === 'giveWeapons') character.isArmed = true;
    if (id === 'shield') character.hasShield = true;
    this.world.addEffect(character.position, id, { characterId: character.id });
    return character;
  }
  strike(character) {
    character.lightningStrikeCount += 1;
    const learned = this.world.divineTeaching.respond(character, 'lightning');
    if (!learned) this.world.ais.get(character.id)?.interrupt();
    if (character.lightningStrikeCount === 3) this.world.killCharacter(character);
  }
  bless(character) {
    character.blessingCount += 1;
    this.world.divineTeaching.respond(character, 'blessing');
    if (character.blessingCount >= 5 && !character.isExalted) { character.isExalted = true; character.canFoundSettlement = true; this.world.addEffect(character.position, 'exalted', { characterId: character.id }); }
  }
  rally(position) {
    if (!this.world.isWalkable(position.x, position.y)) { this.world.addEffect(position, 'invalid'); return false; }
    const pathfinder = new Pathfinder(); const living = this.world.characters.filter(character => character.alive);
    const offsets = [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
    let assigned = 0;
    for (let index=0; index<living.length; index+=1) { const offset=offsets[index%offsets.length]; const destination={x:Math.floor(position.x+offset[0])+.5,y:Math.floor(position.y+offset[1])+.5}; if (!this.world.isWalkable(destination.x,destination.y)) continue; const path=pathfinder.findPath(this.world.terrain,living[index].position,destination); if (path.length || Math.hypot(living[index].position.x-destination.x,living[index].position.y-destination.y)<1) { this.world.ais.get(living[index].id)?.rally(path); assigned+=1; } }
    if (!assigned && living.length) { this.world.addEffect(position, 'invalid'); return false; }
    this.world.rally = { position: {...position}, remaining: 12 };
    this.world.addEffect(position, 'rayOfLight', { duration: 12 });
    return this.world.rally;
  }
}
