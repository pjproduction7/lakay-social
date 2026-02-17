import { Server } from "socket.io";

const userSockets = new Map();
let ioInstance = null;

function getCorsOrigins() {
  // Allow local dev ports dynamically during development
  return ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];
}

export function initRealtime(server) {
  ioInstance = new Server(server, {
    cors: {
      // Allow localhost during development and explicit production domains
      origin: (origin, callback) => {
        const allowed = [
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175',
          'https://lakaysocial.com',
          'https://www.lakaysocial.com',
          'https://lakay-social-production-361d.up.railway.app'
        ];
        if (!origin) {
          // server-to-server or same-origin requests
          return callback(null, true);
        }
        if (origin.startsWith('http://localhost') || allowed.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    },
  });
  console.log('Realtime initialized (CORS: localhost allowed)');

  // Log engine-level handshake/connection errors so production logs show why upgrades fail
  try {
    ioInstance.engine?.on('connection_error', (err) => {
      console.error('Realtime engine connection_error:', err && err.message ? err.message : err);
    });
  } catch (e) {
    console.error('Failed to attach engine connection_error listener', e);
  }

  ioInstance.on("connection", (socket) => {
    const origin = socket.handshake?.headers?.origin || 'unknown-origin';
    const transport = socket.conn?.transport?.name || 'unknown-transport';
    console.log(`Realtime socket connected id=${socket.id} transport=${transport} origin=${origin} ip=${socket.handshake.address || 'unknown'}`);

    socket.on("auth:identify", ({ username }) => {
      if (!username) {
        return;
      }
      const normalized = username.trim().toLowerCase();
      if (!normalized) {
        return;
      }
      socket.data.username = normalized;
      userSockets.set(normalized, socket.id);
      broadcastPresence();
    });

    socket.on("disconnect", (reason) => {
      console.log(`Realtime socket disconnected id=${socket.id} reason=${reason}`);
      if (socket.data.username) {
        userSockets.delete(socket.data.username);
        broadcastPresence();
      }
    });
  });

  return ioInstance;
}

function broadcastPresence() {
  if (!ioInstance) {
    return;
  }
  ioInstance.emit("presence:update", Array.from(userSockets.keys()));
}

function emitToUser(username, event, payload) {
  if (!ioInstance || !username) {
    return;
  }
  const socketId = userSockets.get(username.trim().toLowerCase());
  if (socketId) {
    ioInstance.to(socketId).emit(event, payload);
  }
}

export function emitPublicChatMessage(message) {
  if (!ioInstance) {
    return;
  }
  ioInstance.emit("chat:public:new", message);
}

export function emitPrivateChatMessage(message) {
  if (!ioInstance) {
    return;
  }
  const participants = new Set();
  if (message.sender) {
    participants.add(message.sender);
  }
  if (message.recipient) {
    participants.add(message.recipient);
  }
  if (participants.size === 0) {
    return;
  }
  const payload = {
    id: message.id,
    sender: message.sender,
    recipient: message.recipient,
    content: message.content,
    created_at: message.created_at,
  };
  participants.forEach((participant) => emitToUser(participant, "chat:dm:new", payload));
}
