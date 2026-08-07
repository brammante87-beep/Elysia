export class Character {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.position = { ...data.position };
    this.worldType = data.worldType;
    this.chosenOne = true;
    this.alive = true;
    if (data.sexCharacteristics) this.sexCharacteristics = data.sexCharacteristics;
    if (data.genderIdentity) this.genderIdentity = data.genderIdentity;
    if (data.sexualOrientation) this.sexualOrientation = data.sexualOrientation;
    if (data.species) this.species = data.species;
  }

  toJSON() { return { ...this, position: { ...this.position } }; }
}
