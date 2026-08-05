import { Terrain } from "./Terrain.js";
import { Hero } from "../entities/Hero.js";
import { Villager } from "../entities/Villager.js";

export class World {
    constructor() {
        this.tileSize = 64;
        this.terrain = new Terrain(16, 10, this.tileSize);
        this.hero = null;
        this.villagers = [];
    }

    initialize() {
        this.terrain.generate();
        this.hero = new Hero("Hero", 320, 384);
        this.villagers = [
            new Villager("Mira", 448, 384),
            new Villager("Taro", 384, 480)
        ];
    }

    update(delta) {
        this.hero.update(delta);

        this.villagers.forEach((villager) => {
            villager.update(delta);
        });
    }

    getEntities() {
        return [this.hero, ...this.villagers];
    }
}
