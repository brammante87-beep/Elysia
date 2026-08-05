import { Terrain } from "./Terrain.js";
import { Hero } from "../entities/Hero.js";
import { Villager } from "../entities/Villager.js";

export class World {
    constructor() {
        this.tileSize = 64;
        this.terrain = new Terrain(16, 10, this.tileSize);
        this.hero = null;
        this.heroDestination = null;
        this.villagers = [];
    }

    initialize() {
        this.terrain.generate();
        this.hero = new Hero("Prescelto", 320, 384);
        this.villagers = [
            new Villager("Mira", 448, 384),
            new Villager("Taro", 384, 480)
        ];
    }

    update(delta) {
        this.updateHero(delta);

        this.villagers.forEach((villager) => {
            villager.update(delta);
        });
    }

    updateHero(delta) {
        if (this.heroDestination === null) {
            return;
        }

        const distanceX = this.heroDestination.x - this.hero.x;
        const distanceY = this.heroDestination.y - this.hero.y;
        const distance = Math.hypot(distanceX, distanceY);
        const step = this.hero.speed * delta;

        if (distance <= step) {
            this.hero.x = this.heroDestination.x;
            this.hero.y = this.heroDestination.y;
            this.heroDestination = null;
            return;
        }

        this.hero.x += (distanceX / distance) * step;
        this.hero.y += (distanceY / distance) * step;
    }

    setHeroDestination(x, y) {
        this.heroDestination = { x, y };
    }

    isWalkableAtWorldPosition(x, y) {
        return this.terrain.isWalkableAtWorldPosition(x, y);
    }

    contains(x, y) {
        return x >= 0 &&
            y >= 0 &&
            x <= this.getWidth() &&
            y <= this.getHeight();
    }

    getWidth() {
        return this.terrain.columns * this.tileSize;
    }

    getHeight() {
        return this.terrain.rows * this.tileSize;
    }

    getEntities() {
        return [this.hero, ...this.villagers];
    }
}
