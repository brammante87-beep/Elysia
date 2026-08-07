export class MigrationNarrative {
  static StoryTypes = Object.freeze(['WAR','WORLD_COLLAPSE','FAMINE','DIVINE_CONFLICT','PERSECUTION','SOLITUDE','NATURAL_DISASTER','EXILE','LOST_TRAVELER']);
  static OriginWorlds = Object.freeze(['Ilyrion','Varkesh','Pelagion-9','Asteria','Veloran','Nymara','Tharos','Eredyn','Caligo','Orthea','Syr','Mareth','Ilyon','Vaelora','Cyrane','Ossara','Luneth','Tiravel','Auralis','Nerion','Selvara','Kaelor','Myriath','Damaris','Elyndra','Voruna','Iskara','Phaeron','Talmera','Coralis','Zoryn','Avenor','Rhyssa']);
  static Labels = Object.freeze({ WAR:'Fuggito da una guerra che ha disperso il suo popolo.', WORLD_COLLAPSE:'Sopravvissuto al collasso del suo mondo.', FAMINE:'Partito quando raccolti e provviste sono venuti meno.', DIVINE_CONFLICT:'Scampato a un conflitto attribuito agli Onnipotenti.', PERSECUTION:'In fuga da chi non gli permetteva di vivere liberamente.', SOLITUDE:'Viandante in cerca di compagnia e di una nuova casa.', NATURAL_DISASTER:'Sopravvissuto a un grande disastro naturale.', EXILE:'Esule dal proprio mondo.', LOST_TRAVELER:'Viaggiatore smarrito che ha infine trovato Elysia.' });
  static Human = Object.freeze({
    WAR:[['h-war-1','Vengo da {originWorld}. La guerra ci ha dispersi. Posso restare qui?'],['h-war-2','Su {originWorld} non trovavo più pace. Offro il mio lavoro in cambio di una casa.']],
    WORLD_COLLAPSE:[['h-collapse-1','Di {originWorld} resta soltanto il ricordo. Elysia può essere il mio nuovo inizio?'],['h-collapse-2','Il cielo di {originWorld} si è spezzato. Ho viaggiato fin qui cercando terra viva.']],
    FAMINE:[['h-famine-1','Su {originWorld} i raccolti sono morti. Non cerco ricchezze, solo un posto dove ricominciare.'],['h-famine-2','La fame mi ha condotto lontano da {originWorld}. Posso guadagnarmi un posto tra voi?']],
    DIVINE_CONFLICT:[['h-divine-1','Gli Onnipotenti si contendevano {originWorld}. Ho seguito le stelle fino a Elysia.'],['h-divine-2','Sono fuggito dai prodigi che devastavano {originWorld}. Qui vorrei vivere in pace.']],
    PERSECUTION:[['h-persecution-1','Su {originWorld} non potevo più essere me stesso. Mi accoglierete a Elysia?'],['h-persecution-2','Chi governava {originWorld} mi dava la caccia. Chiedo soltanto una vita tranquilla qui.']],
    SOLITUDE:[['h-solitude-1','Ciao, sono stanco di stare solo. Vengo da {originWorld}: posso unirmi a voi?'],['h-solitude-2','Ho lasciato {originWorld} per conoscere nuovi compagni. Elysia sembra un luogo gentile.']],
    NATURAL_DISASTER:[['h-disaster-1','Il mare ha coperto le città di {originWorld}. Posso costruire una nuova casa qui?'],['h-disaster-2','Tempeste senza fine hanno cancellato la mia strada su {originWorld}. Elysia mi offre un riparo?']],
    EXILE:[['h-exile-1','Mi chiamavano esule su {originWorld}. Qui posso vivere senza quel nome?'],['h-exile-2','Sono stato mandato via da {originWorld}. Se mi accogliete, lavorerò con voi.']],
    LOST_TRAVELER:[['h-lost-1','Partii da {originWorld} per curiosità e persi la rotta. Posso fermarmi a Elysia?'],['h-lost-2','Ho vagato tra cieli sconosciuti da {originWorld}. Finalmente vedo luci amiche. Posso restare?']]
  });
  static Beast = Object.freeze({
    deer:[['b-deer-1','La mia mandria fuggì da {originWorld} quando i fiumi scomparvero. Qui sento acqua viva.'],['b-deer-2','Il fuoco divorò la foresta di {originWorld}. Posso correre nelle terre aperte di Elysia?'],['b-deer-3','Ho seguito il profumo dell’erba viva da {originWorld} fino a questo luogo.']],
    dog:[['b-dog-1','Ho perso il mio branco oltre le stelle, lontano da {originWorld}. Posso camminare con voi?'],['b-dog-2','Le case di {originWorld} sono rimaste vuote. Cerco nuovi compagni a Elysia.'],['b-dog-3','Da {originWorld} ho seguito tracce amiche fin qui. Offro la mia lealtà al nuovo branco.']],
    cat:[['b-cat-1','Le rovine di {originWorld} non erano più il mio territorio. Qui vorrei trovare quiete.'],['b-cat-2','Ho vagato solo da {originWorld}. Elysia ha angoli caldi e odori nuovi.'],['b-cat-3','Una tempesta cancellò i sentieri di {originWorld}. Posso scegliere una casa tra voi?']]
  });
  constructor(data = {}) { this.usedWorlds = [...(data.usedWorlds ?? [])]; this.recentLineIds = [...(data.recentLineIds ?? [])].slice(-6); }
  origin(seed) { const available = MigrationNarrative.OriginWorlds.filter(name => !this.usedWorlds.includes(name)); const pool = available.length ? available : MigrationNarrative.OriginWorlds; const name = pool[Math.abs(seed) % pool.length]; this.usedWorlds.push(name); return name; }
  story(seed) { return MigrationNarrative.StoryTypes[Math.abs(seed) % MigrationNarrative.StoryTypes.length]; }
  dialogue(story, origin, species = null, seed = 0) { const pool = species ? MigrationNarrative.Beast[species] : MigrationNarrative.Human[story]; const choices = pool.filter(([id]) => !this.recentLineIds.includes(id)); const [id, template] = (choices.length ? choices : pool)[Math.abs(seed) % (choices.length || pool.length)]; this.recentLineIds.push(id); this.recentLineIds = this.recentLineIds.slice(-6); return { id, lines: template.split(' | ').map(line => line.replaceAll('{originWorld}', origin)) }; }
  label(story) { return MigrationNarrative.Labels[story] ?? 'Viaggiatore giunto da un altro mondo.'; }
  toJSON() { return { usedWorlds: [...this.usedWorlds], recentLineIds: [...this.recentLineIds] }; }
}
