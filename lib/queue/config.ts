import IORedis from 'ioredis';
import { config } from '@/lib/config';

// Redis configuration
export const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
};

// Create Redis client
export const createRedisClient = () => {
  return new IORedis(redisConfig);
};

// Queue configuration
export const QUEUE_NAME = 'document-processing';

// Export queue options
export const queueOptions = {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 100, // Keep last 100 failed jobs
  },
};

// Export worker options
export const workerOptions = {
  connection: redisConfig,
  concurrency: 4, // Process 4 jobs concurrently
  lockDuration: 30000, // 30 seconds
  maxStalledCount: 1,
};