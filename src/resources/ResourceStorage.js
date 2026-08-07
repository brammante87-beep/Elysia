import { Resources } from '../data/Resources.js';

export class ResourceStorage {
  constructor(values = {}, capacity = 6) {
    this.capacity = capacity;
    this.values = Object.fromEntries(Resources.ALL.map(id => [id, Math.max(0, Math.min(capacity, values[id] ?? 0))]));
  }
  get(resource) { return this.values[resource] ?? 0; }
  add(resource, amount = 1) { const before = this.get(resource); this.values[resource] = Math.min(this.capacity, before + amount); return this.values[resource] - before; }
  remove(resource, amount = 1) { const removed = Math.min(this.get(resource), amount); this.values[resource] -= removed; return removed; }
  has(cost) { return Object.entries(cost).every(([resource, amount]) => this.get(resource) >= amount); }
  consume(cost) { if (!this.has(cost)) return false; for (const [resource, amount] of Object.entries(cost)) this.values[resource] -= amount; return true; }
  isFull(resource) { return this.get(resource) >= this.capacity; }
  isCompletelyFull() { return Resources.ALL.every(resource => this.isFull(resource)); }
  toJSON() { return { capacity: this.capacity, values: { ...this.values } }; }
}
