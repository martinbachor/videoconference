const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

// EJS + statické súbory
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static('public'));

// Stav obrazoviek (1 účastník na obrazovku)
const screens = {
  screen1: { occupant: null },
  screen2: { occupant: null },
  screen3: { occupant: null },
  screen4: { occupant: null } // prezentácia / share
};

function publicScreensState() {
  const result = {};
  for (const [id, data] of Object.entries(screens)) {
    result[id] = {
      occupied: !!data.occupant,
      name: data.occupant ? data.occupant.name : null
    };
  }
  return result;
}

// ---------- ROUTES ----------

// Mapa miestnosti
app.get('/', (req, res) => {
  res.render('map'); // views/map.ejs
});

// Obrazovky v miestnosti (PC1–PC4)
app.get('/screen/:id', (req, res) => {
  const screenId = req.params.id;
  if (!screens[screenId]) {
    return res.status(404).send('Neznáma obrazovka');
  }
  res.render('screen', { screenId }); // views/screen.ejs
});

// (voliteľné) klasická room, ak ju chceš neskôr použiť
app.get('/room/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });
});

// ---------- SOCKET.IO LOGIKA ----------

io.on('connection', socket => {
  console.log('Nové pripojenie:', socket.id);

  // vlastné pole na uloženie, ktorú obrazovku má tento socket
  socket.screenId = null;

  // pošleme stav obrazoviek
  socket.emit('screens-state', publicScreensState());

  // žiadosť o obsadenie obrazovky
  socket.on('request-screen', ({ screenId, name }) => {
    const screen = screens[screenId];

    if (!screen) {
      socket.emit('screen-error', { message: 'Neznáma obrazovka.' });
      return;
    }

    if (screen.occupant) {
      socket.emit('screen-busy', { screenId });
      return;
    }

    screen.occupant = {
      socketId: socket.id,
      name: name || 'Účastník'
    };

    socket.screenId = screenId; // 🔴 tu bola chyba, už nie socket.data

    io.emit('screens-state', publicScreensState());
    socket.emit('screen-assigned', { screenId });
  });

  // dobrovoľný leave
  socket.on('leave-screen', () => {
    const screenId = socket.screenId;
    if (screenId && screens[screenId]?.occupant?.socketId === socket.id) {
      screens[screenId].occupant = null;
      socket.screenId = null;
      io.emit('screens-state', publicScreensState());
    }
  });

  // auto-uvoľnenie pri disconnecte
  socket.on('disconnect', () => {
    const screenId = socket.screenId;
    if (screenId && screens[screenId]?.occupant?.socketId === socket.id) {
      screens[screenId].occupant = null;
      io.emit('screens-state', publicScreensState());
    }
  });

  // pôvodná zoom-clone logika (ak potrebuješ /room/:room)
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId);
    });
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server beží na porte ${PORT}`);
});
