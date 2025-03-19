// grenade_explosion.js
const explosionImage = new Image();
explosionImage.src = 'explosion.png';

function explodeGrenade(grenade, projectiles, index) {
    console.log(`Grenade at (${grenade.x}, ${grenade.y}) exploded`);

    const explosionAudio = new Audio('explosion.mp3');
    explosionAudio.play().catch(e => console.error("Error playing explosion.mp3:", e));

    const impactAudio = new Audio('grenade_impact.mp3');
    impactAudio.play().catch(e => console.error("Error playing grenade_impact.mp3:", e));

    window.decals.push({ 
        x: grenade.x, 
        y: grenade.y, 
        rotation: Math.random() * 2 * Math.PI, 
        image: explosionImage, 
        lifetime: 2,
        size: 64
    });

    window.decals.push({ 
        x: grenade.x, 
        y: grenade.y, 
        rotation: Math.random() * 2 * Math.PI 
    });

    // Add lingering orange particles with minimal movement
    for (let i = 0; i < 13; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = (Math.random() * 39 + 2) / 60; // Lower velocity (10–20 units/s)
        const lifetime = Math.floor(Math.random() * 33 + 1); // 10–38 frames (avg 23)

        const particle = {
            x: grenade.x,
            y: grenade.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            angle: angle,
            lifetime: lifetime,
            source: 'particle',
            type: 'linger'
        };
        projectiles.push(particle);
    }

    window.spawnExplosionParticles(grenade.x, grenade.y, projectiles);

    for (let j = 0; j < window.enemies.length; j++) {
        const enemy = window.enemies[j];
        if (enemy.dead) continue;
        const dx = grenade.x - enemy.x;
        const dy = grenade.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < enemy.radius + 40) {
            enemy.hp -= 100;
            enemy.wasHit = true;
            console.log(`Enemy hit by grenade explosion! HP remaining: ${enemy.hp}`);
            if (enemy.hp <= 0) {
                enemy.dead = true;
                enemy.deathAngle = Math.atan2(dy, dx);
                window.killCount = (window.killCount || 0) + 1;
                document.getElementById('kills').textContent = `Kills: ${window.killCount}`;
                console.log(`Enemy at (${enemy.x}, ${enemy.y}) killed by grenade`);
            }
        }
    }

    if (window.player.hp > 0) {
        const dx = grenade.x - window.player.x;
        const dy = grenade.y - window.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < window.player.radius + 40) {
            const damage = 100;
            if (window.player.armor > 0) {
                window.player.armor -= damage;
                if (window.player.armor < 0) {
                    window.player.hp += window.player.armor;
                    window.player.armor = 0;
                }
            } else {
                window.player.hp -= damage;
            }
            console.log(`Player hit by grenade explosion! HP remaining: ${window.player.hp}, Armor remaining: ${window.player.armor}`);
            window.hpElement.textContent = `HP: ${window.player.hp}`;
            window.armorElement.textContent = `Armor: ${window.player.armor}`;
        }
    }
}

window.explodeGrenade = explodeGrenade;