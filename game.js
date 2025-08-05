const backgroundCanvas = document.getElementById('backgroundCanvas');
const gameCanvas = document.getElementById('gameCanvas');
const backgroundCtx = backgroundCanvas.getContext('2d');
const ctx = gameCanvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');
const loadingScreen = document.getElementById('loadingScreen');
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

// Load background image
const backgroundImage = new Image();
backgroundImage.src = 'background.png';

// Player soldier properties
const soldier = {
    x: 50,
    y: 280, // Adjusted for taller ground
    width: 20,
    height: 30,
    speed: 5,
    jumpPower: 15,
    velocityY: 0,
    isJumping: false,
    isDucking: false,
    color: 'red',
    hits: 0,
    maxHits: 50
};

// Ground properties
const ground = {
    y: 310, // Adjusted to make ground taller
    height: 90, // Increased from 60
    color: 'green'
};

// Arrays and game state
let playerBullets = [];
let enemyBullets = [];
let enemies = [];
let gameOver = false;
let gameStarted = false;
let lastSpawnTime = 0;
let isMovingLeft = false;
let isMovingRight = false;
let isShooting = false;
let shootDirection = { x: 0, y: 0 };

// Game constants
const gravity = 0.6;
const maxBulletDistance = 300;
const shootInterval = 200; // Fire every 200ms during drag
let lastShotTime = 0;

// Button references
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const jumpBtn = document.getElementById('jumpBtn');
const duckBtn = document.getElementById('duckBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// Initialize button visibility
startBtn.classList.add('active');
jumpBtn.style.display = 'none';
duckBtn.style.display = 'none';
leftBtn.style.display = 'none';
rightBtn.style.display = 'none';
shootBtn.style.display = 'none';

// Show loading screen for 3 seconds, then reveal game
setTimeout(() => {
    loadingScreen.style.display = 'none';
    gameContainer.style.display = 'block';
}, 3000);

// Button event listeners
startBtn.addEventListener('click', () => {
    gameStarted = true;
    startBtn.classList.remove('active');
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
    soldier.y = 280;
    soldier.velocityY = 0;
    soldier.isJumping = false;
    soldier.isDucking = false;
    soldier.hits = 0;
    playerBullets = [];
    enemyBullets = [];
    enemies = [];
    gameOver = false;
    gameStarted = true;
    isMovingLeft = false;
    isMovingRight = false;
    isShooting = false;
    shootDirection = { x: 0, y: 0 };
    lastSpawnTime = Date.now();
    cameraX = 0;
    analogThumb.style.transform = 'translate(0, 0)';
    restartBtn.classList.remove('active');
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

leftBtn.addEventListener('mousedown', () => {
    if (gameStarted && !gameOver) isMovingLeft = true;
});
leftBtn.addEventListener('mouseup', () => {
    isMovingLeft = false;
});
leftBtn.addEventListener('mouseout', () => {
    isMovingLeft = false;
});
leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameStarted && !gameOver) isMovingLeft = true;
});
leftBtn.addEventListener('touchend', () => {
    isMovingLeft = false;
});
leftBtn.addEventListener('touchcancel', () => {
    isMovingLeft = false;
});

rightBtn.addEventListener('mousedown', () => {
    if (gameStarted && !gameOver) isMovingRight = true;
});
rightBtn.addEventListener('mouseup', () => {
    isMovingRight = false;
});
rightBtn.addEventListener('mouseout', () => {
    isMovingRight = false;
});
rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameStarted && !gameOver) isMovingRight = true;
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
    const maxDistance = 15; // Max thumb movement (half of button radius - thumb radius)
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    if (magnitude > maxDistance) {
        dx = (dx / magnitude) * maxDistance;
        dy = (dy / magnitude) * maxDistance;
    }
    analogThumb.style.transform = `translate(${dx}px, ${dy}px)`;
    shootDirection = { x: dx / maxDistance, y: dy / maxDistance };
    if (magnitude === 0) shootDirection = { x: 0, y: 0 };
}

function fireBullet() {
    if (shootDirection.x === 0 && shootDirection.y === 0) return;
    const currentTime = Date.now();
    if (currentTime - lastShotTime >= shootInterval) {
        const bulletSpeed = 10;
        playerBullets.push({
            x: soldier.x + soldier.width,
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

// Spawn enemy soldiers
function spawnEnemies() {
    const currentTime = Date.now();
    if (currentTime - lastSpawnTime >= 5000 && gameStarted && !gameOver) {
        for (let i = 0; i < 2; i++) {
            enemies.push({
                x: cameraX + canvasWidth + Math.random() * (worldWidth - cameraX - canvasWidth - 20),
                y: ground.y - 30,
                width: 20,
                height: 30,
                color: 'blue',
                hits: 0,
                maxHits: 3,
                lastShot: 0
            });
        }
        lastSpawnTime = currentTime;
    }
}

// Enemy shooting logic
function enemyShoot() {
    const currentTime = Date.now();
    enemies.forEach(enemy => {
        if (currentTime - enemy.lastShot >= 2000 && gameStarted && !gameOver) {
            enemyBullets.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                width: 5,
                height: 2.5,
                speed: -10,
                distanceTraveled: 0
            });
            enemy.lastShot = currentTime;
        }
    });
}

// Collision detection
function checkCollisions() {
    playerBullets.forEach(bullet => {
        enemies.forEach(enemy => {
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
            soldier.hits++;
            bullet.distanceTraveled = maxBulletDistance;
        }
    });

    enemies = enemies.filter(enemy => enemy.hits < enemy.maxHits);
}

// Game loop
function gameLoop() {
    if (!gameStarted || gameOver) {
        if (gameOver) {
            ctx.fillStyle = 'black';
            ctx.font = '48px Arial';
            ctx.fillText('Game Over', canvasWidth / 2 - 100, gameCanvas.height / 2);
            restartBtn.classList.add('active');
            jumpBtn.style.display = 'none';
            duckBtn.style.display = 'none';
            leftBtn.style.display = 'none';
            rightBtn.style.display = 'none';
            shootBtn.style.display = 'none';
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

    // Spawn and shoot enemies
    spawnEnemies();
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
        bullet.x += bullet.speed;
        bullet.distanceTraveled += Math.abs(bullet.speed);
    });

    // Check collisions
    checkCollisions();

    // Check game over
    if (soldier.hits >= soldier.maxHits) {
        gameOver = true;
    }

    // Clear canvases
    backgroundCtx.clearRect(0, 0, canvasWidth, backgroundCanvas.height);
    ctx.clearRect(0, 0, canvasWidth, gameCanvas.height);

    // Draw background
    backgroundCtx.save();
    backgroundCtx.translate(-cameraX, 0);
    if (backgroundImage.complete) {
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
    ctx.fillStyle = soldier.color;
    ctx.fillRect(soldier.x, soldier.y, soldier.width, soldier.height);

    // Draw enemies
    ctx.fillStyle = 'blue';
    enemies.forEach(enemy => {
        if (enemy.x >= cameraX && enemy.x <= cameraX + canvasWidth) {
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
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

    // Draw hit counters
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText(`Player Hits: ${soldier.hits}/${soldier.maxHits}`, 10, 20);
    enemies.forEach((enemy, index) => {
        if (enemy.x >= cameraX && enemy.x <= cameraX + canvasWidth) {
            ctx.fillText(`${enemy.hits}/3`, enemy.x - cameraX, enemy.y - 10);
        }
    });

    requestAnimationFrame(gameLoop);
}