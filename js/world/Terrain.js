export class Terrain {
    constructor(columns, rows, tileSize) {
        this.columns = columns;
        this.rows = rows;
        this.tileSize = tileSize;
        this.tiles = [];
    }

    generate() {
        this.tiles = [];

        for (let row = 0; row < this.rows; row += 1) {
            const tilesInRow = [];

            for (let column = 0; column < this.columns; column += 1) {
                tilesInRow.push(this.getTileType(row));
            }

            this.tiles.push(tilesInRow);
        }
    }

    getTileType(row) {
        if (row < 3) {
            return "sea";
        }

        if (row < 5) {
            return "beach";
        }

        return "grass";
    }

    isWalkableAtWorldPosition(x, y) {
        const column = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        if (!this.containsTile(column, row)) {
            return false;
        }

        const tile = this.tiles[row][column];

        return tile === "beach" || tile === "grass";
    }

    containsTile(column, row) {
        return column >= 0 &&
            row >= 0 &&
            column < this.columns &&
            row < this.rows;
    }
}
