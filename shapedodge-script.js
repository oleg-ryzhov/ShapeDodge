// ========= STRUCTURES =========
// Each structure appears after the wave number listed in "wave".
// blocks  = solid rectangles (x, y, width, height) in world coordinates
// enemies = what spawns inside the structure's footprint (type must exist in Enemies.types)
const structures = [
    {
        wave: 5,
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
        wave: 10,
        blocks: [
            { width: 580, height: 20, x: 1220, y: 35 },
            { width: 20, height: 105, x: 1220, y: 55 },
            { width: 20, height: 220, x: 1220, y: 260 },
            { width: 20, height: 100, x: 1340, y: 260 },
            { width: 20, height: 220, x: 1460, y: 260 },
            { width: 20, height: 220, x: 1580, y: 260 },
            { width: 320, height: 20, x: 1600, y: 460 },
            { width: 100, height: 20, x: 1240, y: 260 },
            { width: 120, height: 20, x: 1340, y: 460 },
            { width: 20, height: 200, x: 1760, y: 140 },
            { width: 430, height: 20, x: 1330, y: 140 },
            { width: 140, height: 20, x: 1780, y: 320 },
        ],
        enemies: [
            { type: "gary", amount: 3 },
            { type: "fast", amount: 5 },
            { type: "tiny", amount: 5 },
        ]
    },
    {
        wave: 20,
        blocks: [
            { width: 40, height: 240, x: 1400, y: 500 },
            { width: 920, height: 40, x: 520, y: 460 },
            { width: 40, height: 240, x: 1400, y: 840 },
            { width: 40, height: 240, x: 520, y: 500 },
            { width: 40, height: 240, x: 520, y: 840 },
            { width: 320, height: 60, x: 820, y: 760 },
            { width: 60, height: 60, x: 590, y: 530 },
            { width: 60, height: 60, x: 1310, y: 530 },
            { width: 60, height: 60, x: 1310, y: 990 },
            { width: 60, height: 60, x: 590, y: 990 },
            { width: 60, height: 90, x: 950, y: 500 },
            { width: 60, height: 90, x: 950, y: 990 },
        ],
        enemies: [
            { type: "gary", amount: 4 },
            { type: "tank", amount: 2 },
            { type: "temu_snail", amount: 3 },
            { type: "fast", amount: 6 },
            { type: "tiny", amount: 6 },
        ]
    },
];

// ========= TICK ENGINE VARS =========
const tickLength = 20;        // 50 ticks per second
let frameAccumulator = 0;     // Store leftover time after every tick
let lastTimestamp = 0;        // Store time of previous frame

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
        this.damageCooldown = 50;   // ticks of invulnerability after taking a hit
        this.lastShotTime = 0;
        this.shotCooldown = 20;     // ticks between shots
        this.damageTickCounter = -100; // starts negative so the player is safe for the first 2 seconds
        this.shotTickCounter = 20;     // starts at the cooldown so the first shot is instant
    }

    // ========= UPDATE PLAYER =========
    update() {
        // Move first, then clamp (blocks are handled inside moveEntityWithObstacles)
        moveEntityWithObstacles(this, this.speedX, this.speedY);

        // Keep the player inside the fixed game world.
        this.x = Math.max(0, Math.min(this.x, gameArea.width - this.width));
        this.y = Math.max(0, Math.min(this.y, gameArea.height - this.height));

        // Cooldown timers count up every tick
        this.damageTickCounter++;
        this.shotTickCounter++;
    }

    // ========= RENDER VISUALS =========
    draw() {
        const ctx = gameArea.context;

        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // ------ Health bar (centered at the bottom of the world) ------
        const barWidth = 600;
        const barHeight = 30;
        const barX = (gameArea.width - barWidth) / 2;
        const barY = gameArea.height - barHeight - 10;

        // Black background
        ctx.fillStyle = "black";
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Red fill, scaled by the fraction of HP remaining
        ctx.fillStyle = "red";
        ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHP), barHeight);

        // HP text
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            Math.ceil(this.hp) + " / " + this.maxHP,
            barX + barWidth / 2,
            barY + barHeight - 5
        );
    }

    // ========= DAMAGE LOGIC =========
    takeDamage(amount) {
        // Damage only applies once the invulnerability window has passed
        if (this.damageTickCounter >= this.damageCooldown) {
            this.hp = Math.max(0, this.hp - amount);
            this.damageTickCounter = 0;
        }
    }

    // ========= SHOOTING LOGIC =========
    // Each shooting method creates a bullet if the cooldown has elapsed.
    // The last two numbers are the bullet's direction vector (x, y).
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
        // ------ Enemy types ------
        // cost         = how much of a wave's budget this enemy uses
        // is_boss      = bosses survive structure transitions and don't count as "active enemies"
        // special      = "one_hp" makes the player drop to 1 HP on touch instead of taking damage
        // track_player = true makes the enemy home in on the player instead of bouncing around
        this.types = {
            gary:  { width:80,  height:80,  speed:5,   maxHP:25,   hp:25,   damage:35, color:"blue",   cost:15,  is_boss:false, special:null,     track_player:false },
            fast:  { width:50,  height:50,  speed:8,   maxHP:10,   hp:10,   damage:15, color:"yellow", cost:10,  is_boss:false, special:null,     track_player:false },
            tank:  { width:150, height:150, speed:3,   maxHP:100,  hp:100,  damage:60, color:"purple", cost:50,  is_boss:false, special:null,     track_player:false },
            tiny:  { width:25,  height:25,  speed:4,   maxHP:5,    hp:5,    damage:10, color:"lime",   cost:5,   is_boss:false, special:null,     track_player:false },
            snail: { width:15,  height:15,  speed:1.5, maxHP:1000, hp:1000, damage:1,  color:"black",  cost:500, is_boss:true,  special:"one_hp", track_player:true  },
            temu_snail: { width:15,  height:15,  speed:1.5, maxHP:200, hp:200, damage:1,  color:"black",  cost:200, is_boss:false,  special:"one_hp", track_player:true }
        };
        this.components = []; // every enemy currently alive
    }

    // ========= SPAWN ENEMY =========
    // Spawn an enemy from a randomly selected side in the supplied array.
    spawnEnemy(type, sides) {
        const side = sides[Math.floor(Math.random() * sides.length)];

        let x, y, dx, dy;
        const centerX = gameArea.width / 2;
        const centerY = gameArea.height / 2;

        // Enemies start just outside the chosen wall and head inward.
        // dx / dy are direction multipliers (-1 to 1), scaled by speed below.
        if (side === "left") {
            x = -type.width;                                         // fully outside the left wall
            y = Math.random() * (gameArea.height - type.height);     // random height along the wall
            dx = 1;                                                  // move right
            dy = (centerY - y) / (gameArea.height / 2);              // drift vertically toward the center line
        } else if (side === "right") {
            x = gameArea.width;
            y = Math.random() * (gameArea.height - type.height);
            dx = -1;
            dy = (centerY - y) / (gameArea.height / 2);
        } else if (side === "top") {
            x = Math.random() * (gameArea.width - type.width);       // random position along the top
            y = -type.height;
            dx = (centerX - x) / (gameArea.width / 2);               // drift horizontally toward the center line
            dy = 1;                                                  // move down
        } else if (side === "bottom") {
            x = Math.random() * (gameArea.width - type.width);
            y = gameArea.height;
            dx = (centerX - x) / (gameArea.height / 2);
            dy = -1;
        }

        // The sideways drift is only 20% of the main speed so enemies mostly travel straight across
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

    // ========= UPDATE ENEMIES =========
    update() {
        this.components.forEach(e => {
            // ------ TRACKER ENEMIES ------
            if (e.track_player) {
                // Tracker enemies continuously calculate a direction toward the player.
                // Distance is measured center to center
                const dx = (playerObj.x + playerObj.width / 2) - (e.x + e.width / 2);
                const dy = (playerObj.y + playerObj.height / 2) - (e.y + e.height / 2);
                const angle = Math.atan2(dy, dx);

                // cos/sin split the speed between x and y so diagonal movement isn't faster
                moveEntityWithObstacles(
                    e,
                    Math.cos(angle) * e.speed,
                    Math.sin(angle) * e.speed
                );
            // ------ NORMAL ENEMIES ------
            } else {
                // Normal enemies bounce off structure blocks and world boundaries.
                const collision = moveEntityWithObstacles(e, e.speedX, e.speedY);

                // ==== Bounce off obstacles ====
                // Flip the speed on whichever axis was blocked
                if (collision.blockedX) e.speedX *= -1;
                if (collision.blockedY) e.speedY *= -1;

                // ==== Bounce off the world boundaries ====
                // Snap back inside the world and force the speed to point away from the wall
                // (Math.abs prevents the enemy from getting stuck flipping back and forth)
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

    // ========= RENDER VISUALS =========
    draw() {
        const ctx = gameArea.context;

        this.components.forEach(e => {
            ctx.fillStyle = e.color;
            ctx.fillRect(e.x, e.y, e.width, e.height);

            // Only draw a health bar when the enemy has taken damage.
            if (e.hp < e.maxHP) {
                // Bar is at least 64 wide / 8 tall, centered above the enemy
                const barWidth = Math.max(64, e.width);
                const barHeight = Math.max(8, e.height / 10);
                const barX = e.x + e.width / 2 - barWidth / 2;
                const barY = e.y - barHeight - 5;

                // Black outline
                ctx.fillStyle = "black";
                ctx.fillRect(barX, barY, barWidth, barHeight);

                // Red filler, inset by the outline weight on every side
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
        this.spawnQueue = [];        // enemies waiting to be spawned, one at a time
        this.spawnInterval = 40;     // ticks between queued spawns
        this.spawnTimer = 0;
        this.duration = 0;
        this.maxDuration = 3000;     // currently unused
        this.baseBudget = 30;        // wave budget = baseBudget + wave * 20

        // This pair is chosen once per normal wave and used for both spawns and warnings.
        this.waveSides = null;
    }

    // ========= UPDATE WAVES =========
    update() {
        // Don't advance normal waves while a structure is active or counting down.
        if (structureManager.isActive || structureManager.spawnCountdown > 0) return;

        // Bosses are ignored here so a living snail never blocks the next wave
        const activeEnemies = enemiesObj.components.filter(e => !e.is_boss).length;
        this.duration++;

        // ------ Wave end check ------
        // Only checked once the whole queue has been spawned
        if (this.spawnQueue.length === 0) {
            // Next wave starts if everything is dead or the boss took enough damage
            if (activeEnemies === 0 || waveBossDmg >= maxSnailDamage) {
                this.startNextWave();
            // With 2 or fewer enemies left there is a 1% chance each tick (about every 2 seconds)
            // to start the next wave anyway, so stragglers don't stall the game
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

    // ========= SPAWN WAVES =========
    startNextWave() {
        this.currentWave++;
        waveBossDmg = 0; // boss damage is tracked per wave
        // Budget grows by 20 every wave
        let budget = this.baseBudget + this.currentWave * 20;
        this.duration = 0;

        // Check whether a structure is scheduled for this wave number
        const structureTrigger = structures.find(s => s.wave === this.currentWave);

        if (structureTrigger) {
            // ------ STRUCTURE WAVE ------
            // Structure waves remove normal enemies but preserve every existing boss.
            enemiesObj.components = enemiesObj.components.filter(e => e.is_boss);
            this.spawnQueue = [];
            this.waveSides = null; // hides the wall warning

            // Starts the red warning box; the structure itself spawns when the countdown ends
            structureManager.startStructureCountdown(structureTrigger);

            // Only spawn a new snail if no boss is already present.
            if (!enemiesObj.components.some(e => e.is_boss)) {
                enemiesObj.spawnEnemy(enemiesObj.types.snail, ["left", "right"]);
            }

            // Small heal as a reward for reaching a structure
            if (playerObj) {
                playerObj.hp = Math.min(playerObj.maxHP, playerObj.hp + 50);
            }
        } else {
            // ------ NORMAL WAVE ------
            // Select exactly two edges. The warning and all queued spawns share this pair.
            this.waveSides = this.pickTwoRandom(["left", "right", "top", "bottom"]);

            // Spawn the snail on wave 1
            if (this.currentWave === 1) {
                enemiesObj.spawnEnemy(enemiesObj.types.snail, this.waveSides);
            }

            // ------ Budget system ------
            // Keep buying random enemy types the remaining budget can afford,
            // until less than 5 is left (the cheapest enemy costs 5)
            const enemyOptions = Object.values(enemiesObj.types).filter(t => t.cost < 500);

            while (budget >= 5) {
                const possible = enemyOptions.filter(t => t.cost <= budget);
                if (possible.length === 0) break;

                const choice = possible[Math.floor(Math.random() * possible.length)];
                this.spawnQueue.push({ type: choice, sides: this.waveSides });
                budget -= choice.cost;
            }

            // Spawns get faster each wave, but never faster than every 10 ticks
            this.spawnInterval = Math.max(10, 40 - this.currentWave * 2);
        }
    }

    // ========= DRAW WAVE WARNING =========
    // Draw a 20-world-pixel red gradient along each selected edge.
    // The border has the strongest opacity; the color fades to transparent inward.
    drawWaveWarning() {
        // Nothing to warn about without a pending spawn queue or chosen sides
        if (this.spawnQueue.length === 0 || !this.waveSides) return;

        const ctx = gameArea.context;
        const thickness = 30;
        const alpha = getWarningPulseAlpha(0);
        // Two color stops: opaque red at the wall, fully transparent red at the inner edge
        const redAtBorder = `rgba(255, 0, 0, ${alpha})`;
        const transparentRed = "rgba(255, 0, 0, 0)";

        ctx.save();

        // A linear gradient goes from its first point (start) to its second point (end).
        // The start is always at the wall, so the red is strongest there.
        for (const side of this.waveSides) {
            if (side === "left") {
                const gradient = ctx.createLinearGradient(0, 0, thickness, 0);
                gradient.addColorStop(0, redAtBorder);
                gradient.addColorStop(1, transparentRed);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, thickness, gameArea.height);
            } else if (side === "right") {
                // Gradient points leftward, away from the right wall
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
                // Gradient points upward, away from the bottom wall
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

    // ------ Pick 2 random sides ------
    // Randomly select two different entries from the supplied sides.
    // Partial Fisher-Yates shuffle: swap a random element into slot 0,
    // then swap a random element from the remaining ones into slot 1.
    pickTwoRandom(arr) {
        const copy = [...arr]; // copy so the original array isn't reordered
        let i = Math.floor(Math.random() * copy.length);
        [copy[0], copy[i]] = [copy[i], copy[0]];

        // Slot 1 is picked from index 1 onward so it can never repeat slot 0
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
        this.isActive = false;            // true while the structure's blocks exist
        this.currentBlocks = [];          // blocks currently on the arena
        this.structureEnemyCount = 0;
        this.spawnCountdown = 0;          // ticks left until the structure spawns
        this.pendingStructureDef = null;  // structure waiting to spawn during the countdown
        this.countdownJustStarted = false;
    }

    // ========= START COUNTDOWN =========
    // Begin the warning period without creating the structure yet.
    startStructureCountdown(structureDef) {
        this.pendingStructureDef = structureDef;
        this.spawnCountdown = 125; // 125 ticks at 50 TPS equals 2.5 seconds.
        // startNextWave() runs before this class's update() in the same tick,
        // so this flag stops the first tick from being counted twice
        this.countdownJustStarted = true;
    }

    // ========= GET FOOTPRINT =========
    // Find the smallest rectangle that completely covers every structure block.
    // Tracks the lowest / highest x and y reached by any block edge.
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

    // ========= SPAWN STRUCTURE =========
    spawnStructure(structureDef) {
        this.isActive = true;
        this.currentBlocks = structureDef.blocks;

        // ------ Move the player out of blocks ------
        // Move the player out of actual blocks if the player overlaps one.
        const entities = [];
        if (playerObj) entities.push(playerObj);

        for (const entity of entities) {
            const overlapsStructure = this.currentBlocks.some(
                block => isColliding(entity, block)
            );

            // Entity is already in free space, nothing to do
            if (!overlapsStructure) continue;

            const originalX = entity.x;
            const originalY = entity.y;
            const maxX = gameArea.width - entity.width;
            const maxY = gameArea.height - entity.height;
            const maxRadius = Math.max(gameArea.width, gameArea.height);
            let freePosition = null;

            // Search outward in small increments for a position outside all blocks.
            // Each radius is a square "ring" of candidate positions around the original spot,
            // so the first free position found is also (roughly) the closest one.
            for (let radius = 5; radius <= maxRadius && !freePosition; radius += 5) {
                const candidates = [];

                // Top and bottom edges of the ring (full width)
                // Left and right edges skip the corners, which are already covered above
                for (let offset = -radius; offset <= radius; offset += 5) {
                    candidates.push({ x: originalX + offset, y: originalY - radius });
                    candidates.push({ x: originalX + offset, y: originalY + radius });

                    if (offset !== -radius && offset !== radius) {
                        candidates.push({ x: originalX - radius, y: originalY + offset });
                        candidates.push({ x: originalX + radius, y: originalY + offset });
                    }
                }
                // Test each candidate: it must be inside the world and touch no block
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
            // Move the entity to the free position if one was found
            if (freePosition) {
                entity.x = freePosition.x;
                entity.y = freePosition.y;
            }
        }

        this.spawnStructureEnemies(structureDef);
    }

    // ========= SPAWN STRUCTURE ENEMIES =========
    // Spawn the enemies assigned to this structure.
    spawnStructureEnemies(structureDef) {
        // ------ Spawn area ------
        // Same bounding-box calculation as getFootprint()
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
                const maxAttempts = 20; // gives up on this enemy instead of looping forever

                // Try random positions inside the footprint that do not overlap blocks.
                // Subtracting the enemy size keeps its full body inside the footprint.
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

                // If all attempts failed, this enemy is simply skipped
                if (validPosition) {
                    // Safety clamp in case the footprint reaches outside the world
                    x = Math.max(0, Math.min(x, gameArea.width - type.width));
                    y = Math.max(0, Math.min(y, gameArea.height - type.height));

                    // Random direction (angle) and 50%-100% of the normal speed
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
                        is_boss: type.is_boss,
                        track_player: type.track_player
                    });

                    this.structureEnemyCount++;
                }
            }
        });
    }

    // ========= UPDATE STRUCTURE =========
    update() {
        // ------ COUNTDOWN PHASE ------
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
                // (This check runs before spawnStructure(), so the player isn't pushed out first.)
                if (playerObj && isColliding(playerObj, footprint)) {
                    playerObj.hp = 0;
                }

                this.pendingStructureDef = null;
                this.spawnStructure(structureDef);
                return;
            }
        }

        // ------ ACTIVE STRUCTURE PHASE ------
        if (!this.isActive) return;

        // Bosses don't count, so the structure can clear while a snail is still alive
        const aliveStructureEnemies = enemiesObj.components.filter(e => !e.is_boss).length;

        // Structure clears when all its enemies are dead or the boss took enough damage
        if (aliveStructureEnemies === 0 || waveBossDmg >= maxSnailDamage) {
            this.isActive = false;
            this.currentBlocks = [];

            // Preserve snails, clear regular enemies, and begin the next wave.
            enemiesObj.components = enemiesObj.components.filter(e => e.is_boss);
            waveManager.spawnQueue = [];
            waveManager.startNextWave();
        }
    }

    // ========= RENDER VISUALS =========
    draw() {
        const ctx = gameArea.context;

        // ------ Countdown warning ------
        // Before spawning, flash a solid red rectangle over the full structure footprint.
        if (this.spawnCountdown > 0 && this.pendingStructureDef) {
            const footprint = this.getFootprint(this.pendingStructureDef);

            // save/restore keeps globalAlpha from affecting later drawing
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

        // ------ Active structure ------
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

    // ========= SPAWN BULLET =========
    // vectorX / vectorY is the direction (-1, 0 or 1 on each axis)
    spawnBullet(posX, posY, vectorX, vectorY) {
        const type = this.types.default;

        this.components.push({
            x: posX,
            y: posY,
            width: type.width,
            height: type.height,
            speedX: type.speed * vectorX,
            speedY: type.speed * vectorY,
            angle: Math.atan2(vectorY, vectorX), // used to rotate the sprite when drawing
            damage: type.damage,
            color: type.color
        });
    }

    // ========= UPDATE BULLETS =========
    // Loops backwards so removing a bullet doesn't skip the next one
    update() {
        for (let i = this.components.length - 1; i >= 0; i--) {
            const b = this.components[i];
            b.x += b.speedX;
            b.y += b.speedY;

            // Approximate the rotated bullet's hitbox for obstacle collisions.
            // Bullets only travel along one axis, so a vertical bullet just swaps width and height.
            // x / y is the bullet's center, so the box is shifted back by half its size.
            const horizontal = b.speedX !== 0;
            const bulletBox = {
                x: b.x - (horizontal ? b.width : b.height) / 2,
                y: b.y - (horizontal ? b.height : b.width) / 2,
                width: horizontal ? b.width : b.height,
                height: horizontal ? b.height : b.width
            };

            // ------ Structure collision ------
            let hitObstacle = false;

            for (const block of structureManager.currentBlocks) {
                if (isColliding(bulletBox, block)) {
                    this.components.splice(i, 1);
                    hitObstacle = true;
                    break;
                }
            }

            // Bullet is already removed, skip the bounds check
            if (hitObstacle) continue;

            // ------ Out of bounds ------
            // 50px margin so bullets aren't removed while still partly visible
            if (b.x < -50 || b.x > gameArea.width + 50 ||
                b.y < -50 || b.y > gameArea.height + 50) {
                this.components.splice(i, 1);
            }
        }
    }

    // ========= RENDER VISUALS =========
    draw() {
        const ctx = gameArea.context;

        this.components.forEach(b => {
            // Move the origin to the bullet's center and rotate,
            // so the rectangle can be drawn around (0, 0) at any angle
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
let gameDuration = 0;        // ticks since the run started (also drives the pulse animations)
let gameStarted = false;
let isPaused = true;
let gameOver = false;
let waveBossDmg = 0;         // damage dealt to bosses during the current wave
const maxSnailDamage = 75;   // boss damage needed to skip to the next wave

// ========= WARNING PULSE =========
// Calculate the warning opacity from the current tick count.
// One complete flash cycle takes 25 ticks (0.5 seconds at 50 ticks per second).
// The minimum is supplied by each warning type; the maximum is always 0.85.
function getWarningPulseAlpha(minAlpha) {
    const maxAlpha = 0.75;
    // Position inside the current cycle, from 0 to 1
    const cyclePosition = (gameDuration % 25) / 25;
    // cos goes 1 -> -1 -> 1 over one cycle; (cos + 1) / 2 remaps that to 1 -> 0 -> 1
    const pulse = (Math.cos(cyclePosition * Math.PI * 2) + 1) / 2;
    // Blend between the minimum and maximum opacity
    return minAlpha + (maxAlpha - minAlpha) * pulse;
}

/* ============================
          TRANSITIONS
   ============================ */

// ========= INITIALIZE GAME =========
function init() {
    gameArea.setup();
}

// ========= START GAME =========
function startGame() {
    // Fresh start (first run, or after a game over); otherwise this just unpauses
    if (!gameStarted || gameOver) {
        gameOver = false;
        gameStarted = true;
        isPaused = false;

        // Replace every manager so no old state carries over
        enemiesObj = new Enemies();
        bulletsObj = new Bullets();
        waveManager = new WaveManager();
        structureManager = new StructureManager();
        waveBossDmg = 0;
        gameDuration = 0;

        // Player starts in the center of the world
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

// ========= RESUME GAME =========
function resumeGame() {
    isPaused = false;
    document.getElementById("pause-menu-overlay").classList.add("hidden");
}

// ========= QUIT TO MENU =========
function quitToMenu() {
    isPaused = true;
    document.getElementById("main-menu-overlay").classList.remove("hidden");
    document.getElementById("main-menu-content").classList.remove("hidden");
    document.getElementById("pause-menu-overlay").classList.add("hidden");
    document.getElementById("game-over-menu-overlay").classList.add("hidden");
}

// ========= TOGGLE PAUSE =========
function togglePause() {
    // Pausing makes no sense before the game starts or after it ends
    if (!gameStarted || gameOver) return;

    isPaused = !isPaused;

    if (isPaused) {
        document.getElementById("pause-menu-overlay").classList.remove("hidden");
    } else {
        document.getElementById("pause-menu-overlay").classList.add("hidden");
    }
}

// ========= HANDLE GAME OVER =========
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
const WORLD_WIDTH = 1920;   // Fixed game world width
const WORLD_HEIGHT = 1080;  // Fixed game world height

const gameArea = {
    canvas: document.getElementById("gameCanvas"),
    // ------ World sizing ------
    width: WORLD_WIDTH,      // Game logic uses these, never the real canvas size
    height: WORLD_HEIGHT,
    // ------ Screen sizing ------
    scale: 1,                // World units -> screen pixels
    offsetX: 0,              // Letterbox offset in screen pixels
    offsetY: 0,

    setup: function() {
        this.context = this.canvas.getContext("2d");
        this.resize();
        lastTimestamp = performance.now();
        requestAnimationFrame(engineLoop);
    },

    // ------ Fit canvas to window and recalculate scale ------
    // Fit the fixed game world into the display while preserving its aspect ratio.
    resize: function() {
        // devicePixelRatio makes the canvas sharp on high-DPI screens
        const dpr = window.devicePixelRatio || 1;
        const cssW = window.innerWidth;
        const cssH = window.innerHeight;

        // CSS size = how big the canvas looks, canvas size = how many real pixels it has
        this.canvas.style.width = cssW + "px";
        this.canvas.style.height = cssH + "px";
        this.canvas.width = Math.round(cssW * dpr);
        this.canvas.height = Math.round(cssH * dpr);

        // Largest scale where the whole world still fits (min picks the limiting axis)
        this.scale = Math.min(
            this.canvas.width / this.width,
            this.canvas.height / this.height
        );

        // Center the world; the leftover space becomes the black bars
        this.offsetX = (this.canvas.width - this.width * this.scale) / 2;
        this.offsetY = (this.canvas.height - this.height * this.scale) / 2;
    },

    // ------ Clear full canvas in screen space ------
    clear: function() {
        if (this.context) {
            this.context.setTransform(1, 0, 0, 1, 0, 0);
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    // ------ Switch drawing to world coordinates and clip to playfield ------
    // Switch the canvas to world coordinates so all game dimensions scale together.
    beginWorld: function() {
        const ctx = this.context;
        // Matrix = (scale x, skew y, skew x, scale y, move x, move y)
        ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
        // Clip to the arena so nothing draws into the black bars
        ctx.beginPath();
        ctx.rect(0, 0, this.width, this.height);
        ctx.clip();
    }
};

/* ============================
       PLAYER MOVEMENT LOGIC
   ============================ */
function movePlayer() {
    // Reset first so releasing a key stops the player
    playerObj.speedX = 0;
    playerObj.speedY = 0;

    // Opposite keys held together cancel out
    if (keys.w && !keys.s) playerObj.speedY = -playerObj.speed;
    if (keys.s && !keys.w) playerObj.speedY = playerObj.speed;
    if (keys.a && !keys.d) playerObj.speedX = -playerObj.speed;
    if (keys.d && !keys.a) playerObj.speedX = playerObj.speed;
}

// ========= SHOOTING KEYBINDS =========
function calculateShots() {
    if (keys.ArrowRight) playerObj.shootRight();
    if (keys.ArrowLeft) playerObj.shootLeft();
    if (keys.ArrowUp) playerObj.shootUp();
    if (keys.ArrowDown) playerObj.shootDown();
}

// ========= COLLISION PROCESSING ENGINE =========
// Axis-aligned bounding-box collision detection.
// It returns true if the two rectangles overlap.
// Works by checking the four ways they can be apart; if none is true, they overlap.
// Using <= and >= means rectangles that only touch at an edge do NOT collide.
function isColliding(a, b) {
    if (!a || !b) return false;

    return !(
        a.x + a.width <= b.x ||
        a.x >= b.x + b.width ||
        a.y + a.height <= b.y ||
        a.y >= b.y + b.height
    );
}

// ========= OBSTACLE MOVEMENT =========
// Move an entity separately on each axis so collisions can be resolved per axis.
// Returns which axes were blocked so enemies know which direction to bounce.
function moveEntityWithObstacles(entity, dx, dy) {
    let blockedX = false;
    let blockedY = false;

    // ------ Horizontal ------
    entity.x += dx;

    for (const block of structureManager.currentBlocks) {
        if (isColliding(entity, block)) {
            // Snap to the block's edge on the side the entity came from
            if (dx > 0) {
                entity.x = block.x - entity.width;
            } else if (dx < 0) {
                entity.x = block.x + block.width;
            }

            blockedX = true;
            break;
        }
    }

    // ------ Vertical ------
    // Done after x so the entity can slide along a wall instead of sticking to it
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
    // Loops backwards so enemies can be removed safely while iterating
    for (let i = enemiesObj.components.length - 1; i >= 0; i--) {
        const enemy = enemiesObj.components[i];

        // Handle contact between the player and an enemy.
        if (isColliding(playerObj, enemy)) {
            // "one_hp" enemies set the player to exactly 1 HP (only if not already there)
            // and start the damage cooldown, so the player gets a moment to react
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
            // Small 10x10 box centered on the bullet's position
            const bBox = {
                x: bullet.x - 5,
                y: bullet.y - 5,
                width: 10,
                height: 10
            };

            if (isColliding(bBox, enemy)) {
                enemy.hp -= bullet.damage;
                bulletsObj.components.splice(j, 1);

                // Track boss damage so heavy damage can end the current wave
                if (enemy.is_boss) {
                    waveBossDmg += bullet.damage;
                }

                if (enemy.hp <= 0) {
                    enemiesObj.components.splice(i, 1);
                }

                // One bullet can only hit one enemy, and this enemy may be removed now
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

    // Order matters: movement first, then wave logic, then shooting and collisions
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

    // Only counts ticks while the game is actually running
    gameDuration++;
    return true;
}

/* ============================
          RENDER VISUALS
   ============================ */
function renderGame() {
    // ------ Letterbox bars ------
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
        // ------ World space ------
        const ctx = gameArea.context;
        ctx.save();
        gameArea.beginWorld();

        // Arena background
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(0, 0, gameArea.width, gameArea.height);

        // Draw game objects in world space.
        playerObj.draw();
        enemiesObj.draw();
        bulletsObj.draw();

        // Draw the structure warning or active structure, then the wave-edge warning.
        // (Warnings are drawn last so they appear on top of everything else.)
        structureManager.draw();
        waveManager.drawWaveWarning();

        ctx.restore();

        // ------ Screen space ------
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

    // Fixed timestep: run as many 20ms ticks as the elapsed time allows,
    // so the game speed doesn't depend on the monitor's refresh rate
    while (frameAccumulator >= tickLength) {
        update();
        frameAccumulator -= tickLength;
    }

    // Rendering happens once per frame, not once per tick
    renderGame();
    requestAnimationFrame(engineLoop);
}

/* ============================
        KEYBOARD LISTENERS
   ============================ */
document.addEventListener("keydown", e => {
    // Arrow keys keep their name; letters are lowercased so Shift / Caps Lock don't break movement
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

// Recalculate the scale and letterbox offsets whenever the window changes
window.addEventListener("resize", () => {
    gameArea.resize();
});