import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // For development, allow access from the client
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join a specific assignment's update channel
    socket.on('join-assignment', (assignmentId: string) => {
      socket.join(`assignment:${assignmentId}`);
      console.log(`Client ${socket.id} joined channel: assignment:${assignmentId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};

/**
 * Helper to emit progress updates to the client
 */
export const emitAssignmentProgress = (assignmentId: string, payload: {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  message?: string;
  error?: string;
}) => {
  try {
    const ioInstance = getIO();
    ioInstance.to(`assignment:${assignmentId}`).emit('assignment-progress', payload);
  } catch (error) {
    console.error('Failed to emit WS progress update:', error);
  }
};
