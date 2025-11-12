import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

export interface SupplierSearchParams {
  material?: string;
  country?: string;
  city?: string;
  minRating?: number;
  certifications?: string[];
  limit?: number;
  offset?: number;
}

export interface SupplierRanking {
  supplier: any;
  score: number;
  reasons: string[];
}

export class SupplierService {
  async searchSuppliers(params: SupplierSearchParams) {
    const {
      material,
      country,
      city,
      minRating = 0,
      certifications = [],
      limit = 20,
      offset = 0,
    } = params;

    const where: any = {
      status: 'ACTIVE',
    };

    if (country) {
      where.country = country;
    }

    if (city) {
      where.city = city;
    }

    if (minRating > 0) {
      where.rating = {
        gte: minRating,
      };
    }

    // Build query
    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        materials: material
          ? {
              where: {
                OR: [
                  { materialName: { contains: material, mode: 'insensitive' } },
                  { material: { name: { contains: material, mode: 'insensitive' } } },
                ],
              },
            }
          : true,
        certifications: certifications.length > 0
          ? {
              where: {
                type: { in: certifications as any[] },
                verified: true,
              },
            }
          : true,
      },
      take: limit,
      skip: offset,
      orderBy: [
        { rating: 'desc' },
        { reliability: 'desc' },
      ],
    });

    return suppliers;
  }

  async rankSuppliers(
    materialName: string,
    quantity: number,
    unit: string
  ): Promise<SupplierRanking[]> {
    // Find suppliers with the material
    const suppliers = await prisma.supplier.findMany({
      where: {
        status: 'ACTIVE',
        materials: {
          some: {
            OR: [
              { materialName: { contains: materialName, mode: 'insensitive' } },
              { material: { name: { contains: materialName, mode: 'insensitive' } } },
            ],
            availability: true,
          },
        },
      },
      include: {
        materials: {
          where: {
            OR: [
              { materialName: { contains: materialName, mode: 'insensitive' } },
              { material: { name: { contains: materialName, mode: 'insensitive' } } },
            ],
          },
        },
        certifications: {
          where: {
            verified: true,
          },
        },
      },
    });

    // Rank suppliers based on multiple factors
    const rankings: SupplierRanking[] = suppliers.map((supplier) => {
      let score = 0;
      const reasons: string[] = [];

      // Rating (0-5 scale, weighted 30%)
      const ratingScore = (supplier.rating || 0) * 6; // Convert to 0-30
      score += ratingScore;
      if (supplier.rating && supplier.rating >= 4.5) {
        reasons.push('High rating');
      }

      // Reliability (0-100 scale, weighted 25%)
      const reliabilityScore = (supplier.reliability || 0) * 0.25;
      score += reliabilityScore;
      if (supplier.reliability && supplier.reliability >= 95) {
        reasons.push('High reliability');
      }

      // Price competitiveness (weighted 25%)
      const material = supplier.materials[0];
      if (material) {
        const priceScore = 25 - (Number(material.unitPrice) % 25); // Lower price = higher score
        score += priceScore;
        reasons.push('Competitive pricing');
      }

      // Certifications (weighted 10%)
      const certScore = supplier.certifications.length * 2;
      score += Math.min(certScore, 10);
      if (supplier.certifications.length > 0) {
        reasons.push(`${supplier.certifications.length} certifications`);
      }

      // Risk index (weighted 10%, lower risk = higher score)
      const riskScore = 10 - ((supplier.riskIndex || 50) / 10);
      score += riskScore;
      if (supplier.riskIndex && supplier.riskIndex < 20) {
        reasons.push('Low risk');
      }

      return {
        supplier: {
          ...supplier,
          material: material,
          estimatedTotalCost: material
            ? Number(material.unitPrice) * quantity
            : null,
        },
        score: Math.round(score * 100) / 100,
        reasons,
      };
    });

    // Sort by score descending
    rankings.sort((a, b) => b.score - a.score);

    return rankings;
  }

  async getSupplier(supplierId: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        materials: true,
        certifications: {
          where: {
            verified: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    return supplier;
  }

  async createSupplier(data: {
    name: string;
    location: string;
    country: string;
    city: string;
    coordinates?: [number, number];
    website?: string;
    contactEmail?: string;
  }) {
    return prisma.supplier.create({
      data: {
        name: data.name,
        location: data.location,
        country: data.country,
        city: data.city,
        coordinates: data.coordinates || null,
        website: data.website,
        contactEmail: data.contactEmail,
        status: 'PENDING_VERIFICATION',
      },
    });
  }
}

export const supplierService = new SupplierService();

