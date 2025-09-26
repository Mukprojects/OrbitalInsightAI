import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database.js';
import { createError } from '../middleware/errorHandler.js';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const debrisQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional().default(1),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default(20),
  type: z.enum(['ROCKET_BODY', 'PAYLOAD', 'MISSION_DEBRIS', 'FRAGMENTATION_DEBRIS', 'UNKNOWN']).optional(),
  minSize: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  maxSize: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  sortBy: z.enum(['name', 'size', 'lastObserved', 'decayPrediction']).optional().default('lastObserved'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Get all debris objects with filtering and pagination
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = debrisQuerySchema.parse(req.query);
    const { page, limit, type, minSize, maxSize, sortBy, sortOrder } = query;
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      isTracked: true,
    };
    
    if (type) where.type = type;
    if (minSize !== undefined || maxSize !== undefined) {
      where.size = {};
      if (minSize !== undefined) where.size.gte = minSize;
      if (maxSize !== undefined) where.size.lte = maxSize;
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [debris, total] = await Promise.all([
      prisma.debrisObject.findMany({
        where,
        include: {
          positions: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.debrisObject.count({ where }),
    ]);

    const debrisWithPositions = debris.map(obj => ({
      ...obj,
      currentPosition: obj.positions[0] || null,
      positions: undefined, // Remove positions array from response
    }));

    res.json({
      debris: debrisWithPositions,
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

// Get debris object by ID
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    
    const debris = await prisma.debrisObject.findUnique({
      where: { id },
      include: {
        positions: {
          orderBy: { timestamp: 'desc' },
          take: 100, // Last 100 positions for trajectory visualization
        },
      },
    });

    if (!debris) {
      throw createError('Debris object not found', 404, 'DEBRIS_NOT_FOUND');
    }

    const debrisWithTrajectory = {
      ...debris,
      currentPosition: debris.positions[0] || null,
      trajectory: debris.positions.map(pos => ({
        latitude: pos.latitude,
        longitude: pos.longitude,
        altitude: pos.altitude,
        timestamp: pos.timestamp,
      })),
    };

    res.json({ debris: debrisWithTrajectory });
  } catch (error) {
    next(error);
  }
});

// Get debris position history
router.get('/:id/positions', async (req, res, next) => {
  try {
    const { id } = req.params;
    const hours = parseInt(req.query.hours as string) || 24;
    
    const debris = await prisma.debrisObject.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!debris) {
      throw createError('Debris object not found', 404, 'DEBRIS_NOT_FOUND');
    }

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const positions = await prisma.debrisPosition.findMany({
      where: {
        debrisId: id,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
    });

    res.json({
      debris: { id: debris.id, name: debris.name },
      positions,
      timeRange: { hours, since, until: new Date() },
    });
  } catch (error) {
    next(error);
  }
});

// Get debris statistics
router.get('/stats/overview', async (req, res, next) => {
  try {
    const [
      totalDebris,
      trackedDebris,
      debrisByType,
      recentDecays,
      upcomingDecays,
      sizeDistribution,
      altitudeDistribution,
    ] = await Promise.all([
      prisma.debrisObject.count(),
      prisma.debrisObject.count({ where: { isTracked: true } }),
      prisma.debrisObject.groupBy({
        by: ['type'],
        where: { isTracked: true },
        _count: true,
      }),
      prisma.debrisObject.count({
        where: {
          decayPrediction: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            lte: new Date(),
          },
        },
      }),
      prisma.debrisObject.count({
        where: {
          decayPrediction: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
          },
        },
      }),
      prisma.debrisObject.findMany({
        where: {
          isTracked: true,
          size: { not: null },
        },
        select: { size: true },
      }),
      prisma.debrisPosition.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        select: { altitude: true },
        distinct: ['debrisId'],
      }),
    ]);

    // Process size distribution
    const sizeRanges = {
      'Small (< 1m)': 0,
      'Medium (1-10m)': 0,
      'Large (> 10m)': 0,
      'Unknown': 0,
    };

    sizeDistribution.forEach(obj => {
      if (!obj.size) sizeRanges['Unknown']++;
      else if (obj.size < 1) sizeRanges['Small (< 1m)']++;
      else if (obj.size <= 10) sizeRanges['Medium (1-10m)']++;
      else sizeRanges['Large (> 10m)']++;
    });

    // Process altitude distribution
    const altitudeRanges = {
      'LEO (< 2000km)': 0,
      'MEO (2000-35786km)': 0,
      'HEO (> 35786km)': 0,
    };

    altitudeDistribution.forEach(pos => {
      if (pos.altitude < 2000) altitudeRanges['LEO (< 2000km)']++;
      else if (pos.altitude <= 35786) altitudeRanges['MEO (2000-35786km)']++;
      else altitudeRanges['HEO (> 35786km)']++;
    });

    res.json({
      overview: {
        totalDebris,
        trackedDebris,
        untrackedDebris: totalDebris - trackedDebris,
        recentDecays,
        upcomingDecays,
      },
      distribution: {
        byType: debrisByType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {} as Record<string, number>),
        bySize: sizeRanges,
        byAltitude: altitudeRanges,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get upcoming debris decays
router.get('/decays/upcoming', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const upcomingDecays = await prisma.debrisObject.findMany({
      where: {
        decayPrediction: {
          gte: new Date(),
          lte: until,
        },
        isTracked: true,
      },
      include: {
        positions: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: { decayPrediction: 'asc' },
    });

    const decaysWithPositions = upcomingDecays.map(debris => ({
      ...debris,
      currentPosition: debris.positions[0] || null,
      positions: undefined,
      daysUntilDecay: debris.decayPrediction 
        ? Math.ceil((debris.decayPrediction.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        : null,
    }));

    res.json({
      upcomingDecays: decaysWithPositions,
      timeRange: { days, until },
      count: decaysWithPositions.length,
    });
  } catch (error) {
    next(error);
  }
});

// Search debris objects
router.get('/search/query', async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      throw createError('Search query must be at least 2 characters', 400, 'INVALID_QUERY');
    }

    const searchTerm = q.trim();
    
    const debris = await prisma.debrisObject.findMany({
      where: {
        isTracked: true,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { noradId: { equals: isNaN(parseInt(searchTerm)) ? undefined : parseInt(searchTerm) } },
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
        size: true,
        noradId: true,
        lastObserved: true,
        decayPrediction: true,
      },
      take: 20,
      orderBy: { lastObserved: 'desc' },
    });

    res.json({
      query: searchTerm,
      results: debris,
      count: debris.length,
    });
  } catch (error) {
    next(error);
  }
});

// Get debris collision risks
router.get('/risks/collisions', async (req, res, next) => {
  try {
    // Find collision risks involving debris objects
    const debrisRisks = await prisma.collisionRisk.findMany({
      where: {
        isActive: true,
        OR: [
          { secondaryObjName: { contains: 'debris', mode: 'insensitive' } },
          { secondaryObjName: { contains: 'rocket', mode: 'insensitive' } },
        ],
      },
      include: {
        primarySatellite: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { probability: 'desc' },
      take: 50,
    });

    const risksByLevel = debrisRisks.reduce((acc, risk) => {
      acc[risk.riskLevel] = (acc[risk.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      risks: debrisRisks.map(risk => ({
        id: risk.id,
        primarySatellite: risk.primarySatellite,
        debrisObject: risk.secondaryObjName,
        probability: risk.probability,
        riskLevel: risk.riskLevel,
        timeOfClosest: risk.timeOfClosest,
        missDistance: risk.missDistance,
      })),
      distribution: risksByLevel,
      totalRisks: debrisRisks.length,
    });
  } catch (error) {
    next(error);
  }
});

export { router as debrisRoutes };