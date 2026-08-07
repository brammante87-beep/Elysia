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
      if (!record || record.version !== Config.SAVE_VERSION || !('data' in record)) return null;
      return record;
    } catch {
      return null;
    }
  }

  deleteSave() { this.storage.removeItem(Config.SAVE_KEY); }
}
