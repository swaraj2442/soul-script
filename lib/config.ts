import { keys } from './keys';
import { AI_MODELS, AIModel } from './openai/client';

export const config = {
  supabase: {
    url: keys.supabase.url,
    anonKey: keys.supabase.anonKey,
    serviceRoleKey: keys.supabase.serviceRoleKey
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0'),
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      console.log(`Redis connection attempt ${times}, retrying in ${delay}ms`);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 10000,
    reconnectOnError: (err: Error) => {
      console.error('Redis reconnect on error:', err);
      return true; // Always attempt to reconnect
    }
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    defaultModel: 'gpt-3.5-turbo' as AIModel,
    models: AI_MODELS
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    defaultModel: 'gemini-pro' as AIModel
  },
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY || '',
    defaultModel: 'llama-2-7b' as AIModel
  }
} as const;

// Type for the config object
export type Config = typeof config; 