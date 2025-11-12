/**
 * Scheduled job to sync commodity prices from FRED API
 * Runs every hour to keep prices up-to-date
 */
import { commodityService } from '../services/commodity.service.js';
import logger from '../utils/logger.js';

const COMMODITIES = ['Cotton', 'Polyester', 'Wool', 'Silk'];

export async function syncCommodityPrices() {
  logger.info('Starting commodity price sync job');

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const commodity of COMMODITIES) {
    try {
      await commodityService.getCommodityPrice(commodity);
      results.success++;
      logger.info(`Synced price for ${commodity}`);
    } catch (error) {
      results.failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`${commodity}: ${errorMsg}`);
      logger.error(`Failed to sync price for ${commodity}:`, error);
    }
  }

  logger.info(`Commodity price sync completed: ${results.success} success, ${results.failed} failed`);

  if (results.errors.length > 0) {
    logger.warn('Price sync errors:', results.errors);
  }

  return results;
}

// For cron scheduling (would use node-cron or similar in production)
// cron.schedule('0 * * * *', syncCommodityPrices); // Every hour

