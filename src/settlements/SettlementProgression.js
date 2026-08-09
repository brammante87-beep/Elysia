import { Config } from '../core/Config.js';
import { WorldTypeId } from '../data/WorldTypes.js';
import { CentralStructure } from '../entities/CentralStructure.js';
import { Settlement } from './Settlement.js';
import { SettlementNameGenerator } from './SettlementNameGenerator.js';

export class SettlementProgression {
  constructor(world, data = {}) {
    this.world = world;
    this.transformations = data.transformations ?? 0;
    this.migrationVersion = data.migrationVersion ?? 0;
    this.repairLegacySettlements();
  }

  ensureFoundingSettlement() {
    if (this.world.worldType === WorldTypeId.PLANT) return null;
    if (this.world.settlements.length) return this.world.settlements[0];
    const chosen = this.world.characters.find(character => character.chosenOne && character.alive);
    const household = this.world.households.find(item => item.id === chosen?.householdId) ?? this.world.households[0];
    const home = this.world.findHome(household?.homeBuildingId);
    if (!household || !home?.completed) return null;
    const settlement = new Settlement({ id: 'settlement-1', name: new SettlementNameGenerator().generate(this.world.worldSeed), founderId: chosen?.id ?? household.memberIds[0], householdIds: [household.id], homeBuildingIds: [home.id], foundingHomeId: home.id, center: home.position });
    household.settlementId = settlement.id;
    home.settlementId = settlement.id;
    for (const id of household.memberIds) {
      const character = this.world.characters.find(item => item.id === id);
      if (character) character.settlementId = settlement.id;
    }
    this.world.settlements.push(settlement);
    return settlement;
  }

  evaluate() {
    this.ensureFoundingSettlement();
    let result = false;
    for (const settlement of this.world.settlements) result = this.evaluateSettlement(settlement) || result;
    return result;
  }

  qualifyingHomes(settlement) {
    return settlement.homeBuildingIds
      .map(id => this.world.findHome(id))
      .filter(home => home?.completed && home.alive && home.kind !== 'centralStructure')
      .slice(0, Config.SETTLEMENT_HOME_MILESTONE);
  }

  evaluateSettlement(settlement) {
    if (!settlement?.isGrowing()) return false;
    const consumed = this.qualifyingHomes(settlement);
    if (consumed.length < Config.SETTLEMENT_HOME_MILESTONE) return false;
    const founding = consumed.find(home => home.id === settlement.foundingHomeId);
    if (!founding) return false;
    return this.consolidate(settlement, consumed, false);
  }

  consolidate(settlement, consumed, migrated) {
    const beast = this.world.worldType === WorldTypeId.BEAST;
    const center = this.clusterCenter(consumed);
    const storage = this.sumStorage(consumed);
    const centralId = consumed.find(home => home.kind === 'centralStructure')?.id ?? settlement.foundingHomeId;
    const central = new CentralStructure({ id: centralId, position: center, completed: true, alive: true, settlementId: settlement.id, householdId: null, storage, centralVariant: beast ? 'greatDen' : 'castle', visualVariant: beast ? 'greatDen' : 'castle', transformationAge: migrated ? 2 : 0 });
    const consumedIds = new Set(consumed.map(home => home.id));
    this.world.homes = this.world.homes.filter(home => !consumedIds.has(home.id));
    this.world.homes.push(central);
    if (consumedIds.has(this.world.hut?.id)) this.world.hut = central;
    this.rehomeResidents(settlement, consumedIds, central);
    settlement.homeBuildingIds = [central.id];
    settlement.foundingHomeId = central.id;
    settlement.centralStructureId = central.id;
    settlement.center = { ...center };
    settlement.name ??= new SettlementNameGenerator().generate(this.world.worldSeed + this.transformations);
    settlement.establish();
    this.transformations += migrated ? 0 : 1;
    if (!migrated) this.emitTransformation(settlement, consumed, central, beast);
    return central;
  }

  clusterCenter(homes) {
    const total = homes.reduce((point, home) => ({ x: point.x + home.position.x, y: point.y + home.position.y }), { x: 0, y: 0 });
    return { x: total.x / homes.length, y: total.y / homes.length };
  }

  sumStorage(homes) {
    const totals = { wood: 0, water: 0, food: 0 };
    for (const home of homes) for (const resource of Object.keys(totals)) totals[resource] += home.storage?.get(resource) ?? 0;
    for (const resource of Object.keys(totals)) {
      if (totals[resource] > Config.CENTRAL_STORAGE_CAPACITY) throw new Error(`Castle storage overflow for ${resource}`);
    }
    return totals;
  }

  rehomeResidents(settlement, consumedIds, central) {
    for (const household of this.world.households) {
      if (household.settlementId !== settlement.id && !consumedIds.has(household.homeBuildingId)) continue;
      if (consumedIds.has(household.homeBuildingId)) household.homeBuildingId = central.id;
      for (const memberId of household.memberIds) {
        const character = this.world.characters.find(item => item.id === memberId);
        if (!character) continue;
        if (consumedIds.has(character.homeBuildingId)) character.homeBuildingId = central.id;
        if (Math.hypot(character.position.x - central.position.x, character.position.y - central.position.y) < central.collisionRadius) character.position = { x: central.position.x, y: central.position.y + central.collisionRadius + .5 };
      }
    }
  }

  emitTransformation(settlement, homes, central, beast) {
    const message = beast ? 'Quattro tane si intrecciano nella Grande Tana ancestrale.' : 'Quattro dimore si fondono nel Castello.';
    this.world.addEffect(central.position, 'settlementTransform', { duration: 5, settlementName: settlement.name, message, sourcePositions: homes.map(home => ({ ...home.position })), visualVariant: beast ? 'roots' : 'masonry' });
    this.world.diagnostics.trace('settlementImmigrationClosed', { settlementId: settlement.id, externalArrivalCount: settlement.externalArrivalCount });
    this.world.diagnostics.trace('centralTransformationCompleted', { settlementId: settlement.id, buildingId: central.id, consumedBuildingIds: homes.map(home => home.id), variant: central.centralVariant });
  }

  repairLegacySettlements() {
    if (this.migrationVersion >= 1) return;
    for (const settlement of this.world.settlements ?? []) {
      if (settlement.isGrowing()) continue;
      const registered = settlement.homeBuildingIds.map(id => this.world.findHome(id)).filter(Boolean);
      const central = registered.find(home => home.kind === 'centralStructure');
      const obsolete = registered.filter(home => home.kind !== 'centralStructure' && home.completed && home.alive);
      const occupied = obsolete.every(home => this.world.households.some(household => household.homeBuildingId === home.id));
      if (central && obsolete.length === 3 && occupied) this.consolidate(settlement, [central, ...obsolete], true);
    }
    this.migrationVersion = 1;
  }

  toJSON() { return { transformations: this.transformations, migrationVersion: this.migrationVersion }; }
}
