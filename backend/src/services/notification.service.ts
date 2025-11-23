import prisma from '../config/database.js';
import logger from '../utils/logger.js';

export enum NotificationType {
  BOM_GENERATED = 'BOM_GENERATED',
  SUPPLIERS_FOUND = 'SUPPLIERS_FOUND',
  MARKET_FORECAST_READY = 'MARKET_FORECAST_READY',
  PRICE_FORECAST_READY = 'PRICE_FORECAST_READY',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Create a notification for a user
 */
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  metadata,
}: CreateNotificationParams) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: metadata || {},
      },
    });

    logger.info(`Notification created: ${type} for user ${userId}`);
    return notification;
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notification when BOM is generated
 */
export const notifyBOMGenerated = async (
  userId: string,
  productId: string,
  productName: string,
  confidence: number
) => {
  return createNotification({
    userId,
    type: NotificationType.BOM_GENERATED,
    title: 'BOM Generated',
    message: `Your product "${productName}" BOM has been successfully generated with ${Math.round(confidence * 100)}% confidence`,
    metadata: {
      productId,
      productName,
      confidence,
    },
  });
};

/**
 * Create notification when suppliers are found
 */
export const notifySuppliersFound = async (
  userId: string,
  productId: string,
  productName: string,
  supplierCount: number
) => {
  return createNotification({
    userId,
    type: NotificationType.SUPPLIERS_FOUND,
    title: 'Suppliers Found',
    message: `${supplierCount} supplier${supplierCount > 1 ? 's' : ''} have been identified for your materials`,
    metadata: {
      productId,
      productName,
      supplierCount,
    },
  });
};

/**
 * Create notification when market forecasts are ready
 */
export const notifyMarketForecastReady = async (
  userId: string,
  productId: string,
  productName: string,
  countryCount: number
) => {
  return createNotification({
    userId,
    type: NotificationType.MARKET_FORECAST_READY,
    title: 'Market Forecast Ready',
    message: `Market demand forecasts have been generated for ${countryCount} countr${countryCount > 1 ? 'ies' : 'y'}`,
    metadata: {
      productId,
      productName,
      countryCount,
    },
  });
};

/**
 * Create notification when price forecasts are ready
 */
export const notifyPriceForecastReady = async (
  userId: string,
  productId: string,
  productName: string,
  materialCount: number
) => {
  return createNotification({
    userId,
    type: NotificationType.PRICE_FORECAST_READY,
    title: 'Price Forecast Ready',
    message: `Price forecasts have been generated for ${materialCount} material${materialCount > 1 ? 's' : ''}`,
    metadata: {
      productId,
      productName,
      materialCount,
    },
  });
};

