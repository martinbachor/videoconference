const socket = io('/');

const screensEls = document.querySelectorAll('.screen');
let myScreen = null;

// vykreslenie stavu obrazoviek
function renderScreens(state) {
  screensEls.forEach((el) => {
    const id = el.dataset.screen;
    const info = state[id];
    const statusEl = el.querySelector('.status');

    el.classList.remove('free', 'occupied');

    if (!info) {
      statusEl.textContent = 'Neznáma';
      return;
    }

    if (info.occupied) {
      el.classList.add('occupied');
      statusEl.textContent = `Obsadená (${info.name || 'účastník'})`;
    } else {
      el.classList.add('free');
      statusEl.textContent = 'Voľná (klikni pre pripojenie)';
    }
  });
}

// server poslal stav
socket.on('screens-state', (state) => {
  renderScreens(state);
});

// server potvrdil priradenie (aktuálne to len držíme, okno už je otvorené)
socket.on('screen-assigned', ({ screenId }) => {
  console.log('✅ screen-assigned prijatý:', screenId);
  myScreen = screenId;
});

// obrazovky - kliknutie
screensEls.forEach((el) => {
  el.addEventListener('click', () => {
    const screenId = el.dataset.screen;
    // ak je obsadená, nič
    if (el.classList.contains('occupied')) {
      return;
    }

    const name = prompt('Zadaj svoje meno:');
    if (!name) return;

    // 1) otvor nové okno s obrazovkou
    window.open(`/screen/${screenId}`, '_blank');

    // 2) pošli serveru, že sa chceš priradiť na túto obrazovku
    socket.emit('request-screen', { screenId, name });
  });
});

// pri zatvorení tabu pošli info (ak bol priradený)
// server to použije na uvoľnenie obrazovky
window.addEventListener('beforeunload', () => {
  if (myScreen) {
    socket.emit('leave-screen');
  }
});
