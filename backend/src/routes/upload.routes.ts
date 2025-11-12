import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validator.js';
import { upload, processAndUploadAsset, saveAssetToDatabase, deleteAsset } from '../services/upload.service.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

// Validation schema
const uploadSchema = z.object({
  params: z.object({
    productId: z.string().uuid(),
  }),
});

// Upload product assets (images/videos)
router.post(
  '/products/:productId/assets',
  authenticate,
  upload.array('files', 10), // Max 10 files
  validate(uploadSchema),
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user!.userId;

    // Verify product belongs to user
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId,
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    // Process and upload each file
    const assets = await Promise.all(
      req.files.map((file) =>
        processAndUploadAsset(file, productId, userId)
      )
    );

    // Save to database
    const savedAssets = await Promise.all(
      assets.map((asset) => saveAssetToDatabase(productId, asset))
    );

    logger.info(`Uploaded ${savedAssets.length} assets for product ${productId}`);

    res.status(201).json({
      success: true,
      data: {
        assets: savedAssets,
      },
    });
  })
);

// Get product assets
router.get(
  '/products/:productId/assets',
  authenticate,
  validate(uploadSchema),
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user!.userId;

    // Verify product belongs to user
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId,
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const assets = await prisma.productAsset.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { assets },
    });
  })
);

// Delete asset
router.delete(
  '/assets/:assetId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { assetId } = req.params;
    const userId = req.user!.userId;

    // Verify asset belongs to user's product
    const asset = await prisma.productAsset.findFirst({
      where: {
        id: assetId,
        product: {
          userId,
        },
      },
    });

    if (!asset) {
      throw new AppError('Asset not found', 404);
    }

    await deleteAsset(assetId);

    logger.info(`Deleted asset ${assetId}`);

    res.json({
      success: true,
      message: 'Asset deleted successfully',
    });
  })
);

export default router;

