// weapons.js
const weapons = {
    1: {
        id: 1,
        name: "Beretta 92 FS",
        baseShootInterval: 20,
        shootDelay: 12,
        damage: 15,
        spread: 2.0,
        maxAmmo: 15,
        reloadTime: 120,
        sound: 'beretta.wav'
    },
    2: {
        id: 2,
        name: "UZI x2",
        baseShootInterval: 3,
        shootDelay: 15,
        damage: 6,
        spread: 7.0,
        maxAmmo: 50,
        reloadTime: 200,
        sound: 'uzi.wav'
    },
    3: {
        id: 3,
        name: "Remington 870",
        baseShootInterval: 60,
        shootDelay: 12,
        damage: 7,
        spread: 18.0,
        maxAmmo: 6,
        reloadTime: 240,
        sound: 'remington.wav'
    },
    4: {
        id: 4,
        name: "MP5",
        baseShootInterval: 9,
        shootDelay: 15,
        damage: 8,
        spread: 5.5,
        maxAmmo: 30,
        reloadTime: 150,
        sound: 'mp5.mp3'
    },
    5: {
        id: 5,
        name: "HK33",
        baseShootInterval: 7,
        shootDelay: 15,
        damage: 9,
        spread: 4.0,
        maxAmmo: 25,
        reloadTime: 160,
        sound: 'hk33.wav'
    },
    6: {
        id: 6,
        name: "SG 551",
        baseShootInterval: 6,
        shootDelay: 17,
        damage: 11,
        spread: 3.6,
        maxAmmo: 30,
        reloadTime: 185,
        sound: 'sg551.wav'
    },
    7: {
        id: 7,
        name: "HK91",
        baseShootInterval: 14,
        shootDelay: 19,
        damage: 17,
        spread: 2.8,
        maxAmmo: 20,
        reloadTime: 210,
        sound: 'hk91.wav'
    },
    8: {
        id: 8,
        name: "M4",
        baseShootInterval: 5,
        shootDelay: 12,
        damage: 12,
        spread: 2.8,
        maxAmmo: 30,
        reloadTime: 180,
        sound: 'M4.mp3'
    },
    9: {
        id: 9,
        name: "RPG",
        baseShootInterval: 180,
        shootDelay: 12,
        damage: 100,
        spread: 0,
        maxAmmo: 1,
        reloadTime: 300,
        sound: 'rpg.mp3'
    }
};

function shootWeapon(enemy, playerX, playerY, projectiles, shootInterval) {
    if (!enemy.shootTimer) enemy.shootTimer = 0;
    if (!enemy.shootDelayTimer) enemy.shootDelayTimer = enemy.weapon.shootDelay;

    enemy.shootTimer++;
    enemy.shootDelayTimer++;

    if (enemy.shootDelayTimer >= enemy.weapon.shootDelay && enemy.shootTimer >= shootInterval) {
        const dx = playerX - enemy.x;
        const dy = playerY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const baseAngle = Math.atan2(dy, dx);

        if (enemy.weapon.name === "Remington 870") {
            for (let i = 0; i < 8; i++) {
                const spreadAngle = (Math.random() - 0.5) * (enemy.weapon.spread * Math.PI / 180);
                const angle = baseAngle + spreadAngle;
                const speed = 24; // 25% slower (1920 / 60 = 32 → 24)

                const projectile = {
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    angle: angle,
                    lifetime: 240,
                    source: 'enemy',
                    damage: enemy.weapon.damage + Math.floor(Math.random() * 11)
                };
                projectiles.push(projectile);
            }
            spawnMuzzleFlash(enemy.x, enemy.y, baseAngle, projectiles);
        } else {
            const spreadAngle = (Math.random() - 0.5) * (enemy.weapon.spread * Math.PI / 180);
            const angle = baseAngle + spreadAngle;
            const speed = 1920 / 60;

            const projectile = {
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                angle: angle,
                lifetime: 240,
                source: 'enemy',
                damage: enemy.weapon.damage + Math.floor(Math.random() * (enemy.weapon.name === "HK91" ? 6 : 4))
            };
            projectiles.push(projectile);
            spawnMuzzleFlash(enemy.x, enemy.y, angle, projectiles);
        }

        enemy.shootTimer = 0;
        enemy.ammo--;
        console.log(`Enemy at (${enemy.x}, ${enemy.y}) fired ${enemy.weapon.name}, ammo remaining: ${enemy.ammo}`);

        if (enemy.ammo <= 0) {
            enemy.shooting = false;
        }

        if (window.player.hp > 0) {
            const audio = new Audio(enemy.weapon.sound);
            audio.play().catch(e => console.error(`Error playing ${enemy.weapon.sound}:`, e));
        }
    }
}

function getEnemyWeapons() {
    return Object.values(weapons);
}

window.shootWeapon = shootWeapon;
window.getEnemyWeapons = getEnemyWeapons;