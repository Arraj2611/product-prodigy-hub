import { createClient } from 'redis';
import { config } from './index.js';
import logger from '../utils/logger.js';

const redisClient = createClient({
  socket: {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
  },
  password: config.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

// Connect on module load
(async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
  }
})();

// Graceful shutdown
process.on('beforeExit', async () => {
  await redisClient.quit();
});

export default redisClient;

