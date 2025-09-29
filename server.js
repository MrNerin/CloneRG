const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// Хранение комнат
const rooms = {};

wss.on('connection', (ws, req) => {
  let roomId = null;
  let playerName = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === 'join') {
        roomId = message.roomId;
        playerName = message.playerName;

        if (!rooms[roomId]) {
          rooms[roomId] = {};
        }

        rooms[roomId][playerName] = { x: 1, y: 1, position: 1 }; // начальные координаты

        // Отправляем обновлённый список игроков в комнате
        broadcast(roomId, {
          type: 'players',
          players: rooms[roomId]
        });
      }

      if (message.type === 'move') {
        if (rooms[roomId] && rooms[roomId][playerName]) {
          rooms[roomId][playerName].position = message.position;

          // Отправляем обновлённые позиции всем
          broadcast(roomId, {
            type: 'players',
            players: rooms[roomId]
          });
        }
      }
    } catch (e) {
      console.error('Ошибка при обработке сообщения:', e);
    }
  });

  ws.on('close', () => {
    if (roomId && playerName && rooms[roomId]) {
      delete rooms[roomId][playerName];
      if (Object.keys(rooms[roomId]).length === 0) {
        delete rooms[roomId];
      } else {
        // Обновляем список игроков
        broadcast(roomId, {
          type: 'players',
          players: rooms[roomId]
        });
      }
    }
  });
});

function broadcast(roomId, message) {
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ roomId, ...message }));
    }
  }
}

console.log('WebSocket-сервер запущен на ws://localhost:8080');