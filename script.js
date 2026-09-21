const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const stageLabel = document.getElementById('stageLabel');
const statusLabel = document.getElementById('statusLabel');
const messageBox = document.getElementById('messageBox');

const TOTAL_STAGES = 100;
const groundY = canvas.height - 70;
const gravity = 1700;
const jumpPower = 700;
const moveSpeed = 320;

const keys = {
  ArrowRight: false,
  ArrowLeft: false,
  KeyD: false,
  KeyA: false,
  Space: false,
};

let currentStage = 0;
let stageData = [];
let player = null;
let cameraX = 0;
let lastTime = 0;
let started = false;
let gameRunning = false;
let messageTimer = 0;

function showMessage(text, duration = 1) {
  messageBox.textContent = text;
  messageBox.classList.add('visible');
  messageTimer = duration;
}

function hideMessage() {
  messageBox.classList.remove('visible');
}

function generateStage(levelIndex) {
  const stageNumber = levelIndex + 1;
  const difficulty = Math.min(stageNumber * 0.18, 18);
  const width = 1800 + stageNumber * 22;
  const finishX = width - 120;
  const obstacleCount = Math.min(3 + Math.floor(stageNumber / 9), 12);
  const obstacles = [];
  let x = 360;

  for (let i = 0; i < obstacleCount; i++) {
    const baseW = 28 + Math.random() * 26 + difficulty * 0.7;
    const h = 34 + Math.random() * 36 + difficulty * 1.3;
    const y = groundY - h;
    const gap = 150 + Math.random() * 90 + difficulty * 5;
    x += gap;

    obstacles.push({
      x: x,
      y,
      w: baseW,
      h,
    });
  }

  return {
    width,
    finishX,
    obstacles,
    stageNumber,
    theme: getTheme(stageNumber),
  };
}

function getTheme(stageNumber) {
  if (stageNumber <= 10) return 'شارع عربي';
  if (stageNumber <= 20) return 'حي عربي';
  if (stageNumber <= 30) return 'سوق';
  if (stageNumber <= 40) return 'صحراء';
  if (stageNumber <= 50) return 'جبل';
  if (stageNumber <= 60) return 'مدينة';
  if (stageNumber <= 80) return 'طريق سريع';
  return 'منطقة متقدمة';
}

function resetPlayer() {
  return {
    x: 110,
    y: groundY - 52,
    w: 34,
    h: 52,
    vy: 0,
    onGround: true,
    dir: 1,
  };
}

function initStages() {
  stageData = Array.from({ length: TOTAL_STAGES }, (_, index) => generateStage(index));
}

function resetStage() {
  const active = stageData[currentStage];
  player = resetPlayer();
  cameraX = 0;
  statusLabel.textContent = active.theme;
  stageLabel.textContent = `${currentStage + 1} / ${TOTAL_STAGES}`;
}

function startGame() {
  started = true;
  gameRunning = true;
  currentStage = 0;
  initStages();
  resetStage();
  hideMessage();
  startOverlay.classList.remove('visible');
  showMessage('ابدأ!', 1.2);
}

function nextStage() {
  if (currentStage < TOTAL_STAGES - 1) {
    currentStage += 1;
    resetStage();
    showMessage(`المرحلة ${currentStage + 1}`, 1.4);
  } else {
    gameRunning = false;
    started = false;
    showMessage('أتممت كل المراحل', 2.2);
    startOverlay.classList.add('visible');
    startOverlay.querySelector('h1').textContent = 'انتهت اللعبة';
    startOverlay.querySelector('p').textContent = 'لقد أكملت جميع 100 مرحلة بنجاح.';
    startBtn.textContent = 'إعادة اللعب';
  }
}

function handleDeath() {
  gameRunning = false;
  showMessage('تموت! أعد المحاولة', 1.7);
  setTimeout(() => {
    if (started) {
      resetStage();
      gameRunning = true;
    }
  }, 700);
}

function checkCollisions() {
  const active = stageData[currentStage];
  for (const obstacle of active.obstacles) {
    const playerRight = player.x + player.w;
    const playerBottom = player.y + player.h;
    const obstacleRight = obstacle.x + obstacle.w;
    const obstacleBottom = obstacle.y + obstacle.h;

    const overlaps =
      playerRight > obstacle.x &&
      player.x < obstacleRight &&
      playerBottom > obstacle.y &&
      player.y < obstacleBottom;

    if (overlaps) {
      handleDeath();
      return;
    }
  }
}

function updatePlayer(dt) {
  const moveDir = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
  if (moveDir !== 0) {
    player.x += moveDir * moveSpeed * dt;
    player.dir = moveDir;
  }

  if ((keys.ArrowUp || keys.Space) && player.onGround) {
    player.vy = -jumpPower;
    player.onGround = false;
  }

  player.vy += gravity * dt;
  player.y += player.vy * dt;

  if (player.y + player.h >= groundY) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  const maxX = stageData[currentStage].width - player.w;
  player.x = Math.max(80, Math.min(player.x, maxX));

  cameraX = Math.max(0, Math.min(player.x - canvas.width * 0.35, stageData[currentStage].width - canvas.width));

  if (player.x + player.w >= stageData[currentStage].finishX) {
    nextStage();
  }

  checkCollisions();
}

function drawBackground(theme) {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#9ec9ff');
  sky.addColorStop(0.5, '#d6ebff');
  sky.addColorStop(1, '#eef9ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const sunX = canvas.width * 0.82;
  const sunY = 90;
  ctx.fillStyle = 'rgba(255,213,79,0.9)';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 42, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 18; i++) {
    const x = (i * 120 - cameraX * 0.2) % (canvas.width + 200);
    const h = 50 + (i % 5) * 26;
    ctx.fillStyle = 'rgba(95, 115, 140, 0.38)';
    ctx.fillRect(x, canvas.height - 210 - h, 80, h + 110);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let row = 0; row < 5; row++) {
      ctx.fillRect(x + 12, canvas.height - 180 - h + row * 22, 12, 10);
      ctx.fillRect(x + 30, canvas.height - 180 - h + row * 22, 12, 10);
      ctx.fillRect(x + 48, canvas.height - 180 - h + row * 22, 12, 10);
    }
  }

  const roadY = groundY + 10;
  ctx.fillStyle = '#3f4c57';
  ctx.fillRect(0, roadY, canvas.width, canvas.height - roadY);

  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(-cameraX * 0.8, roadY + 12, stageData[currentStage].width, 8);

  for (let i = 0; i < 14; i++) {
    const x = (-cameraX * 0.8) + i * 110;
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(x, roadY + 40, 56, 12);
    ctx.fillStyle = '#333';
    ctx.fillRect(x + 10, roadY + 46, 38, 4);
  }

  ctx.fillStyle = '#2a2f36';
  ctx.fillRect(0, groundY, canvas.width, 8);

  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, groundY + 8, canvas.width, 70);

  ctx.fillStyle = '#d8f0ff';
  ctx.font = '16px Tahoma';
  ctx.fillText(theme, 28, 34);
}

function drawFinishLine() {
  const active = stageData[currentStage];
  const x = active.finishX - cameraX;
  ctx.fillStyle = '#ffd54a';
  ctx.fillRect(x, groundY - 78, 10, 78);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 18, groundY - 72, 42, 12);
}

function drawObstacles() {
  const active = stageData[currentStage];
  for (const obstacle of active.obstacles) {
    const drawX = obstacle.x - cameraX;
    ctx.fillStyle = '#db3d3d';
    ctx.fillRect(drawX, obstacle.y, obstacle.w, obstacle.h);
    ctx.fillStyle = '#8f1d1d';
    ctx.fillRect(drawX + 6, obstacle.y + 6, obstacle.w - 12, obstacle.h - 12);
  }
}

function drawPlayer() {
  const px = player.x - cameraX;
  ctx.fillStyle = '#1d4f8c';
  ctx.fillRect(px, player.y, player.w, player.h);
  ctx.fillStyle = '#5ea3ff';
  ctx.fillRect(px + 7, player.y + 8, player.w - 14, 16);
  ctx.fillStyle = '#f7d57b';
  ctx.fillRect(px + 10, player.y + 28, 8, 8);
  ctx.fillRect(px + 16, player.y + 28, 8, 8);
}

function drawScene() {
  const active = stageData[currentStage];
  drawBackground(active.theme);
  drawObstacles();
  drawFinishLine();
  drawPlayer();

  ctx.fillStyle = 'rgba(17, 21, 27, 0.65)';
  ctx.fillRect(20, canvas.height - 36, 130, 18);
  ctx.fillStyle = '#fff';
  ctx.font = '14px Tahoma';
  ctx.fillText(`المرحلة ${currentStage + 1}`, 32, canvas.height - 21);
}

function update(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.035);
  lastTime = time;

  if (gameRunning && started) {
    updatePlayer(dt);
  }

  if (messageTimer > 0) {
    messageTimer -= dt;
    if (messageTimer <= 0) hideMessage();
  }

  drawScene();
  requestAnimationFrame(update);
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault();
  }
  if (keys.hasOwnProperty(event.code)) {
    keys[event.code] = true;
  }
});

window.addEventListener('keyup', (event) => {
  if (keys.hasOwnProperty(event.code)) {
    keys[event.code] = false;
  }
});

startBtn.addEventListener('click', () => {
  startOverlay.querySelector('h1').textContent = 'لعبة الجري والقفز';
  startOverlay.querySelector('p').textContent = 'قفز فوق الحواجز ولا تلمسها.';
  startBtn.textContent = 'ابدأ';
  startGame();
});

initStages();
resetStage();
showMessage('جاهز', 1);
requestAnimationFrame(update);
