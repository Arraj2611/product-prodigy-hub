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

// Fetch supplier contact information
const fetchContactSchema = z.object({
  body: z.object({
    supplier_name: z.string(),
    city: z.string(),
    country: z.string(),
    website: z.string().optional(),
  }),
});

router.post(
  '/suppliers/fetch-contact',
  validate(fetchContactSchema),
  asyncHandler(async (req, res) => {
    const { supplier_name, city, country, website } = req.body;

    const { aiService } = await import('../services/ai.service.js');
    try {
      const contactInfo = await aiService.fetchSupplierContact({
        supplier_name,
        city,
        country,
        website,
      });

      res.json({
        success: true,
        data: contactInfo,
      });
    } catch (error: any) {
      logger.error(`Failed to fetch supplier contact: ${error}`);
      // Return fallback contact info
      const companyDomain = supplier_name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      res.json({
        success: true,
        data: {
          contactEmail: `sales@${companyDomain}.com`,
          website: website || `https://www.${companyDomain}.com`,
          found: false,
        },
      });
    }
  })
);

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

    const materialStr = typeof material === 'string' ? material : (Array.isArray(material) ? String(material[0]) : String(material || ''));
    const quantityNum = typeof quantity === 'string' ? parseFloat(quantity) : (Array.isArray(quantity) ? parseFloat(String(quantity[0])) : (typeof quantity === 'number' ? quantity : 0));
    const unitStr = typeof unit === 'string' ? unit : (Array.isArray(unit) ? String(unit[0]) : String(unit || ''));
    
    const rankings = await supplierService.rankSuppliers(
      materialStr,
      quantityNum,
      unitStr
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

// Get suppliers for a product (via BOM materials)
router.get(
  '/products/:productId/suppliers',
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user!.userId;

    // Import prisma
    const prisma = (await import('../config/database.js')).default;

    // Verify product belongs to user
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId,
      },
      include: {
        boms: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Get all BOM items for this product
    const bomItems = product.boms.flatMap(bom => bom.items);
    const materialNames = [...new Set(bomItems.map(item => item.name))];

    if (materialNames.length === 0) {
      return res.json({
        success: true,
        data: { suppliers: [] },
      });
    }

    // Find suppliers grouped by material - max 3 unique suppliers per material
    const suppliersByMaterial: Record<string, any[]> = {};
    
    for (const materialName of materialNames) {
      // Find suppliers that provide this specific material
      const materialSuppliers = await prisma.supplier.findMany({
        where: {
          status: 'ACTIVE',
          materials: {
            some: {
              materialName: {
                equals: materialName,
                mode: 'insensitive',
              },
            },
          },
        },
        include: {
          materials: {
            where: {
              materialName: {
                equals: materialName,
                mode: 'insensitive',
              },
            },
          },
          certifications: {
            where: {
              verified: true,
            },
          },
        },
        orderBy: [
          { rating: 'desc' },
          { reliability: 'desc' },
        ],
        take: 3, // Max 3 suppliers per material
      });
      
      suppliersByMaterial[materialName] = materialSuppliers;
    }

    // Flatten suppliers but keep material association
    // A supplier can appear multiple times if they supply multiple materials
    const allSuppliers: any[] = [];
    const seenSupplierIds = new Set<string>();
    
    for (const [materialName, materialSuppliers] of Object.entries(suppliersByMaterial)) {
      for (const supplier of materialSuppliers) {
        // Create a supplier entry for this material
        // If supplier already seen, we still include it but with the material context
        const supplierWithMaterial = {
          ...supplier,
          // Ensure materials array only contains the relevant material for this entry
          materials: supplier.materials.filter((m: any) => 
            m.materialName.toLowerCase() === materialName.toLowerCase()
          ),
        };
        allSuppliers.push(supplierWithMaterial);
        seenSupplierIds.add(supplier.id);
      }
    }

    res.json({
      success: true,
      data: { suppliers: allSuppliers },
    });
  })
);

export default router;

