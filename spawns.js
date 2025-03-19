// spawns.js
console.log("spawns.js loaded");

const spawnWaves = [
    "0,05 A",
    "0,1 A",
    "0,15 A",
    "5,0 A",
    "8,0 A",
    "12,0 A",
    "16,0 A",
    "20,0 B",
    "30,0 A",
    "35,0 A",
    "39,0 A",
    "40,0 A",
    "44,0 A",
    "50,0 A",
    "56,5 B",
    "60,0 A",
    "65,0 A",
    "66,0 A",
    "68,0 B",
    "69,5 A",
    "71,0 A",
    "71,5 C",
    "72,0 A",
    "73,5 B",
    "75,0 A",
    "76,0 A",
    "76,5 B",
    "77,0 A",
    "78,0 A",
    "78,5 B",
    "78,5 C",
    "79,0 A",
    "80,0 B",
    "82,0 B",
    "84,0 C",
    "86,0 C",
    "88,0 B",
    "89,5 A",
    "90,0 C",
    "91,0 B",
    "92,5 A",
    "93,0 C",
    "94,0 B",
    "95,0 C",
    "94,0 B",
    "94,5 A",
    "94,8 A",
    "95,1 A",
    "95,2 A",
    "95,5 A",
    "95,8 A",
    "96,1 A",
    "96,5 A",
    "96,7 A",
    "96,9 A",
    "97,5 A",
    "98,5 A",
    "98,8 A",
    "98,9 A",
    "99,5 A",
    "99,9 A"
];

const spawnLocations = [
    { x: 40, y: 6 },
    { x: 7, y: 160 },
    { x: 8, y: 1080 },
    { x: 9, y: 1145 },
    { x: 1270, y: 1240 },
    { x: 1270, y: 682 },
    { x: 1270, y: 220 },
    { x: 1105, y: 1260 }
];

function updateSpawns(enemies, gameTime, tileSize) {
    spawnWaves.forEach(wave => {
        const [timeStr, type] = wave.split(" ");
        const [seconds, hundredths] = timeStr.split(",");
        const spawnTime = parseInt(seconds) * 60 + parseInt(hundredths) * 0.6;

        if (gameTime === spawnTime) {
            spawnEnemy(enemies, type, tileSize);
        }
    });
}

function spawnEnemies(enemies, gameTime, tileSize) {
    if (gameTime === 0) {
        spawnEnemy(enemies, "A", tileSize);
    }
}

function spawnEnemy(enemies, type, tileSize) {
    const spawnLoc = spawnLocations[Math.floor(Math.random() * spawnLocations.length)];
    const weapon = assignEnemyWeapon(type);
    let enemyConfig = {
        x: spawnLoc.x,
        y: spawnLoc.y,
        radius: 10.7,
        path: [],
        timer: 0,
        checkTimer: 0,
        shootTimer: 0,
        reloadTimer: 0,
        shootDelayTimer: weapon.shootDelay + 3.6,
        pathCost: Infinity,
        currentSpeed: 0,
        safeAreas: [],
        unsafeAreas: [],
        state: 'attacking',
        hp: 100,
        speed: Math.floor(Math.random() * 26) + 50,
        dead: false,
        firingAngle: Math.atan2(window.player.y - spawnLoc.y, window.player.x - spawnLoc.x),
        ammo: weapon.maxAmmo,
        spread: weapon.spread,
        weapon: weapon,
        type: type
    };

    switch (type) {
        case "A": // Light unit
            enemyConfig.hp = 100;
            break;
        case "B": // Heavy unit
            enemyConfig.hp = 150;
            break;
        case "C": // Random light/heavy/none
            if (Math.random() < 0.33) return;
            enemyConfig.hp = Math.random() < 0.5 ? 100 : 150;
            enemyConfig.type = enemyConfig.hp === 150 ? "B" : "A";
            break;
        case "D": // Riot shield
            enemyConfig.hp = 200;
            enemyConfig.speed = Math.floor(Math.random() * 21) + 40;
            break;
        case "E": // Boss Stansfield
            enemyConfig.hp = 500;
            enemyConfig.radius = 15;
            enemyConfig.speed = Math.floor(Math.random() * 31) + 60;
            break;
    }

    enemies.push(enemyConfig);
    console.log(`Spawned ${type} enemy at (${spawnLoc.x}, ${spawnLoc.y}) with speed: ${enemyConfig.speed}, weapon: ${enemyConfig.weapon.name}`);
}

function assignEnemyWeapon(type) {
    const weapons = window.getEnemyWeapons();
    let allowedWeaponIds;
    if (type === "B" || type === "E") {
        allowedWeaponIds = [3, 7]; // Heavy: Remington 870, HK91
    } else {
        allowedWeaponIds = [4, 5, 6]; // Light: MP5, HK33, SG 551
    }
    const randomId = allowedWeaponIds[Math.floor(Math.random() * allowedWeaponIds.length)];
    const selectedWeapon = weapons.find(w => w.id === randomId);
    return selectedWeapon;
}

window.updateSpawns = updateSpawns;
window.spawnEnemies = spawnEnemies;