import { RivalMeteorAttack } from './RivalMeteorAttack.js';

export class FirstRivalAttack {
  static Phases = Object.freeze({ DORMANT:'DORMANT', DELAY:'DELAY', MANIFESTATION:'MANIFESTATION', DIALOGUE:'DIALOGUE', WARNING:'WARNING', PREPARATION:'PREPARATION', METEOR:'METEOR', CASTLE_RESCUE:'CASTLE_RESCUE', IMPACT:'IMPACT', AFTERMATH:'AFTERMATH', COMPLETE:'COMPLETE' });
  static Durations = Object.freeze({ DELAY:3, MANIFESTATION:2, DIALOGUE:6, WARNING:2, PREPARATION:10, METEOR:3, CASTLE_RESCUE:2.4, IMPACT:2.2, AFTERMATH:5 });
  static Dialogue = Object.freeze([
    '« Così è questo che stai facendo… »',
    '« Raccogli chi fugge dagli altri mondi e lo chiami civiltà. Li usi per far crescere il tuo piccolo Elysia. »',
    '« Credevi davvero che nessuno se ne sarebbe accorto? »',
  ]);

  constructor(world, data = {}) {
    this.world = world;
    this.phase = data.phase ?? FirstRivalAttack.Phases.DORMANT;
    this.elapsed = data.elapsed ?? 0;
    this.firstRivalAttackStarted = data.firstRivalAttackStarted ?? false;
    this.firstRivalAttackCompleted = data.firstRivalAttackCompleted ?? false;
    this.targetSettlementId = data.targetSettlementId ?? null;
    this.casualties = data.casualties ?? 0;
    this.rescueEmitted = data.rescueEmitted ?? false;
    this.rivalWorldId = data.rivalWorldId ?? 'rivalWorld1';
    this.meteor = new RivalMeteorAttack(world);
    if (this.targetSettlementId) this.meteor.arm(this.targetSettlementId);
  }

  notifySettlementRegistered(settlement) {
    if (this.firstRivalAttackStarted || this.firstRivalAttackCompleted || this.world.settlements.length !== 2) return false;
    if (!settlement || settlement !== this.world.settlements[1] || !this.world.findHome(settlement.foundingHomeId)?.completed) return false;
    this.firstRivalAttackStarted = true;
    this.targetSettlementId = this.world.settlements[0].id;
    this.meteor.arm(this.targetSettlementId);
    this.enter(FirstRivalAttack.Phases.DELAY);
    return true;
  }

  get active() { return this.phase !== FirstRivalAttack.Phases.DORMANT && this.phase !== FirstRivalAttack.Phases.COMPLETE; }
  get blocksSimulation() { return this.active; }
  get blocksSaving() { return this.active; }
  get allowsMiracles() { return this.phase === FirstRivalAttack.Phases.PREPARATION; }
  get countdown() { return this.allowsMiracles ? Math.max(0, Math.ceil(FirstRivalAttack.Durations.PREPARATION - this.elapsed)) : null; }
  targetSettlement() { return this.world.settlements.find(settlement => settlement.id === this.targetSettlementId) ?? null; }
  targetPosition() { return this.targetSettlement()?.center ?? { x:this.world.terrain.width/2, y:this.world.terrain.height/2 }; }

  update(deltaTime) {
    if (!this.active) return false;
    this.elapsed += deltaTime;
    const duration = FirstRivalAttack.Durations[this.phase];
    if (duration !== undefined && this.elapsed >= duration) this.advance();
    return true;
  }

  advance() {
    const phases = FirstRivalAttack.Phases;
    const next = { DELAY:phases.MANIFESTATION, MANIFESTATION:phases.DIALOGUE, DIALOGUE:phases.WARNING, WARNING:phases.PREPARATION, PREPARATION:phases.METEOR, METEOR:phases.CASTLE_RESCUE, CASTLE_RESCUE:phases.IMPACT, IMPACT:phases.AFTERMATH, AFTERMATH:phases.COMPLETE }[this.phase];
    if (next) this.enter(next);
  }

  enter(phase) {
    this.phase = phase;
    this.elapsed = 0;
    if (phase === FirstRivalAttack.Phases.PREPARATION) {
      for (const character of this.meteor.affectedCharacters()) {
        character.insideHome = false;
        character.interactionRadius = Math.max(character.interactionRadius, character.lifeStage === 'child' ? 1.75 : 1.25);
      }
    }
    if (phase === FirstRivalAttack.Phases.CASTLE_RESCUE && !this.rescueEmitted) { this.rescueEmitted = true; this.world.diagnostics.trace('rivalCastleRescue', { rainbow:true, unicorn:true }); }
    if (phase === FirstRivalAttack.Phases.IMPACT) this.casualties = this.meteor.resolve().casualties;
    if (phase === FirstRivalAttack.Phases.COMPLETE) {
      this.firstRivalAttackCompleted = true;
      for (const character of this.world.characters) character.shieldImpactReaction = 0;
      this.world.reconcileLivingHouseholds();
    }
  }

  dialogueBeat() { return FirstRivalAttack.Dialogue[Math.min(2, Math.floor(this.elapsed / 2))]; }
  aftermathMessage() { return this.casualties ? `Elysia ha conosciuto il suo primo attacco. ${this.casualties} vite sono state spezzate.` : 'Elysia ha conosciuto il suo primo attacco. Il tuo potere li ha protetti tutti.'; }
  toJSON() { return { phase:this.phase, elapsed:this.elapsed, firstRivalAttackStarted:this.firstRivalAttackStarted, firstRivalAttackCompleted:this.firstRivalAttackCompleted, targetSettlementId:this.targetSettlementId, casualties:this.casualties, rescueEmitted:this.rescueEmitted, rivalWorldId:this.rivalWorldId }; }
}
