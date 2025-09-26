import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database.js';
import { logger } from '../utils/logger.js';
import { createError } from '../middleware/errorHandler.js';
import { authenticateToken, optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const satelliteQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional().default(1),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default(20),
  type: z.enum(['EARTH_OBSERVATION', 'COMMUNICATION', 'NAVIGATION', 'WEATHER', 'SCIENTIFIC', 'MILITARY', 'COMMERCIAL', 'AMATEUR', 'DEBRIS', 'UNKNOWN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DECAYED', 'MANEUVERING', 'TUMBLING', 'UNKNOWN']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'altitude', 'inclination', 'launchDate', 'updatedAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

const trackSatelliteSchema = z.object({
  satelliteId: z.string().uuid('Invalid satellite ID'),
});

// Get all satellites with filtering and pagination
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = satelliteQuerySchema.parse(req.query);
    const { page, limit, type, status, search, sortBy, sortOrder } = query;
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      isActive: true,
    };
    
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { commonName: { contains: search, mode: 'insensitive' } },
        { owner: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'altitude') {
      orderBy.apogee = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [satellites, total] = await Promise.all([
      prisma.satellite.findMany({
        where,
        include: {
          positions: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
          collisionRisks: {
            where: { isActive: true },
            orderBy: { probability: 'desc' },
            take: 3,
          },
          _count: {
            select: {
              trackedBy: req.user ? { where: { userId: req.user.id } } : undefined,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.satellite.count({ where }),
    ]);

    const satellitesWithTracking = satellites.map(sat => ({
      ...sat,
      isTracked: req.user ? sat._count.trackedBy > 0 : false,
      currentPosition: sat.positions[0] || null,
      riskLevel: sat.collisionRisks[0]?.riskLevel || 'LOW',
    }));

    res.json({
      satellites: satellitesWithTracking,
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

// Get satellite by ID
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    
    const satellite = await prisma.satellite.findUnique({
      where: { id },
      include: {
        tleData: {
          where: { isLatest: true },
          take: 1,
        },
        positions: {
          orderBy: { timestamp: 'desc' },
          take: 100, // Last 100 positions for orbit visualization
        },
        collisionRisks: {
          where: { isActive: true },
          orderBy: { probability: 'desc' },
          include: {
            primarySatellite: {
              select: { id: true, name: true, noradId: true },
            },
          },
        },
        events: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            trackedBy: req.user ? { where: { userId: req.user.id } } : undefined,
          },
        },
      },
    });

    if (!satellite) {
      throw createError('Satellite not found', 404, 'SATELLITE_NOT_FOUND');
    }

    const satelliteWithTracking = {
      ...satellite,
      isTracked: req.user ? satellite._count.trackedBy > 0 : false,
      currentPosition: satellite.positions[0] || null,
      orbitPath: satellite.positions.map(pos => ({
        latitude: pos.latitude,
        longitude: pos.longitude,
        altitude: pos.altitude,
        timestamp: pos.timestamp,
      })),
    };

    res.json({ satellite: satelliteWithTracking });
  } catch (error) {
    next(error);
  }
});

// Get satellite position history
router.get('/:id/positions', async (req, res, next) => {
  try {
    const { id } = req.params;
    const hours = parseInt(req.query.hours as string) || 24;
    
    const satellite = await prisma.satellite.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!satellite) {
      throw createError('Satellite not found', 404, 'SATELLITE_NOT_FOUND');
    }

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const positions = await prisma.satellitePosition.findMany({
      where: {
        satelliteId: id,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
    });

    res.json({
      satellite: { id: satellite.id, name: satellite.name },
      positions,
      timeRange: { hours, since, until: new Date() },
    });
  } catch (error) {
    next(error);
  }
});

// Track/untrack satellite
router.post('/:id/track', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    
    const satellite = await prisma.satellite.findUnique({
      where: { id },
      select: { id: true, name: true, type: true, status: true },
    });

    if (!satellite) {
      throw createError('Satellite not found', 404, 'SATELLITE_NOT_FOUND');
    }

    const existingTracking = await prisma.userSatelliteTracking.findUnique({
      where: {
        userId_satelliteId: {
          userId: req.user!.id,
          satelliteId: id,
        },
      },
    });

    if (existingTracking) {
      // Toggle tracking status
      await prisma.userSatelliteTracking.update({
        where: { id: existingTracking.id },
        data: { isActive: !existingTracking.isActive },
      });

      res.json({
        message: existingTracking.isActive ? 'Satellite untracked' : 'Satellite tracked',
        isTracked: !existingTracking.isActive,
        satellite,
      });
    } else {
      // Create new tracking record
      await prisma.userSatelliteTracking.create({
        data: {
          userId: req.user!.id,
          satelliteId: id,
          isActive: true,
        },
      });

      res.json({
        message: 'Satellite tracked successfully',
        isTracked: true,
        satellite,
      });
    }

    logger.info(`User ${req.user!.username} ${existingTracking?.isActive === false || !existingTracking ? 'tracked' : 'untracked'} satellite ${satellite.name}`);
  } catch (error) {
    next(error);
  }
});

// Get user's tracked satellites
router.get('/user/tracked', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const tracked = await prisma.userSatelliteTracking.findMany({
      where: {
        userId: req.user!.id,
        isActive: true,
      },
      include: {
        satellite: {
          include: {
            positions: {
              orderBy: { timestamp: 'desc' },
              take: 1,
            },
            collisionRisks: {
              where: { isActive: true },
              orderBy: { probability: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    const trackedSatellites = tracked.map(tracking => ({
      ...tracking.satellite,
      trackedAt: tracking.addedAt,
      currentPosition: tracking.satellite.positions[0] || null,
      riskLevel: tracking.satellite.collisionRisks[0]?.riskLevel || 'LOW',
    }));

    res.json({
      trackedSatellites,
      count: trackedSatellites.length,
    });
  } catch (error) {
    next(error);
  }
});

// Get satellite statistics
router.get('/stats/overview', async (req, res, next) => {
  try {
    const [
      totalSatellites,
      activeSatellites,
      satellitesByType,
      satellitesByStatus,
      recentLaunches,
      highRiskCollisions,
    ] = await Promise.all([
      prisma.satellite.count({ where: { isActive: true } }),
      prisma.satellite.count({ where: { isActive: true, status: 'ACTIVE' } }),
      prisma.satellite.groupBy({
        by: ['type'],
        where: { isActive: true },
        _count: true,
      }),
      prisma.satellite.groupBy({
        by: ['status'],
        where: { isActive: true },
        _count: true,
      }),
      prisma.satellite.count({
        where: {
          isActive: true,
          launchDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      prisma.collisionRisk.count({
        where: {
          isActive: true,
          riskLevel: { in: ['HIGH', 'CRITICAL'] },
        },
      }),
    ]);

    res.json({
      overview: {
        totalSatellites,
        activeSatellites,
        inactiveSatellites: totalSatellites - activeSatellites,
        recentLaunches,
        highRiskCollisions,
      },
      distribution: {
        byType: satellitesByType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byStatus: satellitesByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Search satellites
router.get('/search/query', async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      throw createError('Search query must be at least 2 characters', 400, 'INVALID_QUERY');
    }

    const searchTerm = q.trim();
    
    const satellites = await prisma.satellite.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { commonName: { contains: searchTerm, mode: 'insensitive' } },
          { owner: { contains: searchTerm, mode: 'insensitive' } },
          { noradId: { equals: isNaN(parseInt(searchTerm)) ? undefined : parseInt(searchTerm) } },
        ],
      },
      select: {
        id: true,
        name: true,
        commonName: true,
        type: true,
        status: true,
        noradId: true,
        owner: true,
        launchDate: true,
      },
      take: 20,
      orderBy: { name: 'asc' },
    });

    res.json({
      query: searchTerm,
      results: satellites,
      count: satellites.length,
    });
  } catch (error) {
    next(error);
  }
});

export { router as satelliteRoutes };