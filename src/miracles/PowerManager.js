import { DIVINE_POWERS } from '../data/Powers.js';
import { Pathfinder } from '../world/Pathfinder.js';
import { CommunicationIntent } from '../dialogue/CommunicationIntent.js';

export class PowerManager {
  static TargetTypes = Object.freeze({ PLACEMENT: 'placement', CHARACTER: 'character', RALLY: 'rally' });

  constructor(world) { this.world = world; }
  definition(id) { return DIVINE_POWERS.find(power => power.id === id) ?? null; }
  targetType(id) { return this.definition(id)?.targetType ?? null; }
  cast(id, position, choice = null) {
    const type = this.targetType(id);
    if (type === PowerManager.TargetTypes.PLACEMENT) { const crisis=this.world.events?.activeEvents?.find(event=>['DRY_WATER_SOURCE','TREE_FIRE'].includes(event.type)&&Math.hypot(event.target.position.x-position.x,event.target.position.y-position.y)<=3); if(id==='water'&&crisis){this.world.events.intervene(id,position);this.world.addEffect(position,id);return crisis;} return this.world.placeEntity(id, position); }
    if (type === PowerManager.TargetTypes.RALLY) return this.rally(position);
    if (type === PowerManager.TargetTypes.CHARACTER) return this.affectCharacter(id, position, choice);
    return false;
  }
  livingCharacterAt(position) { return this.world.characters.find(character => character.alive && Math.hypot(character.position.x-position.x, character.position.y-position.y) <= character.interactionRadius) ?? null; }
  affectCharacter(id, position, choice) {
    if (id === 'lightning') { const enemy=this.world.invasions?.lightningAt(position); if (enemy) return enemy; }
    const character = this.livingCharacterAt(position);
    if (!character) { const crisis=this.world.events?.activeEvents?.find(event=>event.type==='SICK_FOOD_SOURCE'&&Math.hypot(event.target.position.x-position.x,event.target.position.y-position.y)<=3); if(id==='blessing'&&crisis){this.world.events.intervene(id,position);this.world.addEffect(position,id);return crisis;} this.world.addEffect(position, 'invalid'); return false; }
    if (id === 'changeSex' && !choice) return { requiresChoice: true, character };
    if (id === 'lightning') this.strike(character);
    if (id === 'blessing') this.bless(character);
    if (id === 'changeSex') character.sexCharacteristics = choice;
    if (id === 'giveWeapons') { character.isArmed = true; character.weaponVisualId = character.worldType === 'human' ? 'divineBlade' : `${character.species ?? 'beast'}Armament`; }
    if (id === 'shield') { character.hasShield = true; character.needs.shield(); }
    this.world.addEffect(character.position, id, { characterId: character.id, duration:id==='lightning'?1.25:id==='giveWeapons'?2.2:undefined });
    this.recordDivineWitnesses(id, character);
    this.world.events?.intervene(id, character.position, character);
    return character;
  }
  strike(character) {
    character.lightningStrikeCount += 1;
    const learned = this.world.divineTeaching.respond(character, 'lightning');
    if (!learned) this.world.ais.get(character.id)?.interrupt();
    character.needs.danger(.28);
    if (character.lightningStrikeCount === 3) this.world.killCharacter(character, 'lightning');
  }
  bless(character) {
    character.blessingCount += 1;
    character.needs.change('happiness', .12);
    this.world.divineTeaching.respond(character, 'blessing');
    if (character.blessingCount >= 5 && !character.isExalted) { character.isExalted = true; character.canFoundSettlement = true; this.world.addEffect(character.position, 'exalted', { characterId: character.id }); }
  }
  recordDivineWitnesses(action, target) { const witnesses=this.world.characters.filter(character=>character.alive&&!character.insideHome&&Math.hypot(character.position.x-target.position.x,character.position.y-target.position.y)<=7); for(const witness of witnesses){const fact=this.world.dialogue.witness(witness,{type:action,subjectId:target.id,importance:action==='lightning'?.9:.65,emotionalImpact:action==='lightning'?-1:.5}); const memory=witness.memories.entries.find(item=>item.id===fact.memoryId); this.world.beliefSystem.observe(witness,memory,{theftKnown:Boolean(witness.knowledge.knows('theft',target.id)),reasonKnown:Boolean(witness.knowledge.knows('theft',target.id)),repeatedTarget:(target.blessingCount+(target.hasShield?1:0))>=3,inCrisis:target.injured});} const speaker=witnesses.sort((a,b)=>b.personality.faithDisposition-a.personality.faithDisposition)[0]; if(!speaker||!['blessing','lightning','shield','giveWeapons'].includes(action))return; this.world.dialogue.say(new CommunicationIntent({speakerId:speaker.id,targetType:'PLAYER',intent:'INTERPRET_DIVINE_ACTION',action,count:target.blessingCount,subjectId:target.id,theftKnown:Boolean(speaker.knowledge.knows('theft',target.id)),knowledgeSource:'WITNESSED',emotion:action==='lightning'?'AFRAID':'GRATEFUL',priority:action==='lightning'?'CRITICAL':'HIGH'})); }
  rally(position) {
    if (!this.world.isWalkable(position.x, position.y)) { this.world.addEffect(position, 'invalid'); return false; }
    const pathfinder = new Pathfinder(); const living = this.world.characters.filter(character => character.alive);
    const offsets = [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
    let assigned = 0;
    for (let index=0; index<living.length; index+=1) { const offset=offsets[index%offsets.length]; const destination={x:Math.floor(position.x+offset[0])+.5,y:Math.floor(position.y+offset[1])+.5}; if (!this.world.isWalkable(destination.x,destination.y)) continue; const path=pathfinder.findPath(this.world.terrain,living[index].position,destination); if (path.length || Math.hypot(living[index].position.x-destination.x,living[index].position.y-destination.y)<1) { this.world.ais.get(living[index].id)?.rally(path); assigned+=1; } }
    if (!assigned && living.length) { this.world.addEffect(position, 'invalid'); return false; }
    this.world.rally = { position: {...position}, remaining: 12 };
    this.world.addEffect(position, 'rayOfLight', { duration: 12 });
    this.world.events?.intervene('rayOfLight', position);
    return this.world.rally;
  }
}
