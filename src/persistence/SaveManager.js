import { Config } from '../core/Config.js';
import { GameState } from '../core/GameState.js';
import { WorldTypes } from '../data/WorldTypes.js';

export class SaveManager {
  constructor(storage = globalThis.localStorage) { this.storage = storage; }

  hasSave() { return this.load() !== null; }

  save(data) {
    const record = { version: Config.SAVE_VERSION, data };
    this.storage.setItem(Config.SAVE_KEY, JSON.stringify(record));
    return record;
  }

  load() {
    const serialized = this.storage.getItem(Config.SAVE_KEY);
    if (serialized === null) return null;
    try {
      const record = JSON.parse(serialized);
      if (!this.isValidRecord(record)) return null;
      return { ...record, data: this.withDefaults(record.data) };
    } catch {
      return null;
    }
  }

  isValidRecord(record) {
    const structurallyValid = record !== null
      && typeof record === 'object'
      && !Array.isArray(record)
      && record.version === Config.SAVE_VERSION
      && record.data !== null
      && typeof record.data === 'object'
      && !Array.isArray(record.data);
    if (!structurallyValid) return false;
    if ('state' in record.data && !Object.values(GameState.States).includes(record.data.state)) return false;
    if ('introPage' in record.data && (!Number.isInteger(record.data.introPage) || record.data.introPage < 0)) return false;
    return !('worldType' in record.data) || record.data.worldType === null || WorldTypes.isValid(record.data.worldType);
  }

  withDefaults(data) {
    if (!('state' in data)) return data;
    return { ...data, introPage: data.introPage ?? 0, worldType: data.worldType ?? null };
  }

  deleteSave() { this.storage.removeItem(Config.SAVE_KEY); }
}
