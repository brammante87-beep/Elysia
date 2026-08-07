export class Pathfinder {
  findPath(terrain, start, goal) {
    const key = (x, y) => `${x},${y}`; const origin = { x: Math.floor(start.x), y: Math.floor(start.y) };
    const destination = { x: Math.floor(goal.x), y: Math.floor(goal.y) };
    const queue = [origin]; const cameFrom = new Map([[key(origin.x, origin.y), null]]);
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (queue.length) {
      const current = queue.shift(); if (current.x === destination.x && current.y === destination.y) break;
      for (const [dx, dy] of directions) { const next = { x: current.x + dx, y: current.y + dy }; const id = key(next.x, next.y); if (terrain.isWalkable(next.x, next.y) && !cameFrom.has(id)) { cameFrom.set(id, current); queue.push(next); } }
    }
    if (!cameFrom.has(key(destination.x, destination.y))) return [];
    const path = []; let current = destination; while (current) { path.push({ x: current.x + 0.5, y: current.y + 0.5 }); current = cameFrom.get(key(current.x, current.y)); }
    return path.reverse().slice(1);
  }
}
