const socket = io('/');
const screenId = window.SCREEN_ID;

const statusEl = document.getElementById('status');
const videoEl = document.getElementById('remoteVideo');
const placeholderEl = document.getElementById('placeholder');

// nahlás serveru, že tento socket je fyzická obrazovka
socket.emit('register-screen', { screenId });

// PeerJS klient pre obrazovku – stabilné ID = screenId
const peer = new Peer(screenId, {
  host: 'localhost',
  port: 3001,
  path: '/peerjs',
});

peer.on('open', (id) => {
  console.log(`Screen ${screenId} PeerJS ID:`, id);
});

// Keď remote účastník zavolá túto obrazovku
peer.on('call', (call) => {
  console.log('Prichádzajúci hovor na', screenId);

  // obrazovka neposiela vlastné video/audio späť
  call.answer();

  call.on('stream', (remoteStream) => {
    console.log('Dostal som stream na', screenId);
    placeholderEl.style.display = 'none';
    videoEl.srcObject = remoteStream;
  });

  call.on('close', () => {
    console.log('Hovor ukončený na', screenId);
    videoEl.srcObject = null;
    placeholderEl.style.display = 'block';
  });
});

// update textov podľa obsadenosti
socket.on('screens-state', (state) => {
  const info = state[screenId];
  if (!info) {
    statusEl.textContent = 'Neznáma obrazovka.';
    return;
  }

  if (info.occupied) {
    statusEl.textContent = `Pripojený: ${info.name || 'účastník'}`;
  } else {
    statusEl.textContent = 'Čakám na účastníka...';
    videoEl.srcObject = null;
    placeholderEl.style.display = 'block';
  }
});
