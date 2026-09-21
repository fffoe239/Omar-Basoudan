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

const keys = { ArrowRight: false, ArrowLeft: false, KeyD: false, KeyA: false, Space: false, ArrowUp: false };
let currentStage = 0;
let stageData = [];
let player = null;
let cameraX = 0;
let lastTime = 0;
let started = false;
let gameRunning = false;
let messageTimer = 0;
let jumpWasDown = false;

function showMessage(text, duration = 1) {
  messageBox.textContent = text;
  messageBox.classList.add('visible');
  messageTimer = duration;
}
function hideMessage() { messageBox.classList.remove('visible'); }

function generateStage(levelIndex) {
  const stageNumber = levelIndex + 1;
  const difficulty = Math.min(stageNumber * 0.18, 18);
  const width = 1800 + stageNumber * 22;
  const finishX = width - 120;
  const obstacleCount = Math.min(3 + Math.floor(stageNumber / 9), 12);
  const obstacles = [];
  const overheads = [];
  let x = 360;

  for (let i = 0; i < obstacleCount; i++) {
    x += 150 + Math.random() * 90 + difficulty * 5;
    const w = 28 + Math.random() * 26 + difficulty * 0.7;
    const h = 34 + Math.random() * 36 + difficulty * 1.3;
    obstacles.push({ x, y: groundY - h, w, h, kind: 'ground' });

    // From stage 4 onward, some obstacles also have a hanging pillar above them.
    if (stageNumber >= 4 && (i + stageNumber) % 3 === 0) {
      const top = 55 + (i % 3) * 12;
      const bottom = groundY - h - 52 - (stageNumber % 3) * 8;
      overheads.push({ x: x - 5, y: top, w: w + 10, h: Math.max(45, bottom - top), kind: 'overhead' });
    }
  }

  return { width, finishX, obstacles, overheads, stageNumber, theme: getTheme(stageNumber) };
}

function getTheme(n) {
  if (n <= 10) return 'شارع عربي';
  if (n <= 20) return 'حي عربي';
  if (n <= 30) return 'سوق';
  if (n <= 40) return 'صحراء';
  if (n <= 50) return 'جبل';
  if (n <= 60) return 'مدينة';
  if (n <= 80) return 'طريق سريع';
  return 'منطقة متقدمة';
}

function resetPlayer() {
  return { x: 110, y: groundY - 58, w: 38, h: 58, vy: 0, onGround: true, jumpsLeft: 2, dir: 1, run: 0 };
}
function initStages() { stageData = Array.from({ length: TOTAL_STAGES }, (_, i) => generateStage(i)); }
function resetStage() {
  player = resetPlayer();
  cameraX = 0;
  const active = stageData[currentStage];
  statusLabel.textContent = active.theme;
  stageLabel.textContent = `${currentStage + 1} / ${TOTAL_STAGES}`;
}
function startGame() {
  started = true; gameRunning = true; currentStage = 0; initStages(); resetStage();
  hideMessage(); startOverlay.classList.remove('visible'); showMessage('ابدأ! عندك دبل نط', 1.5);
}
function nextStage() {
  if (currentStage < TOTAL_STAGES - 1) {
    currentStage++; resetStage(); showMessage(`المرحلة ${currentStage + 1}`, 1.4);
  } else {
    gameRunning = false; started = false; showMessage('أتممت كل المراحل', 2.2);
    startOverlay.classList.add('visible');
    startOverlay.querySelector('h1').textContent = 'انتهت اللعبة';
    startOverlay.querySelector('p').textContent = 'لقد أكملت جميع 100 مرحلة بنجاح.';
    startBtn.textContent = 'إعادة اللعب';
  }
}
function handleDeath() {
  if (!gameRunning) return;
  gameRunning = false; showMessage('اصطدمت! أعد المحاولة', 1.7);
  setTimeout(() => { if (started) { resetStage(); gameRunning = true; } }, 700);
}
function overlaps(a, b) {
  return a.x + a.w > b.x && a.x < b.x + b.w && a.y + a.h > b.y && a.y < b.y + b.h;
}
function checkCollisions() {
  const active = stageData[currentStage];
  if (active.obstacles.some(o => overlaps(player, o)) || active.overheads.some(o => overlaps(player, o))) handleDeath();
}
function jump() {
  if (player.jumpsLeft > 0) {
    player.vy = -jumpPower;
    player.onGround = false;
    player.jumpsLeft--;
    showMessage(player.jumpsLeft === 1 ? 'قفزة ثانية متاحة' : 'دبل نط!', 0.45);
  }
}
function updatePlayer(dt) {
  const moveDir = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
  if (moveDir) { player.x += moveDir * moveSpeed * dt; player.dir = moveDir; player.run += dt * 12; }

  const jumpDown = keys.Space || keys.ArrowUp;
  if (jumpDown && !jumpWasDown) jump();
  jumpWasDown = jumpDown;

  player.vy += gravity * dt;
  player.y += player.vy * dt;
  if (player.y + player.h >= groundY) {
    player.y = groundY - player.h; player.vy = 0; player.onGround = true; player.jumpsLeft = 2;
  }
  const active = stageData[currentStage];
  player.x = Math.max(80, Math.min(player.x, active.width - player.w));
  cameraX = Math.max(0, Math.min(player.x - canvas.width * 0.35, active.width - canvas.width));
  checkCollisions();
  if (gameRunning && player.x + player.w >= active.finishX) nextStage();
}

function drawBackground(theme) {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#9ec9ff'); sky.addColorStop(0.5, '#d6ebff'); sky.addColorStop(1, '#eef9ff');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,213,79,0.9)'; ctx.beginPath(); ctx.arc(canvas.width * 0.82, 90, 42, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 18; i++) {
    const x = (i * 120 - cameraX * 0.2) % (canvas.width + 200); const h = 50 + (i % 5) * 26;
    ctx.fillStyle = 'rgba(95,115,140,0.38)'; ctx.fillRect(x, canvas.height - 210 - h, 80, h + 110);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let row = 0; row < 5; row++) for (let col = 0; col < 3; col++) ctx.fillRect(x + 12 + col * 18, canvas.height - 180 - h + row * 22, 12, 10);
  }
  const roadY = groundY + 10;
  ctx.fillStyle = '#3f4c57'; ctx.fillRect(0, roadY, canvas.width, canvas.height - roadY);
  ctx.fillStyle = '#8a8a8a'; ctx.fillRect(-cameraX * 0.8, roadY + 12, stageData[currentStage].width, 8);
  for (let i = 0; i < 14; i++) { const x = -cameraX * 0.8 + i * 110; ctx.fillStyle = '#f5f5f5'; ctx.fillRect(x, roadY + 40, 56, 12); }
  ctx.fillStyle = '#2a2f36'; ctx.fillRect(0, groundY, canvas.width, 8);
  ctx.fillStyle = '#d8f0ff'; ctx.font = '16px Tahoma'; ctx.fillText(theme, 28, 34);
}
function drawFinishLine() {
  const x = stageData[currentStage].finishX - cameraX;
  ctx.fillStyle = '#ffd54a'; ctx.fillRect(x, groundY - 78, 10, 78); ctx.fillStyle = '#fff'; ctx.fillRect(x - 18, groundY - 72, 42, 12);
}
function drawObstacles() {
  const active = stageData[currentStage];
  for (const o of active.obstacles) {
    const x = o.x - cameraX; ctx.fillStyle = '#db3d3d'; ctx.fillRect(x, o.y, o.w, o.h); ctx.fillStyle = '#8f1d1d'; ctx.fillRect(x + 6, o.y + 6, o.w - 12, o.h - 12);
  }
  for (const o of active.overheads) {
    const x = o.x - cameraX; ctx.fillStyle = '#f08a24'; ctx.fillRect(x, o.y, o.w, o.h); ctx.fillStyle = '#8d4214'; ctx.fillRect(x + 6, o.y, o.w - 12, o.h);
    ctx.fillStyle = '#ffe082'; ctx.fillRect(x - 8, o.y, o.w + 16, 9);
  }
}
function drawPlayer() {
  const px = player.x - cameraX;
  ctx.save();
  ctx.translate(px + player.w / 2, player.y);
  if (player.dir < 0) ctx.scale(-1, 1);
  // Omar: a visible character with head, hair, shirt, arms and running legs.
  ctx.fillStyle = '#f2b27d'; ctx.beginPath(); ctx.arc(0, 12, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#242424'; ctx.beginPath(); ctx.arc(0, 7, 14, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1682a8'; ctx.fillRect(-13, 25, 26, 22);
  ctx.fillStyle = '#f2b27d'; ctx.fillRect(-20, 27, 8, 17); ctx.fillRect(12, 27, 8, 17);
  const leg = Math.sin(player.run) * 4;
  ctx.fillStyle = '#213b76'; ctx.fillRect(-11 + leg, 47, 9, 12); ctx.fillRect(3 - leg, 47, 9, 12);
  ctx.fillStyle = '#111'; ctx.fillRect(-14 + leg, 57, 13, 4); ctx.fillRect(2 - leg, 57, 13, 4);
  ctx.restore();
}
function drawScene() {
  const active = stageData[currentStage]; drawBackground(active.theme); drawObstacles(); drawFinishLine(); drawPlayer();
  ctx.fillStyle = 'rgba(17,21,27,0.65)'; ctx.fillRect(20, canvas.height - 36, 230, 18);
  ctx.fillStyle = '#fff'; ctx.font = '14px Tahoma'; ctx.fillText(`المرحلة ${currentStage + 1} — دبل نط`, 32, canvas.height - 21);
}
function update(time) {
  const dt = Math.min((time - lastTime) / 1000 || 0, 0.035); lastTime = time;
  if (gameRunning && started) updatePlayer(dt);
  if (messageTimer > 0 && (messageTimer -= dt) <= 0) hideMessage();
  drawScene(); requestAnimationFrame(update);
}
window.addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'ArrowUp') e.preventDefault(); if (Object.prototype.hasOwnProperty.call(keys, e.code)) keys[e.code] = true; });
window.addEventListener('keyup', e => { if (Object.prototype.hasOwnProperty.call(keys, e.code)) keys[e.code] = false; });
startBtn.addEventListener('click', () => { startOverlay.querySelector('h1').textContent = 'لعبة الجري والقفز'; startOverlay.querySelector('p').textContent = 'قفز فوق الحواجز — عندك دبل نط، وانتبه للعواميد من فوق.'; startBtn.textContent = 'ابدأ'; startGame(); });
initStages(); resetStage(); showMessage('جاهز', 1); requestAnimationFrame(update);
