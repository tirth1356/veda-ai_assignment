import Redis from 'ioredis';
import { ConnectionOptions } from 'bullmq';

export const redisConfig: ConnectionOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null, // Critical requirement for BullMQ
};

// Create a reusable Redis client for application caching
export const redisClient = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
});

console.log(`Redis client and BullMQ configurations successfully loaded.`);
export default redisClient;
