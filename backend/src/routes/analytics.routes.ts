import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// Get market demand forecasts for a product
router.get(
  '/products/:productId/market-forecasts',
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

    const forecasts = await prisma.marketDemandForecast.findMany({
      where: {
        productId,
      },
      orderBy: {
        demand: 'desc',
      },
    });

    res.json({
      success: true,
      data: { forecasts },
    });
  })
);

// Get material price forecasts for a product
router.get(
  '/products/:productId/price-forecasts',
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

    const forecasts = await prisma.materialPriceForecast.findMany({
      where: {
        productId,
      },
      orderBy: [
        { materialName: 'asc' },
        { week: 'asc' },
      ],
    });

    // Group by material
    const grouped: Record<string, Array<{ week: number; price: number }>> = {};
    for (const forecast of forecasts) {
      if (!grouped[forecast.materialName]) {
        grouped[forecast.materialName] = [];
      }
      grouped[forecast.materialName].push({
        week: forecast.week,
        price: Number(forecast.price),
      });
    }

    res.json({
      success: true,
      data: { forecasts: grouped },
    });
  })
);

// Get aggregated market forecasts (for dashboard)
router.get(
  '/market-forecasts',
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    // Get latest forecasts for all user's products
    const forecasts = await prisma.marketDemandForecast.findMany({
      where: {
        product: {
          userId,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        forecastDate: 'desc',
      },
      take: 50, // Limit to recent forecasts
    });

    res.json({
      success: true,
      data: { forecasts },
    });
  })
);

// Get aggregated price forecasts (for dashboard)
router.get(
  '/price-forecasts',
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { material } = req.query;

    const where: any = {
      product: {
        userId,
      },
    };

    if (material) {
      where.materialName = material as string;
    }

    const forecasts = await prisma.materialPriceForecast.findMany({
      where,
      orderBy: [
        { materialName: 'asc' },
        { week: 'asc' },
      ],
      take: 100, // Limit results
    });

    // Group by material
    const grouped: Record<string, Array<{ week: number; price: number }>> = {};
    for (const forecast of forecasts) {
      if (!grouped[forecast.materialName]) {
        grouped[forecast.materialName] = [];
      }
      grouped[forecast.materialName].push({
        week: forecast.week,
        price: Number(forecast.price),
      });
    }

    res.json({
      success: true,
      data: { forecasts: grouped },
    });
  })
);

// ROUTE FROZEN - Commented out temporarily
// Get revenue projections for a product
// router.get(
//   '/products/:productId/revenue-projection',
//   asyncHandler(async (req, res) => {
//     const { productId } = req.params;
//     const userId = req.user!.userId;

//     // Verify product belongs to user
//     const product = await prisma.product.findFirst({
//       where: {
//         id: productId,
//         userId,
//       },
//       include: {
//         boms: {
//           include: {
//             items: true,
//           },
//           take: 1,
//           orderBy: {
//             createdAt: 'desc',
//           },
//         },
//       },
//     });

//     if (!product) {
//       throw new AppError('Product not found', 404);
//     }

//     // Calculate BOM cost
//     const bom = product.boms[0];
//     let bomCost = 0;
//     if (bom) {
//       bomCost = bom.items.reduce((sum, item) => {
//         const quantity = Number(item.quantity) || 0;
//         const unitCost = Number(item.unitCost) || 0;
//         return sum + (quantity * unitCost);
//       }, 0);
//     }

//     // If no BOM cost, use default
//     if (bomCost === 0) {
//       bomCost = 50; // Default fallback
//     }

//     // Call AI service to generate revenue projection
//     const { aiService } = await import('../services/ai.service.js');
//     try {
//       const projection = await aiService.generateRevenueProjection({
//         product_name: product.name,
//         product_description: product.description || '',
//         bom_cost: bomCost,
//       });

//       res.json({
//         success: true,
//         data: projection,
//       });
//     } catch (error: any) {
//       // Fallback: return empty projection
//       res.json({
//         success: true,
//         data: { projections: [] },
//       });
//     }
//   })
// );

// Return empty response for frozen route
router.get(
  '/products/:productId/revenue-projection',
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      data: { projections: [] },
    });
  })
);

// ROUTE FROZEN - Commented out temporarily
// Get product performance metrics
// router.get(
//   '/product-performance',
//   asyncHandler(async (req, res) => {
//     const userId = req.user!.userId;

//     // Get all user's products
//     const products = await prisma.product.findMany({
//       where: {
//         userId,
//       },
//       include: {
//         boms: {
//           include: {
//             items: true,
//           },
//           take: 1,
//         },
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//       take: 10, // Limit to recent products
//     });

//     if (products.length === 0) {
//       return res.json({
//         success: true,
//         data: { performance: [] },
//       });
//     }

//     // Prepare product data for AI service
//     const productData = products.map(p => ({
//       name: p.name,
//       description: p.description || '',
//       status: p.status,
//     }));

//     // Call AI service to generate performance metrics
//     const { aiService } = await import('../services/ai.service.js');
//     try {
//       const performance = await aiService.generateProductPerformance({
//         products: productData,
//       });

//       res.json({
//         success: true,
//         data: performance,
//       });
//     } catch (error: any) {
//       // Fallback: return basic metrics
//       const fallback = products.map((p, i) => ({
//         product: p.name,
//         sales: 100 + (i * 50),
//         revenue: 20000 + (i * 10000),
//         margin: 50 + (i * 5),
//       }));

//       res.json({
//         success: true,
//         data: { performance: fallback },
//       });
//     }
//   })
// );

// Return empty response for frozen route
router.get(
  '/product-performance',
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      data: { performance: [] },
    });
  })
);

export default router;

