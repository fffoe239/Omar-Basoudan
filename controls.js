const jumpButton = document.getElementById('jumpBtn');

function pressJump(event) {
  event.preventDefault();
  if (typeof jump === 'function' && gameRunning && started) jump();
}

jumpButton.addEventListener('pointerdown', pressJump, { passive: false });
jumpButton.addEventListener('contextmenu', event => event.preventDefault());
