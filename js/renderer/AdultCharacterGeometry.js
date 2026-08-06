export class AdultCharacterGeometry {
    static SPRITE_WIDTH = 64;
    static SPRITE_HEIGHT = 64;
    static OFFSET_X = -32;
    static OFFSET_Y = -45;

    static getAdultCharacterBounds(character) {
        const left = character.x + this.OFFSET_X;
        const top = character.y + this.OFFSET_Y;
        return {
            left,
            top,
            right: left + this.SPRITE_WIDTH,
            bottom: top + this.SPRITE_HEIGHT
        };
    }
}
