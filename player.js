// player.js
function updatePlayer(mouseX, mouseY) {
    const maxReloadTime = 90;
    const maxShootTime = 5;

    if (window.player.hp <= 0) return;

    let dx = 0;
    let dy = 0;
    const keys = window.keysPressed || {};
    let baseSpeed = window.player.speed;
    window.player.isSprinting = false;

    // Sprint with Shift (double speed, no shooting/grenades)
    if (keys['Shift']) {
        baseSpeed *= 2; // Double speed
        window.player.isSprinting = true;
    }
    // Slow movement with Ctrl (half speed, 100% spread, not moving for spread calc)
    else if (keys['Control']) {
        baseSpeed *= 0.5; // Half speed
    }

    // WASD and Arrow keys for movement
    if (keys['w'] || keys['W'] || keys['ArrowUp']) dy -= baseSpeed;
    if (keys['s'] || keys['S'] || keys['ArrowDown']) dy += baseSpeed;
    if (keys['a'] || keys['A'] || keys['ArrowLeft']) dx -= baseSpeed;
    if (keys['d'] || keys['D'] || keys['ArrowRight']) dx += baseSpeed;

    const magnitude = Math.sqrt(dx * dx + dy * dy);
    const isMoving = magnitude > 0 && !keys['Control']; // Ctrl movement not counted
    if (magnitude > 0) {
        dx = dx * baseSpeed / magnitude;
        dy = dy * baseSpeed / magnitude;
    }

    const newX = window.player.x + dx;
    const newY = window.player.y + dy;
    const tileX = Math.floor(newX / window.tileSize);
    const tileY = Math.floor(newY / window.tileSize);

    if (window.map && tileX >= 0 && tileX < 64 && tileY >= 0 && tileY < 64 && window.map[tileY][tileX] === 0) {
        window.player.x = newX;
        window.player.y = newY;
    }

    // Update movement counter for spread
    if (isMoving || window.player.wasHit) {
        window.player.movementCounter = 10; // Reset to max when moving or hit
    } else if (window.player.movementCounter > 0) {
        window.player.movementCounter--; // Decrease when still
    }
    window.player.wasHit = false; // Reset hit flag after frame

    window.player.shootTimer--;
    if (window.player.shootTimer <= 0 && window.player.isShooting && window.player.ammo > 0 && !window.player.isReloading && !window.player.isSprinting) {
        spawnPlayerProjectile(window.player.x, window.player.y, mouseX, mouseY, window.projectiles);
        window.player.shootTimer = maxShootTime;
        window.player.ammo--;
        window.ammoElement.textContent = '';
    }

    if (keys['r'] || keys['R']) {
        if (!window.player.isReloading && window.player.ammo < window.player.maxAmmo) {
            window.player.isReloading = true;
            window.player.reloadTimer = maxReloadTime;
            if (!window.player.reloadSoundPlayed) {
                const reloadAudio = new Audio('reload.mp3');
                reloadAudio.play().catch(e => console.error("Error playing reload.mp3:", e));
                window.player.reloadSoundPlayed = true;
            }
        }
    }

    if (window.player.isReloading) {
        window.player.reloadTimer--;
        if (window.player.reloadTimer <= 0) {
            window.player.ammo = window.player.maxAmmo;
            window.player.isReloading = false;
            window.player.reloadSoundPlayed = false;
            window.ammoElement.textContent = '';
        }
    }

    const grenadeKeyPressed = keys['g'] || keys['G'] || keys[' '];
    if (grenadeKeyPressed && window.player.grenadeDelayTimer <= 0 && window.player.grenades > 0 && !window.player.isSprinting) {
        window.player.pressDuration = Math.min(window.player.pressDuration + 1, 15);
    } else if (!grenadeKeyPressed && window.player.pressDuration > 0 && window.player.grenadeDelayTimer <= 0 && window.player.grenades > 0) {
        window.player.lastGrenadeTime = window.throwGrenade(window.player.x, window.player.y, mouseX, mouseY, window.projectiles, window.player.lastGrenadeTime, window.player.pressDuration);
        window.player.grenades--;
        window.grenadesElement.textContent = '';
        window.player.grenadeDelayTimer = 22;
        window.player.pressDuration = 0;
    } else if (window.player.grenadeDelayTimer > 0) {
        window.player.grenadeDelayTimer--;
    }
}

window.updatePlayer = updatePlayer;