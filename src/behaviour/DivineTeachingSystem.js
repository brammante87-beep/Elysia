import { Config } from '../core/Config.js';

export class DivineTeachingSystem {
  constructor(world) { this.world = world; this.feedbackShown = new Set(); }

  respond(character, intervention) {
    const ai = this.world.ais.get(character.id);
    if (!ai?.isStealing()) return false;
    const approval = intervention === 'blessing';
    character.behaviourMemory.teach('theft', approval ? Config.THEFT_TEACHING_AMOUNT : -Config.THEFT_TEACHING_AMOUNT);
    if (!approval) ai.cancelTheft('lightning');
    const key = approval ? 'theftApproval' : 'theftDisapproval';
    if (!this.feedbackShown.has(key)) {
      this.feedbackShown.add(key);
      this.world.addEffect(character.position, key, { characterId: character.id, message: approval ? 'Ha interpretato il tuo favore come approvazione.' : 'Ha compreso la tua disapprovazione.' });
    }
    return true;
  }
}
