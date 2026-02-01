import { Server } from "socket.io";

const userSockets = new Map();
let ioInstance = null;

function getCorsOrigins() {
  return ["http://localhost:5173"];
}

export function initRealtime(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: getCorsOrigins(),
    },
  });

  ioInstance.on("connection", (socket) => {
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

    socket.on("disconnect", () => {
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
