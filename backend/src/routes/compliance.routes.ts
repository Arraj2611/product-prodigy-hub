import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { complianceService } from '../services/compliance.service.js';

const router = Router();

router.use(authenticate);

// Calculate risk index for supplier
router.post(
  '/suppliers/:supplierId/risk-index',
  asyncHandler(async (req, res) => {
    const { supplierId } = req.params;
    const riskIndex = await complianceService.calculateRiskIndex(supplierId);

    res.json({
      success: true,
      data: { riskIndex },
    });
  })
);

// Verify certification
router.post(
  '/suppliers/:supplierId/certifications/:certificationId/verify',
  asyncHandler(async (req, res) => {
    const { supplierId, certificationId } = req.params;
    await complianceService.verifyCertification(supplierId, certificationId);

    res.json({
      success: true,
      message: 'Certification verified',
    });
  })
);

// Get audit logs
router.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const {
      userId,
      entityType,
      startDate,
      endDate,
      limit,
    } = req.query;

    const logs = await complianceService.getAuditLogs({
      userId: userId as string | undefined,
      entityType: entityType as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: { logs },
    });
  })
);

export default router;

