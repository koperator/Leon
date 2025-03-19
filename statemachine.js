// statemachine.js
class StateMachine {
    constructor(enemy) {
        this.enemy = enemy;
        this.state = enemy.state || 'moving'; // Default to moving
        this.minSafeDistance = 30;
    }

    update(playerX, playerY, projectiles, tileSize, map, safetyVectorMap) {
        const dx = playerX - this.enemy.x;
        const dy = playerY - this.enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const constantSpeed = this.enemy.speed / 60;

        // Update firing angle
        this.enemy.firingAngle = Math.atan2(playerY - this.enemy.y, playerX - this.enemy.x);

        // Calculate shoot interval based on distance
        const randomFactor = 0.9 + Math.random() * 0.2;
        let shootInterval = this.enemy.weapon.baseShootInterval * randomFactor;
        if (dist <= 200) shootInterval = this.enemy.weapon.baseShootInterval * randomFactor;
        else if (dist < 500) shootInterval = this.enemy.weapon.baseShootInterval * 2 * randomFactor;
        else shootInterval = this.enemy.weapon.baseShootInterval * 3 * randomFactor;

        // State-specific behavior
        switch (this.state) {
            case 'moving':
                if (!this.enemy.path || this.enemy.path.length <= 1) {
                    const result = findPath(this.enemy.x, this.enemy.y, playerX, playerY, tileSize, map, safetyVectorMap);
                    this.enemy.path = result.path;
                    this.enemy.pathCost = result.cost;
                    console.log(`Enemy at (${this.enemy.x}, ${this.enemy.y}) moving towards player (${playerX}, ${playerY})`);
                }
                this.move(constantSpeed);
                break;

            case 'shooting':
                window.shootWeapon(this.enemy, playerX, playerY, projectiles, shootInterval);
                break;

            case 'retreating':
                if (!this.enemy.path || this.enemy.path.length <= 1) {
                    this.state = 'reloading';
                    this.enemy.reloadTimer = 0;
                    this.enemy.path = [];
                    console.log(`Enemy at (${this.enemy.x}, ${this.enemy.y}) reached safe spot, transitioning to reloading`);
                } else {
                    this.move(constantSpeed);
                }
                break;

            case 'reloading':
                this.enemy.reloadTimer = (this.enemy.reloadTimer || 0) + 1;
                if (this.enemy.reloadTimer >= this.enemy.weapon.reloadTime) {
                    this.state = 'moving';
                    this.enemy.ammo = this.enemy.weapon.maxAmmo;
                    this.enemy.shooting = false;
                    console.log(`Enemy at (${this.enemy.x}, ${this.enemy.y}) reloaded, transitioning to moving`);
                }
                break;

            case 'dead':
                // No action needed
                break;

            default:
                console.error(`Unknown state for enemy at (${this.enemy.x}, ${this.enemy.y}): ${this.state}`);
                this.state = 'moving';
        }

        this.enemy.currentSpeed = constantSpeed * 60;
    }

    move(constantSpeed) {
        if (this.enemy.path && this.enemy.path.length > 1) {
            const nextPoint = this.enemy.path[1];
            const dxMove = nextPoint.x - this.enemy.x;
            const dyMove = nextPoint.y - this.enemy.y;
            const moveDist = Math.sqrt(dxMove * dxMove + dyMove * dyMove);

            if (moveDist > constantSpeed) {
                const moveX = (dxMove / moveDist) * constantSpeed;
                const moveY = (dyMove / moveDist) * constantSpeed;
                this.enemy.x += moveX;
                this.enemy.y += moveY;
            } else {
                this.enemy.x = nextPoint.x;
                this.enemy.y = nextPoint.y;
                this.enemy.path.shift();
            }
        }
    }

    retreat(playerX, playerY, tileSize, map, safetyVectorMap) {
        this.state = 'retreating';
        this.enemy.shooting = false;
        let safeTile = null;
        for (const area of this.enemy.safeAreas) {
            const safeX = area.x + tileSize / 2;
            const safeY = area.y + tileSize / 2;
            const moveDist = Math.sqrt((safeX - this.enemy.x) ** 2 + (safeY - this.enemy.y) ** 2);
            if (moveDist >= this.minSafeDistance) {
                safeTile = area;
                break;
            }
        }
        if (safeTile) {
            const safeX = safeTile.x + tileSize / 2;
            const safeY = safeTile.y + tileSize / 2;
            const result = findPath(this.enemy.x, this.enemy.y, safeX, safeY, tileSize, map, safetyVectorMap);
            this.enemy.path = result.path;
            this.enemy.pathCost = result.cost;
            console.log(`Enemy at (${this.enemy.x}, ${this.enemy.y}) retreating to (${safeX}, ${safeY})`);
        } else {
            this.state = 'reloading';
            this.enemy.reloadTimer = 0;
            console.log(`No safe position found for enemy at (${this.enemy.x}, ${this.enemy.y}), reloading in place`);
        }
    }

    setState(newState) {
        this.state = newState;
    }
}

window.StateMachine = StateMachine;