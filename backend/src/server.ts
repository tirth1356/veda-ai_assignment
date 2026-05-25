import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { initSocket } from './config/socket';
import { initWorker } from './queues/worker';

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB Database
    await connectDB();

    // 2. Create HTTP server from Express instance
    const server = http.createServer(app);

    // 3. Initialize WebSocket Server
    initSocket(server);
    console.log('Socket.io server successfully bound to HTTP server.');

    // 4. Initialize BullMQ background process worker
    initWorker();

    // 5. Start listening
    server.listen(PORT, () => {
      console.log(`=============================================`);
      console.log(`VedaAI Express Server running on port: ${PORT}`);
      console.log(`=============================================`);
    });
  } catch (error) {
    console.error('Fatal error starting VedaAI backend server:', error);
    process.exit(1);
  }
};

startServer();
