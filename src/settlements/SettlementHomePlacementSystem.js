import { Config } from '../core/Config.js';
import { TerrainMap } from '../world/TerrainMap.js';
import { BuildingFootprint } from '../entities/BuildingFootprint.js';

export class SettlementHomePlacementSystem {
  constructor(world, data = {}) { this.world = world; this.reservations = new Map((data.reservations ?? []).map(item => [item.ownerId, { ...item, position: { ...item.position }, bounds: { ...item.bounds } }])); }

  reserve(settlement, ownerId, bounds = BuildingFootprint.dwelling()) {
    const existing = this.reservations.get(ownerId); if (existing) return { ...existing.position };
    this.world.diagnostics.trace('homePlacementSearchStarted', { settlementId: settlement.id, ownerId });
    for (const position of this.candidates(settlement)) if (this.isValid(position, bounds)) { this.reservations.set(ownerId, { ownerId, settlementId: settlement.id, position: { ...position }, bounds: { ...bounds } }); this.world.diagnostics.trace('homePlacementReserved', { settlementId: settlement.id, ownerId, position }); return { ...position }; } else this.world.diagnostics.trace('homePlacementCandidateRejected', { settlementId: settlement.id, ownerId, position });
    return null;
  }

  complete(ownerId, buildingId) { const reservation = this.reservations.get(ownerId); if (!reservation) return false; this.reservations.delete(ownerId); this.world.diagnostics.trace('homePlacementCompleted', { ownerId, buildingId, position: reservation.position }); return true; }
  cancel(ownerId) { return this.reservations.delete(ownerId); }

  candidates(settlement) {
    const center = settlement.center ?? this.world.findHome(settlement.foundingHomeId)?.position;
    if (!center) return [];
    // Reserve enough room for the founding dwelling's later central-structure footprint.
    const spacingX = Config.CENTRAL_PLACEMENT_HALF_WIDTH + Config.HOME_PLACEMENT_HALF_WIDTH + Config.HOME_MIN_CLEARANCE + .5;
    const spacingY = Config.CENTRAL_PLACEMENT_HALF_HEIGHT + Config.HOME_PLACEMENT_HALF_HEIGHT + Config.HOME_MIN_CLEARANCE + .5;
    const organic = this.world.worldType === 'beast' ? .42 : .24;
    const preferred = [[-1,0],[1,.08],[.12,-1],[-.08,1],[-1,-1],[1,1],[1,-1],[-1,1]];
    const result = preferred.map(([x,y], index) => ({ x: center.x + x * spacingX + Math.sin(index * 2.17 + this.world.worldSeed) * organic, y: center.y + y * spacingY + Math.cos(index * 1.73 + this.world.worldSeed) * organic }));
    for (let ring = 2; ring <= 7; ring += 1) for (let step = 0; step < ring * 8; step += 1) { const angle = step * Math.PI * 2 / (ring * 8); result.push({ x: center.x + Math.cos(angle) * spacingX * ring, y: center.y + Math.sin(angle) * spacingY * ring }); }
    return result.map(point => ({ x: Math.round(point.x * 4) / 4, y: Math.round(point.y * 4) / 4 }));
  }

  isValid(position, bounds, ignoredHomeIds = []) {
    if (!this.isBuildableGrass(position, bounds)) return false;
    for (const home of this.world.homes.filter(item => item.alive && !ignoredHomeIds.includes(item.id))) if (this.overlaps(position, bounds, home.position, home.placementBounds ?? BuildingFootprint.dwelling())) return false;
    for (const reservation of this.reservations.values()) if (this.overlaps(position, bounds, reservation.position, reservation.bounds)) return false;
    const blockers = [...this.world.trees, ...this.world.waterSources, ...this.world.cows, ...this.world.animalFoodSources, ...this.world.flowers, ...this.world.appleTrees].filter(item => item.alive);
    return blockers.every(entity => !this.intersectsCircle(position, bounds, entity.position, entity.collisionRadius ?? .8));
  }

  isBuildableGrass(position, bounds) { const minX = Math.floor(position.x - bounds.halfWidth), maxX = Math.floor(position.x + bounds.halfWidth); const minY = Math.floor(position.y - bounds.halfHeight), maxY = Math.floor(position.y + bounds.halfHeight); for (let y = minY; y <= maxY; y += 1) for (let x = minX; x <= maxX; x += 1) if (!this.world.isTerrainType(x, y, TerrainMap.Types.GRASS)) return false; return true; }
  overlaps(a, ab, b, bb) { return Math.abs(a.x - b.x) < ab.halfWidth + bb.halfWidth + Config.HOME_MIN_CLEARANCE && Math.abs(a.y - b.y) < ab.halfHeight + bb.halfHeight + Config.HOME_MIN_CLEARANCE; }
  intersectsCircle(position, bounds, circle, radius) { const x = Math.max(position.x - bounds.halfWidth - Config.HOME_MIN_CLEARANCE, Math.min(circle.x, position.x + bounds.halfWidth + Config.HOME_MIN_CLEARANCE)); const y = Math.max(position.y - bounds.halfHeight - Config.HOME_MIN_CLEARANCE, Math.min(circle.y, position.y + bounds.halfHeight + Config.HOME_MIN_CLEARANCE)); return Math.hypot(circle.x - x, circle.y - y) < radius; }

  repairOverlaps(settlement) {
    const homes = settlement.homeBuildingIds.map(id => this.world.findHome(id)).filter(Boolean); const accepted = [];
    for (const home of homes) { const invalid = !this.isBuildableGrass(home.position, home.placementBounds) || accepted.some(other => this.overlaps(home.position, home.placementBounds, other.position, other.placementBounds)); if (invalid) { const original = { ...home.position }; const position = this.candidates(settlement).find(candidate => this.isValid(candidate, home.placementBounds, [home.id])); if (position) { home.position = position; this.world.diagnostics.trace('overlapRepairPerformed', { settlementId: settlement.id, buildingId: home.id, from: original, to: position }); } } accepted.push(home); }
  }
  toJSON() { return { reservations: [...this.reservations.values()].map(item => ({ ...item, position: { ...item.position }, bounds: { ...item.bounds } })) }; }
}
