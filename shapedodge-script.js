
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
        this.damageCooldown = 50;

        this.lastShotTime = 0;
        this.shotCooldown = 20;

        this.damageTickCounter = -100;
        this.shotTickCounter = 20;
    }

    // ========= UPDATE PLAYER =========
    update() {
        moveEntityWithObstacles(this, this.speedX, this.speedY);

        // Clamp to world bounds (not screen, since world is fixed)
        this.x = Math.max(0, Math.min(this.x, gameArea.width - this.width));
        this.y = Math.max(0, Math.min(this.y, gameArea.height - this.height));

        this.damageTickCounter++;
        this.shotTickCounter++;
    }

    // ========= RENDER VISUALS =========
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
        ctx.fillText(Math.ceil(this.hp) + " / " + this.maxHP, barX + barWidth / 2, barY + barHeight - 5);
    }

    // ========= DAMAGE LOGIC =========
    takeDamage(amount) {
        if (this.damageTickCounter >= this.damageCooldown) {
            this.hp = Math.max(0, this.hp - amount);
            this.damageTickCounter = 0;
        }
    }

    // ========= SHOOTING LOGIC =========
    shootLeft() {
        if (this.shotTickCounter >= this.shotCooldown) {
            bulletsObj.spawnBullet(this.x, this.y + (this.height / 2), -1, 0)
            this.shotTickCounter = 0
        }
    } shootRight() {
        if (this.shotTickCounter >= this.shotCooldown) {
            bulletsObj.spawnBullet(this.x + this.width, this.y + (this.height / 2), 1, 0)
            this.shotTickCounter = 0
        }
    } shootUp() {
        if (this.shotTickCounter >= this.shotCooldown) {
            bulletsObj.spawnBullet(this.x + (this.width / 2), this.y, 0, -1)
            this.shotTickCounter = 0
        }
    } shootDown() {
        if (this.shotTickCounter >= this.shotCooldown) {
            bulletsObj.spawnBullet(this.x + (this.width / 2), this.y + this.height, 0, 1)
            this.shotTickCounter = 0
        }
    }
}

/* ============================
          ENEMIES CLASS
   ============================ */
class Enemies {
    constructor() {
        this.types = {
            gary:  { width:80,  height:80,  speed:5,   maxHP:25,   hp:25,   damage:35, color:"blue",   cost:15,  is_boss: false, special:null,     track_player:false },
            fast:  { width:50,  height:50,  speed:8,   maxHP:10,   hp:10,   damage:15, color:"yellow", cost:10,  is_boss: false, special:null,     track_player:false },
            tank:  { width:150, height:150, speed:3,   maxHP:100,  hp:100,  damage:60, color:"purple", cost:50,  is_boss: false, special:null,     track_player:false },
            tiny:  { width:25,  height:25,  speed:4,   maxHP:5,    hp:5,    damage:10, color:"lime",   cost:5,   is_boss: false, special:null,     track_player:false },
            snail: { width:15,  height:15,  speed:1.5, maxHP:1000, hp:1000, damage:1,  color:"black",  cost:250, is_boss: true,  special:'one_hp', track_player:true  }
        };
        this.components = [];
    }

    // ========= SPAWN ENEMY =========
    spawnEnemy(type, sides) {
        // Pick a random side from the sides array
        const side = sides[Math.floor(Math.random() * sides.length)];

        let x, y, dx, dy;
        const centerX = gameArea.width / 2;
        const centerY = gameArea.height / 2;

        // Calculate spawn position and direction based on side
        if (side === 'left') {
            x = -type.width;
            y = Math.random() * (gameArea.height - type.height);
            dx = 1;
            dy = (centerY - y) / (gameArea.height / 2);
        } else if (side === 'right') {
            x = gameArea.width;
            y = Math.random() * (gameArea.height - type.height);
            dx = -1;
            dy = (centerY - y) / (gameArea.height / 2);
        } else if (side === 'top') {
            x = Math.random() * (gameArea.width - type.width);
            y = -type.height;
            dx = (centerX - x) / (gameArea.width / 2);
            dy = 1;
        } else if (side === 'bottom') {
            x = Math.random() * (gameArea.width - type.width);
            y = gameArea.height;
            dx = (centerX - x) / (gameArea.height / 2);
            dy = -1;
        }

        const enemy = {
            x, y,
            width: type.width, height: type.height,
            speed: type.speed,
            speedX: dx * type.speed,
            speedY: dy * (type.speed * 0.2),
            maxHP: type.maxHP,
            hp: type.maxHP,
            damage: type.damage,
            color: type.color, cost: type.cost,
            special: type.special,
            is_boss: type.is_boss,
            track_player: type.track_player,
        };
        this.components.push(enemy);
    }

    // ========= UPDATE ENEMIES =========
    update() {
        this.components.forEach(e => {

            // ------ TRACKER ENEMIES ------
            if (e.track_player) {
                // calculate distance to the player (from center to center)
                const dx = (playerObj.x + playerObj.width / 2) - (e.x + e.width / 2);
                const dy = (playerObj.y + playerObj.height / 2) - (e.y + e.height / 2);

                // calculate movement angle
                const angle = Math.atan2(dy, dx);

                // calculate movement speeds
                const moveX = Math.cos(angle) * e.speed;
                const moveY = Math.sin(angle) * e.speed;

                // Move towards the player without crossing obstacles
                moveEntityWithObstacles(e, moveX, moveY);
            }

            // ------ NORMAL ENEMIES ------
            else {
                // Move enemy and detect collisions with blocks
                const collision = moveEntityWithObstacles(e, e.speedX, e.speedY); // get blockedX and blockedY values

                // ==== Bounce off obstacles ====
                if (collision.blockedX) { // movement is blocked on the x axis
                    e.speedX *= -1; // invert speed
                }
                if (collision.blockedY) { // movement is blocked on the y axis
                    e.speedY *= -1; // invert speed
                }

                // ==== Bounce off the world boundaries ====
                // LEFT BORDER
                if (e.x <= 0 && e.speedX < 0) {
                    e.x = 0; // keep enemy inside world
                    e.speedX = Math.abs(e.speedX); // make speed positive so that the enemy moves towards +x
                }
                // RIGHT BORDER
                else if (e.x + e.width >= gameArea.width && e.speedX > 0) {
                    e.x = gameArea.width - e.width;
                    e.speedX = -Math.abs(e.speedX);
                }
                // TOP BORDER
                if (e.y <= 0 && e.speedY < 0) {
                    e.y = 0;
                    e.speedY = Math.abs(e.speedY);
                }
                // BOTTOM BORDER
                else if (e.y + e.height >= gameArea.height && e.speedY > 0) {
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

            // Draw health bar if enemy is damaged
            if (e.hp < e.maxHP) {
                let barWidth = Math.max(64, e.width);
                let barHeight = Math.max(8, e.height / 10);

                let barX = (e.x + e.width / 2) - (barWidth / 2);
                let barY = e.y - barHeight - 5;

                // Draw black outline
                ctx.fillStyle = "black";
                ctx.fillRect(barX, barY, barWidth, barHeight);

                // Draw red filler based on health percentage
                const outlineWeight = 1;
                let fillerWidth = (e.hp / e.maxHP) * (barWidth - outlineWeight * 2)
                let fillerHeight = barHeight - outlineWeight * 2;

                let fillerX = barX + outlineWeight;
                let fillerY = barY + outlineWeight;

                ctx.fillStyle = "red";
                ctx.fillRect(fillerX, fillerY, fillerWidth, fillerHeight);
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
        this.spawnInterval = 40; // 0.8 seconds
        this.spawnTimer = 0;
        this.duration = 0;
        this.maxDuration = 3000; // 60 seconds
        this.baseBudget = 30;
    }

    // ========= UPDATE WAVES =========
    update() {
        // ------ If structure is active, let StructureManager handle wave end ------
        if (structureManager.isActive) {
            return; // Don't do normal wave logic during structure
        }

        // ------ NORMAL WAVE LOGIC ------
        const activeEnemies = enemiesObj.components.filter(e => !e.is_boss).length;
        this.duration++;

        // Check if wave should end and next wave should start
        if (this.spawnQueue.length === 0) {
            if (activeEnemies === 0 || /* this.duration >= this.maxDuration || */ waveSnailDamage >= maxSnailDamage) {
                this.startNextWave();
            } else if (activeEnemies <= 2) {
                // Small chance to start new wave if only a few enemies left
                if (Math.floor(Math.random() * 100) == 1) {
                    this.startNextWave();
                }
            }
        }

        // Spawn enemies from queue at intervals
        if (this.spawnQueue.length > 0) {
            this.spawnTimer++;
            if (this.spawnTimer >= this.spawnInterval) {
                let next = this.spawnQueue.shift();
                enemiesObj.spawnEnemy(next.type, next.sides);
                this.spawnTimer = 0;
            }
        }
    }

    // ========= SPAWN WAVES =========
    startNextWave() {
        this.currentWave++;
        waveSnailDamage = 0;
        let budget = this.baseBudget + (this.currentWave * 20);
        this.duration = 0;

        // Check if a structure should spawn after this wave
        const structureTrigger = structures.find(s => s.wave === this.currentWave);

        if (structureTrigger) {
            // ------ STRUCTURE WAVE ------
            // Completely clear normal enemies and reset for structure
            enemiesObj.components = [];
            this.spawnQueue = [];

            // Spawn structure with its own enemies
            structureManager.spawnStructure(structureTrigger);

            // Spawn snail at structure start
            enemiesObj.spawnEnemy(enemiesObj.types.snail, ['left', 'right']);

            if (playerObj) playerObj.hp = Math.min(playerObj.maxHP, playerObj.hp + 50);
        } else {
            // ------ NORMAL WAVE ------
            // Spawn snail on wave 1 (the special enemy)
            if (this.currentWave === 1) {
                enemiesObj.spawnEnemy(enemiesObj.types.snail, ['left', 'right', 'top', 'bottom']);
            }

            // Build spawn queue with random enemies based on budget
            const enemyOptions = Object.values(enemiesObj.types).filter(t => t.cost < 500);
            while (budget >= 5) {
                let possible = enemyOptions.filter(t => t.cost <= budget);
                if (possible.length === 0) break;
                let choice = possible[Math.floor(Math.random() * possible.length)];

                // Pick 2 random sides for this wave's spawns
                const allSides = ['left', 'right', 'top', 'bottom'];
                const waveSides = this.pickTwoRandom(allSides);

                this.spawnQueue.push({ type: choice, sides: waveSides });
                budget -= choice.cost;
            }

            // Speed up spawn rate as waves progress
            this.spawnInterval = Math.max(10, 40 - (this.currentWave * 2));
        }
    }

    // ------ Pick 2 random sides ------
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
        this.currentBlocks = []; // blocks currently on the arena
        this.structureEnemyCount = 0; // track how many structure enemies are alive
    }

    // ------ Spawn Structure ------
    spawnStructure(structureDef) {
        this.isActive = true;
        this.currentBlocks = structureDef.blocks;

        // Reposition player if they overlap structure blocks
        const entities = [];
        if (playerObj) entities.push(playerObj);

        for (const entity of entities) {
            // Check if entity overlaps any block
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

            // Search in expanding circles for a free position
            for (let radius = 5; radius <= maxRadius && !freePosition; radius += 5) {
                const candidates = [];

                // Generate candidate positions at this radius
                for (let offset = -radius; offset <= radius; offset += 5) {
                    candidates.push({ x: originalX + offset, y: originalY - radius });
                    candidates.push({ x: originalX + offset, y: originalY + radius });

                    if (offset !== -radius && offset !== radius) {
                        candidates.push({ x: originalX - radius, y: originalY + offset });
                        candidates.push({ x: originalX + radius, y: originalY + offset });
                    }
                }

                // Test each candidate for collision
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

                    // If no blocks overlap this candidate, use it
                    const blocked = this.currentBlocks.some(
                        block => isColliding(candidateBox, block)
                    );

                    if (!blocked) {
                        freePosition = candidate;
                        break;
                    }
                }
            }

            // Move entity to the free position if found
            if (freePosition) {
                entity.x = freePosition.x;
                entity.y = freePosition.y;
            }
        }

        // Spawn structure enemies after clearing overlaps
        this.spawnStructureEnemies(structureDef);
    }

    // ------ Spawn Structure Enemies ------
    spawnStructureEnemies(structureDef) {
        // Calculate bounding box of all structure blocks
        // This gives us the area where enemies can spawn inside the structure
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        structureDef.blocks.forEach(block => {
            minX = Math.min(minX, block.x);
            minY = Math.min(minY, block.y);
            maxX = Math.max(maxX, block.x + block.width);
            maxY = Math.max(maxY, block.y + block.height);
        });

        // Reset structure enemy count before spawning
        this.structureEnemyCount = 0;

        // Spawn each enemy type defined in the structure
        structureDef.enemies.forEach(enemyDef => {
            // Spawn 'amount' copies of this enemy type
            for (let i = 0; i < enemyDef.amount; i++) {
                const type = enemiesObj.types[enemyDef.type];

                // Pick random position inside structure bounding box
                // Keep trying random spots until we find one that doesn't overlap blocks
                let validPosition = false;
                let x, y;
                let attempts = 0;
                const maxAttempts = 20; // prevent infinite loops

                while (!validPosition && attempts < maxAttempts) {
                    x = minX + Math.random() * (maxX - minX - type.width);
                    y = minY + Math.random() * (maxY - minY - type.height);

                    // Check if this position overlaps any block
                    const testBox = { x: x, y: y, width: type.width, height: type.height };
                    const overlapsBlock = structureDef.blocks.some(block => isColliding(testBox, block));

                    if (!overlapsBlock) {
                        validPosition = true;
                    }
                    attempts++;
                }

                // If we found a valid position, clamp to world bounds and spawn
                if (validPosition) {
                    x = Math.max(0, Math.min(x, gameArea.width - type.width));
                    y = Math.max(0, Math.min(y, gameArea.height - type.height));

                    // Create enemy object with initial random velocity
                    const randomSpeed = type.speed * (0.5 + Math.random() * 0.5); // 50%-100% of normal speed
                    const randomAngle = Math.random() * Math.PI * 2;

                    const enemy = {
                        x, y,
                        width: type.width, height: type.height,
                        speed: type.speed,
                        speedX: Math.cos(randomAngle) * randomSpeed,
                        speedY: Math.sin(randomAngle) * randomSpeed,
                        maxHP: type.maxHP,
                        hp: type.maxHP,
                        damage: type.damage,
                        color: type.color, cost: type.cost,
                        special: type.special,
                        track_player: type.track_player,
                    };
                    enemiesObj.components.push(enemy);
                    this.structureEnemyCount++;
                }
            }
        });
    }

    // ------ Update Structure ------
    update() {
        if (!this.isActive) return;

        // Count non-boss structure enemies still alive (preserve snails)
        const aliveStructureEnemies = enemiesObj.components.filter(e => !e.is_boss).length;

        // Check if structure should clear (all enemies dead OR snail takes 75 damage)
        if (aliveStructureEnemies === 0 || waveSnailDamage >= maxSnailDamage) {
            // ==== STRUCTURE CLEARED ====
            // Clear structure and resume normal waves
            this.isActive = false;
            this.currentBlocks = [];

            // Remove all non-boss enemies but keep snails
            enemiesObj.components = enemiesObj.components.filter(e => e.is_boss);
            waveManager.spawnQueue = [];
            waveManager.startNextWave();
        }
    }

    // ------ Draw Structure ------
    draw() {
        if (!this.isActive) return;

        const ctx = gameArea.context;
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
        const bullet = {
            x: posX,
            y: posY,
            width: type.width,
            height: type.height,
            speedX: type.speed * vectorX,
            speedY: type.speed * vectorY,
            angle: Math.atan2(vectorY, vectorX),
            damage: type.damage,
            color: type.color
        };
        this.components.push(bullet);
    }

    // ========= MATH =========
    update() {
        for (let i = this.components.length - 1; i >= 0; i--) {
            let b = this.components[i];
            b.x += b.speedX;
            b.y += b.speedY;

            // Create bullet hitbox accounting for rotation
            const horizontal = b.speedX !== 0;
            const bulletBox = {
                x: b.x - (horizontal ? b.width : b.height) / 2,
                y: b.y - (horizontal ? b.height : b.width) / 2,
                width: horizontal ? b.width : b.height,
                height: horizontal ? b.height : b.width
            };

            // Check collision with structure blocks
            let hitObstacle = false;
            for (const block of structureManager.currentBlocks) {
                if (isColliding(bulletBox, block)) {
                    this.components.splice(i, 1);
                    hitObstacle = true;
                    break;
                }
            }

            // Skip rest of update if bullet was removed
            if (hitObstacle) continue;

            // Remove bullets outside world
            if (b.x < -50 || b.x > gameArea.width + 50 ||
                b.y < -50 || b.y > gameArea.height + 50) {
                this.components.splice(i, 1);
            }
        }
    }

    // ========= VISUALS =========
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
let keys = { w:false, a:false, s:false, d:false, ArrowLeft:false, ArrowUp:false, ArrowRight:false, ArrowDown:false };
let gameDuration = 0;

let gameStarted = false;
let isPaused = true;
let gameOver = false;

let waveSnailDamage = 0;
const maxSnailDamage = 75;

/* ============================
          TRANSITIONS
   ============================ */

// ========= INITIALIZE GAME =========
function init() {
    gameArea.setup();
}

// ========= START GAME =========
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
    width: WORLD_WIDTH,      // Game logic uses these
    height: WORLD_HEIGHT,
    // ------ Screen sizing ------
    scale: 1,                // World units -> screen pixels (scales up on 4K, 1:1 on 1080p)
    offsetX: 0,              // Letterbox offset in screen pixels
    offsetY: 0,

    setup: function() {
        this.context = this.canvas.getContext("2d");
        this.resize();
        lastTimestamp = performance.now();
        requestAnimationFrame(engineLoop);
    },

    // ------ Fit canvas to window and recalculate scale ------
    resize: function() {
        const dpr = window.devicePixelRatio || 1;
        const cssW = window.innerWidth;
        const cssH = window.innerHeight;

        // Set canvas CSS size to match window
        this.canvas.style.width = cssW + "px";
        this.canvas.style.height = cssH + "px";

        // Set canvas buffer size for sharp rendering on high-DPI screens
        this.canvas.width = Math.round(cssW * dpr);
        this.canvas.height = Math.round(cssH * dpr);

        // Calculate largest scale that fits the whole world (letterbox on non-16:9)
        this.scale = Math.min(this.canvas.width / this.width, this.canvas.height / this.height);

        // Center the scaled world, split leftover space equally on both sides (creates black bars)
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
    beginWorld: function() {
        const ctx = this.context;
        // Apply scale and offset so world coords become screen coords
        ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
        // Clip to arena so nothing draws outside it
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

// ========= SHOOTING KEYBINDS =========
function calculateShots() {
    if (keys.ArrowRight) playerObj.shootRight();
    if (keys.ArrowLeft) playerObj.shootLeft();
    if (keys.ArrowUp) playerObj.shootUp();
    if (keys.ArrowDown) playerObj.shootDown();
}

// ========= COLLISION PROCESSING ENGINE =========
function isColliding(a, b) {
    if (!a || !b) return false;

    return !(
        a.x + a.width <= b.x ||
        a.x >= b.x + b.width ||
        a.y + a.height <= b.y ||
        a.y >= b.y + b.height
    );
}


function moveEntityWithObstacles(entity, dx, dy) {
    let blockedX = false;
    let blockedY = false;

    // Move horizontally and check for block collision
    entity.x += dx;
    for (const block of structureManager.currentBlocks) {
        if (isColliding(entity, block)) {
            // Snap to block edge based on direction
            if (dx > 0) {
                entity.x = block.x - entity.width;
            } else if (dx < 0) {
                entity.x = block.x + block.width;
            }
            blockedX = true;
            break;
        }
    }

    // Move vertically and check for block collision
    entity.y += dy;
    for (const block of structureManager.currentBlocks) {
        if (isColliding(entity, block)) {
            // Snap to block edge based on direction
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
    // Check player collisions with enemies
    for (let i = enemiesObj.components.length - 1; i >= 0; i--) {
        const enemy = enemiesObj.components[i];

        // Handle player + enemy collision
        if (isColliding(playerObj, enemy)) {
            if (enemy.special === "one_hp" && playerObj.hp != 1) {
                playerObj.hp = 1;
                playerObj.damageTickCounter = 0;
            } else {
                playerObj.takeDamage(enemy.damage);
            }
        }

        // Handle bullet + enemy collision
        for (let j = bulletsObj.components.length - 1; j >= 0; j--) {
            const bullet = bulletsObj.components[j];
            const bBox = { x: bullet.x - 5, y: bullet.y - 5, width: 10, height: 10 };

            if (isColliding(bBox, enemy)) {
                enemy.hp -= bullet.damage;
                bulletsObj.components.splice(j, 1);

                // Track damage to snail for wave spawning
                if (enemy.special === "one_hp") {
                    waveSnailDamage += bullet.damage;
                }
                // Remove enemy if dead
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
    structureManager.update(); // Check if structure should clear

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
    // Clear canvas to black (letterbox bars)
    if (gameArea.context) {
        gameArea.context.setTransform(1, 0, 0, 1, 0, 0);
        gameArea.context.fillStyle = "black";
        gameArea.context.fillRect(0, 0, gameArea.canvas.width, gameArea.canvas.height);
    }

    if (gameStarted && playerObj && gameArea.context) {
        // ------ Draw Objects in World Space ------
        const ctx = gameArea.context;
        ctx.save();
        gameArea.beginWorld();

        // Draw arena background
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(0, 0, gameArea.width, gameArea.height);

        playerObj.draw();
        enemiesObj.draw();
        bulletsObj.draw();
        structureManager.draw();

        ctx.restore();

        // ------ Wave Counter in Screen Space ------
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // back to screen space
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
    let deltaTime = currentTime - lastTimestamp;
    lastTimestamp = currentTime;

    frameAccumulator += deltaTime;

    let running = true;
    while (frameAccumulator >= tickLength) {
        running = update();
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
