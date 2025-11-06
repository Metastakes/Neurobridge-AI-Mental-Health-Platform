import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectWebSocket = (sessionId: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

  socket = io(wsUrl, {
    query: { sessionId },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  return socket;
};

export const disconnectWebSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;
