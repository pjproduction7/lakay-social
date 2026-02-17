import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getApiBaseUrl } from '../services/api.js';

export default function useChatSocket({ currentUser, onPrivateMessage, onPresenceUpdate }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const baseUrl = getApiBaseUrl();
    // Debug: show which API base the client is using so we can debug websocket target
    console.log('useChatSocket: connecting socket to', baseUrl);
    // Workaround: force polling on Railway-hosted API (avoids websocket upgrade issues behind some proxies).
    const transports = baseUrl.includes('railway.app') ? ['polling'] : ['websocket', 'polling'];
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

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [currentUser, onPrivateMessage, onPresenceUpdate]);

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

  return {
    sendMessage,
    connect,
    disconnect,
    isConnected,
    socket: socketRef.current,
  };
}
