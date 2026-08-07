export class SexChoicePanel {
  constructor(documentObject) { this.document = documentObject; this.element = null; }
  show(root, character, onChoose) {
    this.remove(); this.element=this.document.createElement('section'); this.element.className='sex-choice-panel';
    const title=this.document.createElement('h2'); title.textContent=`TRASFORMA ${character.name.toLocaleUpperCase('it')}`; this.element.append(title);
    const choices=character.worldType==='human' ? [['male','MASCHILE'],['female','FEMMINILE'],['intersex','INTERSESSUALE']] : [['male','MASCHIO'],['female','FEMMINA'],['intersex','INTERSESSUALE']];
    for (const [value,label] of choices) { const button=this.document.createElement('button'); button.textContent=label; button.addEventListener('click',()=>{onChoose(value);this.remove();}); this.element.append(button); }
    root.append(this.element);
  }
  remove() { this.element?.remove(); this.element=null; }
}
