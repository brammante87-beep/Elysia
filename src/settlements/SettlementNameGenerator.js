export class SettlementNameGenerator {
  static starts = Object.freeze(['Eli', 'Luma', 'Astra', 'Vela', 'Niva', 'Sera', 'Oria', 'Tera']);
  static ends = Object.freeze(['ria', 'dor', 'lume', 'valle', 'selva', 'nora', 'vento', 'ara']);
  generate(seed = 0) { const value = Math.abs(Number(seed) || 0); return `${SettlementNameGenerator.starts[value % 8]}${SettlementNameGenerator.ends[Math.floor(value / 8) % 8]}`; }
}
