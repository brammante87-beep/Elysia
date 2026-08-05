export class Renderer {
    constructor(canvas, context, world, assetLoader = null) {
        this.canvas = canvas;
        this.context = context;
        this.world = world;
        this.assetLoader = assetLoader;
    }

    render() {
        this.clear();
        this.drawTerrain();
        this.drawHouses();
        this.drawTrees();
        this.drawWaterSources();
        this.drawAnimals();
        this.drawDestinationMarker();
        this.drawEntities();
        this.drawWorldFeedbackMessages();
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawTerrain() {
        const terrain = this.world.terrain;

        for (let row = 0; row < terrain.rows; row += 1) {
            for (let column = 0; column < terrain.columns; column += 1) {
                this.context.fillStyle = this.getTerrainColor(terrain.tiles[row][column]);
                this.context.fillRect(
                    column * terrain.tileSize,
                    row * terrain.tileSize,
                    terrain.tileSize,
                    terrain.tileSize
                );
            }
        }
    }

    getTerrainColor(tileType) {
        if (tileType === "sea") {
            return "#4aa3df";
        }

        if (tileType === "beach") {
            return "#e9d8a6";
        }

        return "#6abf69";
    }

    drawEntities() {
        this.world.getEntities().forEach((entity) => {
            if (entity.selected) {
                this.drawSelectionRing(entity);
            }

            this.drawEntity(entity);
        });
    }

    drawHouses() {
        this.world.getHouses().forEach((house) => {
            this.drawHouse(house);
        });
    }

    drawHouse(house) {
        this.context.fillStyle = "rgba(0, 0, 0, 0.22)";
        this.context.beginPath();
        this.context.ellipse(house.x, house.y + 21, 31, 10, 0, 0, Math.PI * 2);
        this.context.fill();

        this.context.fillStyle = "#8a4b24";
        this.context.beginPath();
        this.context.moveTo(house.x - 34, house.y - 4);
        this.context.lineTo(house.x, house.y - 32);
        this.context.lineTo(house.x + 34, house.y - 4);
        this.context.closePath();
        this.context.fill();

        this.context.fillStyle = "#dfc29a";
        this.context.fillRect(house.x - 25, house.y - 4, 50, 34);

        this.context.fillStyle = "#4b2a18";
        this.context.fillRect(house.x - 7, house.y + 10, 14, 20);

        if (house.fertilityPhase === "private") {
            this.drawHouseFertilityFeedback(house);
        }
    }

    drawHouseFertilityFeedback(house) {
        this.context.strokeStyle = "rgba(251, 191, 36, 0.75)";
        this.context.lineWidth = 5;
        this.context.beginPath();
        this.context.ellipse(house.x, house.y + 2, 42, 36, 0, 0, Math.PI * 2);
        this.context.stroke();

        this.drawSmallHeart(house.x - 18, house.y - 43);
        this.drawSmallHeart(house.x + 18, house.y - 39);
    }

    drawSmallHeart(x, y) {
        this.context.fillStyle = "#f472b6";
        this.context.beginPath();
        this.context.moveTo(x, y + 6);
        this.context.bezierCurveTo(x - 8, y, x - 6, y - 8, x, y - 3);
        this.context.bezierCurveTo(x + 6, y - 8, x + 8, y, x, y + 6);
        this.context.fill();
    }

    drawTrees() {
        this.world.getTrees().forEach((tree) => {
            this.drawTree(tree);
        });
    }

    drawTree(tree) {
        const spriteName = tree.cutFeedbackTimer > 0 ? "treeHit" : "tree";
        const sprite = this.getTreeSprite(spriteName);

        if (sprite === null) {
            this.drawGeometricTree(tree);
            return;
        }

        this.context.drawImage(sprite, tree.x - 32, tree.y - 46, 64, 64);
    }

    getTreeSprite(spriteName) {
        if (this.assetLoader === null) {
            return null;
        }

        return this.assetLoader.getImage(spriteName);
    }

    drawGeometricTree(tree) {
        this.context.fillStyle = "#7a4a24";
        this.context.fillRect(tree.x - 5, tree.y - 2, 10, 26);

        this.context.fillStyle = tree.cutFeedbackTimer > 0 ? "#8ee68e" : tree.color;
        this.context.beginPath();
        this.context.arc(tree.x, tree.y - 12, tree.radius, 0, Math.PI * 2);
        this.context.fill();
    }


    drawWaterSources() {
        this.world.getWaterSources().forEach((source) => {
            const sprite = this.getSprite(source.useFeedbackTimer > 0 ? "waterSourceUse" : "waterSource");
            if (sprite === null) { this.drawGeometricWaterSource(source); return; }
            this.context.drawImage(sprite, source.x - 32, source.y - 38, 64, 64);
        });
    }

    drawGeometricWaterSource(source) {
        this.context.fillStyle = "rgba(0, 0, 0, 0.18)";
        this.context.beginPath();
        this.context.ellipse(source.x, source.y + 8, 22, 8, 0, 0, Math.PI * 2);
        this.context.fill();
        this.context.fillStyle = source.useFeedbackTimer > 0 ? "#7dd3fc" : source.color;
        this.context.beginPath();
        this.context.ellipse(source.x, source.y, source.radius, source.radius * 0.55, 0, 0, Math.PI * 2);
        this.context.fill();
    }

    drawAnimals() {
        this.world.getAnimals().forEach((animal) => {
            const sprite = this.getSprite(animal.hitFeedbackTimer > 0 ? "deerHit" : "deer");
            if (sprite === null) { this.drawGeometricAnimal(animal); return; }
            this.context.drawImage(sprite, animal.x - 32, animal.y - 45, 64, 64);
        });
    }

    drawGeometricAnimal(animal) {
        this.context.fillStyle = "rgba(0, 0, 0, 0.22)";
        this.context.beginPath();
        this.context.ellipse(animal.x, animal.y + 15, 20, 7, 0, 0, Math.PI * 2);
        this.context.fill();
        this.context.fillStyle = animal.hitFeedbackTimer > 0 ? "#c08457" : animal.color;
        this.context.fillRect(animal.x - 16, animal.y - 10, 28, 18);
        this.context.beginPath();
        this.context.arc(animal.x + 16, animal.y - 14, 8, 0, Math.PI * 2);
        this.context.fill();
    }

    getSprite(spriteName) {
        if (this.assetLoader === null) { return null; }
        return this.assetLoader.getImage(spriteName);
    }

    drawSelectionRing(entity) {
        this.context.strokeStyle = "#facc15";
        this.context.lineWidth = 3;
        this.context.beginPath();
        this.context.ellipse(entity.x, entity.y + 14, 18, 8, 0, 0, Math.PI * 2);
        this.context.stroke();
    }

    drawDestinationMarker() {
        const destination = this.world.heroDestination;

        if (destination === null) {
            return;
        }

        this.context.strokeStyle = "#ffffff";
        this.context.lineWidth = 2;
        this.context.beginPath();
        this.context.arc(destination.x, destination.y, 10, 0, Math.PI * 2);
        this.context.stroke();

        this.context.beginPath();
        this.context.moveTo(destination.x - 14, destination.y);
        this.context.lineTo(destination.x + 14, destination.y);
        this.context.moveTo(destination.x, destination.y - 14);
        this.context.lineTo(destination.x, destination.y + 14);
        this.context.stroke();
    }

    drawEntity(entity) {
        if (entity.state === "insideHouse") {
            return;
        }

        if (entity.arrivalMarkerTimer > 0) {
            this.drawArrivalMarker(entity);
        }

        if (entity.reservedForPartnership) {
            this.drawPartnerTargetHighlight(entity);
        }

        if (entity === this.world.hero) {
            this.drawHero(entity);
        } else {
            this.drawVillager(entity);
        }

        this.drawEntityName(entity);

        if (entity.state === "cuttingTree") {
            this.drawCuttingFeedback(entity);
        }

        if (entity.state === "collectingWater") {
            this.drawWaterFeedback(entity);
        }

        if (entity.state === "huntingAnimal") {
            this.drawCuttingFeedback(entity);
        }

        if (entity.state === "socializing" || entity.partnerFeedbackTimer > 0) {
            this.drawHeartFeedback(entity);
        }
    }

    drawArrivalMarker(entity) {
        this.context.strokeStyle = "rgba(250, 204, 21, 0.85)";
        this.context.lineWidth = 4;
        this.context.beginPath();
        this.context.arc(entity.x, entity.y, 24, 0, Math.PI * 2);
        this.context.stroke();
    }

    drawWorldFeedbackMessages() {
        this.world.feedbackMessages.forEach((message, index) => {
            this.context.fillStyle = "rgba(16, 24, 32, 0.82)";
            this.context.fillRect(18, 72 + index * 32, 360, 26);
            this.context.fillStyle = "#ffffff";
            this.context.font = "14px Arial";
            this.context.textAlign = "left";
            this.context.fillText(message.text, 28, 90 + index * 32);
        });
    }

    drawPartnerTargetHighlight(entity) {
        this.context.strokeStyle = "#f472b6";
        this.context.lineWidth = 3;
        this.context.beginPath();
        this.context.ellipse(entity.x, entity.y + 16, 18, 8, 0, 0, Math.PI * 2);
        this.context.stroke();
    }

    drawHero(hero) {
        const sprite = this.getHeroSprite(hero);

        if (sprite === null) {
            this.drawGeometricEntity(hero);
        } else {
            this.context.drawImage(sprite, hero.x - 32, hero.y - 45, 64, 64);
        }

        this.drawOrientationAccent(hero);
    }

    getHeroSprite(hero) {
        if (this.assetLoader === null) {
            return null;
        }

        return this.assetLoader.getImage(hero.getSpriteKey());
    }

    drawVillager(villager) {
        const sprite = this.getVillagerSprite(villager);

        if (sprite === null) {
            this.drawGeometricEntity(villager);
        } else {
            this.context.drawImage(sprite, villager.x - 32, villager.y - 45, 64, 64);
        }

        this.drawOrientationAccent(villager);
    }

    getVillagerSprite(villager) {
        if (this.assetLoader === null) {
            return null;
        }

        return this.assetLoader.getImage(villager.spriteKey);
    }

    drawGeometricEntity(entity) {
        this.context.fillStyle = "rgba(0, 0, 0, 0.25)";
        this.context.beginPath();
        this.context.ellipse(entity.x, entity.y + 14, 12, 5, 0, 0, Math.PI * 2);
        this.context.fill();

        this.context.fillStyle = entity.color;
        this.context.beginPath();
        this.context.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
        this.context.fill();
    }

    drawEntityName(entity) {
        this.context.fillStyle = "#ffffff";
        this.context.font = "14px Arial";
        this.context.textAlign = "center";
        this.context.fillText(entity.name, entity.x, entity.y - 20);
    }

    drawOrientationAccent(entity) {
        const colors = this.getOrientationAccentColors(entity.orientation);
        const stripeWidth = 3;
        const startX = entity.x + 7;
        const startY = entity.y - 9;

        this.context.fillStyle = "#2d2013";
        this.context.beginPath();
        this.context.arc(startX + colors.length * stripeWidth / 2, startY + 3, colors.length * stripeWidth / 2 + 2, 0, Math.PI * 2);
        this.context.fill();

        colors.forEach((color, index) => {
            this.context.fillStyle = color;
            this.context.fillRect(startX + index * stripeWidth, startY, stripeWidth, 6);
        });
    }

    getOrientationAccentColors(orientation) {
        if (orientation === "gay-lesbica") {
            return ["#ef4444", "#f59e0b", "#facc15", "#22c55e", "#3b82f6", "#8b5cf6"];
        }

        if (orientation === "bisessuale") {
            return ["#d60270", "#9b4f96", "#0038a8"];
        }

        if (orientation === "pansessuale") {
            return ["#ff1b8d", "#ffd800", "#1bb3ff"];
        }

        return ["#d1d5db", "#f8fafc"];
    }

    drawHeartFeedback(entity) {
        const x = entity.x;
        const y = entity.y - 34;

        this.context.fillStyle = "#f472b6";
        this.context.beginPath();
        this.context.moveTo(x, y + 6);
        this.context.bezierCurveTo(x - 10, y, x - 8, y - 9, x, y - 4);
        this.context.bezierCurveTo(x + 8, y - 9, x + 10, y, x, y + 6);
        this.context.fill();
    }

    drawWaterFeedback(entity) {
        this.context.fillStyle = "#7dd3fc";
        this.context.beginPath();
        this.context.arc(entity.x + 18, entity.y - 18, 4, 0, Math.PI * 2);
        this.context.fill();
    }

    drawCuttingFeedback(entity) {
        this.context.strokeStyle = "#d1d5db";
        this.context.lineWidth = 3;
        this.context.beginPath();
        this.context.moveTo(entity.x + 10, entity.y - 12);
        this.context.lineTo(entity.x + 22, entity.y - 24);
        this.context.stroke();
    }
}
