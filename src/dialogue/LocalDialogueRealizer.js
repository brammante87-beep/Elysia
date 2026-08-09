import { CharacterKnowledge } from '../social/CharacterKnowledge.js';
export class LocalDialogueRealizer {
  realize(intent, context = {}) { const method = this[intent.intent] ?? this.REPORT_EVENT; const text = method.call(this, intent, context); return this.filter(text, context.familyMode); }
  pick(intent, variants) { let hash = 0; for (const char of intent.signature()) hash = ((hash * 31) + char.charCodeAt(0)) >>> 0; return variants[(hash + (intent.variant ?? 0)) % variants.length]; }
  resource(resource = 'food') { return ({ food: 'cibo', water: 'acqua', wood: 'legna' })[resource] ?? resource; }
  name(id, context) { return context.names?.[id] ?? id ?? 'qualcuno'; }
  beliefMeaning(type) { return ({ THE_OMNIPOTENT_DISAPPROVES_OF_THEFT:'l’Onnipotente non voglia che rubiamo', THE_OMNIPOTENT_APPROVES_OF_SHARING:'l’Onnipotente voglia che ci aiutiamo', THE_OMNIPOTENT_PROTECTS_CHILDREN:'l’Onnipotente protegga i bambini', THE_OMNIPOTENT_VALUES_STRENGTH:'l’Onnipotente apprezzi la forza', THE_OMNIPOTENT_REWARDS_OBEDIENCE:'l’Onnipotente ricompensi chi ascolta', THE_OMNIPOTENT_PROVIDES_WHEN_WE_SUFFER:'l’Onnipotente provveda a noi quando soffriamo', THE_OMNIPOTENT_PUNISHES_VIOLENCE:'l’Onnipotente punisca la violenza', THE_OMNIPOTENT_FAVORS_SOME_PEOPLE:'l’Onnipotente favorisca alcune persone', THE_OMNIPOTENT_IS_UNPREDICTABLE:'la volontà dell’Onnipotente sia imprevedibile', THE_OMNIPOTENT_HAS_ABANDONED_US:'l’Onnipotente ci abbia abbandonati', THE_CASTLE_IS_PROTECTED:'il Castello sia protetto', ELYSIA_IS_CHOSEN:'Elysia sia stata scelta', THE_OMNIPOTENT_SAVED_THE_SETTLEMENT:'l’Onnipotente abbia salvato l’insediamento' })[type] ?? 'l’Onnipotente voglia dirci qualcosa'; }
  EXPRESS_BELIEF(i,c) { const meaning=this.beliefMeaning(i.beliefType); const attribution=i.sourceType==='TOLD_BY_OTHER'&&i.taughtBy?`${this.name(i.taughtBy,c)} dice che `:''; if(i.confidenceLevel==='HIGH')return `${attribution}Sono convinto che ${meaning}.`; if(i.confidenceLevel==='MEDIUM')return `${attribution}Credo che ${meaning}.`; return `${attribution}Forse ${meaning}.`; }
  TEACH_BELIEF(i,c) { return this.EXPRESS_BELIEF(i,c); }
  QUESTION_BELIEF() { return 'Perché credi che l’abbia fatto?'; }
  AGREE_BELIEF() { return 'Credo che tu abbia ragione.'; }
  DISAGREE_BELIEF(i) { return `Non credo che ${this.beliefMeaning(i.beliefType)}.`; }
  DOUBT_BELIEF() { return 'Non ne sono sicuro. Potrebbe esserci un’altra spiegazione.'; }
  REINTERPRET_DIVINE_ACTION() { return 'Forse abbiamo interpretato male ciò che è accaduto.'; }
  ASK_DIVINE_PURPOSE(i) { if(i.faithLevel==='DEVOTED')return 'Onnipotente, guidaci. È questo che vuoi?'; if(i.faithLevel==='SKEPTICAL')return 'Non so se serva parlare con te. Perché l’hai fatto?'; return 'Onnipotente, stiamo facendo la cosa giusta?'; }
  EXPRESS_NEED(i) { const thing=this.resource(i.resource); if ((i.urgency ?? 0) >= 3) return `Onnipotente, aiutaci: non abbiamo più ${thing}!`; if ((i.urgency ?? 0) >= 2) return `Non abbiamo abbastanza ${thing}.`; return `Avrei bisogno di un po' di ${thing}.`; }
  REQUEST_HELP(i,c) { if(i.eventType==='LOST_CHILD')return `Onnipotente, non trovo ${this.name(i.subjectId,c)}.`; if(i.eventType==='DRY_WATER_SOURCE')return "Ti prego, fa' tornare l'acqua."; if(i.eventType==='TREE_FIRE')return 'Onnipotente, il fuoco minaccia gli alberi!'; if(i.eventType==='SICK_FOOD_SOURCE')return 'Quel cibo ha qualcosa che non va. Aiutaci.'; if(i.eventType==='WORK_INJURY'||i.eventType==='NEWCOMER_NEEDS_HELP')return 'Mi sono fatto male. Puoi aiutarmi?'; return i.targetType === 'PLAYER' ? 'Onnipotente, ti prego, aiutaci.' : 'Puoi aiutarmi?'; }
  REPORT_THEFT(i,c) { const name=this.name(i.subjectId,c), object=i.resource==='wood'?'la legna della nostra casa':i.resource==='water'?'la nostra acqua':'il nostro cibo'; if ([CharacterKnowledge.Sources.ASSUMED,CharacterKnowledge.Sources.UNCERTAIN].includes(i.knowledgeSource)) return `Credo che qualcuno stia prendendo ${object}. Non ne sono sicuro.`; if (i.knowledgeSource===CharacterKnowledge.Sources.TOLD_BY_OTHER) return `${this.name(i.toldBy,c)} dice che ${name} ha preso ${object}.`; return `${i.targetType==='PLAYER'?'Onnipotente, ':''}ho visto ${name} ${this.pick(i,['rubare','prendere di nascosto','portare via'])} ${object}.`;
  }
  ASK_CHARACTER(i,c) { if(i.topic==='location') return `Dov'è ${this.name(i.subjectId,c)}?`; if(i.topic==='origin') return 'Da dove vieni?'; return 'Che cosa sai di tutto questo?'; }
  ANSWER_CHARACTER(i,c) { if(i.topic==='location') return `Ho visto ${this.name(i.subjectId,c)} vicino ${i.location ?? 'al villaggio'}.`; if(i.topic==='origin') return i.avoidsAnswer?'Preferirei non parlare di casa.':`Vengo da ${i.origin ?? 'un luogo lontano'}.`; return i.textMeaning ?? 'Questo è ciò che so.'; }
  THANK_DIVINITY() { return 'Onnipotente, grazie.'; }
  QUESTION_DIVINITY() { return 'Onnipotente, ci stai guardando?'; }
  EXPRESS_FEAR(i) { return i.courage > .6?'Dobbiamo difenderci.':'Dobbiamo nasconderci!'; }
  EXPRESS_GRIEF(i,c) { return i.cause==='lightning'?'Onnipotente, perché l’hai fatto?':`${this.name(i.subjectId,c)} mi manca.`; }
  EXPRESS_LOVE(i,c) { return `${this.name(i.subjectId,c)}, sono felice che tu sia qui.`; }
  GREET_CHARACTER(i,c) { return `Ciao, ${this.name(i.subjectId,c)}.`; }
  GREET_NEWCOMER() { return 'Posso restare qui?'; }
  WELCOME_NEWCOMER(i,c) { return `Benvenuto, ${this.name(i.subjectId,c)}.`; }
  CELEBRATE(i,c) { return i.topic==='birth'?`Benvenuta su Elysia, ${this.name(i.subjectId,c)}!`:'Oggi abbiamo qualcosa da celebrare!'; }
  INTERPRET_DIVINE_ACTION(i,c) { if(i.action==='blessing') return i.count>=4?'Ho compreso la tua volontà.':i.count>=3?'Credo di capire...':i.count>=2?'Stai parlando con me?':'Che cosa è stato?'; if(i.action==='lightning') return i.theftKnown?`Credo che abbia punito ${this.name(i.subjectId,c)} perché aveva rubato.`:'Forse era la sua ira.'; return 'Credo che l’Onnipotente voglia dirci qualcosa.'; }
  EXPRESS_CONFUSION() { return 'Che cosa...?'; }
  JUSTIFY_THEFT(i) { return i.reason==='family'?'Serviva alla mia famiglia.':'Avevo fame.'; }
  DENY_THEFT() { return 'Non sono stato io.'; }
  APOLOGIZE() { return 'Mi dispiace. Non lo farò più.'; }
  COMMENT_ON_RESOURCE(i) { return i.abundant?`${this.resource(i.resource)} non manca.`:`Ci serve ${this.resource(i.resource)}.`; }
  AMBIENT_OBSERVATION(i) { return i.recentAttack?'È strano vedere tutto così tranquillo.':i.recentBirth?'C’è una nuova vita nel villaggio.':'È una bella alba.'; }
  REPORT_EVENT(i,c) { return i.textMeaning ?? `${this.name(i.subjectId,c)} ha visto qualcosa di importante.`; }
  filter(text, familyMode) { if (!familyMode) return text; return text.replace(/\b(sesso|sessuale|orientamento|identità di genere)\b/gi, 'vita privata'); }
}
