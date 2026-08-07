import { RivalWorlds } from '../data/RivalWorlds.js';

export class RefugeeIdentity {
  static TrueSpecies = Object.freeze({ rivalWorld1: 'lionHumanoid', rivalWorld2: 'worldIIHuman', rivalWorld3: 'dolphin' });
  static TrueProfiles = Object.freeze({ rivalWorld1: 'civilian.lion', rivalWorld2: 'civilian.worldII', rivalWorld3: 'civilian.dolphin' });
  static RevealLines = Object.freeze({
    rivalWorld1: ['Credevo di essere sfuggito ai suoi cacciatori.', 'Ho lasciato quel mondo per non dover più vedere quegli archi.'],
    rivalWorld2: ['Mi hanno trovato anche qui.', 'Pensavo che Elysia fosse abbastanza lontana.'],
    rivalWorld3: ['Conosco quelle armi. Dobbiamo nasconderci.', 'Non avrei mai creduto che ci avrebbero seguito fin qui.'],
  });

  static worldIdForOrigin(originWorld) { return RivalWorlds.all().find(world => world.worldName === originWorld)?.id ?? null; }
  static data(originWorld, publiclyRevealed = false) {
    const originWorldId = RefugeeIdentity.worldIdForOrigin(originWorld);
    if (!originWorldId) return {};
    return { originWorldId, trueSpecies: RefugeeIdentity.TrueSpecies[originWorldId], isDisguised: !publiclyRevealed,
      disguiseVisualProfile: 'human.base', trueVisualProfile: RefugeeIdentity.TrueProfiles[originWorldId], identityRevealed: publiclyRevealed };
  }
  static reveal(character, dramatic = false) {
    if (!character?.alive || !character.originWorldId || character.identityRevealed) return false;
    character.isDisguised = false; character.identityRevealed = true; character.visualProfile = character.trueVisualProfile;
    if (dramatic) character.speechText = 'No... loro no.';
    return true;
  }
  static historyLine(character) { const lines = RefugeeIdentity.RevealLines[character.originWorldId] ?? []; return lines[Math.abs(String(character.id).length) % Math.max(1, lines.length)] ?? null; }
}
