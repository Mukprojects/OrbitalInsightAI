import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database.js';
import { createError } from '../middleware/errorHandler.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

// Validation schemas
const updatePreferencesSchema = z.object({
  theme: z.string().optional(),
  notifications: z.boolean().optional(),
  emailAlerts: z.boolean().optional(),
  defaultView: z.string().optional(),
  trackingRadius: z.number().min(1).max(10000).optional(),
  alertThreshold: z.number().min(0).max(1).optional(),
});

// Get user preferences
router.get('/preferences', async (req: AuthenticatedRequest, res, next) => {
  try {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.user!.id },
    });

    if (!preferences) {
      // Create default preferences if they don't exist
      const defaultPreferences = await prisma.userPreferences.create({
        data: { userId: req.user!.id },
      });
      
      res.json({ preferences: defaultPreferences });
      return;
    }

    res.json({ preferences });
  } catch (error) {
    next(error);
  }
});

// Update user preferences
router.put('/preferences', async (req: AuthenticatedRequest, res, next) => {
  try {
    const validatedData = updatePreferencesSchema.parse(req.body);

    const updatedPreferences = await prisma.userPreferences.upsert({
      where: { userId: req.user!.id },
      update: validatedData,
      create: {
        userId: req.user!.id,
        ...validatedData,
      },
    });

    res.json({
      message: 'Preferences updated successfully',
      preferences: updatedPreferences,
    });
  } catch (error) {
    next(error);
  }
});

// Get user's activity dashboard
router.get('/dashboard', async (req: AuthenticatedRequest, res, next) => {
  try {
    const [
      trackedSatellitesCount,
      unreadAlertsCount,
      recentAlerts,
      trackedSatellites,
      collisionRisks,
    ] = await Promise.all([
      prisma.userSatelliteTracking.count({
        where: { userId: req.user!.id, isActive: true },
      }),
      prisma.alert.count({
        where: { userId: req.user!.id, isRead: false },
      }),
      prisma.alert.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.userSatelliteTracking.findMany({
        where: { userId: req.user!.id, isActive: true },
        include: {
          satellite: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              positions: {
                orderBy: { timestamp: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { addedAt: 'desc' },
        take: 10,
      }),
      prisma.collisionRisk.findMany({
        where: {
          primarySatellite: {
            trackedBy: {
              some: {
                userId: req.user!.id,
                isActive: true,
              },
            },
          },
          isActive: true,
          riskLevel: { in: ['HIGH', 'CRITICAL'] },
        },
        include: {
          primarySatellite: {
            select: { id: true, name: true },
          },
        },
        orderBy: { probability: 'desc' },
        take: 5,
      }),
    ]);

    res.json({
      summary: {
        trackedSatellites: trackedSatellitesCount,
        unreadAlerts: unreadAlertsCount,
        highRiskCollisions: collisionRisks.length,
      },
      recentAlerts,
      trackedSatellites: trackedSatellites.map(tracking => ({
        ...tracking.satellite,
        trackedAt: tracking.addedAt,
        currentPosition: tracking.satellite.positions[0] || null,
      })),
      collisionRisks,
    });
  } catch (error) {
    next(error);
  }
});

// Get user's sessions
router.get('/sessions', async (req: AuthenticatedRequest, res, next) => {
  try {
    const sessions = await prisma.userSession.findMany({
      where: { 
        userId: req.user!.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    res.json({ sessions });
  } catch (error) {
    next(error);
  }
});

// Revoke a specific session
router.delete('/sessions/:sessionId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { sessionId } = req.params;

    const deletedSession = await prisma.userSession.deleteMany({
      where: {
        id: sessionId,
        userId: req.user!.id,
      },
    });

    if (deletedSession.count === 0) {
      throw createError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    next(error);
  }
});

// Revoke all sessions except current
router.delete('/sessions', async (req: AuthenticatedRequest, res, next) => {
  try {
    const currentToken = req.headers.authorization?.split(' ')[1];

    const deletedSessions = await prisma.userSession.deleteMany({
      where: {
        userId: req.user!.id,
        token: { not: currentToken },
      },
    });

    res.json({
      message: 'All other sessions revoked successfully',
      revokedCount: deletedSessions.count,
    });
  } catch (error) {
    next(error);
  }
});

// Admin routes - require ADMIN role
router.use('/admin', requireRole(['ADMIN']));

// Get all users (admin only)
router.get('/admin/users', async (req: AuthenticatedRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          _count: {
            select: {
              trackedSatellites: true,
              alerts: { where: { isRead: false } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update user status (admin only)
router.put('/admin/users/:userId/status', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw createError('Invalid status value', 400, 'INVALID_STATUS');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true,
      },
    });

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

// Update user role (admin only)
router.put('/admin/users/:userId/role', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['USER', 'ADMIN', 'ANALYST', 'RESEARCHER'];
    if (!validRoles.includes(role)) {
      throw createError('Invalid role', 400, 'INVALID_ROLE');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    res.json({
      message: 'User role updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

// Get user statistics (admin only)
router.get('/admin/stats', async (req: AuthenticatedRequest, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      usersByRole,
      recentRegistrations,
      userActivity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        recentRegistrations,
        activeInLastWeek: userActivity,
      },
      distribution: {
        byRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as userRoutes };