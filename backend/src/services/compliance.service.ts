import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
// import logger from '../utils/logger.js'; // Reserved for future use

export interface RiskFactors {
  geopoliticalStability: number; // 0-100
  priceVolatility: number; // 0-100
  certificationStatus: number; // 0-100
  historicalCompliance: number; // 0-100
}

export class ComplianceService {
  async calculateRiskIndex(supplierId: string): Promise<number> {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        certifications: {
          where: { verified: true },
        },
        priceHistory: {
          orderBy: { date: 'desc' },
          take: 90, // Last 90 days
        },
      },
    });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    const factors = await this.assessRiskFactors(supplier);

    // Weighted risk calculation
    const riskIndex =
      factors.geopoliticalStability * 0.3 +
      factors.priceVolatility * 0.25 +
      factors.certificationStatus * 0.25 +
      factors.historicalCompliance * 0.2;

    // Update supplier risk index
    await prisma.supplier.update({
      where: { id: supplierId },
      data: { riskIndex: Math.round(riskIndex) },
    });

    return Math.round(riskIndex);
  }

  private async assessRiskFactors(supplier: any): Promise<RiskFactors> {
    // Geopolitical stability (simplified - in production, use external APIs)
    const geopoliticalStability = this.getGeopoliticalStability(supplier.country);

    // Price volatility
    const priceVolatility = this.calculatePriceVolatility(supplier.priceHistory || []);

    // Certification status
    const certificationStatus = this.assessCertificationStatus(supplier.certifications || []);

    // Historical compliance (simplified)
    const historicalCompliance = supplier.reliability || 50;

    return {
      geopoliticalStability,
      priceVolatility,
      certificationStatus,
      historicalCompliance,
    };
  }

  private getGeopoliticalStability(country: string): number {
    // Simplified - in production, use external geopolitical risk APIs
    const stabilityMap: Record<string, number> = {
      'Japan': 95,
      'USA': 90,
      'Germany': 90,
      'Italy': 85,
      'India': 75,
      'China': 70,
      'Pakistan': 65,
      'Vietnam': 75,
    };

    return stabilityMap[country] || 50;
  }

  private calculatePriceVolatility(priceHistory: any[]): number {
    if (priceHistory.length < 2) {
      return 50; // Medium risk if no history
    }

    const prices = priceHistory.map((p) => Number(p.unitPrice));
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const coefficient = (stdDev / mean) * 100;

    // Convert to risk score (0-100, higher volatility = higher risk)
    return Math.min(100, coefficient * 2);
  }

  private assessCertificationStatus(certifications: any[]): number {
    if (certifications.length === 0) {
      return 100; // High risk if no certifications
    }

    // More certifications = lower risk
    const baseRisk = 100;
    const riskReduction = certifications.length * 15;
    return Math.max(0, baseRisk - riskReduction);
  }

  async verifyCertification(supplierId: string, certificationId: string): Promise<void> {
    const certification = await prisma.supplierCertification.findFirst({
      where: {
        id: certificationId,
        supplierId,
      },
    });

    if (!certification) {
      throw new AppError('Certification not found', 404);
    }

    // In production, verify with external certification databases
    await prisma.supplierCertification.update({
      where: { id: certificationId },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });

    // Recalculate risk index
    await this.calculateRiskIndex(supplierId);
  }

  async createAuditLog(data: {
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async getAuditLogs(filters: {
    userId?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
    });
  }
}

export const complianceService = new ComplianceService();

