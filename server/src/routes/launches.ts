import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database.js';
import { createError } from '../middleware/errorHandler.js';
import { optionalAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const launchQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional().default(1),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default(20),
  status: z.enum(['SCHEDULED', 'DELAYED', 'LAUNCHED', 'SUCCESS', 'FAILURE', 'PARTIAL_FAILURE']).optional(),
  upcoming: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['launchDate', 'name', 'status']).optional().default('launchDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const createLaunchSchema = z.object({
  name: z.string().min(1, 'Launch name is required'),
  launchDate: z.string().datetime('Invalid launch date'),
  rocket: z.string().optional(),
  launchSite: z.string().optional(),
  mission: z.string().optional(),
  status: z.enum(['SCHEDULED', 'DELAYED', 'LAUNCHED', 'SUCCESS', 'FAILURE', 'PARTIAL_FAILURE']).default('SCHEDULED'),
  payloads: z.array(z.string()).default([]),
  description: z.string().optional(),
  liveStream: z.string().url().optional(),
});

const updateLaunchSchema = createLaunchSchema.partial();

// Get all launches with filtering and pagination
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = launchQuerySchema.parse(req.query);
    const { page, limit, status, upcoming, sortBy, sortOrder } = query;
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    if (status) where.status = status;
    if (upcoming) {
      where.launchDate = { gte: new Date() };
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [launches, total] = await Promise.all([
      prisma.launchEvent.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.launchEvent.count({ where }),
    ]);

    const launchesWithMetadata = launches.map(launch => ({
      ...launch,
      isUpcoming: launch.launchDate > new Date(),
      timeUntilLaunch: launch.launchDate > new Date() 
        ? launch.launchDate.getTime() - Date.now()
        : null,
    }));

    res.json({
      launches: launchesWithMetadata,
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

// Get launch by ID
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    
    const launch = await prisma.launchEvent.findUnique({
      where: { id },
    });

    if (!launch) {
      throw createError('Launch event not found', 404, 'LAUNCH_NOT_FOUND');
    }

    const launchWithMetadata = {
      ...launch,
      isUpcoming: launch.launchDate > new Date(),
      timeUntilLaunch: launch.launchDate > new Date() 
        ? launch.launchDate.getTime() - Date.now()
        : null,
      timeSinceLaunch: launch.launchDate <= new Date()
        ? Date.now() - launch.launchDate.getTime()
        : null,
    };

    res.json({ launch: launchWithMetadata });
  } catch (error) {
    next(error);
  }
});

// Get upcoming launches
router.get('/upcoming/next', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const upcomingLaunches = await prisma.launchEvent.findMany({
      where: {
        launchDate: {
          gte: new Date(),
          lte: until,
        },
        status: { in: ['SCHEDULED', 'DELAYED'] },
      },
      orderBy: { launchDate: 'asc' },
      take: 20,
    });

    const launchesWithCountdown = upcomingLaunches.map(launch => ({
      ...launch,
      timeUntilLaunch: launch.launchDate.getTime() - Date.now(),
      daysUntilLaunch: Math.ceil((launch.launchDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    }));

    res.json({
      upcomingLaunches: launchesWithCountdown,
      timeRange: { days, until },
      count: launchesWithCountdown.length,
    });
  } catch (error) {
    next(error);
  }
});

// Get recent launches
router.get('/recent/completed', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const recentLaunches = await prisma.launchEvent.findMany({
      where: {
        launchDate: {
          gte: since,
          lte: new Date(),
        },
        status: { in: ['SUCCESS', 'FAILURE', 'PARTIAL_FAILURE'] },
      },
      orderBy: { launchDate: 'desc' },
      take: 20,
    });

    const launchesWithAge = recentLaunches.map(launch => ({
      ...launch,
      timeSinceLaunch: Date.now() - launch.launchDate.getTime(),
      daysSinceLaunch: Math.floor((Date.now() - launch.launchDate.getTime()) / (24 * 60 * 60 * 1000)),
    }));

    res.json({
      recentLaunches: launchesWithAge,
      timeRange: { days, since },
      count: launchesWithAge.length,
    });
  } catch (error) {
    next(error);
  }
});

// Get launch statistics
router.get('/stats/overview', async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalLaunches,
      launchesThisYear,
      launchesLast30Days,
      upcomingLaunches,
      launchesByStatus,
      successRate,
      launchesByMonth,
    ] = await Promise.all([
      prisma.launchEvent.count(),
      prisma.launchEvent.count({
        where: { launchDate: { gte: yearStart } },
      }),
      prisma.launchEvent.count({
        where: { launchDate: { gte: last30Days } },
      }),
      prisma.launchEvent.count({
        where: {
          launchDate: { gte: new Date() },
          status: { in: ['SCHEDULED', 'DELAYED'] },
        },
      }),
      prisma.launchEvent.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.launchEvent.aggregate({
        where: {
          status: { in: ['SUCCESS', 'FAILURE', 'PARTIAL_FAILURE'] },
        },
        _count: {
          _all: true,
        },
      }),
      prisma.launchEvent.findMany({
        where: {
          launchDate: { gte: yearStart },
        },
        select: {
          launchDate: true,
          status: true,
        },
      }),
    ]);

    // Calculate success rate
    const completedLaunches = await prisma.launchEvent.count({
      where: { status: { in: ['SUCCESS', 'FAILURE', 'PARTIAL_FAILURE'] } },
    });
    const successfulLaunches = await prisma.launchEvent.count({
      where: { status: 'SUCCESS' },
    });
    const calculatedSuccessRate = completedLaunches > 0 ? (successfulLaunches / completedLaunches) * 100 : 0;

    // Process launches by month
    const monthlyLaunches = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      count: 0,
      successful: 0,
    }));

    launchesByMonth.forEach(launch => {
      const month = launch.launchDate.getMonth();
      monthlyLaunches[month].count++;
      if (launch.status === 'SUCCESS') {
        monthlyLaunches[month].successful++;
      }
    });

    res.json({
      overview: {
        totalLaunches,
        launchesThisYear,
        launchesLast30Days,
        upcomingLaunches,
        successRate: calculatedSuccessRate,
      },
      distribution: {
        byStatus: launchesByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byMonth: monthlyLaunches,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Search launches
router.get('/search/query', async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      throw createError('Search query must be at least 2 characters', 400, 'INVALID_QUERY');
    }

    const searchTerm = q.trim();
    
    const launches = await prisma.launchEvent.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { rocket: { contains: searchTerm, mode: 'insensitive' } },
          { launchSite: { contains: searchTerm, mode: 'insensitive' } },
          { mission: { contains: searchTerm, mode: 'insensitive' } },
          { payloads: { hasSome: [searchTerm] } },
        ],
      },
      orderBy: { launchDate: 'desc' },
      take: 20,
    });

    res.json({
      query: searchTerm,
      results: launches,
      count: launches.length,
    });
  } catch (error) {
    next(error);
  }
});

// Admin routes for managing launches
router.use('/admin', requireRole(['ADMIN', 'ANALYST']));

// Create new launch event (admin only)
router.post('/admin', async (req: AuthenticatedRequest, res, next) => {
  try {
    const validatedData = createLaunchSchema.parse(req.body);

    const launch = await prisma.launchEvent.create({
      data: {
        ...validatedData,
        launchDate: new Date(validatedData.launchDate),
      },
    });

    res.status(201).json({
      message: 'Launch event created successfully',
      launch,
    });
  } catch (error) {
    next(error);
  }
});

// Update launch event (admin only)
router.put('/admin/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateLaunchSchema.parse(req.body);

    const updateData: any = { ...validatedData };
    if (validatedData.launchDate) {
      updateData.launchDate = new Date(validatedData.launchDate);
    }

    const launch = await prisma.launchEvent.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: 'Launch event updated successfully',
      launch,
    });
  } catch (error) {
    next(error);
  }
});

// Delete launch event (admin only)
router.delete('/admin/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    await prisma.launchEvent.delete({
      where: { id },
    });

    res.json({
      message: 'Launch event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export { router as launchRoutes };