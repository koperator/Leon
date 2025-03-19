// grenade.js
function throwGrenade(playerX, playerY, targetX, targetY, projectiles, lastGrenadeTime, pressDuration) {
    if (window.player.isSprinting) return lastGrenadeTime; // Disable while sprinting

    const cooldown = 22;
    const currentTime = Date.now();

    if (lastGrenadeTime && (currentTime - lastGrenadeTime < cooldown * 1000 / 60)) {
        console.log("Grenade on cooldown");
        return lastGrenadeTime;
    }

    const grenade = new Image();
    grenade.src = 'grenade.png';

    const dx = targetX - playerX;
    const dy = targetY - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const baseAngle = Math.atan2(dy, dx);
    const spreadAngle = (Math.random() - 0.5) * (6 * Math.PI / 180);
    const angle = baseAngle + spreadAngle;

    const minDuration = 0.01;
    const maxDuration = 0.25;
    const minSpeed = (1920 * 0.04 / 60) * 0.05;
    const maxSpeed = (1920 * 0.32 / 60) * 0.25;
    const clampedDuration = Math.min(Math.max(pressDuration / 60, minDuration), maxDuration);
    const speed = minSpeed + (maxSpeed - minSpeed) * ((clampedDuration - minDuration) / (maxDuration - minDuration));

    const grenadeProj = {
        x: playerX,
        y: playerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: angle,
        lifetime: 165,
        source: 'grenade',
        initialX: playerX,
        initialY: playerY,
        distanceTraveled: 0,
        hasFriction: false,
        bounces: 0,
        image: grenade
    };

    projectiles.push(grenadeProj);
    console.log(`Grenade thrown from (${playerX}, ${playerY}) toward (${targetX}, ${targetY}) with speed ${speed * 60}`);

    return currentTime;
}

function explodeGrenadesAtPlayer(player, projectiles) {
    const remainingGrenades = player.grenades;
    player.grenades = 0;
    window.grenadesElement.textContent = '';

    for (let i = 0; i < remainingGrenades; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = (Math.random() * 40 + 20) / 60;
        const delay = 120 + Math.floor(i * (51 / Math.max(remainingGrenades - 1, 1)));

        const grenade = {
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            angle: angle,
            lifetime: delay,
            source: 'grenade',
            initialX: player.x,
            initialY: player.y,
            distanceTraveled: 0,
            hasFriction: false,
            bounces: 0,
            image: new Image()
        };
        grenade.image.src = 'grenade.png';
        projectiles.push(grenade);
    }
}

window.throwGrenade = throwGrenade;
window.explodeGrenadesAtPlayer = explodeGrenadesAtPlayer;