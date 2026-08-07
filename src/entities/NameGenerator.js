export class NameGenerator {
  static Names = Object.freeze(['Elia', 'Luce', 'Neri', 'Alma', 'Timo', 'Iris', 'Cora', 'Lio', 'Mira', 'Ari', 'Niva', 'Sole']);

  constructor(existingNames = []) { this.names = new Set(existingNames.map(name => name.trim().toLocaleLowerCase('it'))); }
  register(name) { const key = name.trim().toLocaleLowerCase('it'); if (this.names.has(key)) return false; this.names.add(key); return true; }
  generate(seed = 0) {
    for (let offset = 0; offset < NameGenerator.Names.length; offset += 1) {
      const name = NameGenerator.Names[(Math.abs(seed) + offset) % NameGenerator.Names.length];
      if (this.register(name)) return name;
    }
    let suffix = 2;
    while (!this.register(`Elia ${suffix}`)) suffix += 1;
    return `Elia ${suffix}`;
  }
}
