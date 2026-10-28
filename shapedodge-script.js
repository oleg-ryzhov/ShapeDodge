
 // ========= STRUCTURES =========
const structures = [
    {
        wave: 3,
        blocks: [
            { width: 150, height: 120, x: 120, y: 120 },
            { width: 150, height: 120, x: 530, y: 120 },
            { width: 150, height: 120, x: 530, y: 470 },
            { width: 150, height: 120, x: 120, y: 470 },
            { width: 260, height: 20, x: 270, y: 120 },
            { width: 30, height: 470, x: 850, y: 120 },
        ],
        enemies: [
            { type: "gary", amount: 2 },
            { type: "fast", amount: 1 },
            { type: "tiny", amount: 2 },
        ]
    },
    {
        wave: 6,
        blocks: [
            { width: 100, height: 100, x: 50, y: 50 },
            { width: 100, height: 100, x: 150, y: 50 },
            { width: 100, height: 100, x: 50, y: 150 },
            { width: 100, height: 100, x: 150, y: 150 },
            { width: 200, height: 20, x: 50, y: 250 },
        ],
        enemies: [
            { type: "fast", amount: 3 },
            { type: "tiny", amount: 2 },
        ]
    },
    {
        wave: 9,
        blocks: [
            { width: 120, height: 120, x: 40, y: 40 },
            { width: 120, height: 80, x: 170, y: 60 },
            { width: 80, height: 120, x: 100, y: 170 },
            { width: 150, height: 20, x: 40, y: 300 },
            { width: 20, height: 150, x: 190, y: 170 },
        ],
        enemies: [
            { type: "tank", amount: 1 },
            { type: "gary", amount: 2 },
            { type: "tiny", amount: 3 },
        ]
    },
    {
        wave: 12,
        blocks: [
            { width: 130, height: 130, x: 30, y: 30 },
            { width: 130, height: 130, x: 180, y: 30 },
            { width: 260, height: 20, x: 30, y: 170 },
            { width: 20, height: 150, x: 90, y: 190 },
            { width: 20, height: 150, x: 220, y: 190 },
        ],
        enemies: [
            { type: "tank", amount: 1 },
            { type: "fast", amount: 2 },
            { type: "gary", amount: 2 },
            { type: "tiny", amount: 2 },
        ]
    },
];

// ========= TICK ENGINE VARS =========
const tickLength = 20;        // 50 ticks per second
let frameAccumulator = 0;
let lastTimestamp = 0;

/* ============================
          PLAYER CLASS
   ============================ */
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 80;
        this.speedX = 0;
        this.speedY = 0;
        this.speed = 8;
        this.maxHP = 200;
        this.hp = this.maxHP;

        this.lastDamageTime = 0;
        this.damageCooldown = 50;
        this.lastShotTime = 0;
        this.shotCooldown = 20;
        this.damageTickCounter = -100;
        this.shotTickCounter = 20;
    }

    update() {
        moveEntityWithObstacles(this, this.speedX, this.speedY);

        // Keep the player inside the fixed game world.
        this.x = Math.max(0, Math.min(this.x, gameArea.width - this.width));
        this.y = Math.max(0, Math.min(this.y, gameArea.height - this.height));

        this.damageTickCounter++;
        this.shotTickCounter++;
    }

    draw() {
        const ctx = gameArea.context;

        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);

        const barWidth = 600;
        const barHeight = 30;
        const barX = (gameArea.width - barWidth) / 2;
        const barY = gameArea.height - barHeight - 10;

        ctx.fillStyle = "black";
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = "red";
        ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHP), barHeight);

        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            Math.ceil(this.hp) + " / " + this.maxHP,
            barX + barWidth / 2,
            barY + barHeight - 5
        );
    }

    takeDamage(amount) {
        if (this.damageTickCounter >= this.damageCooldown) {
            this.hp = Math.max(0, this.hp - amount);
            this.damageTickCounter = 0;
        }
    }

    // Each shooting method creates a bullet if the cooldown has elapsed.
    shootLeft() {
        if (this.shotTickCounter >= this.shotCooldown) {
            bulletsObj.spawnBullet(this.x, this.y + this.height / 2, -1, 0);
            this.shotTickCounter = 0;
        }
    }

    shootRight() {
        if (this.shotTickCounter >= this.shotCooldown) {
            bulletsObj.spawnBullet(this.x + this.width, this.y + this.height / 2, 1, 0);
            this.shotTickCounter = 0;
        }
    }

    shootUp() {
        if (this.shotTickCounter >= this.shotCooldown) {
            bulletsObj.spawnBullet(this.x + this.width / 2, this.y, 0, -1);
            this.shotTickCounter = 0;
        }
    }

    shootDown() {
        if (this.shotTickCounter >= this.shotCooldown) {
            bulletsObj.spawnBullet(this.x + this.width / 2, this.y + this.height, 0, 1);
            this.shotTickCounter = 0;
        }
    }
}

/* ============================
          ENEMIES CLASS
   ============================ */
class Enemies {
    constructor() {
        this.types = {
            gary:  { width:80, height:80, speed:5, maxHP:25, hp:25, damage:35, color:"blue", cost:15, is_boss:false, special:null, track_player:false },
            fast:  { width:50, height:50, speed:8, maxHP:10, hp:10, damage:15, color:"yellow", cost:10, is_boss:false, special:null, track_player:false },
            tank:  { width:150, height:150, speed:3, maxHP:100, hp:100, damage:60, color:"purple", cost:50, is_boss:false, special:null, track_player:false },
            tiny:  { width:25, height:25, speed:4, maxHP:5, hp:5, damage:10, color:"lime", cost:5, is_boss:false, special:null, track_player:false },
            snail: { width:15, height:15, speed:1.5, maxHP:1000, hp:1000, damage:1, color:"black", cost:250, is_boss:true, special:"one_hp", track_player:true }
        };
        this.components = [];
    }

    // Spawn an enemy from a randomly selected side in the supplied array.
    spawnEnemy(type, sides) {
        const side = sides[Math.floor(Math.random() * sides.length)];

        let x, y, dx, dy;
        const centerX = gameArea.width / 2;
        const centerY = gameArea.height / 2;

        if (side === "left") {
            x = -type.width;
            y = Math.random() * (gameArea.height - type.height);
            dx = 1;
            dy = (centerY - y) / (gameArea.height / 2);
        } else if (side === "right") {
            x = gameArea.width;
            y = Math.random() * (gameArea.height - type.height);
            dx = -1;
            dy = (centerY - y) / (gameArea.height / 2);
        } else if (side === "top") {
            x = Math.random() * (gameArea.width - type.width);
            y = -type.height;
            dx = (centerX - x) / (gameArea.width / 2);
            dy = 1;
        } else if (side === "bottom") {
            x = Math.random() * (gameArea.width - type.width);
            y = gameArea.height;
            dx = (centerX - x) / (gameArea.height / 2);
            dy = -1;
        }

        this.components.push({
            x, y,
            width: type.width,
            height: type.height,
            speed: type.speed,
            speedX: dx * type.speed,
            speedY: dy * (type.speed * 0.2),
            maxHP: type.maxHP,
            hp: type.maxHP,
            damage: type.damage,
            color: type.color,
            cost: type.cost,
            special: type.special,
            is_boss: type.is_boss,
            track_player: type.track_player
        });
    }

    update() {
        this.components.forEach(e => {
            if (e.track_player) {
                // Tracker enemies continuously calculate a direction toward the player.
                const dx = (playerObj.x + playerObj.width / 2) - (e.x + e.width / 2);
                const dy = (playerObj.y + playerObj.height / 2) - (e.y + e.height / 2);
                const angle = Math.atan2(dy, dx);

                moveEntityWithObstacles(
                    e,
                    Math.cos(angle) * e.speed,
                    Math.sin(angle) * e.speed
                );
            } else {
                // Normal enemies bounce off structure blocks and world boundaries.
                const collision = moveEntityWithObstacles(e, e.speedX, e.speedY);

                if (collision.blockedX) e.speedX *= -1;
                if (collision.blockedY) e.speedY *= -1;

                if (e.x <= 0 && e.speedX < 0) {
                    e.x = 0;
                    e.speedX = Math.abs(e.speedX);
                } else if (e.x + e.width >= gameArea.width && e.speedX > 0) {
                    e.x = gameArea.width - e.width;
                    e.speedX = -Math.abs(e.speedX);
                }

                if (e.y <= 0 && e.speedY < 0) {
                    e.y = 0;
                    e.speedY = Math.abs(e.speedY);
                } else if (e.y + e.height >= gameArea.height && e.speedY > 0) {
                    e.y = gameArea.height - e.height;
                    e.speedY = -Math.abs(e.speedY);
                }
            }
        });
    }

    draw() {
        const ctx = gameArea.context;

        this.components.forEach(e => {
            ctx.fillStyle = e.color;
            ctx.fillRect(e.x, e.y, e.width, e.height);

            // Only draw a health bar when the enemy has taken damage.
            if (e.hp < e.maxHP) {
                const barWidth = Math.max(64, e.width);
                const barHeight = Math.max(8, e.height / 10);
                const barX = e.x + e.width / 2 - barWidth / 2;
                const barY = e.y - barHeight - 5;

                ctx.fillStyle = "black";
                ctx.fillRect(barX, barY, barWidth, barHeight);

                const outlineWeight = 1;
                const fillerWidth = (e.hp / e.maxHP) * (barWidth - outlineWeight * 2);
                const fillerHeight = barHeight - outlineWeight * 2;

                ctx.fillStyle = "red";
                ctx.fillRect(
                    barX + outlineWeight,
                    barY + outlineWeight,
                    fillerWidth,
                    fillerHeight
                );
            }
        });
    }
}

/* ============================
        WAVE MANAGER CLASS
   ============================ */
class WaveManager {
    constructor() {
        this.currentWave = 0;
        this.spawnQueue = [];
        this.spawnInterval = 40;
        this.spawnTimer = 0;
        this.duration = 0;
        this.maxDuration = 3000;
        this.baseBudget = 30;

        // This pair is chosen once per normal wave and used for both spawns and warnings.
        this.waveSides = null;
    }

    update() {
        // Don't advance normal waves while a structure is active or counting down.
        if (structureManager.isActive || structureManager.spawnCountdown > 0) return;

        const activeEnemies = enemiesObj.components.filter(e => !e.is_boss).length;
        this.duration++;

        if (this.spawnQueue.length === 0) {
            if (activeEnemies === 0 || waveSnailDamage >= maxSnailDamage) {
                this.startNextWave();
            } else if (activeEnemies <= 2 && Math.floor(Math.random() * 100) === 1) {
                this.startNextWave();
            }
        }

        // Spawn the next queued enemy when its interval expires.
        if (this.spawnQueue.length > 0) {
            this.spawnTimer++;

            if (this.spawnTimer >= this.spawnInterval) {
                const next = this.spawnQueue.shift();
                enemiesObj.spawnEnemy(next.type, next.sides);
                this.spawnTimer = 0;
            }
        }
    }

    startNextWave() {
        this.currentWave++;
        waveSnailDamage = 0;

        let budget = this.baseBudget + this.currentWave * 20;
        this.duration = 0;

        const structureTrigger = structures.find(s => s.wave === this.currentWave);

        if (structureTrigger) {
            // Structure waves replace the normal wave and begin with a warning countdown.
            enemiesObj.components = [];
            this.spawnQueue = [];
            this.waveSides = null;

            structureManager.startStructureCountdown(structureTrigger);

            // Preserve the snail and health-bonus behavior of structure waves.
            enemiesObj.spawnEnemy(enemiesObj.types.snail, ["left", "right"]);

            if (playerObj) {
                playerObj.hp = Math.min(playerObj.maxHP, playerObj.hp + 50);
            }
        } else {
            // Select exactly two edges. The warning and all queued spawns share this pair.
            this.waveSides = this.pickTwoRandom(["left", "right", "top", "bottom"]);

            if (this.currentWave === 1) {
                enemiesObj.spawnEnemy(enemiesObj.types.snail, this.waveSides);
            }

            const enemyOptions = Object.values(enemiesObj.types).filter(t => t.cost < 500);

            while (budget >= 5) {
                const possible = enemyOptions.filter(t => t.cost <= budget);
                if (possible.length === 0) break;

                const choice = possible[Math.floor(Math.random() * possible.length)];
                this.spawnQueue.push({ type: choice, sides: this.waveSides });
                budget -= choice.cost;
            }

            this.spawnInterval = Math.max(10, 40 - this.currentWave * 2);
        }
    }

    // Draw a 20-world-pixel red gradient along each selected edge.
    // The border has the strongest opacity; the color fades to transparent inward.
    drawWaveWarning() {
        if (this.spawnQueue.length === 0 || !this.waveSides) return;

        const ctx = gameArea.context;
        const thickness = 40;
        const alpha = getWarningPulseAlpha(0.30);
        const redAtBorder = `rgba(255, 0, 0, ${alpha})`;
        const transparentRed = "rgba(255, 0, 0, 0)";

        ctx.save();

        for (const side of this.waveSides) {
            if (side === "left") {
                const gradient = ctx.createLinearGradient(0, 0, thickness, 0);
                gradient.addColorStop(0, redAtBorder);
                gradient.addColorStop(1, transparentRed);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, thickness, gameArea.height);
            } else if (side === "right") {
                const gradient = ctx.createLinearGradient(
                    gameArea.width, 0, gameArea.width - thickness, 0
                );
                gradient.addColorStop(0, redAtBorder);
                gradient.addColorStop(1, transparentRed);
                ctx.fillStyle = gradient;
                ctx.fillRect(gameArea.width - thickness, 0, thickness, gameArea.height);
            } else if (side === "top") {
                const gradient = ctx.createLinearGradient(0, 0, 0, thickness);
                gradient.addColorStop(0, redAtBorder);
                gradient.addColorStop(1, transparentRed);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, gameArea.width, thickness);
            } else if (side === "bottom") {
                const gradient = ctx.createLinearGradient(
                    0, gameArea.height, 0, gameArea.height - thickness
                );
                gradient.addColorStop(0, redAtBorder);
                gradient.addColorStop(1, transparentRed);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, gameArea.height - thickness, gameArea.width, thickness);
            }
        }

        ctx.restore();
    }

    // Randomly select two different entries from the supplied sides.
    pickTwoRandom(arr) {
        const copy = [...arr];
        let i = Math.floor(Math.random() * copy.length);
        [copy[0], copy[i]] = [copy[i], copy[0]];

        i = Math.floor(Math.random() * (copy.length - 1)) + 1;
        [copy[1], copy[i]] = [copy[i], copy[1]];

        return [copy[0], copy[1]];
    }
}

/* ============================
     STRUCTURE MANAGER CLASS
   ============================ */
class StructureManager {
    constructor() {
        this.isActive = false;
        this.currentBlocks = [];
        this.structureEnemyCount = 0;
        this.spawnCountdown = 0;
        this.pendingStructureDef = null;
        this.countdownJustStarted = false;
    }

    // Begin the warning period without creating the structure yet.
    startStructureCountdown(structureDef) {
        this.pendingStructureDef = structureDef;
        this.spawnCountdown = 125; // 125 ticks at 50 TPS equals 2.5 seconds.
        this.countdownJustStarted = true;
    }

    // Find the smallest rectangle that completely covers every structure block.
    getFootprint(structureDef) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const block of structureDef.blocks) {
            minX = Math.min(minX, block.x);
            minY = Math.min(minY, block.y);
            maxX = Math.max(maxX, block.x + block.width);
            maxY = Math.max(maxY, block.y + block.height);
        }

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    spawnStructure(structureDef) {
        this.isActive = true;
        this.currentBlocks = structureDef.blocks;

        // Move the player out of actual blocks if the player overlaps one.
        const entities = [];
        if (playerObj) entities.push(playerObj);

        for (const entity of entities) {
            const overlapsStructure = this.currentBlocks.some(
                block => isColliding(entity, block)
            );

            if (!overlapsStructure) continue;

            const originalX = entity.x;
            const originalY = entity.y;
            const maxX = gameArea.width - entity.width;
            const maxY = gameArea.height - entity.height;
            const maxRadius = Math.max(gameArea.width, gameArea.height);
            let freePosition = null;

            // Search outward in small increments for a position outside all blocks.
            for (let radius = 5; radius <= maxRadius && !freePosition; radius += 5) {
                const candidates = [];

                for (let offset = -radius; offset <= radius; offset += 5) {
                    candidates.push({ x: originalX + offset, y: originalY - radius });
                    candidates.push({ x: originalX + offset, y: originalY + radius });

                    if (offset !== -radius && offset !== radius) {
                        candidates.push({ x: originalX - radius, y: originalY + offset });
                        candidates.push({ x: originalX + radius, y: originalY + offset });
                    }
                }

                for (const candidate of candidates) {
                    if (candidate.x < 0 || candidate.y < 0 ||
                        candidate.x > maxX || candidate.y > maxY) {
                        continue;
                    }

                    const candidateBox = {
                        x: candidate.x,
                        y: candidate.y,
                        width: entity.width,
                        height: entity.height
                    };

                    const blocked = this.currentBlocks.some(
                        block => isColliding(candidateBox, block)
                    );

                    if (!blocked) {
                        freePosition = candidate;
                        break;
                    }
                }
            }

            if (freePosition) {
                entity.x = freePosition.x;
                entity.y = freePosition.y;
            }
        }

        this.spawnStructureEnemies(structureDef);
    }

    // Spawn the enemies assigned to this structure.
    spawnStructureEnemies(structureDef) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        structureDef.blocks.forEach(block => {
            minX = Math.min(minX, block.x);
            minY = Math.min(minY, block.y);
            maxX = Math.max(maxX, block.x + block.width);
            maxY = Math.max(maxY, block.y + block.height);
        });

        this.structureEnemyCount = 0;

        structureDef.enemies.forEach(enemyDef => {
            for (let i = 0; i < enemyDef.amount; i++) {
                const type = enemiesObj.types[enemyDef.type];

                let validPosition = false;
                let x, y;
                let attempts = 0;
                const maxAttempts = 20;

                // Try random positions inside the footprint that do not overlap blocks.
                while (!validPosition && attempts < maxAttempts) {
                    x = minX + Math.random() * (maxX - minX - type.width);
                    y = minY + Math.random() * (maxY - minY - type.height);

                    const testBox = {
                        x, y,
                        width: type.width,
                        height: type.height
                    };

                    const overlapsBlock = structureDef.blocks.some(
                        block => isColliding(testBox, block)
                    );

                    if (!overlapsBlock) validPosition = true;
                    attempts++;
                }

                if (validPosition) {
                    x = Math.max(0, Math.min(x, gameArea.width - type.width));
                    y = Math.max(0, Math.min(y, gameArea.height - type.height));

                    const randomSpeed = type.speed * (0.5 + Math.random() * 0.5);
                    const randomAngle = Math.random() * Math.PI * 2;

                    enemiesObj.components.push({
                        x, y,
                        width: type.width,
                        height: type.height,
                        speed: type.speed,
                        speedX: Math.cos(randomAngle) * randomSpeed,
                        speedY: Math.sin(randomAngle) * randomSpeed,
                        maxHP: type.maxHP,
                        hp: type.maxHP,
                        damage: type.damage,
                        color: type.color,
                        cost: type.cost,
                        special: type.special,
                        track_player: type.track_player
                    });

                    this.structureEnemyCount++;
                }
            }
        });
    }

    update() {
        // Countdown phase: show the complete 125-tick warning before spawning.
        if (this.spawnCountdown > 0 && this.pendingStructureDef) {
            if (this.countdownJustStarted) {
                // Do not decrement on the tick the countdown was created.
                this.countdownJustStarted = false;
            } else {
                this.spawnCountdown--;
            }

            if (this.spawnCountdown === 0) {
                const structureDef = this.pendingStructureDef;
                const footprint = this.getFootprint(structureDef);

                // The entire footprint is dangerous, including gaps between its blocks.
                // Kill the player before generating the structure if their rectangles overlap.
                if (playerObj && isColliding(playerObj, footprint)) {
                    playerObj.hp = 0;
                }

                this.pendingStructureDef = null;
                this.spawnStructure(structureDef);
                return;
            }
        }

        if (!this.isActive) return;

        const aliveStructureEnemies = enemiesObj.components.filter(e => !e.is_boss).length;

        if (aliveStructureEnemies === 0 || waveSnailDamage >= maxSnailDamage) {
            this.isActive = false;
            this.currentBlocks = [];

            // Preserve snails, clear regular enemies, and begin the next wave.
            enemiesObj.components = enemiesObj.components.filter(e => e.is_boss);
            waveManager.spawnQueue = [];
            waveManager.startNextWave();
        }
    }

    draw() {
        const ctx = gameArea.context;

        // Before spawning, flash a solid red rectangle over the full structure footprint.
        if (this.spawnCountdown > 0 && this.pendingStructureDef) {
            const footprint = this.getFootprint(this.pendingStructureDef);

            ctx.save();
            ctx.globalAlpha = getWarningPulseAlpha(0.50);
            ctx.fillStyle = "#ff0000";
            ctx.fillRect(
                footprint.x,
                footprint.y,
                footprint.width,
                footprint.height
            );
            ctx.restore();
        }

        // Draw the actual structure blocks after the warning has ended.
        if (!this.isActive) return;

        this.currentBlocks.forEach(block => {
            ctx.fillStyle = "gray";
            ctx.fillRect(block.x, block.y, block.width, block.height);
        });
    }
}

/* ============================
          BULLETS CLASS
   ============================ */
class Bullets {
    constructor() {
        this.types = {
            default: { width: 30, height: 8, speed: 20, damage: 7, color: "#1a1a1a" }
        };
        this.components = [];
    }

    spawnBullet(posX, posY, vectorX, vectorY) {
        const type = this.types.default;

        this.components.push({
            x: posX,
            y: posY,
            width: type.width,
            height: type.height,
            speedX: type.speed * vectorX,
            speedY: type.speed * vectorY,
            angle: Math.atan2(vectorY, vectorX),
            damage: type.damage,
            color: type.color
        });
    }

    update() {
        for (let i = this.components.length - 1; i >= 0; i--) {
            const b = this.components[i];
            b.x += b.speedX;
            b.y += b.speedY;

            // Approximate the rotated bullet's hitbox for obstacle collisions.
            const horizontal = b.speedX !== 0;
            const bulletBox = {
                x: b.x - (horizontal ? b.width : b.height) / 2,
                y: b.y - (horizontal ? b.height : b.width) / 2,
                width: horizontal ? b.width : b.height,
                height: horizontal ? b.height : b.width
            };

            let hitObstacle = false;

            for (const block of structureManager.currentBlocks) {
                if (isColliding(bulletBox, block)) {
                    this.components.splice(i, 1);
                    hitObstacle = true;
                    break;
                }
            }

            if (hitObstacle) continue;

            if (b.x < -50 || b.x > gameArea.width + 50 ||
                b.y < -50 || b.y > gameArea.height + 50) {
                this.components.splice(i, 1);
            }
        }
    }

    draw() {
        const ctx = gameArea.context;

        this.components.forEach(b => {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.angle);
            ctx.fillStyle = b.color;
            ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
            ctx.restore();
        });
    }
}

/* ============================
        GLOBAL VARIABLES
   ============================ */
let playerObj;
let enemiesObj = new Enemies();
let bulletsObj = new Bullets();
let waveManager = new WaveManager();
let structureManager = new StructureManager();
let keys = {
    w: false, a: false, s: false, d: false,
    ArrowLeft: false, ArrowUp: false, ArrowRight: false, ArrowDown: false
};
let gameDuration = 0;
let gameStarted = false;
let isPaused = true;
let gameOver = false;
let waveSnailDamage = 0;
const maxSnailDamage = 75;

// Calculate the warning opacity from the current tick count.
// One complete flash cycle takes 25 ticks (0.5 seconds at 50 ticks per second).
// The minimum is supplied by each warning type; the maximum is always 0.85.
function getWarningPulseAlpha(minAlpha) {
    const maxAlpha = 0.75;
    const cyclePosition = (gameDuration % 25) / 25;
    const pulse = (Math.cos(cyclePosition * Math.PI * 2) + 1) / 2;
    return minAlpha + (maxAlpha - minAlpha) * pulse;
}

/* ============================
          TRANSITIONS
   ============================ */
function init() {
    gameArea.setup();
}

function startGame() {
    if (!gameStarted || gameOver) {
        gameOver = false;
        gameStarted = true;
        isPaused = false;

        enemiesObj = new Enemies();
        bulletsObj = new Bullets();
        waveManager = new WaveManager();
        structureManager = new StructureManager();
        waveSnailDamage = 0;
        gameDuration = 0;

        playerObj = new Player(
            gameArea.width / 2,
            gameArea.height / 2
        );
    } else {
        isPaused = false;
    }

    document.getElementById("main-menu-overlay").classList.add("hidden");
    document.getElementById("pause-menu-overlay").classList.add("hidden");
    document.getElementById("game-over-menu-overlay").classList.add("hidden");
}

function resumeGame() {
    isPaused = false;
    document.getElementById("pause-menu-overlay").classList.add("hidden");
}

function quitToMenu() {
    isPaused = true;
    document.getElementById("main-menu-overlay").classList.remove("hidden");
    document.getElementById("main-menu-content").classList.remove("hidden");
    document.getElementById("pause-menu-overlay").classList.add("hidden");
    document.getElementById("game-over-menu-overlay").classList.add("hidden");
}

function togglePause() {
    if (!gameStarted || gameOver) return;

    isPaused = !isPaused;

    if (isPaused) {
        document.getElementById("pause-menu-overlay").classList.remove("hidden");
    } else {
        document.getElementById("pause-menu-overlay").classList.add("hidden");
    }
}

function handleGameOver() {
    gameOver = true;
    isPaused = true;

    document.getElementById("game-over-menu-overlay").classList.remove("hidden");
    document.getElementById("total-score").innerText = gameDuration;
    document.getElementById("waves-survived").innerText = waveManager.currentWave;
}

/* ============================
          GAME AREA ENGINE
   ============================ */
const WORLD_WIDTH = 1920;
const WORLD_HEIGHT = 1080;

const gameArea = {
    canvas: document.getElementById("gameCanvas"),
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    scale: 1,
    offsetX: 0,
    offsetY: 0,

    setup: function() {
        this.context = this.canvas.getContext("2d");
        this.resize();
        lastTimestamp = performance.now();
        requestAnimationFrame(engineLoop);
    },

    // Fit the fixed game world into the display while preserving its aspect ratio.
    resize: function() {
        const dpr = window.devicePixelRatio || 1;
        const cssW = window.innerWidth;
        const cssH = window.innerHeight;

        this.canvas.style.width = cssW + "px";
        this.canvas.style.height = cssH + "px";
        this.canvas.width = Math.round(cssW * dpr);
        this.canvas.height = Math.round(cssH * dpr);

        this.scale = Math.min(
            this.canvas.width / this.width,
            this.canvas.height / this.height
        );

        this.offsetX = (this.canvas.width - this.width * this.scale) / 2;
        this.offsetY = (this.canvas.height - this.height * this.scale) / 2;
    },

    clear: function() {
        if (this.context) {
            this.context.setTransform(1, 0, 0, 1, 0, 0);
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    // Switch the canvas to world coordinates so all game dimensions scale together.
    beginWorld: function() {
        const ctx = this.context;
        ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
        ctx.beginPath();
        ctx.rect(0, 0, this.width, this.height);
        ctx.clip();
    }
};

/* ============================
       PLAYER MOVEMENT LOGIC
   ============================ */
function movePlayer() {
    playerObj.speedX = 0;
    playerObj.speedY = 0;

    if (keys.w && !keys.s) playerObj.speedY = -playerObj.speed;
    if (keys.s && !keys.w) playerObj.speedY = playerObj.speed;
    if (keys.a && !keys.d) playerObj.speedX = -playerObj.speed;
    if (keys.d && !keys.a) playerObj.speedX = playerObj.speed;
}

function calculateShots() {
    if (keys.ArrowRight) playerObj.shootRight();
    if (keys.ArrowLeft) playerObj.shootLeft();
    if (keys.ArrowUp) playerObj.shootUp();
    if (keys.ArrowDown) playerObj.shootDown();
}

// Axis-aligned bounding-box collision detection.
// It returns true if the two rectangles overlap.
function isColliding(a, b) {
    if (!a || !b) return false;

    return !(
        a.x + a.width <= b.x ||
        a.x >= b.x + b.width ||
        a.y + a.height <= b.y ||
        a.y >= b.y + b.height
    );
}

// Move an entity separately on each axis so collisions can be resolved per axis.
function moveEntityWithObstacles(entity, dx, dy) {
    let blockedX = false;
    let blockedY = false;

    entity.x += dx;

    for (const block of structureManager.currentBlocks) {
        if (isColliding(entity, block)) {
            if (dx > 0) {
                entity.x = block.x - entity.width;
            } else if (dx < 0) {
                entity.x = block.x + block.width;
            }

            blockedX = true;
            break;
        }
    }

    entity.y += dy;

    for (const block of structureManager.currentBlocks) {
        if (isColliding(entity, block)) {
            if (dy > 0) {
                entity.y = block.y - entity.height;
            } else if (dy < 0) {
                entity.y = block.y + block.height;
            }

            blockedY = true;
            break;
        }
    }

    return { blockedX, blockedY };
}

/* ===============================
        PROCESS ALL COLLISIONS
   =============================== */
function checkCollisions() {
    for (let i = enemiesObj.components.length - 1; i >= 0; i--) {
        const enemy = enemiesObj.components[i];

        // Handle contact between the player and an enemy.
        if (isColliding(playerObj, enemy)) {
            if (enemy.special === "one_hp" && playerObj.hp !== 1) {
                playerObj.hp = 1;
                playerObj.damageTickCounter = 0;
            } else {
                playerObj.takeDamage(enemy.damage);
            }
        }

        // Handle bullet damage to enemies.
        for (let j = bulletsObj.components.length - 1; j >= 0; j--) {
            const bullet = bulletsObj.components[j];
            const bBox = {
                x: bullet.x - 5,
                y: bullet.y - 5,
                width: 10,
                height: 10
            };

            if (isColliding(bBox, enemy)) {
                enemy.hp -= bullet.damage;
                bulletsObj.components.splice(j, 1);

                if (enemy.special === "one_hp") {
                    waveSnailDamage += bullet.damage;
                }

                if (enemy.hp <= 0) {
                    enemiesObj.components.splice(i, 1);
                }

                break;
            }
        }
    }
}

/* ============================
              UPDATE
   ============================ */
function update() {
    if (!gameStarted || isPaused || gameOver) return true;

    movePlayer();

    playerObj.update();
    enemiesObj.update();
    bulletsObj.update();

    waveManager.update();
    structureManager.update();

    calculateShots();
    checkCollisions();

    if (playerObj.hp <= 0) {
        handleGameOver();
        return false;
    }

    gameDuration++;
    return true;
}

/* ============================
          RENDER VISUALS
   ============================ */
function renderGame() {
    // Clear the full canvas, including any black letterbox bars.
    if (gameArea.context) {
        gameArea.context.setTransform(1, 0, 0, 1, 0, 0);
        gameArea.context.fillStyle = "black";
        gameArea.context.fillRect(
            0, 0,
            gameArea.canvas.width,
            gameArea.canvas.height
        );
    }

    if (gameStarted && playerObj && gameArea.context) {
        const ctx = gameArea.context;
        ctx.save();
        gameArea.beginWorld();

        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(0, 0, gameArea.width, gameArea.height);

        // Draw game objects in world space.
        playerObj.draw();
        enemiesObj.draw();
        bulletsObj.draw();

        // Draw the structure warning or active structure, then the wave-edge warning.
        structureManager.draw();
        waveManager.drawWaveWarning();

        ctx.restore();

        // Draw the wave counter in screen space so it stays readable.
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "black";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Wave: " + waveManager.currentWave, 20, 45);
        ctx.restore();
    }
}

/* ============================
              ENGINE LOOP
   ============================ */
function engineLoop(currentTime) {
    const deltaTime = currentTime - lastTimestamp;
    lastTimestamp = currentTime;
    frameAccumulator += deltaTime;

    while (frameAccumulator >= tickLength) {
        update();
        frameAccumulator -= tickLength;
    }

    renderGame();
    requestAnimationFrame(engineLoop);
}

/* ============================
        KEYBOARD LISTENERS
   ============================ */
document.addEventListener("keydown", e => {
    const key = e.key.startsWith("Arrow")
        ? e.key
        : e.key.toLowerCase();

    if (keys.hasOwnProperty(key)) keys[key] = true;

    if (e.key === "Escape" || key === "p") togglePause();
});

document.addEventListener("keyup", e => {
    const key = e.key.startsWith("Arrow")
        ? e.key
        : e.key.toLowerCase();

    if (keys.hasOwnProperty(key)) keys[key] = false;
});

window.addEventListener("resize", () => {
    gameArea.resize();
});
