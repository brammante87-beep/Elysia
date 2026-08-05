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
        this.drawDestinationMarker();
        this.drawEntities();
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
        if (entity.reservedForPartnership) {
            this.drawPartnerTargetHighlight(entity);
        }

        if (entity === this.world.hero) {
            this.drawHero(entity);
        } else {
            this.drawGeometricEntity(entity);
        }

        this.drawEntityName(entity);

        if (entity.state === "cuttingTree") {
            this.drawCuttingFeedback(entity);
        }

        if (entity.state === "socializing" || entity.partnerFeedbackTimer > 0) {
            this.drawHeartFeedback(entity);
        }
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

    drawOrientationAccent(hero) {
        const colors = this.getOrientationAccentColors(hero.orientation);
        const stripeWidth = 3;
        const startX = hero.x + 7;
        const startY = hero.y - 9;

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

    drawCuttingFeedback(entity) {
        this.context.strokeStyle = "#d1d5db";
        this.context.lineWidth = 3;
        this.context.beginPath();
        this.context.moveTo(entity.x + 10, entity.y - 12);
        this.context.lineTo(entity.x + 22, entity.y - 24);
        this.context.stroke();
    }
}
