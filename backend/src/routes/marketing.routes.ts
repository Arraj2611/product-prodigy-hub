import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// All marketing routes require authentication
router.use(authenticate);

// Get marketing campaigns for a product
router.get(
  '/products/:productId/campaigns',
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

    // Call AI service to generate marketing campaigns
    const { aiService } = await import('../services/ai.service.js');
    try {
      const campaigns = await aiService.generateMarketingCampaigns({
        product_name: product.name,
        product_description: product.description || '',
      });

      return res.json({
        success: true,
        data: campaigns,
      });
    } catch (error: any) {
      // Fallback: return empty campaigns
      return res.json({
        success: true,
        data: { campaigns: [] },
      });
    }
  })
);

// Get all marketing campaigns for user
router.get(
  '/campaigns',
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    // Get user's products
    const products = await prisma.product.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5, // Limit to recent products
    });

    if (products.length === 0) {
      return res.json({
        success: true,
        data: { campaigns: [] },
      });
    }

    // Generate campaigns for the first product
    const product = products[0];
    const { aiService } = await import('../services/ai.service.js');
    try {
      const campaigns = await aiService.generateMarketingCampaigns({
        product_name: product.name,
        product_description: product.description || '',
      });

      return res.json({
        success: true,
        data: campaigns,
      });
    } catch (error: any) {
      // Fallback: return empty campaigns
      return res.json({
        success: true,
        data: { campaigns: [] },
      });
    }
  })
);

export default router;

