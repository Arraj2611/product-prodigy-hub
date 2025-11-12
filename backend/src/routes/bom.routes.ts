import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validator.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { aiService } from '../services/ai.service.js';
import logger from '../utils/logger.js';

const router = Router();

// All BOM routes require authentication
router.use(authenticate);

// Validation schemas
const createBOMSchema = z.object({
  params: z.object({
    productId: z.string().uuid(),
  }),
  body: z.object({
    yieldBuffer: z.number().min(0).max(50).optional(),
  }),
});

const updateBOMSchema = z.object({
  params: z.object({
    bomId: z.string().uuid(),
  }),
  body: z.object({
    items: z.array(z.object({
      id: z.string().uuid().optional(),
      category: z.string(),
      name: z.string(),
      type: z.string(),
      quantity: z.union([z.number(), z.string()]),
      unit: z.string(),
      unitCost: z.number().optional(),
      totalCost: z.number().optional(),
      specifications: z.record(z.any()).optional(),
      source: z.string().optional(),
    })).optional(),
    yieldBuffer: z.number().min(0).max(50).optional(),
    status: z.enum(['DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'LOCKED']).optional(),
  }),
});

// Generate BOM from product assets
router.post(
  '/products/:productId/boms',
  validate(createBOMSchema),
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { yieldBuffer = 10.0 } = req.body;
    const userId = req.user!.userId;

    // Verify product belongs to user
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId,
      },
      include: {
        assets: true,
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.assets.length === 0) {
      throw new AppError('Product has no assets. Please upload images first.', 400);
    }

    // Prepare images for AI service
    const images = product.assets
      .filter(asset => asset.type === 'image')
      .map(asset => ({
        url: asset.url,
        storageKey: asset.storageKey,
      }));

    if (images.length === 0) {
      throw new AppError('No images found. Please upload product images.', 400);
    }

    // Call AI service to generate BOM
    const aiResult = await aiService.generateBOM({
      images,
      description: product.description || '',
      yieldBuffer,
    });

    // Create BOM in database
    const bom = await prisma.bOM.create({
      data: {
        productId,
        status: 'DRAFT',
        confidence: aiResult.confidence,
        yieldBuffer,
        version: 1,
      },
    });

    // Create BOM items
    const bomItems = [];
    for (const category of aiResult.bom.categories) {
      for (const item of category.items) {
        const quantity = typeof item.quantity === 'string' 
          ? parseFloat(item.quantity.replace(/[^0-9.]/g, '')) || 0
          : item.quantity;

        const bomItem = await prisma.bOMItem.create({
          data: {
            bomId: bom.id,
            category: category.category,
            name: item.name,
            type: item.type as any,
            quantity,
            unit: item.unit,
            specifications: item.specifications || {},
            source: item.source,
          },
        });
        bomItems.push(bomItem);
      }
    }

    // Save version snapshot
    await prisma.bOMVersion.create({
      data: {
        bomId: bom.id,
        version: 1,
        data: {
          categories: aiResult.bom.categories,
          yieldBuffer,
        },
      },
    });

    logger.info(`BOM generated for product ${productId}: ${bom.id}`);

    res.status(201).json({
      success: true,
      data: {
        bom: {
          ...bom,
          items: bomItems,
        },
        aiResult: {
          confidence: aiResult.confidence,
          processingTime: aiResult.processing_time,
        },
      },
    });
  })
);

// Get BOM
router.get(
  '/boms/:bomId',
  asyncHandler(async (req, res) => {
    const { bomId } = req.params;
    const userId = req.user!.userId;

    const bom = await prisma.bOM.findFirst({
      where: {
        id: bomId,
        product: {
          userId,
        },
      },
      include: {
        items: true,
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!bom) {
      throw new AppError('BOM not found', 404);
    }

    res.json({
      success: true,
      data: { bom },
    });
  })
);

// Update BOM
router.patch(
  '/boms/:bomId',
  validate(updateBOMSchema),
  asyncHandler(async (req, res) => {
    const { bomId } = req.params;
    const { items, yieldBuffer, status } = req.body;
    const userId = req.user!.userId;

    // Verify BOM belongs to user
    const bom = await prisma.bOM.findFirst({
      where: {
        id: bomId,
        product: {
          userId,
        },
      },
    });

    if (!bom) {
      throw new AppError('BOM not found', 404);
    }

    if (bom.status === 'LOCKED') {
      throw new AppError('BOM is locked and cannot be modified', 400);
    }

    // Update BOM
    const updateData: any = {};
    if (yieldBuffer !== undefined) updateData.yieldBuffer = yieldBuffer;
    if (status) updateData.status = status;
    if (status === 'LOCKED') updateData.lockedAt = new Date();

    const updatedBOM = await prisma.bOM.update({
      where: { id: bomId },
      data: updateData,
    });

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await prisma.bOMItem.deleteMany({
        where: { bomId },
      });

      // Create new items
      for (const item of items) {
        const quantity = typeof item.quantity === 'string'
          ? parseFloat(item.quantity.replace(/[^0-9.]/g, '')) || 0
          : item.quantity;

        await prisma.bOMItem.create({
          data: {
            bomId,
            category: item.category,
            name: item.name,
            type: item.type as any,
            quantity,
            unit: item.unit,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            specifications: item.specifications || {},
            source: item.source,
          },
        });
      }
    }

    // Create new version snapshot
    const currentVersion = bom.version;
    const bomWithItems = await prisma.bOM.findUnique({
      where: { id: bomId },
      include: { items: true },
    });

    await prisma.bOMVersion.create({
      data: {
        bomId,
        version: currentVersion + 1,
        data: {
          items: bomWithItems?.items || [],
          yieldBuffer: updatedBOM.yieldBuffer,
          status: updatedBOM.status,
        },
      },
    });

    // Increment version
    await prisma.bOM.update({
      where: { id: bomId },
      data: { version: currentVersion + 1 },
    });

    const updatedBOMWithItems = await prisma.bOM.findUnique({
      where: { id: bomId },
      include: { items: true },
    });

    logger.info(`BOM updated: ${bomId}`);

    res.json({
      success: true,
      data: { bom: updatedBOMWithItems },
    });
  })
);

// Get BOM versions
router.get(
  '/boms/:bomId/versions',
  asyncHandler(async (req, res) => {
    const { bomId } = req.params;
    const userId = req.user!.userId;

    // Verify BOM belongs to user
    const bom = await prisma.bOM.findFirst({
      where: {
        id: bomId,
        product: {
          userId,
        },
      },
    });

    if (!bom) {
      throw new AppError('BOM not found', 404);
    }

    const versions = await prisma.bOMVersion.findMany({
      where: { bomId },
      orderBy: { version: 'desc' },
    });

    res.json({
      success: true,
      data: { versions },
    });
  })
);

// Lock BOM
router.post(
  '/boms/:bomId/lock',
  asyncHandler(async (req, res) => {
    const { bomId } = req.params;
    const userId = req.user!.userId;

    const bom = await prisma.bOM.findFirst({
      where: {
        id: bomId,
        product: {
          userId,
        },
      },
    });

    if (!bom) {
      throw new AppError('BOM not found', 404);
    }

    if (bom.status === 'LOCKED') {
      throw new AppError('BOM is already locked', 400);
    }

    const lockedBOM = await prisma.bOM.update({
      where: { id: bomId },
      data: {
        status: 'LOCKED',
        lockedAt: new Date(),
        verifiedBy: userId,
      },
    });

    logger.info(`BOM locked: ${bomId}`);

    res.json({
      success: true,
      data: { bom: lockedBOM },
    });
  })
);

export default router;

