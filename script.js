const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const stageLabel = document.getElementById('stageLabel');
const statusLabel = document.getElementById('statusLabel');
const messageBox = document.getElementById('messageBox');
const TOTAL_STAGES = 100, groundY = canvas.height - 70, gravity = 1700, jumpPower = 700, moveSpeed = 320;
const keys = {ArrowRight:false,ArrowLeft:false,KeyD:false,KeyA:false,Space:false,ArrowUp:false};
let currentStage=0, stageData=[], player=null, cameraX=0, lastTime=0, started=false, gameRunning=false, messageTimer=0, jumpWasDown=false;
let lastJumpTime = 0;

function showMessage(t,d=1){messageBox.textContent=t;messageBox.classList.add('visible');messageTimer=d} function hideMessage(){messageBox.classList.remove('visible')}
function getTheme(n){if(n<=10)return'شارع عربي';if(n<=20)return'حي عربي';if(n<=30)return'سوق';if(n<=40)return'صحراء';if(n<=50)return'جبل';if(n<=60)return'مدينة';if(n<=80)return'طريق سريع';return'منطقة متقدمة'}
function generateStage(i){const n=i+1,d=Math.min(n*.18,18),width=1800+n*22,obstacles=[],overheads=[];let x=360;for(let k=0;k<Math.min(3+Math.floor(n/9),12);k++){x+=150+Math.random()*90+d*5;const w=28+Math.random()*26+d*.7,h=34+Math.random()*36+d*1.3;obstacles.push({x,y:groundY-h,w,h});if(n>=4&&(k+n)%3===0){const top=55+(k%3)*12;overheads.push({x:x-5,y:top,w:w+10,h:Math.max(45,groundY-h-52-(n%3)*8-top)})}}return{width,finishX:width-120,obstacles,overheads,theme:getTheme(n)}}
function resetPlayer(){return{x:110,y:groundY-62,w:44,h:62,vy:0,onGround:true,jumpsLeft:2,dir:1,run:0}}
function resetStage(){player=resetPlayer();cameraX=0;const a=stageData[currentStage];statusLabel.textContent=a.theme;stageLabel.textContent=`${currentStage+1} / ${TOTAL_STAGES}`}
function initStages(){stageData=Array.from({length:TOTAL_STAGES},(_,i)=>generateStage(i))}
function startGame(){started=true;gameRunning=true;currentStage=0;initStages();resetStage();startOverlay.classList.remove('visible');showMessage('هذا عمر! عندك دبل نط',1.5)}
function nextStage(){if(currentStage<TOTAL_STAGES-1){currentStage++;resetStage();showMessage(`المرحلة ${currentStage+1}`,1.2)}else{gameRunning=false;started=false;startOverlay.classList.add('visible');startOverlay.querySelector('h1').textContent='أحسنت يا عمر!';startOverlay.querySelector('p').textContent='أكملت جميع المراحل.';startBtn.textContent='إعادة اللعب'}}
function death(){if(!gameRunning)return;gameRunning=false;showMessage('اصطدمت! أعد المحاولة',1.5);setTimeout(()=>{if(started){resetStage();gameRunning=true}},700)}
function hit(a,b){return a.x+a.w>b.x&&a.x<b.x+b.w&&a.y+a.h>b.y&&a.y<b.y+b.h}

function triggerJump() {
  if (!started || !gameRunning || !player) return;
  const now = performance.now();
  const quickDouble = !player.onGround && (now - lastJumpTime) < 260;

  if (player.onGround) {
    player.vy = -jumpPower;
    player.onGround = false;
    player.jumpsLeft = 1;
    lastJumpTime = now;
    showMessage('قفزة أولى!', 0.35);
    return;
  }

  if (quickDouble && player.jumpsLeft > 0) {
    player.vy = -jumpPower * 0.96;
    player.jumpsLeft = 0;
    lastJumpTime = now;
    showMessage('قفزة ثانية!', 0.35);
    return;
  }

  if (player.jumpsLeft > 0) {
    player.vy = -jumpPower;
    player.jumpsLeft--;
    lastJumpTime = now;
    showMessage('قفزة ثانية!', 0.35);
  }
}

function updatePlayer(dt){const dir=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0);if(dir){player.x+=dir*moveSpeed*dt;player.dir=dir;player.run+=dt*12}const down=keys.Space||keys.ArrowUp;if(down&&!jumpWasDown)triggerJump();jumpWasDown=down;player.vy+=gravity*dt;player.y+=player.vy*dt;if(player.y+player.h>=groundY){player.y=groundY-player.h;player.vy=0;player.onGround=true;player.jumpsLeft=2}const a=stageData[currentStage];player.x=Math.max(80,Math.min(player.x,a.width-player.w));cameraX=Math.max(0,Math.min(player.x-canvas.width*.35,a.width-canvas.width));if(a.obstacles.some(o=>hit(player,o))||a.overheads.some(o=>hit(player,o)))death();if(gameRunning&&player.x+player.w>=a.finishX)nextStage()}
function drawBackground(theme){const g=ctx.createLinearGradient(0,0,0,canvas.height);g.addColorStop(0,'#8ec5ff');g.addColorStop(.55,'#d9edff');g.addColorStop(1,'#f5fbff');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#ffd84d';ctx.beginPath();ctx.arc(canvas.width*.82,90,42,0,Math.PI*2);ctx.fill();for(let i=0;i<18;i++){const x=(i*120-cameraX*.2)%(canvas.width+200),h=50+(i%5)*26;ctx.fillStyle='rgba(80,100,125,.38)';ctx.fillRect(x,canvas.height-210-h,80,h+110)}const roadY=groundY+10;ctx.fillStyle='#3f4c57';ctx.fillRect(0,roadY,canvas.width,canvas.height-roadY);ctx.fillStyle='#eee';for(let i=0;i<14;i++)ctx.fillRect(-cameraX*.8+i*110,roadY+40,56,12);ctx.fillStyle='#252b32';ctx.fillRect(0,groundY,canvas.width,8);ctx.fillStyle='#193b62';ctx.font='bold 18px Tahoma';ctx.fillText(theme,28,34)}
function drawObstacles(){const a=stageData[currentStage];for(const o of a.obstacles){const x=o.x-cameraX;ctx.fillStyle='#e33434';ctx.fillRect(x,o.y,o.w,o.h);ctx.fillStyle='#7b1111';ctx.fillRect(x+6,o.y+6,o.w-12,o.h-12)}for(const o of a.overheads){const x=o.x-cameraX;ctx.fillStyle='#ef8a22';ctx.fillRect(x,o.y,o.w,o.h);ctx.fillStyle='#ffe082';ctx.fillRect(x-8,o.y,o.w+16,10)}}
function drawFinish(){const x=stageData[currentStage].finishX-cameraX;ctx.fillStyle='#ffd54a';ctx.fillRect(x,groundY-78,10,78);ctx.fillStyle='#fff';ctx.fillRect(x-18,groundY-72,42,12)}
function drawPlayer(){const x=player.x-cameraX,y=player.y;ctx.save();ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=8;ctx.fillStyle='#111';ctx.beginPath();ctx.ellipse(x+22,groundY+3,29,7,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#f4b183';ctx.beginPath();ctx.arc(x+22,y+16,16,0,Math.PI*2);ctx.fill();ctx.fillStyle='#151515';ctx.beginPath();ctx.arc(x+22,y+10,17,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+16,y+16,3,0,Math.PI*2);ctx.arc(x+28,y+16,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x+16,y+16,1.5,0,Math.PI*2);ctx.arc(x+28,y+16,1.5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#16a085';ctx.fillRect(x+5,y+34,34,25);ctx.fillStyle='#f4b183';ctx.fillRect(x-3,y+36,9,20);ctx.fillRect(x+38,y+36,9,20);const leg=Math.sin(player.run)*5;ctx.fillStyle='#24498a';ctx.fillRect(x+8+leg,y+57,11,14);ctx.fillRect(x+25-leg,y+57,11,14);ctx.fillStyle='#111';ctx.fillRect(x+4+leg,y+69,17,5);ctx.fillRect(x+23-leg,y+69,17,5);ctx.fillStyle='#fff';ctx.font='bold 13px Tahoma';ctx.textAlign='center';ctx.fillText('عمر',x+22,y-9);ctx.restore()}
function draw(){drawBackground(stageData[currentStage].theme);drawObstacles();drawFinish();drawPlayer();ctx.fillStyle='rgba(17,21,27,.7)';ctx.fillRect(20,canvas.height-36,245,18);ctx.fillStyle='#fff';ctx.font='bold 14px Tahoma';ctx.fillText(`المرحلة ${currentStage+1} — الشخصية: عمر — دبل نط`,32,canvas.height-21)}
function loop(t){const dt=Math.min((t-lastTime)/1000||0,.035);lastTime=t;if(gameRunning&&started)updatePlayer(dt);if(messageTimer>0&&(messageTimer-=dt)<=0)hideMessage();draw();requestAnimationFrame(loop)}
window.triggerJump = triggerJump;
window.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='ArrowUp')e.preventDefault();if(Object.prototype.hasOwnProperty.call(keys,e.code)){ if (e.code==='Space' || e.code==='ArrowUp'){ if(!e.repeat) triggerJump(); } keys[e.code]=true; }});window.addEventListener('keyup',e=>{if(Object.prototype.hasOwnProperty.call(keys,e.code))keys[e.code]=false});startBtn.addEventListener('click',startGame);initStages();resetStage();showMessage('اضغط ابدأ',1);requestAnimationFrame(loop);
