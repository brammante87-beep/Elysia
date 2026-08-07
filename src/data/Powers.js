export const DIVINE_POWERS = Object.freeze([
  { id: 'plant', label: 'PIANTA', icon: 'assets/powers/plant.svg', description: 'Fa nascere un albero.', targetType: 'placement', worlds: ['human', 'beast', 'plant'] },
  { id: 'water', label: 'ACQUA', icon: 'assets/powers/water.svg', description: 'Fa sgorgare acqua.', targetType: 'placement', worlds: ['human', 'beast'] },
  { id: 'flower', label: 'FIORE', icon: 'assets/powers/flower.svg', description: 'Fa nascere un fiore.', targetType: 'placement', worlds: ['human', 'beast'] },
  { id: 'cow', semanticId: 'foodProvision', label: 'MUCCA', icon: 'assets/powers/cow.svg', description: 'Manifesta nutrimento.', targetType: 'placement', worlds: ['human', 'beast'] },
  { id: 'lightning', label: 'FULMINE', icon: 'assets/powers/lightning.svg', description: 'Manifesta la tua disapprovazione.', targetType: 'character', worlds: ['human', 'beast'] },
  { id: 'blessing', label: 'BENEDIZIONE', icon: 'assets/powers/blessing.svg', description: 'Mostra a un essere il tuo favore.', targetType: 'character', worlds: ['human', 'beast'] },
  { id: 'rayOfLight', label: 'RAGGIO DI LUCE', icon: 'assets/powers/ray-of-light.svg', description: 'Richiama gli esseri in un luogo.', targetType: 'rally', worlds: ['human', 'beast'] },
  { id: 'changeSex', label: 'CAMBIA SESSO', icon: 'assets/powers/change-sex.svg', description: 'Trasforma le caratteristiche sessuali di un essere.', targetType: 'character', worlds: ['human', 'beast'] },
  { id: 'giveWeapons', label: 'ARMI', icon: 'assets/powers/give-weapons.svg', description: 'Prepara un essere alla lotta.', targetType: 'character', worlds: ['human', 'beast'] },
  { id: 'shield', label: 'SCUDO', icon: 'assets/powers/shield.svg', description: 'Concede protezione divina.', targetType: 'character', worlds: ['human', 'beast'] },
]);
