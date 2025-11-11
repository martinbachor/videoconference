const socket = io('/');
const screenId = window.SCREEN_ID;
const statusEl = document.getElementById('status');
const videoArea = document.getElementById('video-area');

socket.on('screens-state', state => {
  const info = state[screenId];
  if (!info) {
    statusEl.textContent = 'Neznáma obrazovka.';
    return;
  }

  if (info.occupied) {
    statusEl.textContent = `Pripojený: ${info.name || 'účastník'}`;
    videoArea.textContent = 'Tu zobrazíš video stream tohto účastníka (napojíme cez PeerJS).';
  } else {
    statusEl.textContent = 'Čakám na účastníka...';
    videoArea.textContent = 'Žiadny účastník nie je priradený.';
  }
});
