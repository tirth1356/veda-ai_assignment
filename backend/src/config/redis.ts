import Redis from 'ioredis';
import { ConnectionOptions } from 'bullmq';

const maxRetriesPerRequest = null; // Critical requirement for BullMQ

export const redisConfig: ConnectionOptions = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL, maxRetriesPerRequest } as any
  : {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest,
    };

// Create a reusable Redis client for application caching
export const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest })
  : new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest,
    });

console.log(`Redis client and BullMQ configurations successfully loaded.`);
export default redisClient;
