// enemyAI.js
const minSafeDistance = 30;

function updateEnemyPaths(enemies, playerX, playerY, projectiles, tileSize, map, safetyVectorMap) {
    enemies.forEach(enemy => {
        if (enemy.dead) return;

        const dx = playerX - enemy.x;
        const dy = playerY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const constantSpeed = enemy.speed / 60;

        enemy.timer = (enemy.timer || 0) + 1;
        enemy.checkTimer = (enemy.checkTimer || 0) + 1;
        enemy.shootTimer = (enemy.shootTimer || 0) + 1;
        enemy.reloadTimer = (enemy.reloadTimer || 0) + 1;
        enemy.shootDelayTimer = (enemy.shootDelayTimer || 0) + 1;

        // Ensure critical properties are always initialized
        if (!enemy.hasOwnProperty('lastPositions')) enemy.lastPositions = [];
        if (!enemy.hasOwnProperty('stuckCounter')) enemy.stuckCounter = 0;
        if (!enemy.hasOwnProperty('skipNextShot')) enemy.skipNextShot = false;

        if (!enemy.hasOwnProperty('state')) {
            enemy.weapon = assignEnemyWeapon(enemy.type);
            enemy.state = 'attacking';
            enemy.hp = enemy.type === "B" || enemy.type === "E" ? enemy.hp * 2 : enemy.hp;
            enemy.ammo = enemy.weapon.maxAmmo;
            enemy.checkTimer = 0;
            enemy.shootTimer = 0;
            enemy.shootDelayTimer = enemy.weapon.shootDelay + 3.6;
            enemy.reloadTimer = enemy.weapon.reloadTime;
            enemy.speed = Math.floor(Math.random() * 26) + 50;
            enemy.dead = false;
            enemy.firingAngle = Math.atan2(playerY - enemy.y, playerX - enemy.x);
            enemy.spread = enemy.weapon.spread;
            console.log(`Enemy spawned with speed: ${enemy.speed}, weapon: ${enemy.weapon.name}`);
        }

        enemy.firingAngle = Math.atan2(playerY - enemy.y, playerX - enemy.x);

        let shootInterval = enemy.weapon.baseShootInterval;
        const randomFactor = 0.9 + Math.random() * 0.2;
        if (dist <= 200) {
            shootInterval = enemy.weapon.baseShootInterval * randomFactor;
        } else if (dist < 500) {
            shootInterval = enemy.weapon.baseShootInterval * 2 * randomFactor;
        } else {
            shootInterval = enemy.weapon.baseShootInterval * 3 * randomFactor;
        }

        enemy.lastPositions.push({ x: enemy.x, y: enemy.y });
        if (enemy.lastPositions.length > 10) enemy.lastPositions.shift();
        const movementRange = Math.max(...enemy.lastPositions.map(p => Math.sqrt((p.x - enemy.x) ** 2 + (p.y - enemy.y) ** 2)));
        if (movementRange < 2 && enemy.path && enemy.path.length > 1) {
            enemy.stuckCounter++;
            if (enemy.stuckCounter > 30) {
                console.log(`Enemy at (${enemy.x}, ${enemy.y}) detected as stuck, forcing new path`);
                const offsetX = playerX + (Math.random() - 0.5) * tileSize * 2;
                const offsetY = playerY + (Math.random() - 0.5) * tileSize * 2;
                const result = findPath(enemy.x, enemy.y, offsetX, offsetY, tileSize, map, safetyVectorMap);
                enemy.path = result.path;
                enemy.pathCost = result.cost;
                enemy.stuckCounter = 0;
            }
        } else {
            enemy.stuckCounter = 0;
        }

        if (enemy.checkTimer >= 18) {
            enemy.checkTimer = 0;

            const currentTileX = Math.floor(enemy.x / tileSize);
            const currentTileY = Math.floor(enemy.y / tileSize);
            const isCurrentPosUnsafe = enemy.unsafeAreas && enemy.unsafeAreas.some(area =>
                Math.floor(area.x / tileSize) === currentTileX &&
                Math.floor(area.y / tileSize) === currentTileY
            );

            if (isCurrentPosUnsafe && hasClearShot(enemy.x, enemy.y, playerX, playerY, tileSize, map) && enemy.state === 'attacking' && enemy.ammo > 0) {
                enemy.shooting = true;
                enemy.path = [];
                enemy.shootDelayTimer = 0;
                console.log(`Enemy at (${enemy.x}, ${enemy.y}) sees player, preparing to shoot, ammo: ${enemy.ammo}, weapon: ${enemy.weapon.name}`);
            } else if ((enemy.ammo === 0 || enemy.wasHit) && enemy.state !== 'reloading' && enemy.state !== 'moving_to_safety' && enemy.timer >= 30) {
                enemy.state = 'moving_to_safety';
                enemy.shooting = false;
                enemy.wasHit = false;
                let safeTile = null;
                for (const area of enemy.safeAreas) {
                    const safeX = area.x + tileSize / 2;
                    const safeY = area.y + tileSize / 2;
                    const moveDist = Math.sqrt((safeX - enemy.x) ** 2 + (safeY - enemy.y) ** 2);
                    if (moveDist >= minSafeDistance) {
                        safeTile = area;
                        break;
                    }
                }
                if (safeTile) {
                    const safeX = safeTile.x + tileSize / 2;
                    const safeY = safeTile.y + tileSize / 2;
                    const result = findPath(enemy.x, enemy.y, safeX, safeY, tileSize, map, safetyVectorMap);
                    enemy.path = result.path;
                    enemy.pathCost = result.cost;
                    enemy.timer = 0;
                    console.log(`Enemy moving to safe position (${safeX}, ${safeY}) ${enemy.ammo === 0 ? 'to reload' : 'after being hit'}`);
                } else {
                    enemy.state = 'reloading';
                    enemy.reloadTimer = 0;
                    console.log(`No safe position > 30 pixels found; reloading in place`);
                }
            } else if (enemy.state === 'moving_to_safety' && (!enemy.path || enemy.path.length <= 1)) {
                enemy.state = 'reloading';
                enemy.reloadTimer = 0;
                enemy.path = [];
                console.log(`Enemy reached safe position or no path, starting reload`);
            } else if (enemy.state === 'reloading' && enemy.reloadTimer >= enemy.weapon.reloadTime) {
                enemy.state = 'attacking';
                enemy.shooting = false;
                enemy.ammo = enemy.weapon.maxAmmo;
                enemy.path = [];
                let targetX = playerX;
                let targetY = playerY;
                if (window.player.hp <= 0) {
                    targetX = enemy.x + (Math.random() - 0.5) * tileSize * 10;
                    targetY = enemy.y + (Math.random() - 0.5) * tileSize * 10;
                }
                const result = findPath(enemy.x, enemy.y, targetX, targetY, tileSize, map, safetyVectorMap);
                enemy.path = result.path;
                enemy.pathCost = result.cost;
                enemy.timer = 0;
                console.log(`Enemy reloaded, advancing to ${window.player.hp <= 0 ? 'random position' : 'attack position'} near (${targetX}, ${targetY})`);
            } else if (enemy.state === 'attacking' && enemy.timer >= 30) {
                enemy.shooting = false;
                let targetX = playerX;
                let targetY = playerY;
                if (window.player.hp <= 0) {
                    targetX = enemy.x + (Math.random() - 0.5) * tileSize * 10;
                    targetY = enemy.y + (Math.random() - 0.5) * tileSize * 10;
                }
                const result = findPath(enemy.x, enemy.y, targetX, targetY, tileSize, map, safetyVectorMap);
                enemy.path = result.path;
                enemy.pathCost = result.cost;
                enemy.timer = 0;
                console.log(`Enemy advancing to ${window.player.hp <= 0 ? 'random position' : 'attack position'} near (${targetX}, ${targetY})`);
            }
        }

        if (enemy.shooting && enemy.ammo > 0 && enemy.shootDelayTimer >= enemy.weapon.shootDelay) {
            if (enemy.shootTimer >= shootInterval) {
                if (enemy.skipNextShot) {
                    enemy.skipNextShot = false;
                    enemy.shootTimer = 0;
                    console.log(`Enemy at (${enemy.x}, ${enemy.y}) skipped shot due to hit`);
                } else {
                    window.shootWeapon(enemy, playerX, playerY, projectiles, shootInterval);
                    enemy.shootTimer = 0;
                    enemy.ammo--;
                    console.log(`Enemy shot fired, ammo remaining: ${enemy.ammo}, weapon: ${enemy.weapon.name}`);
                    if (enemy.ammo === 0) {
                        enemy.shooting = false;
                    }
                }
            }
        } else if (!enemy.shooting && enemy.path && enemy.path.length > 1) {
            const nextPoint = enemy.path[1];
            const dxMove = nextPoint.x - enemy.x;
            const dyMove = nextPoint.y - enemy.y;
            const moveDist = Math.sqrt(dxMove * dxMove + dyMove * dyMove);

            if (moveDist > constantSpeed) {
                const moveX = (dxMove / moveDist) * constantSpeed;
                const moveY = (dyMove / moveDist) * constantSpeed;
                enemy.x += moveX;
                enemy.y += moveY;
            } else {
                enemy.x = nextPoint.x;
                enemy.y = nextPoint.y;
                enemy.path.shift();
            }
        }

        enemy.currentSpeed = constantSpeed * 60;
    });

    updateSafetyAreas(enemies, playerX, playerY);
}

function assignEnemyWeapon(type) {
    const weapons = window.getEnemyWeapons();
    let allowedWeaponIds;
    if (type === "B" || type === "E") {
        allowedWeaponIds = [3, 7];
    } else {
        allowedWeaponIds = [4, 5, 6];
    }
    const randomId = allowedWeaponIds[Math.floor(Math.random() * allowedWeaponIds.length)];
    const selectedWeapon = weapons.find(w => w.id === randomId);
    return selectedWeapon;
}

window.updateEnemyPaths = updateEnemyPaths;