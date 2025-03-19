// projectiles.js
function spawnPlayerProjectile(playerX, playerY, targetX, targetY, projectiles) {
    const dx = targetX - playerX;
    const dy = targetY - playerY;
    const baseAngle = Math.atan2(dy, dx);
    const baseSpread = 2.8; // Current spread
    const spreadFactor = window.player.movementCounter === 10 ? 1.5 : (0.7 + (window.player.movementCounter / 10) * (1.5 - 0.7)); // 70% to 150%
    const spreadAngle = (Math.random() - 0.5) * (baseSpread * spreadFactor * Math.PI / 180);
    const angle = baseAngle + spreadAngle;
    const speed = 1920 / 60;

    const projectile = {
        x: playerX,
        y: playerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: angle,
        lifetime: 240,
        source: 'player',
        damage: Math.floor(Math.random() * 13) + 27
    };

    projectiles.push(projectile);
    spawnMuzzleFlash(playerX, playerY, angle, projectiles);

    const audio = new Audio('M4.mp3');
    audio.play().catch(e => console.error("Error playing M4.mp3:", e));
}

function spawnImpactParticles(x, y, angle, projectiles) {
    for (let i = 0; i < 13; i++) {
        const spreadAngle = angle + (Math.random() - 0.5) * Math.PI * 2;
        const speed = (Math.random() * 600 + 300) / 60;
        const lifetime = Math.floor(Math.random() * 25 + 36);

        const particle = {
            x: x,
            y: y,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed,
            angle: spreadAngle,
            lifetime: lifetime,
            source: 'particle',
            damage: 0,
            bounces: 0,
            impact: true
        };

        projectiles.push(particle);
    }
}

function spawnMuzzleFlash(x, y, angle, projectiles) {
    for (let i = 0; i < 2; i++) {
        const spreadAngle = angle + (Math.random() - 0.5) * (Math.PI / 8);
        const speed = (Math.random() * 180 + 120) / 60;
        const lifetime = Math.floor(Math.random() * 4 + 3);

        const particle = {
            x: x,
            y: y,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed,
            angle: spreadAngle,
            lifetime: lifetime,
            source: 'particle',
            damage: 0,
            bounces: 0,
            muzzle: true
        };

        projectiles.push(particle);
    }
}

function updateProjectiles(projectiles, enemies, player, tileSize, map) {
    let updates = [];
    let toRemove = [];
    const friction = 0.85;
    const velocityThreshold = 2;

    for (let i = 0; i < projectiles.length; i++) {
        const proj = projectiles[i];
        if (!proj) continue;

        if (proj.source === 'player' || proj.source === 'enemy' || proj.muzzle || proj.impact) {
            if (proj.muzzle || proj.impact) {
                proj.vx *= friction;
                proj.vy *= friction;

                if (Math.hypot(proj.vx, proj.vy) < velocityThreshold) {
                    proj.vx = 0;
                    proj.vy = 0;
                }
            }

            const newX = proj.x + proj.vx;
            const newY = proj.y + proj.vy;
            const newLifetime = proj.lifetime - 1;
            updates.push({ index: i, x: newX, y: newY, lifetime: newLifetime });

            const tileX = Math.floor(newX / tileSize);
            const tileY = Math.floor(newY / tileSize);

            if (proj.source === 'player') {
                for (let enemy of enemies) {
                    if (enemy.dead) continue;
                    const dx = newX - enemy.x;
                    const dy = newY - enemy.y;
                    if (Math.hypot(dx, dy) < enemy.radius + 3) {
                        enemy.hp -= proj.damage;
                        enemy.wasHit = true;
                        if (Math.random() < 0.3) enemy.skipNextShot = true; // 30% chance to skip next shot
                        console.log(`Player projectile hit enemy at (${enemy.x}, ${enemy.y}), damage: ${proj.damage}, HP remaining: ${enemy.hp}`);
                        spawnBloodParticles(newX, newY, proj.angle);
                        toRemove.push(i);
                        if (enemy.hp <= 0) {
                            enemy.dead = true;
                            enemy.deathAngle = proj.angle;
                            window.killCount = (window.killCount || 0) + 1;
                            document.getElementById('kills').textContent = `Kills: ${window.killCount}`;
                        }
                        break;
                    }
                }
            } else if (proj.source === 'enemy' && player.hp > 0) {
                const dx = newX - player.x;
                const dy = newY - player.y;
                if (Math.hypot(dx, dy) < player.radius + 3) {
                    let damage = proj.damage;
                    if (player.damageReduction) {
                        damage = Math.max(damage - 1, 0);
                    }
                    if (player.armor > 0) {
                        player.armor -= damage;
                        if (player.armor < 0) {
                            player.hp += player.armor;
                            player.armor = 0;
                        }
                    } else {
                        player.hp -= damage;
                    }
                    console.log(`Enemy projectile hit player, original damage: ${proj.damage}, reduced damage: ${damage}, HP remaining: ${player.hp}, Armor remaining: ${player.armor}`);
                    spawnBloodParticles(newX, newY, proj.angle);
                    player.wasHit = true; // Trigger spread increase
                    toRemove.push(i);
                    window.hpElement.textContent = `HP: ${player.hp}`;
                    window.armorElement.textContent = `Armor: ${player.armor}`;
                }
            }

            if (newLifetime <= 0 || tileX < 0 || tileX >= 64 || tileY < 0 || tileY >= 64 || map[tileY][tileX] === 1) {
                if (proj.source === 'player' || proj.source === 'enemy') {
                    spawnImpactParticles(newX, newY, proj.angle, projectiles);
                }
                toRemove.push(i);
            }
        }
    }

    updates.forEach(update => {
        const proj = projectiles[update.index];
        if (proj) {
            proj.x = update.x;
            proj.y = update.y;
            proj.lifetime = update.lifetime;
        }
    });

    toRemove.sort((a, b) => b - a);
    for (const index of toRemove) {
        if (index >= 0 && index < projectiles.length) {
            projectiles.splice(index, 1);
        }
    }

    window.updateGrenades(projectiles, enemies, tileSize, map);
}