import { Config } from '../core/Config.js';
import { Settlement } from './Settlement.js';

export class SettlementRules {
  static canReceiveExternalArrival(settlement) { return Boolean(settlement && settlement.state === Settlement.States.GROWING && settlement.externalArrivalCount < Config.MAX_EXTERNAL_ARRIVALS); }
  static canConstructOrdinaryHome(settlement) { return Boolean(settlement && settlement.state === Settlement.States.GROWING); }
  static canFoundNewSettlement(character, world) { return Boolean(character?.alive && character.lifeStage === 'adult' && character.isExalted && !character.hasFoundedSettlement && !character.foundingState && world && world.settlements.length + world.foundingReservations.length < Config.MAX_SETTLEMENTS && world.settlementWater?.availableSource(character.position)); }
}
