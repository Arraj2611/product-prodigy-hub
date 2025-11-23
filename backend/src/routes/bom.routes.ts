import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validator.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { aiService } from '../services/ai.service.js';
import { forecastService } from '../services/forecast.service.js';
import logger from '../utils/logger.js';
import { runBackgroundTask } from '../utils/backgroundTask.js';
import { notifyBOMGenerated, notifySuppliersFound, notifyMarketForecastReady } from '../services/notification.service.js';

const router = Router();

// All BOM routes require authentication
router.use(authenticate);

/**
 * Maps AI response material types to Prisma MaterialType enum values
 */
function mapMaterialType(aiType: string, category: string): 'FABRIC' | 'TRIM' | 'HARDWARE' | 'NOTION' | 'PACKAGING' | 'LABELING' {
  const typeLower = aiType.toLowerCase();
  const categoryLower = category.toLowerCase();
  
  // Check category first for better accuracy
  if (categoryLower.includes('packaging') || categoryLower.includes('labeling')) {
    if (categoryLower.includes('labeling')) return 'LABELING';
    return 'PACKAGING';
  }
  
  // Map based on type string
  if (typeLower.includes('fabric') || typeLower.includes('primary fabric') || typeLower.includes('material')) {
    return 'FABRIC';
  }
  
  if (typeLower.includes('hardware') || typeLower.includes('closure') || typeLower.includes('button') || typeLower.includes('zipper') || typeLower.includes('rivet')) {
    return 'HARDWARE';
  }
  
  if (typeLower.includes('trim') || categoryLower.includes('trim')) {
    return 'TRIM';
  }
  
  if (typeLower.includes('notion') || typeLower.includes('thread') || typeLower.includes('interfacing')) {
    return 'NOTION';
  }
  
  // Default based on category
  if (categoryLower.includes('shell') || categoryLower.includes('fabrication')) {
    return 'FABRIC';
  }
  
  if (categoryLower.includes('hardware')) {
    return 'HARDWARE';
  }
  
  // Default fallback
  return 'FABRIC';
}

/**
 * Maps AI response certification types to Prisma CertificationType enum values
 */
function mapCertificationType(aiCertType: string): 'GOTS' | 'FAIR_TRADE' | 'FSC' | 'OEKO_TEX' | 'ORGANIC' | 'RECYCLED' | 'OTHER' {
  const certLower = aiCertType.toLowerCase().replace(/[_-]/g, '');
  
  // Direct matches
  if (certLower.includes('gots')) return 'GOTS';
  if (certLower.includes('fairtrade') || certLower.includes('fair trade')) return 'FAIR_TRADE';
  if (certLower.includes('fsc')) return 'FSC';
  if (certLower.includes('oekotex') || certLower.includes('oeko tex')) return 'OEKO_TEX';
  if (certLower.includes('organic')) return 'ORGANIC';
  if (certLower.includes('recycled')) return 'RECYCLED';
  
  // ISO and other standards map to OTHER
  if (certLower.includes('iso') || certLower.includes('9001') || certLower.includes('14001')) return 'OTHER';
  
  // Default fallback
  return 'OTHER';
}

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

    // Update product status to PROCESSING
    await prisma.product.update({
      where: { id: productId },
      data: { status: 'PROCESSING' },
    });

    // Start BOM generation in background (async)
    runBackgroundTask(async () => {
      try {
        logger.info(`Starting BOM generation for product ${productId} in background`);
        
        // Call AI service to generate BOM
        const aiResult = await aiService.generateBOM({
          images,
          description: product.description || '',
          yieldBuffer,
        });

        // Validate that we got categories
        if (!aiResult.bom.categories || aiResult.bom.categories.length === 0) {
          logger.error(`BOM generation failed: No categories returned from AI service for product ${productId}`);
          logger.error(`AI result structure: ${JSON.stringify(Object.keys(aiResult.bom))}`);
          throw new Error('BOM generation failed: No categories returned from AI service');
        }

        logger.info(`BOM generation returned ${aiResult.bom.categories.length} categories with ${aiResult.bom.categories.reduce((sum: number, cat: any) => sum + (cat.items?.length || 0), 0)} total items`);

        // Calculate total cost from all items if not provided
        let totalBomCost = aiResult.bom.total_cost || null;
        if (!totalBomCost) {
          // Calculate from categories
          let calculatedTotal = 0;
          for (const category of aiResult.bom.categories) {
            for (const item of category.items || []) {
              const itemTotal = item.totalCost || item.total_cost || 0;
              calculatedTotal += Number(itemTotal) || 0;
            }
          }
          totalBomCost = calculatedTotal > 0 ? calculatedTotal : null;
        }
        
        // Create BOM in database
        const bom = await prisma.bOM.create({
          data: {
            productId,
            status: 'DRAFT',
            confidence: aiResult.confidence,
            totalCost: totalBomCost ? Number(totalBomCost.toFixed(2)) : null,
            yieldBuffer,
            version: 1,
          },
        });

        // Extract material names early for parallel processing
        const materialNames: string[] = [];
        const materialDetails: Array<{name: string; type: string; quantity: number; unit: string}> = [];
        
        // Create BOM items
        const bomItems: any[] = [];
        for (const category of aiResult.bom.categories) {
          if (!category.items || category.items.length === 0) {
            logger.warn(`Category '${category.category}' has no items, skipping`);
            continue;
          }
          for (const item of category.items) {
            const quantity = typeof item.quantity === 'string' 
              ? parseFloat(item.quantity.replace(/[^0-9.]/g, '')) || 0
              : item.quantity;
            
            // Collect material info for parallel processing
            materialNames.push(item.name);
            materialDetails.push({
              name: item.name,
              type: item.type || 'MATERIAL',
              quantity,
              unit: item.unit || 'piece'
            });

            // Map AI type to Prisma MaterialType enum
            const materialType = mapMaterialType(item.type || '', category.category);
            
            // Extract cost data from item
            const unitCost = item.unitCost || item.unit_cost || null;
            const totalCost = item.totalCost || item.total_cost || null;
            
            // Calculate costs if not provided, and ensure accuracy
            let finalUnitCost = unitCost;
            let finalTotalCost = totalCost;
            
            if (!finalUnitCost && !finalTotalCost) {
              // No cost data provided, set to null
              finalUnitCost = null;
              finalTotalCost = null;
            } else if (!finalTotalCost && finalUnitCost) {
              // Calculate total from unit cost
              finalTotalCost = Number(finalUnitCost) * quantity;
            } else if (!finalUnitCost && finalTotalCost) {
              // Calculate unit cost from total
              finalUnitCost = quantity > 0 ? Number(finalTotalCost) / quantity : null;
            } else if (finalUnitCost && finalTotalCost && quantity > 0) {
              // Both provided - verify accuracy: totalCost should equal unitCost * quantity
              const calculatedTotal = Number(finalUnitCost) * quantity;
              const tolerance = 0.01; // Allow 1 cent tolerance
              if (Math.abs(Number(finalTotalCost) - calculatedTotal) > tolerance) {
                // Recalculate to ensure accuracy
                console.log(`⚠️  Cost mismatch for ${item.name}: provided=${finalTotalCost}, calculated=${calculatedTotal}, using calculated`);
                finalTotalCost = calculatedTotal;
              }
            }
            
            const bomItem = await prisma.bOMItem.create({
              data: {
                bomId: bom.id,
                category: category.category,
                name: item.name,
                type: materialType,
                quantity,
                unit: item.unit,
                unitCost: finalUnitCost ? Number(finalUnitCost.toFixed(2)) : null,
                totalCost: finalTotalCost ? Number(finalTotalCost.toFixed(2)) : null,
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

        // Update product status to BOM_GENERATED
        await prisma.product.update({
          where: { id: productId },
          data: { status: 'BOM_GENERATED' },
        });

        // Create notification for BOM generation
        try {
          await notifyBOMGenerated(
            userId,
            productId,
            product.name,
            aiResult.confidence || 0.85
          );
        } catch (error) {
          logger.warn('Failed to create BOM notification:', error);
        }

        // Start market analysis and supplier generation in PARALLEL (once materials are identified)
        // This happens asynchronously so BOM completion isn't blocked
        logger.info(`Starting parallel market analysis and supplier generation for ${materialNames.length} materials`);
        
        // Parallel task 1: Market Analysis
        runBackgroundTask(async () => {
          try {
            // Generate market demand forecasts - Markets where the FINISHED PRODUCT can be SOLD
            try {
              logger.info(`Generating market forecasts for product ${productId} - analyzing markets to SELL the finished product`);
              
              const marketForecast = await forecastService.generateMarketForecast({
                product_name: product.name,
                product_description: product.description || '',
                bom_materials: materialNames, // Used for context only, not for material markets
              });

              // Validate forecasts array exists and has data
              if (!marketForecast.forecasts || marketForecast.forecasts.length === 0) {
                logger.warn(`No market forecasts returned for product ${productId}. AI service may need more time or there was an issue.`);
              } else {
                // Store market forecasts in database
                let storedCount = 0;
                for (const forecast of marketForecast.forecasts) {
                  try {
                    await prisma.marketDemandForecast.create({
                      data: {
                        productId,
                        bomId: bom.id,
                        country: forecast.country || 'Unknown',
                        city: forecast.city || null,
                        demand: Number(forecast.demand) || 50,
                        competition: Number(forecast.competition) || 50,
                        price: Number(forecast.price) || 50,
                        growth: Number(forecast.growth) || 50,
                        marketSize: forecast.marketSize || null,
                        avgPrice: forecast.avgPrice || null,
                        growthPercent: forecast.growthPercent || null,
                        trend: forecast.trend || 'stable',
                      },
                    });
                    storedCount++;
                  } catch (dbError) {
                    logger.warn(`Failed to store market forecast for ${forecast.country}: ${dbError}`);
                  }
                }
                logger.info(`Market forecasts stored for product ${productId}: ${storedCount}/${marketForecast.forecasts.length} markets saved to database`);
                
                // Create notification for market forecasts
                if (storedCount > 0) {
                  try {
                    await notifyMarketForecastReady(
                      userId,
                      productId,
                      product.name,
                      storedCount
                    );
                  } catch (error) {
                    logger.warn('Failed to create market forecast notification:', error);
                  }
                }
              }
            } catch (error) {
              logger.error(`Failed to generate market forecasts for product ${productId}:`, error);
              // Don't fail the entire BOM generation if market forecasts fail
            }

          // Generate price forecasts for each material (with delays to prevent rate limiting)
          // Skip price forecasts for now as they're causing rate limits and timeouts
          // TODO: Re-enable with better rate limiting when API limits are increased
          /*
          for (let i = 0; i < bomItems.length; i++) {
            const item = bomItems[i];
            try {
              // Add delay between requests to prevent rate limiting (2 seconds between each)
              if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
              
              const priceForecast = await forecastService.generatePriceForecast({
                material_name: item.name,
                material_type: item.type,
                unit: item.unit,
                weeks: 8,
              });

              // Store price forecasts in database
              for (const forecast of priceForecast.forecasts) {
                await prisma.materialPriceForecast.create({
                  data: {
                    productId,
                    bomId: bom.id,
                    materialName: item.name,
                    unit: item.unit,
                    week: forecast.week,
                    price: forecast.price,
                  },
                });
              }
            } catch (error) {
              logger.warn(`Failed to generate price forecast for ${item.name}: ${error}`);
            }
          }
          */

          // Generate suppliers - max 3 unique suppliers per material (by material name)
          // OPTIMIZATION: Limit to top 6 most important materials to reduce API calls
          // Prioritize by total cost, then by quantity
          let totalSuppliersFound = 0;
          const materialSupplierCounts = new Map<string, number>(); // Track by material NAME, not type
          const processedMaterials = new Set<string>(); // Track which materials we've already processed
          
          // Get unique materials (by name) and sort by importance (total cost, then quantity)
          const uniqueMaterials = Array.from(
            new Map(bomItems.map(item => [item.name, item])).values()
          ).sort((a, b) => {
            // Sort by total cost (descending), then by quantity (descending)
            const costA = Number(a.totalCost || a.unitCost || 0) * Number(a.quantity || 0);
            const costB = Number(b.totalCost || b.unitCost || 0) * Number(b.quantity || 0);
            if (costB !== costA) return costB - costA;
            return Number(b.quantity || 0) - Number(a.quantity || 0);
          });
          
          // Limit to top 6 materials to reduce API calls and rate limiting
          const materialsToProcess = uniqueMaterials.slice(0, 6);
          logger.info(`Processing suppliers for top ${materialsToProcess.length} materials (out of ${uniqueMaterials.length} total)`);
          
          for (let i = 0; i < materialsToProcess.length; i++) {
            const item = materialsToProcess[i];
            const materialKey = item.name; // Use material name as key
            
            // Skip if we already processed this material
            if (processedMaterials.has(materialKey)) {
              continue;
            }
            
            // Check if we already have 3 suppliers for this specific material
            const currentCount = materialSupplierCounts.get(materialKey) || 0;
            if (currentCount >= 3) {
              processedMaterials.add(materialKey);
              continue; // Skip if we already have 3 suppliers for this material
            }
            
            try {
              // Add delay between requests to prevent rate limiting (5 seconds between each)
              // Increased delay to better handle rate limits
              if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 5000));
              }
              
              const suppliers = await forecastService.generateSuppliers({
                material_name: item.name,
                material_type: item.type,
                quantity: Number(item.quantity),
                unit: item.unit,
              });
              
              processedMaterials.add(materialKey); // Mark as processed

              // Limit to exactly 3 suppliers per material (by name)
              const suppliersToAdd = suppliers.suppliers.slice(0, 3 - currentCount);
              totalSuppliersFound += suppliersToAdd.length;
              materialSupplierCounts.set(materialKey, currentCount + suppliersToAdd.length);

              // Store suppliers in database
              for (const supplierData of suppliersToAdd) {
                // Check if supplier already exists
                let supplier = await prisma.supplier.findFirst({
                  where: {
                    name: supplierData.name,
                    country: supplierData.country,
                  },
                });

                if (!supplier) {
                  supplier = await prisma.supplier.create({
                    data: {
                      name: supplierData.name,
                      country: supplierData.country,
                      city: supplierData.city,
                      location: `${supplierData.city}, ${supplierData.country}`,
                      coordinates: supplierData.coordinates,
                      status: 'ACTIVE',
                      rating: supplierData.rating,
                      reliability: supplierData.reliability,
                      website: supplierData.website || null,
                      contactEmail: supplierData.contactEmail || null,
                    },
                  });

                  // Add certifications
                  for (const certType of supplierData.certifications) {
                    // Map AI certification type to Prisma enum
                    const mappedCertType = mapCertificationType(certType);
                    await prisma.supplierCertification.create({
                      data: {
                        supplierId: supplier.id,
                        type: mappedCertType,
                        verified: true,
                      },
                    });
                  }
                }

                // Create supplier material relationship
                await prisma.supplierMaterial.create({
                  data: {
                    supplierId: supplier.id,
                    materialName: item.name,
                    unitPrice: supplierData.unitPrice,
                    unit: item.unit,
                    moq: supplierData.moq != null ? String(supplierData.moq) : null,
                    leadTime: supplierData.leadTime,
                  },
                });
              }
            } catch (error) {
              logger.warn(`Failed to generate suppliers for ${item.name}: ${error}`);
            }
          }

          // Create notification for suppliers found and update product status to SOURCING
          if (totalSuppliersFound > 0) {
            try {
              // Update product status to SOURCING when suppliers are found
              await prisma.product.update({
                where: { id: productId },
                data: { status: 'SOURCING' },
              });
              
              await notifySuppliersFound(
                userId,
                productId,
                product.name,
                totalSuppliersFound
              );
            } catch (error) {
              logger.warn('Failed to create suppliers notification or update product status:', error);
            }
          }

            logger.info(`Suppliers generated for product ${productId}: ${totalSuppliersFound} suppliers found`);
          } catch (error) {
            logger.error(`Supplier generation task failed for product ${productId}:`, error);
          }
        });
      } catch (error) {
        logger.error(`Error in BOM generation background task for product ${productId}:`, error);
        // Update product status to indicate error (optional - you might want to add an ERROR status)
        await prisma.product.update({
          where: { id: productId },
          data: { status: 'DRAFT' }, // Revert to DRAFT on error
        });
      }
    }, `BOM generation for product ${productId}`);

    // Return immediately - BOM generation is happening in background
    res.status(202).json({
      success: true,
      message: 'BOM generation started. You will be notified when it completes.',
      data: {
        productId,
        status: 'PROCESSING',
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

        // Map AI type to Prisma MaterialType enum (or use as-is if already valid enum)
        const materialType = ['FABRIC', 'TRIM', 'HARDWARE', 'NOTION', 'PACKAGING', 'LABELING'].includes(item.type)
          ? item.type as 'FABRIC' | 'TRIM' | 'HARDWARE' | 'NOTION' | 'PACKAGING' | 'LABELING'
          : mapMaterialType(item.type || '', item.category || '');

        await prisma.bOMItem.create({
          data: {
            bomId,
            category: item.category,
            name: item.name,
            type: materialType,
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

