// ========= STRUCTURES =========
const structures = [
    {
    blocks: [
        { width: 150, height: 120, x: 120, y: 120 },
        { width: 150, height: 120, x: 530, y: 120 },
        { width: 150, height: 120, x: 530, y: 470 },
        { width: 150, height: 120, x: 120, y: 470 },
        { width: 260, height: 20, x: 270, y: 120 },
        { width: 30, height: 470, x: 850, y: 120 },
    ],
    enemies: [
        { type: "gary", amount: 1 },
        { type: "fast", amount: 1 },
        { type: "tiny", amount: 1 },
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

        this.x = Math.max(0, Math.min(this.x, gameArea.canvas.width - this.width));
        this.y = Math.max(0, Math.min(this.y, gameArea.canvas.height - this.height));

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
        const barX = (gameArea.canvas.width - barWidth) / 2;
        const barY = gameArea.canvas.height - barHeight - 10;

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
            gary:  { width:80,  height:80,  speed:5,   maxHP:25,   hp:25,   damage:35, color:"blue",   cost:15,  special:null,     track_player:false },
            fast:  { width:50,  height:50,  speed:8,   maxHP:10,   hp:10,   damage:15, color:"yellow", cost:10,  special:null,     track_player:false },
            tank:  { width:150, height:150, speed:3,   maxHP:100,  hp:100,  damage:60, color:"purple", cost:50,  special:null,     track_player:false },
            tiny:  { width:25,  height:25,  speed:4,   maxHP:5,    hp:5,    damage:10, color:"lime",   cost:5,   special:null,     track_player:false },
            snail: { width:15,  height:15,  speed:1.5, maxHP:1000, hp:1000, damage:1,  color:"black",  cost:250, special:'one_hp', track_player:true  }
        };
        this.components = [];
    }

    // ========= SPAWN ENEMY =========
    spawnEnemy(type) {
        // Randomize spawn location
        const side = Math.random() < 0.5 ? 'left' : 'right'; // randomize side
        let x = (side === 'left') ? -type.width : gameArea.canvas.width; // calculate x
        let y = Math.random() * (gameArea.canvas.height - type.height); // calculate y

        const centerX = gameArea.canvas.width / 2;
        const centerY = gameArea.canvas.height / 2;
        let dx = (side === 'left') ? 1 : -1;

        let dy = (centerY - y) / (gameArea.canvas.height / 2);

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
                const collision = moveEntityWithObstacles(e, e.speedX, e.speedY); // get blockedX and blockedY values

                // ==== Bounce off obstacles ====
                if (collision.blockedX) { // movement is blocked on the x axis
                    e.speedX *= -1; // invert speed
                }
                if (collision.blockedY) { // movement is blocked on the y axis
                    e.speedY *= -1; // invert speed
                }

                // ==== Bounce off the canvas boundaries ====
                // LEFT BORDER
                if (e.x <= 0 && e.speedX < 0) {
                    e.x = 0; // keep enemy inside canvas
                    e.speedX = Math.abs(e.speedX); // make speed positive so that the enemy moves towards +x
                }
                // RIGHT BORDER
                else if (e.x + e.width >= gameArea.canvas.width && e.speedX > 0) {
                    e.x = gameArea.canvas.width - e.width;
                    e.speedX = -Math.abs(e.speedX);
                }
                // TOP BORDER
                if (e.y <= 0 && e.speedY < 0) {
                    e.y = 0;
                    e.speedY = Math.abs(e.speedY);
                }
                // BOTTOM BORDER
                else if (e.y + e.height >= gameArea.canvas.height && e.speedY > 0) {
                    e.y = gameArea.canvas.height - e.height;
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

            if (e.hp < e.maxHP) {
                let barWidth = Math.max(64, e.width);
                let barHeight = Math.max(8, e.height / 10);

                let barX = (e.x + e.width / 2) - (barWidth / 2);
                let barY = e.y - barHeight - 5;

                ctx.fillStyle = "black";
                ctx.fillRect(barX, barY, barWidth, barHeight);

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
        const activeEnemies = enemiesObj.components.filter(e => e.special !== 'one_hp').length;
        this.duration++;

        if (this.spawnQueue.length === 0) {
            if (activeEnemies === 0 || /* this.duration >= this.maxDuration || */ waveSnailDamage >= maxSnailDamage) {
                this.startNextWave();
            } else if (activeEnemies <= 2) {
                if (Math.floor(Math.random() * 100) == 1) {
                    this.startNextWave();
                }
            }
        }

        if (this.spawnQueue.length > 0) {
            this.spawnTimer++;
            if (this.spawnTimer >= this.spawnInterval) {
                let nextType = this.spawnQueue.shift();
                enemiesObj.spawnEnemy(nextType);
                this.spawnTimer = 0;
            }
        }
    }

    // ========= SPAWN WAVES =========
    startNextWave() {
        this.currentWave++;
        if (this.currentWave != 3) { // spawn normal wave
            waveSnailDamage = 0;
            let budget = this.baseBudget + (this.currentWave * 20);
            this.duration = 0;

            if (this.currentWave === 1) {
                enemiesObj.spawnEnemy(enemiesObj.types.snail);
            }

            const enemyOptions = Object.values(enemiesObj.types).filter(t => t.cost < 500);
            while (budget >= 5) {
                let possible = enemyOptions.filter(t => t.cost <= budget);
                if (possible.length === 0) break;
                let choice = possible[Math.floor(Math.random() * possible.length)];
                this.spawnQueue.push(choice);
                budget -= choice.cost;
            }

            this.spawnInterval = Math.max(10, 40 - (this.currentWave * 2));
        } else { // spawn structure on wave 6
            structureManager.spawnStructure(structures[0]);
            if (playerObj) playerObj.hp = Math.min(playerObj.maxHP, playerObj.hp + 50);
        }
    }
}

/* ============================
     STRUCTURE MANAGER CLASS
   ============================ */
class StructureManager {
    constructor() {
        this.isActive = false;
        this.currentBlocks = []; // blocks currently on the arena
    }

    // ------ Spawn Structure ------
    spawnStructure(structureDef) {
        this.isActive = true;
        this.currentBlocks = structureDef.blocks;

        // Reposition any player or enemy that overlaps the newly spawned structure.
        const entities = [];
        if (playerObj) entities.push(playerObj);
        if (enemiesObj) entities.push(...enemiesObj.components);

        for (const entity of entities) {
            const overlapsStructure = this.currentBlocks.some(
                block => isColliding(entity, block)
            );

            if (!overlapsStructure) continue;

            const originalX = entity.x;
            const originalY = entity.y;
            const maxX = gameArea.canvas.width - entity.width;
            const maxY = gameArea.canvas.height - entity.height;
            const maxRadius = Math.max(gameArea.canvas.width, gameArea.canvas.height);
            let freePosition = null;

            // Search outward from the entity for a nearby position clear of every block.
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
    }

    // ------ Draw Structure ------
    draw() {
        if (!this.isActive) return; // do nothing if class is not active
        const ctx = gameArea.context;
        this.currentBlocks.forEach(b => {
            ctx.fillStyle = "gray";
            ctx.fillRect(b.x, b.y, b.width, b.height);
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

            // Calculate the bullet hitbox, accounting for its horizontal or vertical orientation
            const horizontal = b.speedX !== 0;
            const bulletBox = {
                x: b.x - (horizontal ? b.width : b.height) / 2,
                y: b.y - (horizontal ? b.height : b.width) / 2,
                width: horizontal ? b.width : b.height,
                height: horizontal ? b.height : b.width
            };

            // Remove the bullet if it collides with an obstacle
            let hitObstacle = false;
            for (const block of structureManager.currentBlocks) {
                if (isColliding(bulletBox, block)) {
                    this.components.splice(i, 1);
                    hitObstacle = true;
                    break;
                }
            }

            // Skip the rest of this iteration if the bullet was removed
            if (hitObstacle) continue;

            // Stop tracking bullets outside canvas
            if (b.x < -50 || b.x > gameArea.canvas.width + 50 ||
                b.y < -50 || b.y > gameArea.canvas.height + 50) {
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
        structureManager = new StructureManager(); // Clear any structure left from a previous run
        waveSnailDamage = 0;
        gameDuration = 0;

        playerObj = new Player(
            gameArea.canvas.width / 2,
            gameArea.canvas.height / 2
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
const gameArea = {
    canvas: document.getElementById("gameCanvas"),
    setup: function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.context = this.canvas.getContext("2d");

        lastTimestamp = performance.now();
        requestAnimationFrame(engineLoop);
    },
    clear: function() {
        if (this.context) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
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

    // Attempt horizontal movement
    entity.x += dx;
    for (const block of structureManager.currentBlocks) {
        if (isColliding(entity, block)) {
            // Snap to the obstacle's edge
            if (dx > 0) {
                entity.x = block.x - entity.width;
            } else if (dx < 0) {
                entity.x = block.x + block.width;
            }
            blockedX = true;
            break;
        }
    }

    // Attempt vertical movement
    entity.y += dy;
    for (const block of structureManager.currentBlocks) {
        if (isColliding(entity, block)) {
            // Snap to the obstacle's edge
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

        if (isColliding(playerObj, enemy)) {
            if (enemy.special === "one_hp" && playerObj.hp != 1) {
                playerObj.hp = 1;
                playerObj.damageTickCounter = 0;
            } else {
                playerObj.takeDamage(enemy.damage);
            }
        }

        for (let j = bulletsObj.components.length - 1; j >= 0; j--) {
            const bullet = bulletsObj.components[j];
            const bBox = { x: bullet.x - 5, y: bullet.y - 5, width: 10, height: 10 };

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
    gameArea.clear();

    if (gameStarted && playerObj && gameArea.context) {
        // ------ Draw Objects ------
        playerObj.draw();
        enemiesObj.draw();
        bulletsObj.draw();
        structureManager.draw();

        // ------ Wave Counter ------
        const ctx = gameArea.context;
        ctx.fillStyle = "black";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Wave: " + waveManager.currentWave, 20, 45);
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
    gameArea.canvas.width = window.innerWidth;
    gameArea.canvas.height = window.innerHeight;
});