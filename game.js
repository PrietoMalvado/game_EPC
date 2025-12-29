const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ===== CONFIG ===== */
const BASE_WIDTH = 800;
const BASE_HEIGHT = 325;
let scale = 1;

/* ===== LOCAL STORAGE ===== */
let highScore = localStorage.getItem("highScore") || 0;
let muted = localStorage.getItem("muted") === "true";

/* ===== RESIZE ===== */
function resizeCanvas() {
  scale = Math.min(
    window.innerWidth / BASE_WIDTH,
    window.innerHeight / BASE_HEIGHT
  );
  canvas.width = BASE_WIDTH * scale;
  canvas.height = BASE_HEIGHT * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* ===== AUDIO ===== */
const music = new Audio("audio/music.wav");
music.loop = true;
music.volume = 0.35;

const gameOverMusic = new Audio("audio/lose.wav");
gameOverMusic.volume = 0.5;

const coinSound = new Audio("audio/coin.wav");
coinSound.volume = 0.6;

music.muted = gameOverMusic.muted = coinSound.muted = muted;

let audioEnabled = false;
function enableAudio() {
  if (!audioEnabled && !muted) {
    music.play().then(() => audioEnabled = true).catch(() => {});
  }
}
function toggleMute() {
  muted = !muted;
  localStorage.setItem("muted", muted);
  music.muted = gameOverMusic.muted = coinSound.muted = muted;
}

/* ===== FONDO ===== */
const bgImage = new Image();
bgImage.src = "img/fondo.png";
let bgX = 0;

/* ===== SPRITES ===== */
const playerImg = new Image();
playerImg.src = "img/player.png";

const enemyImg = new Image();
enemyImg.src = "img/enemy.png";

const enemyFlyImg = new Image();
enemyFlyImg.src = "img/enemy_fly.png";

/* ===== ESTADO ===== */
let score = 0;
let coinsCollected = 0;
let gameOver = false;

/* ===== DIFICULTAD ===== */
let difficultyLevel = 1;
let gameSpeed = 5;
let obstacleInterval = 1400;
let coinInterval = 1000;

/* ===== JUGADOR ===== */
const player = {
  x: 80,
  y: 220,
  width: 30,
  height: 30,
  vy: 0,
  gravity: 1,
  jumpPower: -15,
  grounded: true
};

/* ===== OBJETOS ===== */
const obstacles = [];
const coins = [];
const flyingEnemies = [];

/* ===== INPUT ===== */
document.addEventListener("keydown", e => {
  enableAudio();
  if (e.code === "Space") jump();
  if (e.code === "KeyM") toggleMute();
  if (e.code === "Enter" && gameOver) resetGame();
});

canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  enableAudio();

  const rect = canvas.getBoundingClientRect();
  const x = (e.touches[0].clientX - rect.left) / scale;
  const y = (e.touches[0].clientY - rect.top) / scale;

  if (x > 740 && y < 40) {
    toggleMute();
    return;
  }

  gameOver ? resetGame() : jump();
});

/* ===== GAME ===== */
function jump() {
  if (player.grounded && !gameOver) {
    player.vy = player.jumpPower;
    player.grounded = false;
  }
}

function resetGame() {
  obstacles.length = 0;
  coins.length = 0;
  flyingEnemies.length = 0;

  score = 0;
  coinsCollected = 0;
  difficultyLevel = 1;
  gameSpeed = 5;
  obstacleInterval = 1400;
  coinInterval = 1000;
  gameOver = false;
  player.y = 220;
  player.vy = 0;

  gameOverMusic.pause();
  gameOverMusic.currentTime = 0;

  if (!muted) {
    music.currentTime = 0;
    music.play();
  }

  clearIntervals();
  startIntervals();
  loop();
}

/* ===== DIFICULTAD PROGRESIVA ===== */
function updateDifficulty() {
  const newLevel = Math.floor(score / 200) + 1;

  if (newLevel !== difficultyLevel) {
    difficultyLevel = newLevel;

    gameSpeed = Math.min(12, 5 + difficultyLevel * 0.7);
    obstacleInterval = Math.max(600, 1400 - difficultyLevel * 100);
    coinInterval = Math.max(700, 1000 - difficultyLevel * 50);

    clearIntervals();
    startIntervals();
  }
}

/* ===== SPAWN ===== */
let obstacleTimer, coinTimer, flyingTimer;

function startIntervals() {
  obstacleTimer = setInterval(spawnObstacle, obstacleInterval);
  coinTimer = setInterval(spawnCoin, coinInterval);

  if (difficultyLevel >= 3) {
    flyingTimer = setInterval(spawnFlyingEnemy, 2200);
  }
}

function clearIntervals() {
  clearInterval(obstacleTimer);
  clearInterval(coinTimer);
  clearInterval(flyingTimer);
}

function spawnObstacle() {
  const size = 20 + Math.random() * (difficultyLevel * 5);
  obstacles.push({
    x: BASE_WIDTH,
    y: 250 - size,
    width: size,
    height: size
  });
}

function spawnCoin() {
  const pattern = difficultyLevel >= 4 ? 3 : 1;
  for (let i = 0; i < pattern; i++) {
    coins.push({
      x: BASE_WIDTH + i * 25,
      y: 160 + Math.random() * 60,
      size: 20
    });
  }
}

function spawnFlyingEnemy() {
  flyingEnemies.push({
    x: BASE_WIDTH,
    y: 155 + Math.random() * 70,
    width: 28,
    height: 28
  });
}

/* ===== UPDATE ===== */
function updatePlayer() {
  player.y += player.vy;
  player.vy += player.gravity;
  if (player.y >= 220) {
    player.y = 220;
    player.vy = 0;
    player.grounded = true;
  }
}

function updateBackground() {
  bgX -= gameSpeed * 0.4;
  if (bgX <= -BASE_WIDTH) bgX = 0;
}

function updateObjects(list, sizeKey = "width") {
  list.forEach(o => o.x -= gameSpeed);
  while (list.length && list[0].x + (list[0][sizeKey] || list[0].size) < 0) {
    list.shift();
  }
}

function collision(a, b) {
  return (
    a.x < b.x + (b.width || b.size) &&
    a.x + a.width > b.x &&
    a.y < b.y + (b.height || b.size) &&
    a.y + a.height > b.y
  );
}

function checkCollisions() {
  for (let o of obstacles) {
    if (collision(player, o)) endGame();
  }

  for (let f of flyingEnemies) {
    if (collision(player, f)) endGame();
  }

  for (let i = coins.length - 1; i >= 0; i--) {
    if (collision(player, coins[i])) {
      coins.splice(i, 1);
      coinsCollected++;
      score += 10;
      if (!muted) {
        coinSound.currentTime = 0;
        coinSound.play();
      }
    }
  }
}

function endGame() {
  gameOver = true;
  music.pause();

  if (score > highScore) {
    highScore = Math.floor(score);
    localStorage.setItem("highScore", highScore);
  }

  if (!muted) {
    gameOverMusic.currentTime = 0;
    gameOverMusic.play();
  }
}

function update() {
  updateDifficulty();
  updateBackground();
  updatePlayer();
  updateObjects(obstacles);
  updateObjects(coins, "size");
  updateObjects(flyingEnemies);
  checkCollisions();
  score += 0.05;
}

/* ===== DRAW ===== */
function drawBackground() {
  ctx.drawImage(bgImage, bgX, 0, BASE_WIDTH, BASE_HEIGHT);
  ctx.drawImage(bgImage, bgX + BASE_WIDTH, 0, BASE_WIDTH, BASE_HEIGHT);
  ctx.fillStyle = "#444";
  ctx.fillRect(0, 250, BASE_WIDTH, 40);
}

function drawPlayer() {
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

function drawObstacles() {
  obstacles.forEach(o =>
    ctx.drawImage(enemyImg, o.x, o.y, o.width, o.height)
  );
}

function drawFlyingEnemies() {
  flyingEnemies.forEach(f =>
    ctx.drawImage(enemyFlyImg, f.x, f.y, f.width, f.height)
  );
}

function drawCoins() {
  ctx.fillStyle = "gold";
  coins.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + Math.floor(score), 10, 20);
  ctx.fillText("HighScore: " + highScore, 10, 40);
  ctx.fillText("Level: " + difficultyLevel, 10, 60);

  ctx.fillStyle = "rgba(0,0,0,0.01)";
  ctx.fillRect(740, 5, 55, 30);
  ctx.fillStyle = "white";
  ctx.fillText(muted ? "🔇" : "🔊", 758, 25);

  if (gameOver) {
    ctx.font = "26px Arial";
    ctx.fillText("GAME OVER", 320, 130);
    ctx.font = "16px Arial";
    ctx.fillText("Toca o presiona ENTER", 300, 165);
  }
}

/* ===== LOOP ===== */
function loop() {
  ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  drawBackground();
  update();
  drawPlayer();
  drawObstacles();
  drawFlyingEnemies();
  drawCoins();
  drawUI();
  if (!gameOver) requestAnimationFrame(loop);
}

/* ===== START ===== */
startIntervals();
loop();
