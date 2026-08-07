import { Config } from '../core/Config.js';

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
      return record;
    } catch {
      return null;
    }
  }

  isValidRecord(record) {
    return record !== null
      && typeof record === 'object'
      && !Array.isArray(record)
      && record.version === Config.SAVE_VERSION
      && record.data !== null
      && typeof record.data === 'object'
      && !Array.isArray(record.data);
  }

  deleteSave() { this.storage.removeItem(Config.SAVE_KEY); }
}
