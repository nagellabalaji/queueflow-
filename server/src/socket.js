let io = null;

function initSocket(serverInstance) {
  const { Server } = require('socket.io');
  io = new Server(serverInstance, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_queue', (queueId) => {
      socket.join(`queue_${queueId}`);
    });

    socket.on('leave_queue', (queueId) => {
      socket.leave(`queue_${queueId}`);
    });
  });

  return io;
}

function emitQueueUpdate(queueId, action, payload = {}) {
  if (io) {
    // Broadcast to specific queue room
    io.to(`queue_${queueId}`).emit('queue_update', { action, queueId, payload, timestamp: new Date().toISOString() });
    // Also broadcast general event to all
    io.emit('global_update', { action, queueId, payload, timestamp: new Date().toISOString() });
  }
}

module.exports = {
  initSocket,
  emitQueueUpdate
};
