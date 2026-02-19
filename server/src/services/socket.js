import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

export function initSocket(httpServer, allowedOrigins) {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      // Allow unauthenticated connections for public chat
      socket.user = null;
      return next();
    }
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (err) {
      socket.user = null;
      next(); // still allow, just as anonymous
    }
  });

  io.on('connection', (socket) => {
    const username = socket.user?.username || 'anonymous';
    console.log(`Socket connected: ${username} (${socket.id})`);

    // Join a room
    socket.on('join_room', (room) => {
      socket.join(room);
      socket.to(room).emit('user_joined', { username, room });
    });

    // Leave a room
    socket.on('leave_room', (room) => {
      socket.leave(room);
      socket.to(room).emit('user_left', { username, room });
    });

    // Send message to room (public chat)
    socket.on('send_message', async ({ room, content }) => {
      if (!content?.trim()) return;
      const message = {
        id: Date.now(),
        username,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        room,
      };

      // Persist to DB if user is authenticated
      if (socket.user) {
        try {
          await query(
            `INSERT INTO chat_messages (room, user_id, content, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [room, socket.user.id, content.trim()]
          );
        } catch (err) {
          console.error('Failed to persist chat message:', err.message);
        }
      }

      io.to(room).emit('new_message', message);
    });

    // Private message
    socket.on('private_message', async ({ toUsername, content }) => {
      if (!socket.user || !content?.trim()) return;
      try {
        const recipientResult = await query('SELECT id FROM users WHERE username = $1', [toUsername]);
        const recipient = recipientResult.rows[0];
        if (!recipient) return;

        await query(
          `INSERT INTO messages (sender_id, recipient_id, content, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [socket.user.id, recipient.id, content.trim()]
        );

        const msgPayload = {
          from: username,
          content: content.trim(),
          timestamp: new Date().toISOString(),
        };

        // Emit to recipient's room (they should join their own userId room on connect)
        io.to(`user:${recipient.id}`).emit('private_message', msgPayload);
        socket.emit('private_message_sent', msgPayload);
      } catch (err) {
        console.error('Private message error:', err.message);
      }
    });

    // Join personal notification room
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
    }

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${username}`);
    });
  });

  return io;
}
