import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.use(authenticate);

// Get user's notifications
router.get(
  '/notifications',
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { limit = 20, unreadOnly = false } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : 20,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  })
);

// Mark notification as read
router.patch(
  '/notifications/:notificationId/read',
  asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user!.userId;

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: { notification: updated },
    });
  })
);

// Mark all notifications as read
router.patch(
  '/notifications/read-all',
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: { count: result.count },
    });
  })
);

// Delete notification
router.delete(
  '/notifications/:notificationId',
  asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user!.userId;

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  })
);

export default router;

