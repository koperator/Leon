// grenade_physics.js
function updateGrenades(projectiles, enemies, tileSize, map) {
    let toRemove = [];

    for (let i = 0; i < projectiles.length; i++) {
        const proj = projectiles[i];
        if (proj.source !== 'grenade' || !proj.initialX || !proj.initialY) continue;

        const oldX = proj.x;
        const oldY = proj.y;

        proj.x += proj.vx;
        proj.y += proj.vy;

        const dxTravel = proj.x - proj.initialX;
        const dyTravel = proj.y - proj.initialY;
        proj.distanceTraveled = Math.sqrt(dxTravel * dxTravel + dyTravel * dyTravel);
        if (proj.distanceTraveled >= 200 && !proj.hasFriction) {
            proj.hasFriction = true;
            console.log(`Grenade at (${proj.x}, ${proj.y}) reached 200 units, friction enabled`);
        }

        const tileX = Math.floor(proj.x / tileSize);
        const tileY = Math.floor(proj.y / tileSize);
        let collided = false;
        let normalX = 0;
        let normalY = 0;

        if (tileX < 0 || tileX >= 64 || tileY < 0 || tileY >= 64 || map[tileY][tileX] === 1) {
            collided = true;
            const centerX = (tileX + 0.5) * tileSize;
            const centerY = (tileY + 0.5) * tileSize;
            const dx = proj.x - centerX;
            const dy = proj.y - centerY;
            const mag = Math.sqrt(dx * dx + dy * dy) || 1;
            normalX = dx / mag;
            normalY = dy / mag;

            proj.x = oldX;
            proj.y = oldY;
            const correctionDist = 1;
            proj.x += normalX * correctionDist;
            proj.y += normalY * correctionDist;
        } else {
            for (const enemy of enemies) {
                if (enemy.dead) continue;
                const dx = proj.x - enemy.x;
                const dy = proj.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < enemy.radius + 5) {
                    collided = true;
                    normalX = dx / dist;
                    normalY = dy / dist;
                    proj.x = oldX;
                    proj.y = oldY;
                    proj.x += normalX * 1;
                    proj.y += normalY * 1;
                    break;
                }
            }
        }

        if (collided) {
            const dot = proj.vx * normalX + proj.vy * normalY;
            proj.vx = (proj.vx - 2 * dot * normalX) * 0.7;
            proj.vy = (proj.vy - 2 * dot * normalY) * 0.7;
            proj.hasFriction = true;
            proj.bounces++;
            const bounceAudio = new Audio('bounce.wav');
            bounceAudio.play().catch(e => console.error("Error playing bounce.wav:", e));
            console.log(`Grenade at (${proj.x}, ${proj.y}) bounced, velocity: (${proj.vx}, ${proj.vy}), bounces: ${proj.bounces}`);
        }

        if (proj.hasFriction) {
            proj.vx *= 0.98;
            proj.vy *= 0.98;
            if (Math.abs(proj.vx) < 0.1 && Math.abs(proj.vy) < 0.1) {
                proj.vx = 0;
                proj.vy = 0;
            }
        }

        proj.lifetime--;
        if (proj.lifetime <= 0) {
            window.explodeGrenade(proj, projectiles, i); // Call from grenade_explosion.js
            toRemove.push(i);
        }
    }

    toRemove.sort((a, b) => b - a);
    for (const index of toRemove) {
        if (index >= 0 && index < projectiles.length) {
            projectiles.splice(index, 1);
        }
    }
}

window.updateGrenades = updateGrenades;