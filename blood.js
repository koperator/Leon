// blood.js

function spawnBloodParticles(x, y, angle) {
    for (let i = 0; i < 7; i++) { // 15% fewer particles (from 8 to 7)
        const spreadAngle = angle + (Math.random() - 0.5) * Math.PI; // ±90° spread
        const speed = (Math.random() * 180 + 135) / 60; // (135-315 units/s)

        const particle = {
            x: x,
            y: y,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed,
            lifetime: Math.floor((Math.random() * 22 + 9) * 169), // 6-22 seconds
            stuck: false,
            size: 3.89 // increased size
        };

        window.bloodParticles.push(particle);
    }
}

function updateBlood(bloodParticles, tileSize, map) {
    const friction = 0.85; // 3x friction
    const velocityThreshold = 2; // new threshold: 2 units/frame

    for (let i = bloodParticles.length - 1; i >= 0; i--) {
        const proj = bloodParticles[i];
        if (!proj) continue;

        if (!proj.stuck) {
            proj.vx *= friction;
            proj.vy *= friction;

            proj.x += proj.vx;
            proj.y += proj.vy;

            const mapX = Math.floor(proj.x / tileSize);
            const mapY = Math.floor(proj.y / tileSize);

            if (map[mapY] && map[mapY][mapX]) {
                proj.stuck = true;
                proj.vx = 0;
                proj.vy = 0;
            }

            if (Math.hypot(proj.vx, proj.vy) < velocityThreshold) {
                proj.vx = 0;
                proj.vy = 0;
                proj.stuck = true;
            }
        }

        proj.lifetime--;

        if (proj.lifetime <= 0) {
            bloodParticles.splice(i, 1);
        }
    }
}

window.spawnBloodParticles = spawnBloodParticles;
window.updateBlood = updateBlood;
