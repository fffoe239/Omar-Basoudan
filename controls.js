const jumpButton = document.getElementById('jumpBtn');

function pressJump(event) {
  event.preventDefault();
  if (typeof window.triggerJump === 'function') {
    window.triggerJump();
  }
}

jumpButton.addEventListener('pointerdown', pressJump, { passive: false });
jumpButton.addEventListener('contextmenu', event => event.preventDefault());
