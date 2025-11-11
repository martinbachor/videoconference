const socket = io('/');
const screensEls = document.querySelectorAll('.screen');

let myScreen = null;

function renderScreens(state) {
  screensEls.forEach(el => {
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

socket.on('screens-state', state => {
  renderScreens(state);
});

socket.on('screen-busy', ({ screenId }) => {
  alert(`Obrazovka ${screenId} je už obsadená.`);
});

socket.on('screen-error', ({ message }) => {
  alert(message || 'Chyba pri priradení obrazovky.');
});

socket.on('screen-assigned', ({ screenId }) => {
  myScreen = screenId;
  alert(`Bol si priradený na ${screenId}.`);
  // Tu neskôr presmerujeme na konkrétnu stránku s videom
  // napr.: window.location.href = `/room/${screenId}`;
});

// Kliknutie na obrazovku v mape
screensEls.forEach(el => {
  el.addEventListener('click', () => {
    const screenId = el.dataset.screen;
    if (el.classList.contains('occupied')) return;

    const name = prompt('Zadaj svoje meno:') || 'Účastník';
    socket.emit('request-screen', { screenId, name });
  });
});
