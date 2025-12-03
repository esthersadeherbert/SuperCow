//--------------------------------------------------
// SCALE GAME TO ANY PHONE SIZE
//--------------------------------------------------
function scaleGame() {
  const gw = document.getElementById("game-wrapper");
  const scaleX = window.innerWidth / 1080;
  const scaleY = window.innerHeight / 1920;
  const scale = Math.min(scaleX, scaleY);
  gw.style.transform = `scale(${scale})`;
}
window.addEventListener("resize", scaleGame);
window.addEventListener("load", scaleGame);

//--------------------------------------------------
// START SCREEN LOGIC + COUNTDOWN
//--------------------------------------------------
const startScreen = document.getElementById("start-screen");
const playBtn = document.getElementById("play-btn");
let gameStarted = false;

// Countdown overlay + number
const countdownOverlay = document.getElementById("countdown-overlay");
const countdownEl = document.getElementById("countdown");
const beepSound = new Audio("sounds/beep.mp3");

playBtn.addEventListener("click", () => {
  // hide start screen visually
  startScreen.classList.add("fade-out");

  setTimeout(() => {
    startScreen.style.display = "none";

    // Start 3-second full-screen countdown
    startCountdownAndGame();
  }, 600);
});

function startCountdownAndGame() {
  let counter = 3;

  countdownEl.textContent = counter;

  // Show overlay
  countdownOverlay.classList.remove("hidden");
  setTimeout(() => countdownOverlay.classList.add("show"), 10);

  const countdownInterval = setInterval(() => {
    // Play beep
    beepSound.currentTime = 0;
    beepSound.play();

    // Pop animation
    countdownEl.classList.add("pop");
    setTimeout(() => countdownEl.classList.remove("pop"), 200);

    counter--;
    countdownEl.textContent = counter;

    if (counter === 0) {
      clearInterval(countdownInterval);

      // Fade out overlay
      countdownOverlay.classList.remove("show");

      setTimeout(() => {
        countdownOverlay.classList.add("hidden");

        // Start actual gameplay
        gameStarted = true;
        startTimer();
        playBackgroundMusic();
      }, 300);
    }
  }, 1000);
}

let timeLeft = 30;
let timerStarted = false;

// Popup elements
const winnerPopup = document.getElementById("winner-popup");
const gameOverPopup = document.getElementById("gameover-popup");
const finalScoreText = document.getElementById("final-score");
const gameOverScoreText = document.getElementById("gameover-score");
const timerUI = document.getElementById("timer");

// MUTE BUTTON
const muteBtn = document.getElementById("mute-btn");

//--------------------------------------------------
// CANVAS
//--------------------------------------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1080;
canvas.height = 1920;

//--------------------------------------------------
// AUDIO
//--------------------------------------------------
const bgMusic = document.getElementById("bg-music");
const sfxCollect = document.getElementById("sfx-collect");
const sfxHit = document.getElementById("sfx-hit");

bgMusic.volume = 0.5;
sfxCollect.volume = 0.9;
sfxHit.volume = 0.9;

let isMuted = false;

function updateMuteUI() {
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
}

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  bgMusic.muted = isMuted;
  sfxCollect.muted = isMuted;
  sfxHit.muted = isMuted;
  updateMuteUI();
});
updateMuteUI();

function playBackgroundMusic() {
  bgMusic.currentTime = 0;
  bgMusic.play().catch((e) => console.warn("bgMusic play failed:", e));
}

function playCollectSfx() {
  if (!isMuted) {
    sfxCollect.currentTime = 0;
    sfxCollect.play().catch(() => {});
  }
}

function playHitSfx() {
  if (!isMuted) {
    sfxHit.currentTime = 0;
    sfxHit.play().catch(() => {});
  }
}

//--------------------------------------------------
// BEST SCORE (localStorage)
//--------------------------------------------------
let bestScore = Number(localStorage.getItem("bestScore") || 0);

function updateBestScoreUI() {
  const elStart = document.getElementById("best-score-start");
  const elWin = document.getElementById("best-score-win");
  const elLose = document.getElementById("best-score-lose");

  if (elStart) elStart.textContent = bestScore;
  if (elWin) elWin.textContent = bestScore;
  if (elLose) elLose.textContent = bestScore;
}
updateBestScoreUI();

//--------------------------------------------------
// END GAME (updated to show popups + best score)
//--------------------------------------------------
function showPopup(popupEl) {
  if (!popupEl) return;
  popupEl.classList.remove("hidden");
  // prefer .show-popup CSS (your CSS should define show-popup -> visible)
  popupEl.classList.add("show-popup");
}

function hidePopup(popupEl) {
  if (!popupEl) return;
  popupEl.classList.remove("show-popup");
  // keep element visible until animation finishes, then hide
  setTimeout(() => {
    popupEl.classList.add("hidden");
  }, 320);
}

function endGameWinner() {
  gameStarted = false;
  bgMusic.pause();

  // update current results
  if (finalScoreText) finalScoreText.textContent = score;
  // update best score if needed
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("bestScore", bestScore);
    updateBestScoreUI();
  }
  // show winner popup
  showPopup(winnerPopup);
}

function endGameOver() {
  gameStarted = false;
  bgMusic.pause();

  if (gameOverScoreText) gameOverScoreText.textContent = score;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("bestScore", bestScore);
    updateBestScoreUI();
  }
  showPopup(gameOverPopup);
}

//--------------------------------------------------
// RESTART (reset internal state & show start screen)
//--------------------------------------------------
function restartGame() {
  // hide popups if any
  hidePopup(winnerPopup);
  hidePopup(gameOverPopup);

  // reset game variables
  score = 0;
  document.getElementById("score").textContent = score;
  timeLeft = 30;
  timerStarted = false;
  timerUI.textContent = timeLeft;

  player.lives = 3;
  updateLivesUI();

  enemies = [];
  collectibles = [];
  lastEnemySpawn = 0;
  lastCollectSpawn = 0;
  pulseTimer = 0;

  // stop music
  try {
    bgMusic.pause();
  } catch (e) {}

  // show the start screen again
  startScreen.style.display = "flex";
  // remove fade-out in case it was added
  startScreen.classList.remove("fade-out");

  // ensure best score UI on start screen updated
  updateBestScoreUI();
}

//--------------------------------------------------
// LOAD IMAGES
//--------------------------------------------------
const playerImg = new Image();
playerImg.src = "assets/player.png";

const enemySprites = [
  "enemy1.png",
  "enemy2.png",
  "enemy3.png",
].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

const collectSprites = ["assets/collect1.png", "assets/collect2.png"].map(
  (src) => {
    const img = new Image();
    img.src = src;
    return img;
  }
);

// CLOUDS
const cloudImages = [
  "cloud1.png",
  "cloud2.png",
  "cloud3.png",
].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

// CLOUD OBJECTS (positions + speed)
let clouds = [
  { x: 100, y: 200, speed: 0.3, img: cloudImages[0] },
  { x: 600, y: 600, speed: 0.2, img: cloudImages[1] },
  { x: -200, y: 1000, speed: 0.15, img: cloudImages[2] },
];

//--------------------------------------------------
// BACKGROUND: reuse the same image as the start screen
// (start-bg exists in your HTML) -> copy src into bgImage
//--------------------------------------------------
const startBgEl = document.getElementById("start-bg");
const bgImage = new Image();
if (startBgEl && startBgEl.src) {
  bgImage.src = startBgEl.src;
} else {
  // fallback: a simple gradient drawn when image isn't available
  bgImage.onload = () => {};
}

//--------------------------------------------------
// PLAYER
//--------------------------------------------------
const player = {
  x: 1080 / 2 - 120,
  y: 1500,
  w: 180,
  h: 180,
  targetX: 1080 / 2 - 120,
  targetY: 1500,
  lives: 3,
  invincible: false,
  blinkTimer: 0,
  shakeTimer: 0,
};

//--------------------------------------------------
// GAME ELEMENTS
//--------------------------------------------------
let enemies = [];
let collectibles = [];
let score = 0;

let lastEnemySpawn = 0;
let lastCollectSpawn = 0;

const enemyRate = 900;
const collectRate = 1500;

let pulseTimer = 0;

//--------------------------------------------------
// UPDATE HEART UI
//--------------------------------------------------
function updateLivesUI() {
  const livesEl = document.getElementById("lives");
  if (livesEl) livesEl.innerHTML = "❤️".repeat(player.lives);
}

// initial update
updateLivesUI();

//--------------------------------------------------
// PLAYER MOVEMENT
//--------------------------------------------------
function setPlayerPosition(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / 1080;
  const scaleY = rect.height / 1920;

  const xOnCanvas = (clientX - rect.left) / scaleX;
  const yOnCanvas = (clientY - rect.top) / scaleY;

  player.targetX = xOnCanvas - player.w / 2;
  player.targetY = yOnCanvas - player.h / 2;
}

// MOUSE
canvas.addEventListener("mousedown", (e) => {
  setPlayerPosition(e.clientX, e.clientY);
  canvas.addEventListener("mousemove", dragMove);
});
canvas.addEventListener("mouseup", () => {
  canvas.removeEventListener("mousemove", dragMove);
});
function dragMove(e) {
  setPlayerPosition(e.clientX, e.clientY);
}

// TOUCH
canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  setPlayerPosition(t.clientX, t.clientY);
});
canvas.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  setPlayerPosition(t.clientX, t.clientY);
});

//--------------------------------------------------
// TIMER
//--------------------------------------------------
function startTimer() {
  if (timerStarted) return;
  timerStarted = true;

  timerUI.textContent = timeLeft;

  const countdown = setInterval(() => {
    if (!gameStarted) {
      clearInterval(countdown);
      return;
    }

    timeLeft--;
    timerUI.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(countdown);
      endGameWinner();
    }
  }, 1000);
}

//--------------------------------------------------
// CLOUD DRAW
//--------------------------------------------------
function drawBackgroundClouds() {
  clouds.forEach((cloud) => {
    cloud.x += cloud.speed;
    if (cloud.x > 1300) cloud.x = -400;

    // subtle parallax by varying alpha/scale per cloud
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.drawImage(cloud.img, cloud.x, cloud.y, 420, 220);
    ctx.restore();
  });
}

//--------------------------------------------------
// GAME LOOP
//--------------------------------------------------
function gameLoop(timestamp) {
  // draw background image if available, otherwise a gradient
  if (bgImage && bgImage.complete && bgImage.naturalWidth !== 0) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  } else {
    // fallback gradient
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#a7ecff");
    g.addColorStop(1, "#fff6ff");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // clouds behind everything else
  drawBackgroundClouds();

  if (gameStarted) {
    updatePlayer();
    spawnEnemies(timestamp);
    spawnCollectibles(timestamp);
    updateEnemies();
    updateCollectibles();
    checkCollisions();

    // draw player & other dynamic things handled in update functions
  } else {
    drawIdleDecor();
  }

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// idle background bubbles
function drawIdleDecor() {
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    const x = (i + 1) * 150 + Math.sin(Date.now() / 2000 + i) * 30;
    const y = 300 + Math.cos(Date.now() / 1700 + i) * 40;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.arc(x, y, 80 + (i % 3) * 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // also draw the player idle if desired
  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
}

//--------------------------------------------------
// UPDATE PLAYER (MOVEMENT + BLINK + SHAKE)
//--------------------------------------------------
function updatePlayer() {
  // smooth follow
  player.x += (player.targetX - player.x) * 0.2;
  player.y += (player.targetY - player.y) * 0.2;

  // Boundaries
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;
  if (player.y < 0) player.y = 0;
  if (player.y + player.h > canvas.height) player.y = canvas.height - player.h;

  ctx.save();

  // Shake effect
  if (player.shakeTimer > 0) {
    player.shakeTimer--;
    const shakeX = Math.sin(player.shakeTimer * 0.6) * 20;
    const shakeY = Math.cos(player.shakeTimer * 0.6) * 20;
    ctx.translate(shakeX, shakeY);
  }

  // Blink (invincible)
  if (player.invincible) {
    player.blinkTimer++;
    if (Math.floor(player.blinkTimer / 5) % 2 === 0) {
      ctx.globalAlpha = 0.2;
    }
  }

  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
  ctx.restore();
}

//--------------------------------------------------
// SPAWN ENEMIES
//--------------------------------------------------
function spawnEnemies(timestamp) {
  if (timestamp - lastEnemySpawn > enemyRate) {
    const sprite =
      enemySprites[Math.floor(Math.random() * enemySprites.length)];

    enemies.push({
      x: Math.random() * (1080 - 200),
      y: -200,
      w: 160,
      h: 160,
      speed: 4 + Math.random() * 3,
      img: sprite,
    });

    lastEnemySpawn = timestamp;
  }
}

//--------------------------------------------------
// SPAWN COLLECTIBLES
//--------------------------------------------------
function spawnCollectibles(timestamp) {
  if (timestamp - lastCollectSpawn > collectRate) {
    const sprite =
      collectSprites[Math.floor(Math.random() * collectSprites.length)];

    collectibles.push({
      x: Math.random() * (1080 - 150),
      y: -200,
      w: 120,
      h: 120,
      speed: 5,
      img: sprite,
    });

    lastCollectSpawn = timestamp;
  }
}

//--------------------------------------------------
// UPDATE ENEMIES
//--------------------------------------------------
function updateEnemies() {
  enemies.forEach((e, i) => {
    e.y += e.speed;
    if (e.y > canvas.height + 200) enemies.splice(i, 1);

    ctx.drawImage(e.img, e.x, e.y, e.w, e.h);
  });
}

//--------------------------------------------------
// UPDATE COLLECTIBLES
//--------------------------------------------------
function updateCollectibles() {
  pulseTimer += 0.07;

  collectibles.forEach((c, i) => {
    c.y += c.speed;
    if (c.y > canvas.height + 200) collectibles.splice(i, 1);

    const pulse = (Math.sin(pulseTimer) + 1) / 2;
    const glowSize = 20 + pulse * 40;
    const glowAlpha = 0.4 + pulse * 0.6;

    ctx.save();
    ctx.shadowColor = `rgba(255,255,160,${glowAlpha})`;
    ctx.shadowBlur = glowSize;
    ctx.drawImage(c.img, c.x, c.y, c.w, c.h);
    ctx.restore();
  });
}

//--------------------------------------------------
// COLLISIONS
//--------------------------------------------------
function checkCollisions() {
  // ENEMIES
  enemies.forEach((e, i) => {
    if (!player.invincible && isColliding(player, e)) {
      enemies.splice(i, 1);

      player.lives--;
      updateLivesUI();

      player.invincible = true;
      player.blinkTimer = 0;
      player.shakeTimer = 20;

      setTimeout(() => {
        player.invincible = false;
      }, 1000);

      playHitSfx();

      if (player.lives <= 0) {
        endGameOver();
      }
    }
  });

  // COLLECTIBLES
  collectibles.forEach((c, i) => {
    if (isColliding(player, c)) {
      score += 20;
      const scoreEl = document.getElementById("score");
      if (scoreEl) scoreEl.textContent = score;

      // update best immediately if you want live best update:
      // if (score > bestScore) { bestScore = score; localStorage.setItem("bestScore", bestScore); updateBestScoreUI(); }

      collectibles.splice(i, 1);
      playCollectSfx();
    }
  });
}

//--------------------------------------------------
// AABB COLLISION
//--------------------------------------------------
function isColliding(a, b) {
  return !(
    a.x + a.w < b.x ||
    a.x > b.x + b.w ||
    a.y + a.h < b.y ||
    a.y > b.y + b.h
  );
}

//--------------------------------------------------
// INIT
//--------------------------------------------------
updateLivesUI();
updateBestScoreUI();
