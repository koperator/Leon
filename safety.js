// safety.js
function updateSafetyAreas(enemies, playerX, playerY) {
    enemies.forEach(enemy => {
        if (enemy.timer >= 30) { // Sync with path update (0.5 seconds)
            enemy.safeAreas = [];
            enemy.unsafeAreas = [];

            // 5x5 area around enemy
            const enemyTileX = Math.floor(enemy.x / tileSize);
            const enemyTileY = Math.floor(enemy.y / tileSize);
            const playerTileX = Math.floor(playerX / tileSize);
            const playerTileY = Math.floor(playerY / tileSize);

            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const tileX = enemyTileX + dx;
                    const tileY = enemyTileY + dy;
                    if (tileX >= 0 && tileX < 64 && tileY >= 0 && tileY < 64 && map[tileY][tileX] === 0) {
                        checkTileSafety(tileX, tileY, playerTileX, playerTileY, enemy.safeAreas, enemy.unsafeAreas);
                    }
                }
            }

            // Path-adjacent blocks
            if (enemy.path && enemy.path.length > 1) {
                for (let i = 0; i < enemy.path.length; i++) {
                    const pathX = Math.floor(enemy.path[i].x / tileSize);
                    const pathY = Math.floor(enemy.path[i].y / tileSize);
                    const adjacentTiles = [
                        { x: pathX + 1, y: pathY },
                        { x: pathX - 1, y: pathY },
                        { x: pathX, y: pathY + 1 },
                        { x: pathX, y: pathY - 1 }
                    ];

                    adjacentTiles.forEach(adj => {
                        if (adj.x >= 0 && adj.x < 64 && adj.y >= 0 && adj.y < 64 && map[adj.y][adj.x] === 0) {
                            const exists = enemy.safeAreas.some(a => a.x === adj.x * tileSize && a.y === adj.y * tileSize) ||
                                           enemy.unsafeAreas.some(a => a.x === adj.x * tileSize && a.y === adj.y * tileSize);
                            if (!exists) {
                                checkTileSafety(adj.x, adj.y, playerTileX, playerTileY, enemy.safeAreas, enemy.unsafeAreas);
                            }
                        }
                    });
                }
            }

            console.log(`Safety updated for enemy at (${enemy.x}, ${enemy.y}): Safe=${enemy.safeAreas.length}, Unsafe=${enemy.unsafeAreas.length}`);
        }
    });
}

function checkTileSafety(tileX, tileY, playerTileX, playerTileY, safeAreas, unsafeAreas) {
    let hasWall = false;
    const directionX = playerTileX - tileX;
    const directionY = playerTileY - tileY;
    const steps = Math.max(Math.abs(directionX), Math.abs(directionY));
    const xStep = steps ? directionX / steps : 0;
    const yStep = steps ? directionY / steps : 0;

    let checkX = tileX;
    let checkY = tileY;
    for (let i = 0; i <= steps; i++) {
        const checkTileX = Math.round(checkX);
        const checkTileY = Math.round(checkY);
        if (checkTileX >= 0 && checkTileX < 64 && checkTileY >= 0 && checkTileY < 64) {
            if (map[checkTileY][checkTileX] === 1) {
                hasWall = true;
                break;
            }
        }
        checkX += xStep;
        checkY += yStep;
    }

    if (hasWall) {
        safeAreas.push({ x: tileX * tileSize, y: tileY * tileSize });
    } else {
        unsafeAreas.push({ x: tileX * tileSize, y: tileY * tileSize });
    }
}