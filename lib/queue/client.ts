import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../config';

// Create Redis connection with error handling
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  lazyConnect: true, // Don't connect immediately
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`Redis connection attempt ${times}, retrying in ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
  reconnectOnError: (err) => {
    console.error('Redis reconnect on error:', err);
    return true; // Always attempt to reconnect
  }
});

// Handle Redis connection events
redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('ready', () => {
  console.log('Redis client ready');
});

redis.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});

redis.on('end', () => {
  console.log('Redis connection ended');
});

// Create document processing queue
export const documentQueue = new Queue('document-processing', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

// Test Redis connection
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    // Try to connect if not already connected
    if (!redis.status || redis.status !== 'ready') {
      console.log('Redis not ready, attempting to connect...');
      try {
        await redis.connect();
      } catch (connectError) {
        console.error('Redis connection failed:', connectError);
        return false;
      }
    }
    
    try {
      const pingResponse = await redis.ping();
      if (pingResponse !== 'PONG') {
        console.error('Redis ping failed:', pingResponse);
        return false;
      }
      return true;
    } catch (pingError) {
      console.error('Redis ping failed:', pingError);
      return false;
    }
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
};

// Get queue status with better error handling
export const getQueueStatus = async () => {
  try {
    // Try to connect if not already connected
    if (!redis.status || redis.status !== 'ready') {
      console.log('Redis not ready, attempting to connect...');
      try {
        await redis.connect();
      } catch (connectError) {
        console.error('Redis connection failed:', connectError);
        return {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          total: 0,
          error: `Redis connection failed: ${connectError instanceof Error ? connectError.message : 'Unknown error'}`
        };
      }
    }

    try {
  const [waiting, active, completed, failed] = await Promise.all([
        documentQueue.getWaitingCount(),
        documentQueue.getActiveCount(),
        documentQueue.getCompletedCount(),
        documentQueue.getFailedCount()
  ]);
  
  return {
    waiting,
    active,
    completed,
    failed,
        total: waiting + active + completed + failed
      };
    } catch (queueError) {
      console.error('Error getting queue counts:', queueError);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        total: 0,
        error: `Failed to get queue counts: ${queueError instanceof Error ? queueError.message : 'Unknown error'}`
      };
    }
  } catch (error) {
    console.error('Error getting queue status:', error);
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};