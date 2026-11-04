import { io } from 'socket.io-client';

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
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
