import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validator.js';
import { commodityService } from '../services/commodity.service.js';
import { supplierService } from '../services/supplier.service.js';
import logger from '../utils/logger.js';

const router = Router();

router.use(authenticate);

// Get commodity price
const getPriceSchema = z.object({
  query: z.object({
    commodity: z.string(),
    date: z.string().optional(),
  }),
});

router.get(
  '/commodities/prices',
  validate(getPriceSchema),
  asyncHandler(async (req, res) => {
    const { commodity, date } = req.query;

    const priceData = await commodityService.getCommodityPrice(
      commodity as string,
      date ? new Date(date as string) : undefined
    );

    res.json({
      success: true,
      data: priceData,
    });
  })
);

// Get historical prices
const getHistorySchema = z.object({
  query: z.object({
    commodity: z.string(),
    days: z.coerce.number().min(1).max(365).optional(),
  }),
});

router.get(
  '/commodities/history',
  validate(getHistorySchema),
  asyncHandler(async (req, res) => {
    const { commodity, days = 90 } = req.query;

    const history = await commodityService.getHistoricalPrices(
      commodity as string,
      days as number
    );

    res.json({
      success: true,
      data: { prices: history },
    });
  })
);

// Search suppliers
const searchSuppliersSchema = z.object({
  query: z.object({
    material: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    certifications: z.string().optional(), // Comma-separated
    limit: z.coerce.number().min(1).max(100).optional(),
    offset: z.coerce.number().min(0).optional(),
  }),
});

router.get(
  '/suppliers',
  validate(searchSuppliersSchema),
  asyncHandler(async (req, res) => {
    const {
      material,
      country,
      city,
      minRating,
      certifications,
      limit = 20,
      offset = 0,
    } = req.query;

    const suppliers = await supplierService.searchSuppliers({
      material: material as string | undefined,
      country: country as string | undefined,
      city: city as string | undefined,
      minRating: minRating as number | undefined,
      certifications: certifications
        ? (certifications as string).split(',')
        : undefined,
      limit: limit as number,
      offset: offset as number,
    });

    res.json({
      success: true,
      data: { suppliers },
    });
  })
);

// Rank suppliers for material
const rankSuppliersSchema = z.object({
  query: z.object({
    material: z.string(),
    quantity: z.coerce.number().min(0),
    unit: z.string(),
  }),
});

router.get(
  '/suppliers/rank',
  validate(rankSuppliersSchema),
  asyncHandler(async (req, res) => {
    const { material, quantity, unit } = req.query;

    const rankings = await supplierService.rankSuppliers(
      material as string,
      quantity as number,
      unit as string
    );

    res.json({
      success: true,
      data: { rankings },
    });
  })
);

// Get supplier details
router.get(
  '/suppliers/:supplierId',
  asyncHandler(async (req, res) => {
    const { supplierId } = req.params;

    const supplier = await supplierService.getSupplier(supplierId);

    res.json({
      success: true,
      data: { supplier },
    });
  })
);

export default router;

