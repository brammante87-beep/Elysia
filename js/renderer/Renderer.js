export class Renderer {
    constructor(canvas, context, world) {
        this.canvas = canvas;
        this.context = context;
        this.world = world;
    }

    render() {
        this.clear();
        this.drawTerrain();
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
            this.drawEntity(entity);
        });
    }

    drawEntity(entity) {
        this.context.fillStyle = "rgba(0, 0, 0, 0.25)";
        this.context.beginPath();
        this.context.ellipse(entity.x, entity.y + 14, 12, 5, 0, 0, Math.PI * 2);
        this.context.fill();

        this.context.fillStyle = entity.color;
        this.context.beginPath();
        this.context.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
        this.context.fill();

        this.context.fillStyle = "#ffffff";
        this.context.font = "14px Arial";
        this.context.textAlign = "center";
        this.context.fillText(entity.name, entity.x, entity.y - 20);
    }
}
