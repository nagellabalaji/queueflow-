import { io } from 'socket.io-client';

let socketInstance = null;
const isStaticHosting = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

export function getSocket() {
  if (isStaticHosting) {
    return {
      emit: () => {},
      on: () => {},
      off: () => {}
    };
  }

  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Connected to QueueFlow Realtime Server, ID:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Disconnected from Realtime Server');
    });
  }

  return socketInstance;
}

export function subscribeToQueue(queueId, callback) {
  if (isStaticHosting) {
    return () => {};
  }

  const socket = getSocket();
  socket.emit('join_queue', queueId);

  const handleUpdate = (data) => {
    if (data.queueId === queueId) {
      callback(data);
    }
  };

  socket.on('queue_update', handleUpdate);

  return () => {
    socket.emit('leave_queue', queueId);
    socket.off('queue_update', handleUpdate);
  };
}
