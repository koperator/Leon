// grenade_particles.js
console.log("grenade_particles.js loaded");

function spawnExplosionParticles(x, y, projectiles) {
    for (let i = 0; i < 100; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = (Math.random() * 290.85 + 248.85) / 60;
        const lifetime = Math.floor(Math.random() * 16.8 + 11.55);

        const particle = {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            angle: angle,
            lifetime: lifetime,
            source: 'particle',
            damage: 22,
            bounces: 0,
            fast: false
        };

        projectiles.push(particle);
    }

    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = (Math.random() * 210 + 630) / 60;
        const lifetime = Math.floor(Math.random() * 6.3 + 7.35);

        const particle = {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            angle: angle,
            lifetime: lifetime,
            source: 'particle',
            damage: 22,
            bounces: 0,
            fast: true
        };

        projectiles.push(particle);
    }
}

function updateGrenadeParticles(projectiles, enemies, tileSize, map) {
    let toRemove = [];

    for (let i = 0; i < projectiles.length; i++) {
        const proj = projectiles[i];
        if (proj.source !== 'particle' || (!proj.fast && proj.impact) || proj.muzzle) continue;

        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.lifetime--;

        const tileX = Math.floor(proj.x / tileSize);
        const tileY = Math.floor(proj.y / tileSize);

        if (proj.type !== 'linger') {
            if (proj.lifetime > 0 && (tileX < 0 || tileX >= 64 || tileY < 0 || tileY >= 64 || map[tileY][tileX] === 1)) {
                const oldX = proj.x - proj.vx;
                const oldY = proj.y - proj.vy;
                proj.x = oldX;
                proj.y = oldY;
                const normalX = proj.vx > 0 ? -1 : 1;
                const normalY = proj.vy > 0 ? -1 : 1;
                const dot = proj.vx * normalX + proj.vy * normalY;
                proj.vx = (proj.vx - 2 * dot * normalX) * 0.7;
                proj.vy = (proj.vy - 2 * dot * normalY) * 0.7;
                proj.bounces++;
                console.log(`Explosion particle at (${proj.x}, ${proj.y}) bounced, bounces: ${proj.bounces}`);
                if (proj.bounces >= 3) {
                    toRemove.push(i);
                }
            } else if (proj.lifetime <= 0) {
                toRemove.push(i);
            }

            for (let k = 0; k < projectiles.length; k++) {
                const otherProj = projectiles[k];
                if (otherProj.source === 'grenade' && i !== k) {
                    const dx = proj.x - otherProj.x;
                    const dy = proj.y - otherProj.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 5 + 3) {
                        otherProj.vx += proj.vx * 0.1;
                        otherProj.vy += proj.vy * 0.1;
                        console.log(`Particle at (${proj.x}, ${proj.y}) pushed grenade at (${otherProj.x}, ${otherProj.y}), new grenade velocity: (${otherProj.vx}, ${otherProj.vy})`);
                    }
                }
            }

            for (let j = 0; j < enemies.length; j++) {
                const enemy = enemies[j];
                if (enemy.dead) continue;
                const dx = proj.x - enemy.x;
                const dy = proj.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < enemy.radius + 3) {
                    enemy.hp -= proj.damage;
                    enemy.wasHit = true;
                    console.log(`Enemy hit by particle! HP remaining: ${enemy.hp}, damage dealt: ${proj.damage}`);
                    if (enemy.hp <= 0) {
                        enemy.dead = true;
                        enemy.deathAngle = proj.angle;
                        window.killCount = (window.killCount || 0) + 1;
                        document.getElementById('kills').textContent = `Kills: ${window.killCount}`;
                        console.log(`Enemy at (${enemy.x}, ${enemy.y}) killed`);
                    }
                    toRemove.push(i);
                    break;
                }
            }

            if (proj.lifetime > 0 && window.player.hp > 0) {
                const dx = proj.x - window.player.x;
                const dy = proj.y - window.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < window.player.radius + 3) {
                    const damage = proj.damage;
                    if (window.player.armor > 0) {
                        window.player.armor -= damage;
                        if (window.player.armor < 0) {
                            window.player.hp += window.player.armor;
                            window.player.armor = 0;
                        }
                    } else {
                        window.player.hp -= damage;
                    }
                    console.log(`Player hit by particle! HP remaining: ${window.player.hp}, Armor remaining: ${window.player.armor}`);
                    window.hpElement.textContent = `HP: ${window.player.hp}`;
                    window.armorElement.textContent = `Armor: ${window.player.armor}`;
                    toRemove.push(i);
                }
            }
        } else {
            proj.vx *= 0.9714; // High friction to keep nearly stationary
            proj.vy *= 0.9714;
            if (proj.lifetime <= 0) {
                toRemove.push(i);
            }
        }
    }

    toRemove.sort((a, b) => b - a);
    for (const index of toRemove) {
        if (index >= 0 && index < projectiles.length) {
            projectiles.splice(index, 1);
        }
    }
}

window.spawnExplosionParticles = spawnExplosionParticles;
window.updateGrenadeParticles = updateGrenadeParticles;