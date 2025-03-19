// game.js
const canvas = document.getElementById('gameCanvas');
if (!canvas) {
    console.error("Canvas element not found!");
    throw new Error("Canvas not found");
}
const ctx = canvas.getContext('2d');
canvas.width = 1920;
canvas.height = 1280;

const tileSize = 20;

const ammoElement = document.getElementById('ammo');
const grenadesElement = document.getElementById('grenades');
const killsElement = document.getElementById('kills');
const hpElement = document.getElementById('hp');
const armorElement = document.getElementById('armor');
const timeElement = document.getElementById('time');
const enemiesElement = document.getElementById('enemies');

let player = { 
    x: 200, 
    y: 200, 
    radius: 8,
    speed: 2, 
    ammo: 30, 
    maxAmmo: 30, 
    grenades: 9,
    maxGrenades: 12,
    reloadTimer: 0, 
    isReloading: false,
    shootTimer: 0,
    isShooting: false,
    hp: 100,
    armor: 0,
    damageReduction: false,
    lastGrenadeTime: 0,
    grenadeDelayTimer: 0,
    pressDuration: 0,
    deathTimer: -1,
    deathSoundPlayed: false,
    facingAngle: 0,
    reloadSoundPlayed: false,
    movementCounter: 0,
    isSprinting: false,
    wasHit: false
};
let enemies = [];
let projectiles = [];
let bloodParticles = [];
let boxes = [];
let mapImage = new Image();
mapImage.src = 'map_tex1.png';
let gameTime = 0;
let mouseX = 0, mouseY = 0;
let musicPlayed = false;
window.gameStarted = false;
let fadeTimer = 0;

window.keysPressed = {};

function snapToGrid(value) {
    return Math.round(value / 8) * 8;
}

function startGameLogic() {
    canvas.style.cursor = "url('aim.png') 32 32, auto";
    [ammoElement, grenadesElement, killsElement, hpElement, armorElement, timeElement, enemiesElement].forEach(element => {
        element.style.display = 'block';
    });
    grenadesElement.textContent = '';
    armorElement.textContent = `Armor: ${player.armor}`;
    console.log("Game started");

    document.addEventListener('keydown', (event) => {
        window.keysPressed[event.key] = true;
    });

    document.addEventListener('keyup', (event) => {
        window.keysPressed[event.key] = false;
    });

    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const rawX = event.clientX - rect.left;
        const rawY = event.clientY - rect.top;
        mouseX = snapToGrid(rawX);
        mouseY = snapToGrid(rawY);
        if (player.hp > 0) {
            player.facingAngle = Math.atan2(mouseY - player.y, mouseX - player.x);
        }
    });

    canvas.addEventListener('mousedown', () => {
        if (player.hp > 0 && !player.isSprinting) {
            player.isShooting = true;
        }
    });

    canvas.addEventListener('mouseup', () => {
        player.isShooting = false;
    });

    // Restore sound effects
    setTimeout(() => {
        const alphaAudio = new Audio('alphateam.mp3');
        alphaAudio.play().catch(e => console.error("Error playing alphateam.mp3:", e));
    }, 4000);

    setTimeout(() => {
        const alpha2Audio = new Audio('alphateam2.mp3');
        alpha2Audio.play().catch(e => console.error("Error playing alphateam2.mp3:", e));
    }, 24000);

    setTimeout(() => {
        const alpha3Audio = new Audio('alphateam3.mp3');
        alpha3Audio.play().catch(e => console.error("Error playing alphateam3.mp3:", e));
    }, 49000);

    spawnInitialEnemies();
    spawnBoxes();

    if (!musicPlayed) {
        audio.play().then(() => {
            console.log("Music started playing");
            musicPlayed = true;
        }).catch(e => console.error("Audio play failed:", e));
    }
}

const audio = new Audio('Leon_theme.mp3');
audio.loop = true;

function spawnInitialEnemies() {
    window.spawnEnemies(enemies, 0, tileSize);
}

function spawnBoxes() {
    const spawnLocations = [
        { x: 253, y: 520 },
        { x: 387, y: 754 },
        { x: 273, y: 253 },
        { x: 967, y: 420 },
        { x: 867, y: 974 },
        { x: 293, y: 1121 },
        { x: 453, y: 453 }
    ];
    const boxTypes = [
        { type: 'A', image: 'boxA.png', label: 'ARMOR', effect: () => { 
            player.armor = 100; 
            player.damageReduction = true; 
            armorElement.textContent = `Armor: ${player.armor}`; 
            console.log("Armor picked up: +100 armor, damage reduced by 1");
        } },
        { type: 'B', image: 'boxB.png', label: 'MEDKIT', effect: () => { 
            player.hp = Math.min(player.hp + 50, 100); 
            hpElement.textContent = `HP: ${player.hp}`; 
            console.log("Medkit picked up: +50 HP (max 100)");
        } },
        { type: 'C', image: 'boxC.png', label: 'GRENADE', effect: () => { 
            player.grenades += 4; 
            grenadesElement.textContent = ''; 
            console.log("Grenades picked up: +4 grenades");
        } },
        { type: 'D', image: 'boxD.png', label: 'MAG', effect: () => { 
            player.maxAmmo = 40; 
            player.ammo = Math.min(player.ammo + 10, 40); 
            ammoElement.textContent = ''; 
            console.log("Extended Mag picked up: Max ammo now 40");
        } }
    ];

    const shuffledBoxTypes = boxTypes.slice().sort(() => Math.random() - 0.5).slice(0, 2);
    const shuffledLocations = spawnLocations.slice().sort(() => Math.random() - 0.5);

    shuffledBoxTypes.forEach((box, index) => {
        const loc = shuffledLocations[index];
        boxes.push({
            x: loc.x,
            y: loc.y,
            type: box.type,
            image: new Image(),
            label: box.label,
            effect: box.effect,
            collected: false
        });
        boxes[boxes.length - 1].image.src = box.image;
    });
}

function checkBoxCollision() {
    boxes.forEach(box => {
        if (!box.collected) {
            const dx = player.x - box.x;
            const dy = player.y - box.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < player.radius + 15) {
                box.effect();
                box.collected = true;
                console.log(`Collected box ${box.type} at (${box.x}, ${box.y})`);
            }
        }
    });
}

function incrementTimers() {
    enemies.forEach(enemy => {
        enemy.timer++;
        enemy.checkTimer++;
        enemy.shootTimer++;
        enemy.reloadTimer++;
        enemy.shootDelayTimer++;
    });
    if (player.hp > 0) {
        gameTime++;
        timeElement.textContent = `Time: ${Math.floor(gameTime / 60)}s`;
    }
    if (player.hp <= 0 && player.deathTimer >= 0) {
        player.deathTimer++;
    }
    const aliveEnemies = enemies.filter(enemy => !enemy.dead).length;
    enemiesElement.textContent = `Enemies: ${aliveEnemies}`;
}

function gameLoop() {
    if (typeof window.updateGrenadeParticles !== 'function' || 
        typeof window.spawnEnemies !== 'function' || 
        typeof window.updateSpawns !== 'function' || 
        typeof window.isTitleScreen !== 'function' || 
        typeof window.renderTitle !== 'function') {
        console.warn("Waiting for required scripts to load...");
        requestAnimationFrame(gameLoop);
        return;
    }

    if (window.isTitleScreen()) {
        window.renderTitle(ctx, canvas);
    } else if (!window.gameStarted) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        fadeTimer = Math.min(fadeTimer + 1, 77);
        const fadeOpacity = 1 - (fadeTimer / 77);
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeOpacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        updatePlayer(mouseX, mouseY);
        checkBoxCollision();
        incrementTimers();
        window.updateSpawns(enemies, gameTime, tileSize);
        updateEnemyPaths(enemies, player.x, player.y, projectiles, tileSize, map, safetyVectorMap);
        updateSafetyAreas(enemies, player.x, player.y);
        updateProjectiles(projectiles, enemies, player, tileSize, map);
        window.updateGrenades(projectiles, enemies, tileSize, map);
        window.updateGrenadeParticles(projectiles, enemies, tileSize, map);
        updateBlood(bloodParticles, tileSize, map);
        if (player.hp <= 0 && player.grenades > 0 && player.deathTimer === -1) {
            player.deathTimer = 0;
            if (!player.deathSoundPlayed) {
                const deathAudio = new Audio('thisisfrommathilda.wav');
                deathAudio.play().catch(e => console.error("Error playing thisisfrommathilda.wav:", e));
                player.deathSoundPlayed = true;
            }
        }
        if (player.deathTimer >= 120 && player.deathTimer < 122) {
            window.explodeGrenadesAtPlayer(player, projectiles);
        }
        render(ctx, player, enemies, projectiles, bloodParticles, mapImage, canvas, boxes);
    }
    requestAnimationFrame(gameLoop);
}

function startGameLoop() {
    if (typeof window.updateGrenadeParticles === 'function' && 
        typeof window.spawnEnemies === 'function' && 
        typeof window.updateSpawns === 'function' &&
        typeof window.isTitleScreen === 'function' &&
        typeof window.renderTitle === 'function') {
        console.log("All required scripts loaded, starting game loop");
        gameLoop();
    } else {
        console.warn("Required scripts not fully loaded, retrying in 100ms...");
        setTimeout(startGameLoop, 100);
    }
}

try {
    if (!window.map) {
        console.error("Map not loaded yet!");
        throw new Error("Map not available");
    }
    console.log("Game initialized, waiting for all scripts to load");
    startGameLoop();
} catch (e) {
    console.error("Error initializing game:", e);
}

window.tileSize = tileSize;
window.player = player;
window.enemies = enemies;
window.projectiles = projectiles;
window.bloodParticles = bloodParticles;
window.boxes = boxes;
window.mapImage = mapImage;
window.ammoElement = ammoElement;
window.grenadesElement = grenadesElement;
window.hpElement = hpElement;
window.armorElement = armorElement;
window.mouseX = mouseX;
window.mouseY = mouseY;
window.killsElement = killsElement;
window.startGame = startGameLogic;