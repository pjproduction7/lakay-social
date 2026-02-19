import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getApiBaseUrl } from '../services/api.js';

export default function useChatSocket({ currentUser, onPrivateMessage, onPresenceUpdate, onPublicMessage }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const baseUrl = getApiBaseUrl();
    // Debug: show which API base the client is using so we can debug websocket target
    console.log('useChatSocket: connecting socket to', baseUrl);
    // Temporary: force polling for any non-localhost / production host while production WebSocket support is being restored.
    // Use full websocket + polling only for localhost development to allow local websocket testing.
    const isLocal = baseUrl.includes('localhost');
    const transports = isLocal ? ['websocket', 'polling'] : ['polling'];
    console.log('useChatSocket: transports configured ->', transports);
    const socket = io(baseUrl, { transports });

    socket.on('connect', () => {
      setIsConnected(true);
      if (currentUser) {
        socket.emit('auth:identify', { username: currentUser });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('presence:update', (users) => {
      if (onPresenceUpdate) {
        onPresenceUpdate(users);
      }
    });

    socket.on('chat:dm:new', (message) => {
      if (onPrivateMessage) {
        onPrivateMessage(message);
      }
    });

    // Listen for public chat messages from server
    socket.on('chat:public:new', (message) => {
      if (onPublicMessage) onPublicMessage(message);
    });
    // Backwards-compatible: also listen for the raw 'new_message' event
    socket.on('new_message', (message) => {
      if (onPublicMessage) onPublicMessage(message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [currentUser, onPrivateMessage, onPresenceUpdate, onPublicMessage]);

  const connect = useCallback((username) => {
    if (socketRef.current && username) {
      socketRef.current.emit('auth:identify', { username });
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (socketRef.current) {
      socketRef.current.emit('chat:message', message);
    }
  }, []);

  // New: send a public chat message to a room
  const sendPublicMessage = useCallback((room, content) => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', { room, content });
    }
  }, []);

  return {
    sendMessage,
    sendPublicMessage,
    connect,
    disconnect,
    isConnected,
    socket: socketRef.current,
  };
}
