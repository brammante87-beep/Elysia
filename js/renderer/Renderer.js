export class Renderer {
    constructor(canvas, context, world, assetLoader = null) {
        this.canvas = canvas;
        this.context = context;
        this.world = world;
        this.assetLoader = assetLoader;
        this.context.imageSmoothingEnabled = true;
        this.context.imageSmoothingQuality = "high";
    }

    render() {
        this.clear();
        this.drawTerrain();
        this.drawVillageWell();
        this.drawHouses();
        this.drawTrees();
        this.drawWaterSources();
        this.drawAnimals();
        this.drawDestinationMarker();
        this.drawEntities();
        this.drawVillageBoundary();
        this.drawEntityNames();
        this.drawEntityFeedback();
        this.drawDayNightOverlay();
        this.drawWorldFeedbackMessages();
    }

    drawDayNightOverlay() {
        if (this.world.dayPhase === "day") { return; }
        this.context.fillStyle = this.world.dayPhase === "night" ? "rgba(16, 31, 74, 0.42)" : "rgba(99, 55, 48, 0.18)";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawTerrain() {
        const terrain = this.world.terrain;
        const animationTime = performance.now() / 1000;

        for (let row = 0; row < terrain.rows; row += 1) {
            for (let column = 0; column < terrain.columns; column += 1) {
                this.context.fillStyle = this.getTerrainColor(terrain.tiles[row][column]);
                this.context.fillRect(
                    column * terrain.tileSize,
                    row * terrain.tileSize,
                    terrain.tileSize,
                    terrain.tileSize
                );
                this.drawTerrainDetail(terrain.tiles[row][column], column, row, terrain.tileSize, animationTime);
            }
        }
    }

    drawTerrainDetail(tileType, column, row, tileSize, animationTime) {
        const x = column * tileSize;
        const y = row * tileSize;
        const seed = column * 17 + row * 31;

        if (tileType === "grass") {
            this.context.fillStyle = seed % 2 === 0 ? "rgba(35, 105, 55, 0.10)" : "rgba(220, 238, 151, 0.10)";
            this.context.fillRect(x + 8 + seed % 19, y + 10 + seed % 23, 2, 4);
            this.context.fillRect(x + 31 + seed % 13, y + 33 + seed % 17, 2, 2);
            return;
        }

        if (tileType === "beach") {
            this.context.fillStyle = "rgba(126, 91, 52, 0.10)";
            this.context.fillRect(x + 11 + seed % 27, y + 16 + seed % 19, 2, 2);
            this.context.fillRect(x + 38 + seed % 13, y + 37 + seed % 11, 1, 1);
            if (row === 3) {
                this.context.fillStyle = "rgba(255, 255, 255, 0.18)";
                this.context.fillRect(x, y, tileSize, 4);
            }
            return;
        }

        const waveOffset = (animationTime * 7 + seed) % 24;
        this.context.strokeStyle = "rgba(215, 242, 255, 0.20)";
        this.context.lineWidth = 1.5;
        this.context.beginPath();
        this.context.moveTo(x + waveOffset - 16, y + 18 + seed % 20);
        this.context.quadraticCurveTo(x + waveOffset - 6, y + 15 + seed % 20, x + waveOffset + 4, y + 18 + seed % 20);
        this.context.stroke();
    }

    getTerrainColor(tileType) {
        if (tileType === "sea") {
            return "#3d91c9";
        }

        if (tileType === "beach") {
            return "#e7c987";
        }

        return "#5ca55b";
    }

    drawEntities() {
        this.world.getEntities().forEach((entity) => {
            if (entity.selected) {
                this.drawSelectionRing(entity);
            }

            this.drawEntity(entity);
        });
    }

    drawEntityNames() {
        this.world.getEntities().forEach((entity) => {
            if (entity.state !== "insideHouse") { this.drawEntityName(entity); }
        });
    }

    drawEntityFeedback() {
        this.world.getEntities().forEach((entity) => {
            if (entity.state === "insideHouse") { return; }
            if (entity.state === "cuttingTree" || entity.state === "huntingAnimal") { this.drawCuttingFeedback(entity); }
            if (entity.state === "collectingWater") { this.drawWaterFeedback(entity); }
            if (entity.state === "socializing" || entity.partnerFeedbackTimer > 0) { this.drawHeartFeedback(entity); }
        });
    }

    drawHouses() {
        this.world.getHouses().forEach((house) => {
            this.drawHouse(house);
        });
    }

    drawHouse(house) {
        if (this.world.getSelectedHouse() === house) { this.drawHouseSelection(house); }
        this.context.fillStyle = "rgba(0, 0, 0, 0.22)";
        this.context.beginPath();
        this.context.ellipse(house.x, house.y + 21, house.upgraded ? 37 : 31, 10, 0, 0, Math.PI * 2);
        this.context.fill();

        this.context.fillStyle = house.upgraded ? "#63341f" : "#7b3f24";
        this.context.beginPath();
        const roofWidth = house.upgraded ? 41 : 35;
        const roofTop = house.upgraded ? 40 : 35;
        this.context.moveTo(house.x - roofWidth, house.y - 4);
        this.context.lineTo(house.x, house.y - roofTop);
        this.context.lineTo(house.x + roofWidth, house.y - 4);
        this.context.closePath();
        this.context.fill();

        this.context.fillStyle = "#e4bd86";
        this.context.fillRect(house.x - 25, house.y - 4, 50, 34);
        if (house.upgraded) {
            this.context.strokeStyle = "#75502f"; this.context.lineWidth = 4;
            this.context.strokeRect(house.x - 27, house.y - 5, 54, 36);
            this.context.fillStyle = "#8b6a46"; this.context.fillRect(house.x - 31, house.y + 29, 62, 5);
        }

        this.context.fillStyle = this.world.dayPhase === "night" ? "#ffd978" : "#8ed1df";
        this.context.fillRect(house.x - 19, house.y + 5, 10, 9);
        this.context.fillRect(house.x + 9, house.y + 5, 10, 9);
        this.context.strokeStyle = "rgba(75, 42, 24, 0.65)";
        this.context.lineWidth = 2;
        this.context.strokeRect(house.x - 19, house.y + 5, 10, 9);
        this.context.strokeRect(house.x + 9, house.y + 5, 10, 9);

        this.context.fillStyle = "#4b2a18";
        this.context.fillRect(house.x - 7, house.y + 10, 14, 20);
        this.context.fillStyle = "#d7a849";
        this.context.beginPath();
        this.context.arc(house.x + 4, house.y + 21, 1.5, 0, Math.PI * 2);
        this.context.fill();

        this.drawHouseName(house);

        if (house.fertilityPhase === "private") {
            this.drawHouseFertilityFeedback(house);
        }
        if (house.depositFeedback !== null) { this.drawDepositFeedback(house); }
    }

    drawHouseSelection(house) {
        this.context.strokeStyle = "rgba(250, 204, 21, 0.95)";
        this.context.lineWidth = 4;
        this.context.beginPath();
        this.context.ellipse(house.x, house.y + 2, house.upgraded ? 48 : 42, 45, 0, 0, Math.PI * 2);
        this.context.stroke();
    }

    drawVillageWell() {
        const well = this.world.getVillageWell();
        if (well === null) { return; }
        const context = this.context;
        context.fillStyle = "rgba(0,0,0,0.2)"; context.beginPath(); context.ellipse(well.x, well.y + 14, 29, 10, 0, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#8b7763"; context.beginPath(); context.arc(well.x, well.y, well.radius, 0, Math.PI * 2); context.fill();
        context.strokeStyle = "#554538"; context.lineWidth = 5; context.stroke();
        context.fillStyle = "#3b91b5"; context.beginPath(); context.arc(well.x, well.y, well.radius - 7, 0, Math.PI * 2); context.fill();
        context.strokeStyle = "#69472d"; context.lineWidth = 5; context.beginPath(); context.moveTo(well.x - 19, well.y); context.lineTo(well.x - 19, well.y - 34); context.lineTo(well.x + 19, well.y - 34); context.lineTo(well.x + 19, well.y); context.stroke();
    }

    drawVillageBoundary() {
        const boundary = this.world.getVillageBoundary();
        if (boundary === null) { return; }
        const b = boundary.bounds; const g = boundary.gate; const context = this.context;
        context.save(); context.strokeStyle = "rgba(0,0,0,0.2)"; context.lineWidth = 11; context.strokeRect(b.minX + 2, b.minY + 3, b.width, b.height);
        context.strokeStyle = "#6f4828"; context.lineWidth = 7; context.setLineDash([8, 4]);
        context.beginPath(); context.moveTo(b.minX, b.minY); context.lineTo(b.maxX, b.minY); context.moveTo(b.minX, b.minY); context.lineTo(b.minX, b.maxY); context.moveTo(b.maxX, b.minY); context.lineTo(b.maxX, b.maxY);
        context.moveTo(b.minX, b.maxY); context.lineTo(g.x - g.width / 2, b.maxY); context.moveTo(g.x + g.width / 2, b.maxY); context.lineTo(b.maxX, b.maxY); context.stroke(); context.setLineDash([]);
        context.fillStyle = "#8b5a31"; context.fillRect(g.x - g.width / 2, g.y - 5, 7, 13); context.fillRect(g.x + g.width / 2 - 7, g.y - 5, 7, 13); context.restore();
    }

    drawHouseName(house) {
        this.context.font = "bold 13px sans-serif";
        this.context.textAlign = "center";
        this.context.textBaseline = "bottom";
        this.context.lineWidth = 3;
        this.context.strokeStyle = "rgba(0, 0, 0, 0.7)";
        this.context.fillStyle = "#ffffff";
        const name = this.world.getHouseName(house);
        this.context.strokeText(name, house.x, house.y - 39);
        this.context.fillText(name, house.x, house.y - 39);
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
        this.context.strokeStyle = "#8b9290";
        this.context.lineWidth = 5;
        this.context.beginPath();
        this.context.ellipse(source.x, source.y, source.radius, source.radius * 0.55, 0, 0, Math.PI * 2);
        this.context.stroke();
        this.context.fillStyle = source.useFeedbackTimer > 0 ? "#7dd3fc" : "#38a9d1";
        this.context.fill();
        this.context.strokeStyle = "rgba(255, 255, 255, 0.45)";
        this.context.lineWidth = 1.5;
        this.context.beginPath();
        this.context.ellipse(source.x, source.y, source.radius * 0.55, source.radius * 0.22, 0, 0, Math.PI * 2);
        this.context.stroke();
    }

    drawAnimals() {
        this.world.getAnimals().forEach((animal) => {
            const sprite = this.getSprite(animal.hitFeedbackTimer > 0 ? "deerHit" : "deer");
            if (sprite === null) { this.drawGeometricAnimal(animal); return; }
            this.context.drawImage(sprite, animal.x - 30, animal.y - 43, 60, 60);
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

        if (entity.reservedForPartnership) {
            this.drawPartnerTargetHighlight(entity);
        }

        if (entity === this.world.hero) {
            this.drawHero(entity);
        } else {
            this.drawVillager(entity);
        }

        if (entity.arrivalMarkerTimer > 0) { this.drawArrivalMarker(entity); }
        if (entity.carrying && entity.carrying.amount > 0) { this.drawCarryingFeedback(entity); }
    }

    drawCarryingFeedback(entity) {
        const x = entity.x - 18;
        const y = entity.y + 8;
        const type = entity.carrying.type;
        this.context.lineWidth = 2;
        if (type === "wood") {
            this.context.strokeStyle = "#6f3d20";
            for (let index = 0; index < entity.carrying.amount; index += 1) {
                this.context.beginPath(); this.context.moveTo(x - 3, y - index * 3); this.context.lineTo(x + 8, y - 5 - index * 3); this.context.stroke();
            }
        } else if (type === "water") {
            this.context.fillStyle = "#55c8ef"; this.context.fillRect(x - 2, y - 8, 10, 11);
            this.context.strokeStyle = "#d7f4ff"; this.context.strokeRect(x - 2, y - 8, 10, 11);
        } else if (type === "meat") {
            this.context.fillStyle = "#b84d4d"; this.context.beginPath(); this.context.ellipse(x + 3, y - 3, 7, 5, -0.35, 0, Math.PI * 2); this.context.fill();
        }
    }

    drawDepositFeedback(house) {
        const feedback = house.depositFeedback;
        this.context.fillStyle = feedback.type === "water" ? "#7dd3fc" : feedback.type === "meat" ? "#ef7777" : "#d39b5f";
        this.context.font = "bold 13px Arial";
        this.context.textAlign = "center";
        this.context.fillText(`+${feedback.amount}`, house.x, house.y - 42 - (1.25 - feedback.timer) * 12);
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
            if (villager.ageStage === "child") {
                this.context.drawImage(sprite, villager.x - 26, villager.y - 35, 52, 52);
            } else {
                this.context.drawImage(sprite, villager.x - 32, villager.y - 45, 64, 64);
            }
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
        const nameY = entity.y - this.getEntityNameOffset(entity);
        this.context.font = "600 14px Arial, sans-serif";
        this.context.textAlign = "center";
        this.context.textBaseline = "alphabetic";
        const width = this.context.measureText(entity.name).width;
        this.context.fillStyle = "rgba(15, 23, 31, 0.68)";
        this.context.fillRect(entity.x - width / 2 - 4, nameY - 13, width + 8, 17);
        this.context.fillStyle = "#ffffff";
        this.context.shadowColor = "rgba(0, 0, 0, 0.8)";
        this.context.shadowBlur = 2;
        this.context.fillText(entity.name, entity.x, nameY);
        this.context.shadowBlur = 0;
    }

    getEntityNameOffset(entity) {
        return entity.ageStage === "child" ? 42 : 52;
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
