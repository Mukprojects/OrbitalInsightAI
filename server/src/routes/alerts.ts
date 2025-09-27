import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database.js';
import { createError } from '../middleware/errorHandler.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// All alert routes require authentication
router.use(authenticateToken);

// Validation schemas
const alertQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional().default(1),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default(20),
  type: z.enum(['COLLISION_RISK', 'SATELLITE_ANOMALY', 'SPACE_WEATHER', 'SYSTEM_ALERT', 'LAUNCH_NOTIFICATION']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  isRead: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'severity', 'type']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Get user's alerts with filtering and pagination
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = alertQuerySchema.parse(req.query);
    const { page, limit, type, severity, isRead, sortBy, sortOrder } = query;
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      userId: req.user!.id,
    };
    
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (isRead !== undefined) where.isRead = isRead;

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [alerts, total, unreadCount] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.alert.count({ where }),
      prisma.alert.count({
        where: {
          userId: req.user!.id,
          isRead: false,
        },
      }),
    ]);

    res.json({
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      summary: {
        total,
        unread: unreadCount,
        read: total - unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get alert by ID
router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    
    const alert = await prisma.alert.findUnique({
      where: { 
        id,
        userId: req.user!.id, // Ensure user can only access their own alerts
      },
    });

    if (!alert) {
      throw createError('Alert not found', 404, 'ALERT_NOT_FOUND');
    }

    res.json({ alert });
  } catch (error) {
    next(error);
  }
});

// Mark alert as read
router.put('/:id/read', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const alert = await prisma.alert.findUnique({
      where: { 
        id,
        userId: req.user!.id,
      },
    });

    if (!alert) {
      throw createError('Alert not found', 404, 'ALERT_NOT_FOUND');
    }

    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: { 
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      message: 'Alert marked as read',
      alert: updatedAlert,
    });
  } catch (error) {
    next(error);
  }
});

// Mark alert as unread
router.put('/:id/unread', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const alert = await prisma.alert.findUnique({
      where: { 
        id,
        userId: req.user!.id,
      },
    });

    if (!alert) {
      throw createError('Alert not found', 404, 'ALERT_NOT_FOUND');
    }

    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: { 
        isRead: false,
        readAt: null,
      },
    });

    res.json({
      message: 'Alert marked as unread',
      alert: updatedAlert,
    });
  } catch (error) {
    next(error);
  }
});

// Mark all alerts as read
router.put('/read/all', async (req: AuthenticatedRequest, res, next) => {
  try {
    const updatedAlerts = await prisma.alert.updateMany({
      where: {
        userId: req.user!.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      message: 'All alerts marked as read',
      updatedCount: updatedAlerts.count,
    });
  } catch (error) {
    next(error);
  }
});

// Delete alert
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const alert = await prisma.alert.findUnique({
      where: { 
        id,
        userId: req.user!.id,
      },
    });

    if (!alert) {
      throw createError('Alert not found', 404, 'ALERT_NOT_FOUND');
    }

    await prisma.alert.delete({
      where: { id },
    });

    res.json({
      message: 'Alert deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Delete multiple alerts
router.delete('/bulk/delete', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { alertIds } = req.body;

    if (!Array.isArray(alertIds) || alertIds.length === 0) {
      throw createError('Alert IDs array is required', 400, 'INVALID_ALERT_IDS');
    }

    const deletedAlerts = await prisma.alert.deleteMany({
      where: {
        id: { in: alertIds },
        userId: req.user!.id,
      },
    });

    res.json({
      message: 'Alerts deleted successfully',
      deletedCount: deletedAlerts.count,
    });
  } catch (error) {
    next(error);
  }
});

// Get alert statistics
router.get('/stats/overview', async (req: AuthenticatedRequest, res, next) => {
  try {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalAlerts,
      unreadAlerts,
      alertsByType,
      alertsBySeverity,
      recentAlerts,
      alertTrends,
    ] = await Promise.all([
      prisma.alert.count({
        where: { userId: req.user!.id },
      }),
      prisma.alert.count({
        where: { 
          userId: req.user!.id,
          isRead: false,
        },
      }),
      prisma.alert.groupBy({
        by: ['type'],
        where: { userId: req.user!.id },
        _count: true,
      }),
      prisma.alert.groupBy({
        by: ['severity'],
        where: { userId: req.user!.id },
        _count: true,
      }),
      prisma.alert.count({
        where: {
          userId: req.user!.id,
          createdAt: { gte: last30Days },
        },
      }),
      prisma.alert.groupBy({
        by: ['createdAt'],
        where: {
          userId: req.user!.id,
          createdAt: { gte: last30Days },
        },
        _count: true,
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    res.json({
      overview: {
        total: totalAlerts,
        unread: unreadAlerts,
        read: totalAlerts - unreadAlerts,
        recent: recentAlerts,
      },
      distribution: {
        byType: alertsByType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {} as Record<string, number>),
        bySeverity: alertsBySeverity.reduce((acc, item) => {
          acc[item.severity] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      trends: alertTrends.map(item => ({
        date: item.createdAt,
        count: item._count,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get recent critical alerts
router.get('/critical/recent', async (req: AuthenticatedRequest, res, next) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const criticalAlerts = await prisma.alert.findMany({
      where: {
        userId: req.user!.id,
        severity: { in: ['HIGH', 'CRITICAL'] },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      criticalAlerts,
      timeRange: { hours, since },
      count: criticalAlerts.length,
    });
  } catch (error) {
    next(error);
  }
});

// Create a test alert (for development/testing purposes)
router.post('/test', async (req: AuthenticatedRequest, res, next) => {
  try {
    const testAlert = await prisma.alert.create({
      data: {
        userId: req.user!.id,
        type: 'SYSTEM_ALERT',
        title: 'Test Alert',
        message: 'This is a test alert created for development purposes.',
        severity: 'LOW',
        metadata: {
          source: 'manual',
          testAlert: true,
        },
      },
    });

    res.status(201).json({
      message: 'Test alert created successfully',
      alert: testAlert,
    });
  } catch (error) {
    next(error);
  }
});

export { router as alertRoutes };