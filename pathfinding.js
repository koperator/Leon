// pathfinding.js
function hexToRGB(hex) {
    if (!hex || hex.length !== 4) return { r: 0.467, g: 0.467, b: 0 }; // Default #770
    const r = parseInt(hex[1], 16) / 15;
    const g = parseInt(hex[2], 16) / 15;
    const b = parseInt(hex[3], 16) / 15;
    return { r, g, b };
}

function hasClearShot(fromX, fromY, toX, toY, tileSize, map) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const xStep = steps ? dx / steps : 0;
    const yStep = steps ? dy / steps : 0;

    let checkX = fromX;
    let checkY = fromY;
    for (let i = 0; i <= steps; i++) {
        const tileX = Math.floor(checkX / tileSize);
        const tileY = Math.floor(checkY / tileSize);
        if (tileX < 0 || tileX >= 64 || tileY < 0 || tileY >= 64 || map[tileY][tileX] === 1) {
            return false;
        }
        checkX += xStep;
        checkY += yStep;
    }
    return true;
}

function findPath(startX, startY, goalX, goalY, tileSize, map, safetyVectorMap) {
    const startTileX = Math.floor(startX / tileSize);
    const startTileY = Math.floor(startY / tileSize);
    let goalTileX = Math.floor(goalX / tileSize);
    let goalTileY = Math.floor(goalY / tileSize);

    const dx = goalX - startX;
    const dy = goalY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const wx = Math.abs(dx / dist);
    const wy = Math.abs(dy / dist);

    if (!hasClearShot(startX, startY, goalX, goalY, tileSize, map)) {
        const searchRadius = 5;
        let bestTile = null;
        let bestDist = Infinity;

        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                const nx = goalTileX + dx;
                const ny = goalTileY + dy;
                if (nx < 0 || nx >= 64 || ny < 0 || ny >= 64 || map[ny][nx] === 1) continue;

                const tileCenterX = nx * tileSize + tileSize / 2;
                const tileCenterY = ny * tileSize + tileSize / 2;
                if (hasClearShot(startX, startY, tileCenterX, tileCenterY, tileSize, map)) {
                    const tileDist = Math.sqrt((tileCenterX - goalX) ** 2 + (tileCenterY - goalY) ** 2);
                    if (tileDist < bestDist) {
                        bestDist = tileDist;
                        bestTile = { x: nx, y: ny };
                    }
                }
            }
        }

        if (bestTile) {
            goalTileX = bestTile.x;
            goalTileY = bestTile.y;
            console.log(`Adjusted goal to clear shot position: (${goalTileX}, ${goalTileY})`);
        }
    }

    const openSet = [{ x: startTileX, y: startTileY, g: 0, h: heuristic(startTileX, startTileY, goalTileX, goalTileY), f: 0, parent: null }];
    const closedSet = new Set();
    const nodes = new Map();

    nodes.set(`${startTileX},${startTileY}`, openSet[0]);

    while (openSet.length > 0) {
        let currentIdx = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < openSet[currentIdx].f || (openSet[i].f === openSet[currentIdx].f && Math.random() < 0.5)) { // Random tie-breaking
                currentIdx = i;
            }
        }
        const current = openSet.splice(currentIdx, 1)[0];
        const key = `${current.x},${current.y}`;
        if (closedSet.has(key)) continue;
        closedSet.add(key);

        if (current.x === goalTileX && current.y === goalTileY) {
            let path = [];
            let node = current;
            while (node) {
                path.unshift({ x: node.x * tileSize + tileSize / 2, y: node.y * tileSize + tileSize / 2 });
                node = node.parent;
            }
            return { path, cost: current.g };
        }

        const neighbors = [
            { dx: 1, dy: 0 },  { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },  { dx: 0, dy: -1 },
            { dx: 1, dy: 1 },  { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
        ];

        for (const { dx, dy } of neighbors) {
            const nx = current.x + dx;
            const ny = current.y + dy;
            if (nx < 0 || nx >= 64 || ny < 0 || ny >= 64) continue;
            const nKey = `${nx},${ny}`;
            if (closedSet.has(nKey)) continue;

            const isDiagonal = dx !== 0 && dy !== 0;
            const baseCost = isDiagonal ? 2 : 1;
            let safetyCost = 0;
            if (map[ny][nx] === 1) {
                safetyCost = 900000;
            } else {
                const { r, g, b } = hexToRGB(safetyVectorMap[ny][nx]);
                const directionSafety = wx * r + wy * g;
                const occlusion = b;
                safetyCost = directionSafety < 0.7 ? 150 : 1;
                safetyCost *= (1 + occlusion * 49);
                safetyCost = Math.max(0.1, safetyCost);

                const tileCenterX = nx * tileSize + tileSize / 2;
                const tileCenterY = ny * tileSize + tileSize / 2;
                if (hasClearShot(startX, startY, tileCenterX, tileCenterY, tileSize, map)) {
                    safetyCost *= 0.5;
                }
            }

            const g = current.g + (baseCost * safetyCost);
            const h = heuristic(nx, ny, goalTileX, goalTileY);
            const f = g + h + Math.random() * 0.001; // Small random perturbation for tie-breaking

            let neighbor = nodes.get(nKey);
            if (!neighbor) {
                neighbor = { x: nx, y: ny, g, h, f, parent: current };
                nodes.set(nKey, neighbor);
                openSet.push(neighbor);
            } else if (g < neighbor.g) {
                neighbor.g = g;
                neighbor.f = f;
                neighbor.parent = current;
            }
        }
    }
    return { path: [], cost: Infinity };
}

function heuristic(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    return dx + dy + (3 - 2) * Math.min(dx, dy);
}

window.findPath = findPath;
window.hasClearShot = hasClearShot;