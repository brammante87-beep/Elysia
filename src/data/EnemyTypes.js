export class EnemyTypes {
  static Definitions = Object.freeze([
    Object.freeze({ id:'lionArcher', rivalWorldId:'rivalWorld1', baseHealth:70, damage:24, range:9, preferredRange:7, minimumRange:4, speed:1.7, attackCooldown:3.2, windup:1.25, deliveryType:'projectile', projectileType:'arrow', projectileSpeed:7, weapon:'bow', visualProfile:'alpha185.lionArcher' }),
    Object.freeze({ id:'blondWarrior', rivalWorldId:'rivalWorld2', baseHealth:110, damage:18, range:1.35, preferredRange:1.1, minimumRange:0, speed:2, attackCooldown:1.55, windup:.55, deliveryType:'melee', projectileType:null, weapon:'spear', visualProfile:'alpha130.worldIIWarrior' }),
    Object.freeze({ id:'dolphinGunner', rivalWorldId:'rivalWorld3', baseHealth:60, damage:12, range:7.5, preferredRange:5.5, minimumRange:2.5, speed:2.7, attackCooldown:1.35, windup:.45, deliveryType:'projectile', projectileType:'energyBolt', projectileSpeed:12, weapon:'twin ray emitters', visualProfile:'alpha130.dolphinGunner' }),
  ]);
  static all() { return EnemyTypes.Definitions; }
  static get(id) { return EnemyTypes.Definitions.find(type => type.id === id) ?? null; }
  static forWorld(id) { return EnemyTypes.Definitions.find(type => type.rivalWorldId === id) ?? null; }
}
