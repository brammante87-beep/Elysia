export class EmotionalState {
  static derive(character, recentEvent = null) { const needs=character.needs; if(recentEvent?.type==='death')return 'SAD'; if(recentEvent?.type==='theft')return 'ANGRY'; if(recentEvent?.type==='blessing')return 'GRATEFUL'; if(needs.hunger<.12)return 'DESPERATE'; if(needs.safety<.3)return 'AFRAID'; if(needs.happiness<.32)return 'SAD'; if(needs.happiness>.76)return 'HAPPY'; if(needs.hunger<.35)return 'HOPEFUL'; return 'CALM'; }
}
