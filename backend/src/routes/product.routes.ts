import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validator.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.use(authenticate);

const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  }),
});

const updateProductSchema = z.object({
  params: z.object({
    productId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(['DRAFT', 'PROCESSING', 'BOM_GENERATED', 'SOURCING', 'READY', 'ARCHIVED']).optional(),
  }),
});

// Create product
router.post(
  '/products',
  validate(createProductSchema),
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user!.userId;

    const product = await prisma.product.create({
      data: {
        userId,
        name,
        description,
        status: 'DRAFT',
      },
    });

    res.status(201).json({
      success: true,
      data: { product },
    });
  })
);

// Get user's products
router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const products = await prisma.product.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { products },
    });
  })
);

// Get product
router.get(
  '/products/:productId',
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user!.userId;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId,
      },
      include: {
        assets: true,
        boms: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            items: true, // Include BOM items for cost calculations
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.json({
      success: true,
      data: { product },
    });
  })
);

// Update product
router.patch(
  '/products/:productId',
  validate(updateProductSchema),
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { name, description, status } = req.body;
    const userId = req.user!.userId;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId,
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
    });

    res.json({
      success: true,
      data: { product: updated },
    });
  })
);

// Delete product
router.delete(
  '/products/:productId',
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user!.userId;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId,
      },
      include: {
        assets: true, // Include assets to delete files from storage
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Delete all asset files from storage before deleting the product
    // (Database records will be cascade deleted automatically)
    const { deleteFile } = await import('../services/storage.service.js');
    const logger = (await import('../utils/logger.js')).default;
    
    for (const asset of product.assets) {
      try {
        await deleteFile(asset.storageKey);
        logger.info(`Deleted asset file: ${asset.storageKey}`);
      } catch (error) {
        // Log warning but continue deletion
        logger.warn(`Failed to delete asset file ${asset.storageKey}: ${error}`);
      }
    }

    // Delete product (cascade delete will handle all related records)
    // This will automatically delete:
    // - ProductAsset records (already handled files above)
    // - BOM records and their BOMItem, BOMVersion records
    // - MarketDemandForecast records
    // - MaterialPriceForecast records
    await prisma.product.delete({
      where: { id: productId },
    });

    logger.info(`Deleted product ${productId} and all related data`);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  })
);

export default router;

