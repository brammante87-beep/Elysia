import { House } from './House.js';
import { ResourceStorage } from '../resources/ResourceStorage.js';
import { Config } from '../core/Config.js';
export class CentralStructure extends House {
  constructor(data) { super(data); this.kind = 'centralStructure'; this.centralVariant = data.centralVariant; this.settlementId = data.settlementId; this.storage = new ResourceStorage(data.storage?.values ?? data.storage ?? {}, Config.CENTRAL_STORAGE_CAPACITY); this.collisionRadius = 2; }
}
