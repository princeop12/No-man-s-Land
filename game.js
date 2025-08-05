const backgroundCanvas = document.getElementById('backgroundCanvas');
const gameCanvas = document.getElementById('gameCanvas');
const backgroundCtx = backgroundCanvas.getContext('2d');
const ctx = gameCanvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');
const loadingScreen = document.getElementById('loadingScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreText = document.getElementById('finalScore');
const shootBtn = document.getElementById('shootBtn');
const analogThumb = document.querySelector('.analog-thumb');

// Set canvas and world dimensions
const worldWidth = 1200;
const canvasWidth = Math.min(window.innerWidth * 0.9, 600);
backgroundCanvas.width = canvasWidth;
backgroundCanvas.height = 400;
gameCanvas.width = canvasWidth;
gameCanvas.height = 400;

// Camera properties for scrolling
let cameraX = 0;
const cameraMaxX = worldWidth - canvasWidth;

// Load images with error handling
const backgroundImage = new Image();
backgroundImage.src = 'background.png';
backgroundImage.onerror = () => console.error('Failed to load background.png');

const playerImage = new Image();
playerImage.src = 'player.png';
playerImage.onerror = () => { console.error('Failed to load player.png'); playerImage.error = true; };

const duckImage = new Image();
duckImage.src = 'duck.png';
duckImage.onerror = () => { console.error('Failed to load duck.png'); duckImage.error = true; };

const enemyImage = new Image();
enemyImage.src = 'enemy.png';
enemyImage.onerror = () => { console.error('Failed to load enemy.png'); enemyImage.error = true; };

const droneImage = new Image();
droneImage.src = 'drone.png';
droneImage.onerror = () => { console.error('Failed to load drone.png'); droneImage.error = true; };

// Player soldier properties
const soldier = {
    x: 50,
    y: 250,
    width: 20,
    height: 30,
    speed: 5,
    jumpPower: 15,
    velocityY: 0,
    isJumping: false,
    isDucking: false,
    color: 'red',
    damageTaken: 0,
    maxHealth: 1000,
    facingLeft: false
};

// Ground properties
const ground = {
    y: 280,
    height: 120,
    color: 'green'
};

// Arrays and game state
let playerBullets = [];
let enemyBullets = [];
let groundEnemies = [];
let flyingEnemies = [];
let gameOver = false;
let gameStarted = false;
let lastGroundEnemySpawnTime = 0;
let lastFlyingEnemySpawnTime = 0;
let groundEnemySpawnInterval = 5000;
let flyingEnemySpawnInterval = 5000;
let enemyShootInterval = 2000;
let isMovingLeft = false;
let isMovingRight = false;
let isShooting = false;
let shootDirection = { x: 0, y: 0 };
let score = 0;
let killCount = 0;

// Game constants
const gravity = 0.6;
const maxBulletDistance = 200;
const shootInterval = 200;
let lastShotTime = 0;

// Button references
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const jumpBtn = document.getElementById('jumpBtn');
const duckBtn = document.getElementById('duckBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// Initialize button visibility
jumpBtn.style.display = 'none';
duckBtn.style.display = 'none';
leftBtn.style.display = 'none';
rightBtn.style.display = 'none';
shootBtn.style.display = 'none';

// Button event listeners
startBtn.addEventListener('click', () => {
    gameStarted = true;
    loadingScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    jumpBtn.style.display = 'block';
    duckBtn.style.display = 'block';
    leftBtn.style.display = 'block';
    rightBtn.style.display = 'block';
    shootBtn.style.display = 'flex';
    gameLoop();
});

restartBtn.addEventListener('click', () => {
    // Reset game state
    soldier.x = 50;
    soldier.y = 250;
    soldier.velocityY = 0;
    soldier.isJumping = false;
    soldier.isDucking = false;
    soldier.damageTaken = 0;
    soldier.facingLeft = false;
    playerBullets = [];
    enemyBullets = [];
    groundEnemies = [];
    flyingEnemies = [];
    gameOver = false;
    gameStarted = true;
    isMovingLeft = false;
    isMovingRight = false;
    isShooting = false;
    shootDirection = { x: 0, y: 0 };
    lastGroundEnemySpawnTime = Date.now();
    lastFlyingEnemySpawnTime = Date.now();
    groundEnemySpawnInterval = 5000;
    flyingEnemySpawnInterval = 5000;
    enemyShootInterval = 2000;
    score = 0;
    killCount = 0;
    cameraX = 0;
    analogThumb.style.transform = 'translate(0, 0)';
    gameOverScreen.style.display = 'none';
    jumpBtn.style.display = 'block';
    duckBtn.style.display = 'block';
    leftBtn.style.display = 'block';
    rightBtn.style.display = 'block';
    shootBtn.style.display = 'flex';
    gameLoop();
});

jumpBtn.addEventListener('click', () => {
    if (!soldier.isJumping && gameStarted && !gameOver) {
        soldier.velocityY = -soldier.jumpPower;
        soldier.isJumping = true;
    }
});

duckBtn.addEventListener('mousedown', () => {
    if (!soldier.isJumping && gameStarted && !gameOver) {
        soldier.isDucking = true;
        soldier.height = 15;
        soldier.y = ground.y - soldier.height;
    }
});
duckBtn.addEventListener('mouseup', () => {
    if (gameStarted && !gameOver) {
        soldier.isDucking = false;
        soldier.height = 30;
        soldier.y = ground.y - soldier.height;
    }
});
duckBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!soldier.isJumping && gameStarted && !gameOver) {
        soldier.isDucking = true;
        soldier.height = 15;
        soldier.y = ground.y - soldier.height;
    }
});
duckBtn.addEventListener('touchend', () => {
    if (gameStarted && !gameOver) {
        soldier.isDucking = false;
        soldier.height = 30;
        soldier.y = ground.y - soldier.height;
    }
});

leftBtn.addEventListener('mousedown', () => {
    if (gameStarted && !gameOver) {
        isMovingLeft = true;
        soldier.facingLeft = true;
    }
});
leftBtn.addEventListener('mouseup', () => {
    isMovingLeft = false;
});
leftBtn.addEventListener('mouseout', () => {
    isMovingLeft = false;
});
leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameStarted && !gameOver) {
        isMovingLeft = true;
        soldier.facingLeft = true;
    }
});
leftBtn.addEventListener('touchend', () => {
    isMovingLeft = false;
});
leftBtn.addEventListener('touchcancel', () => {
    isMovingLeft = false;
});

rightBtn.addEventListener('mousedown', () => {
    if (gameStarted && !gameOver) {
        isMovingRight = true;
        soldier.facingLeft = false;
    }
});
rightBtn.addEventListener('mouseup', () => {
    isMovingRight = false;
});
rightBtn.addEventListener('mouseout', () => {
    isMovingRight = false;
});
rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameStarted && !gameOver) {
        isMovingRight = true;
        soldier.facingLeft = false;
    }
});
rightBtn.addEventListener('touchend', () => {
    isMovingRight = false;
});
rightBtn.addEventListener('touchcancel', () => {
    isMovingRight = false;
});

// Analog shoot button logic
function updateAnalogThumb(clientX, clientY) {
    const rect = shootBtn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const maxDistance = 19.5;
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    if (magnitude > maxDistance) {
        dx = (dx / magnitude) * maxDistance;
        dy = (dy / magnitude) * maxDistance;
    }
    analogThumb.style.transform = `translate(${dx}px, ${dy}px)`;
    shootDirection = { x: dx / maxDistance, y: dy / maxDistance };
    if (magnitude === 0) shootDirection = { x: 0, y: 0 };
    soldier.facingLeft = shootDirection.x < 0;
}

function fireBullet() {
    if (shootDirection.x === 0 && shootDirection.y === 0) return;
    const currentTime = Date.now();
    if (currentTime - lastShotTime >= shootInterval) {
        const bulletSpeed = 10;
        playerBullets.push({
            x: soldier.x + (soldier.facingLeft ? 0 : soldier.width),
            y: soldier.y + soldier.height / 2,
            width: 5,
            height: 2.5,
            speedX: shootDirection.x * bulletSpeed,
            speedY: shootDirection.y * bulletSpeed,
            distanceTraveled: 0
        });
        lastShotTime = currentTime;
    }
}

// Mouse drag events
shootBtn.addEventListener('mousedown', (e) => {
    if (gameStarted && !gameOver) {
        isShooting = true;
        updateAnalogThumb(e.clientX, e.clientY);
        fireBullet();
    }
});
document.addEventListener('mousemove', (e) => {
    if (isShooting && gameStarted && !gameOver) {
        updateAnalogThumb(e.clientX, e.clientY);
    }
});
document.addEventListener('mouseup', () => {
    isShooting = false;
    shootDirection = { x: 0, y: 0 };
    analogThumb.style.transform = 'translate(0, 0)';
});

// Touch drag events
shootBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameStarted && !gameOver) {
        isShooting = true;
        const touch = e.touches[0];
        updateAnalogThumb(touch.clientX, touch.clientY);
        fireBullet();
    }
});
document.addEventListener('touchmove', (e) => {
    if (isShooting && gameStarted && !gameOver) {
        e.preventDefault();
        const touch = e.touches[0];
        updateAnalogThumb(touch.clientX, touch.clientY);
    }
});
document.addEventListener('touchend', () => {
    isShooting = false;
    shootDirection = { x: 0, y: 0 };
    analogThumb.style.transform = 'translate(0, 0)';
});
document.addEventListener('touchcancel', () => {
    isShooting = false;
    shootDirection = { x: 0, y: 0 };
    analogThumb.style.transform = 'translate(0, 0)';
});

// Spawn enemies
function spawnGroundEnemies() {
    const currentTime = Date.now();
    if (currentTime - lastGroundEnemySpawnTime >= groundEnemySpawnInterval && gameStarted && !gameOver) {
        for (let i = 0; i < 2; i++) {
            groundEnemies.push({
                x: cameraX + canvasWidth + Math.random() * (worldWidth - cameraX - canvasWidth - 20),
                y: ground.y - 30,
                width: 20,
                height: 30,
                color: 'blue',
                hits: 0,
                maxHits: 3,
                lastShot: 0,
                isFlying: false,
                facingLeft: false,
                action: 'stand',
                lastActionChange: currentTime
            });
        }
        lastGroundEnemySpawnTime = currentTime;
    }
}

function spawnFlyingEnemies() {
    const currentTime = Date.now();
    if (currentTime - lastFlyingEnemySpawnTime >= flyingEnemySpawnInterval && gameStarted && !gameOver) {
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -20 : worldWidth;
        const y = 50 + Math.random() * 100;
        flyingEnemies.push({
            x: x,
            y: y,
            width: 26, // Increased by 30% from 20px
            height: 30,
            color: 'blue',
            hits: 0,
            maxHits: 3,
            lastShot: 0,
            isFlying: true,
            fromLeft: fromLeft
        });
        lastFlyingEnemySpawnTime = currentTime;
    }
}

// Update enemies
function updateEnemies() {
    const currentTime = Date.now();
    groundEnemies.forEach(enemy => {
        enemy.facingLeft = soldier.x < enemy.x;
        if (currentTime - enemy.lastActionChange >= 2000) {
            const actions = ['walkLeft', 'walkRight', 'duck', 'stand'];
            enemy.action = actions[Math.floor(Math.random() * actions.length)];
            enemy.lastActionChange = currentTime;
            if (enemy.action === 'duck') {
                enemy.height = 15;
                enemy.y = ground.y - enemy.height;
            } else {
                enemy.height = 30;
                enemy.y = ground.y - enemy.height;
            }
        }
        if (enemy.action === 'walkLeft') {
            enemy.x -= 2;
            if (enemy.x < 0) enemy.x = 0;
        } else if (enemy.action === 'walkRight') {
            enemy.x += 2;
            if (enemy.x + enemy.width > worldWidth) enemy.x = worldWidth - enemy.width;
        }
    });
    flyingEnemies.forEach(enemy => {
        if (enemy.x < soldier.x) {
            enemy.x += 3;
        } else if (enemy.x > soldier.x) {
            enemy.x -= 3;
        }
    });
}

// Enemy shooting logic
function enemyShoot() {
    const currentTime = Date.now();
    groundEnemies.forEach(enemy => {
        if (currentTime - enemy.lastShot >= enemyShootInterval && gameStarted && !gameOver) {
            enemyBullets.push({
                x: enemy.x,
                y: enemy.y + 5,
                width: 5,
                height: 2.5,
                speed: soldier.x < enemy.x ? -10 : 10,
                distanceTraveled: 0
            });
            enemy.lastShot = currentTime;
        }
    });
    flyingEnemies.forEach(enemy => {
        const distance = Math.abs(enemy.x - soldier.x);
        if (distance <= 10 && currentTime - enemy.lastShot >= enemyShootInterval && gameStarted && !gameOver) {
            const dx = soldier.x - enemy.x;
            const dy = (soldier.y + soldier.height / 2) - (enemy.y + enemy.height / 2);
            const magnitude = Math.sqrt(dx * dx + dy * dy);
            const speed = 10;
            const speedX = magnitude > 0 ? (dx / magnitude) * speed : 0;
            const speedY = magnitude > 0 ? (dy / magnitude) * speed : 0;
            enemyBullets.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                width: 5,
                height: 2.5,
                speedX: speedX,
                speedY: speedY,
                distanceTraveled: 0
            });
            enemy.lastShot = currentTime;
        }
    });
}

// Collision detection
function checkCollisions() {
    playerBullets.forEach(bullet => {
        groundEnemies.forEach(enemy => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                enemy.hits++;
                bullet.distanceTraveled = maxBulletDistance;
            }
        });
        flyingEnemies.forEach(enemy => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                enemy.hits++;
                bullet.distanceTraveled = maxBulletDistance;
            }
        });
    });

    enemyBullets.forEach(bullet => {
        if (
            bullet.x < soldier.x + soldier.width &&
            bullet.x + bullet.width > soldier.x &&
            bullet.y < soldier.y + soldier.height &&
            bullet.y + bullet.height > soldier.y
        ) {
            soldier.damageTaken++;
            bullet.distanceTraveled = maxBulletDistance;
        }
    });

    // Update score and spawn/shoot intervals on kills
    const groundEnemyCount = groundEnemies.length;
    const flyingEnemyCount = flyingEnemies.length;
    groundEnemies = groundEnemies.filter(enemy => enemy.hits < enemy.maxHits);
    flyingEnemies = flyingEnemies.filter(enemy => enemy.hits < enemy.maxHits);
    const newKills = (groundEnemyCount - groundEnemies.length) + (flyingEnemyCount - flyingEnemies.length);
    if (newKills > 0) {
        score += newKills; // 1 point per kill
        killCount += newKills;
        if (killCount >= 10 && killCount % 10 === 0) {
            groundEnemySpawnInterval = Math.max(1000, groundEnemySpawnInterval * 0.95);
            flyingEnemySpawnInterval = Math.max(1000, flyingEnemySpawnInterval * 0.95);
            enemyShootInterval = Math.max(500, enemyShootInterval * 0.99);
        }
    }
}

// Game loop
function gameLoop() {
    if (!gameStarted || gameOver) {
        if (gameOver) {
            gameOverScreen.style.display = 'flex';
            finalScoreText.textContent = `Score: ${score}`;
            return;
        }
        return;
    }

    // Update soldier movement
    if (isMovingLeft) {
        soldier.x -= soldier.speed;
        if (soldier.x < 0) soldier.x = 0;
    }
    if (isMovingRight) {
        soldier.x += soldier.speed;
        if (soldier.x + soldier.width > worldWidth) {
            soldier.x = worldWidth - soldier.width;
        }
    }

    // Update camera position
    const desiredCameraX = soldier.x - canvasWidth / 2 + soldier.width / 2;
    cameraX = Math.max(0, Math.min(desiredCameraX, cameraMaxX));

    // Update soldier physics
    soldier.velocityY += gravity;
    soldier.y += soldier.velocityY;

    if (soldier.y + soldier.height > ground.y) {
        soldier.y = ground.y - soldier.height;
        soldier.velocityY = 0;
        soldier.isJumping = false;
    }

    // Continuous shooting during drag
    if (isShooting) {
        fireBullet();
    }

    // Spawn and update enemies
    spawnGroundEnemies();
    spawnFlyingEnemies();
    updateEnemies();
    enemyShoot();

    // Update bullets
    playerBullets = playerBullets.filter(bullet => bullet.distanceTraveled < maxBulletDistance);
    playerBullets.forEach(bullet => {
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;
        bullet.distanceTraveled += Math.sqrt(bullet.speedX ** 2 + bullet.speedY ** 2);
    });

    enemyBullets = enemyBullets.filter(bullet => bullet.distanceTraveled < maxBulletDistance);
    enemyBullets.forEach(bullet => {
        bullet.x += bullet.speedX || bullet.speed;
        bullet.y += bullet.speedY || 0;
        bullet.distanceTraveled += Math.sqrt((bullet.speedX || bullet.speed) ** 2 + (bullet.speedY || 0) ** 2);
    });

    // Check collisions
    checkCollisions();

    // Check game over
    if (soldier.damageTaken >= soldier.maxHealth) {
        gameOver = true;
    }

    // Clear canvases
    backgroundCtx.clearRect(0, 0, canvasWidth, backgroundCanvas.height);
    ctx.clearRect(0, 0, canvasWidth, gameCanvas.height);

    // Draw background
    backgroundCtx.save();
    backgroundCtx.translate(-cameraX, 0);
    if (backgroundImage.complete && !backgroundImage.error) {
        backgroundCtx.drawImage(backgroundImage, 0, 0, worldWidth, backgroundCanvas.height);
    }
    backgroundCtx.restore();

    // Draw game elements
    ctx.save();
    ctx.translate(-cameraX, 0);

    // Draw ground
    ctx.fillStyle = ground.color;
    ctx.fillRect(0, ground.y, worldWidth, ground.height);

    // Draw player soldier
    ctx.save();
    if (soldier.facingLeft) {
        ctx.scale(-1, 1);
        ctx.translate(-soldier.x - soldier.width, 0);
        ctx.translate(-soldier.width, 0);
    } else {
        ctx.translate(soldier.x, 0);
    }
    if (soldier.isDucking && duckImage.complete && !duckImage.error) {
        ctx.drawImage(duckImage, 0, soldier.y, soldier.width, soldier.height);
    } else if (!soldier.isDucking && playerImage.complete && !playerImage.error) {
        ctx.drawImage(playerImage, 0, soldier.y, soldier.width, soldier.height);
    } else {
        ctx.fillStyle = soldier.color;
        ctx.fillRect(0, soldier.y, soldier.width, soldier.height);
    }
    ctx.restore();

    // Draw ground enemies
    groundEnemies.forEach(enemy => {
        if (enemy.x >= cameraX && enemy.x <= cameraX + canvasWidth) {
            ctx.save();
            if (enemy.facingLeft) {
                ctx.scale(-1, 1);
                ctx.translate(-enemy.x - enemy.width, 0);
                ctx.translate(-enemy.width, 0);
            } else {
                ctx.translate(enemy.x, 0);
            }
            if (enemyImage.complete && !enemyImage.error) {
                ctx.drawImage(enemyImage, 0, enemy.y, enemy.width, enemy.height);
            } else {
                ctx.fillStyle = enemy.color;
                ctx.fillRect(0, enemy.y, enemy.width, enemy.height);
            }
            ctx.restore();
        }
    });

    // Draw flying enemies
    flyingEnemies.forEach(enemy => {
        if (enemy.x >= cameraX && enemy.x <= cameraX + canvasWidth) {
            ctx.save();
            ctx.translate(enemy.x, 0);
            if (droneImage.complete && !droneImage.error) {
                ctx.drawImage(droneImage, 0, enemy.y, enemy.width, enemy.height);
            } else {
                ctx.fillStyle = enemy.color;
                ctx.fillRect(0, enemy.y, enemy.width, enemy.height);
            }
            ctx.restore();
        }
    });

    // Draw player bullets
    ctx.fillStyle = 'yellow';
    playerBullets.forEach(bullet => {
        if (bullet.x >= cameraX && bullet.x <= cameraX + canvasWidth) {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    });

    // Draw enemy bullets
    ctx.fillStyle = 'cyan';
    enemyBullets.forEach(bullet => {
        if (bullet.x >= cameraX && bullet.x <= cameraX + canvasWidth) {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    });

    ctx.restore();

    // Draw HUD (health and score)
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText(`Health: ${soldier.maxHealth - soldier.damageTaken}/${soldier.maxHealth}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
    groundEnemies.forEach((enemy, index) => {
        if (enemy.x >= cameraX && enemy.x <= cameraX + canvasWidth) {
            ctx.fillText(`${enemy.hits}/3`, enemy.x - cameraX, enemy.y - 10);
        }
    });
    flyingEnemies.forEach((enemy, index) => {
        if (enemy.x >= cameraX && enemy.x <= cameraX + canvasWidth) {
            ctx.fillText(`${enemy.hits}/3`, enemy.x - cameraX, enemy.y - 10);
        }
    });

    requestAnimationFrame(gameLoop);
}