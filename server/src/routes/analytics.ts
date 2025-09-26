import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database.js';
import { createError } from '../middleware/errorHandler.js';
import { optionalAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['day', 'week', 'month']).optional().default('day'),
});

// Get system overview analytics
router.get('/overview', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalSatellites,
      activeSatellites,
      totalDebris,
      currentRisks,
      spaceWeatherAlerts,
      recentEvents,
      systemHealth,
    ] = await Promise.all([
      prisma.satellite.count({ where: { isActive: true } }),
      prisma.satellite.count({ where: { isActive: true, status: 'ACTIVE' } }),
      prisma.debrisObject.count({ where: { isTracked: true } }),
      prisma.collisionRisk.count({ where: { isActive: true, riskLevel: { in: ['HIGH', 'CRITICAL'] } } }),
      prisma.spaceWeather.count({ 
        where: { 
          timestamp: { gte: last24Hours },
          alertLevel: { not: 'GREEN' }
        }
      }),
      prisma.satelliteEvent.count({
        where: {
          timestamp: { gte: last7Days },
          severity: { in: ['ERROR', 'CRITICAL'] },
        },
      }),
      {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        lastUpdated: now,
      },
    ]);

    // Calculate trends (simplified)
    const [
      satellitesTrend,
      risksTrend,
      eventsTrend,
    ] = await Promise.all([
      prisma.satellite.count({
        where: {
          isActive: true,
          createdAt: { gte: last7Days },
        },
      }),
      prisma.collisionRisk.count({
        where: {
          isActive: true,
          createdAt: { gte: last7Days },
          riskLevel: { in: ['HIGH', 'CRITICAL'] },
        },
      }),
      prisma.satelliteEvent.count({
        where: {
          timestamp: { gte: last7Days },
          severity: { in: ['ERROR', 'CRITICAL'] },
        },
      }),
    ]);

    res.json({
      overview: {
        satellites: {
          total: totalSatellites,
          active: activeSatellites,
          inactive: totalSatellites - activeSatellites,
          newThisWeek: satellitesTrend,
        },
        debris: {
          total: totalDebris,
          tracked: totalDebris, // Assuming all debris is tracked
        },
        risks: {
          current: currentRisks,
          newThisWeek: risksTrend,
        },
        events: {
          critical: recentEvents,
          thisWeek: eventsTrend,
        },
        spaceWeather: {
          alerts24h: spaceWeatherAlerts,
        },
      },
      systemHealth,
      lastUpdated: now,
    });
  } catch (error) {
    next(error);
  }
});

// Get satellite analytics
router.get('/satellites', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const [
      distributionByType,
      distributionByStatus,
      distributionByCountry,
      launchTrends,
      altitudeDistribution,
    ] = await Promise.all([
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
      prisma.satellite.groupBy({
        by: ['country'],
        where: { isActive: true, country: { not: null } },
        _count: true,
        orderBy: { _count: { country: 'desc' } },
        take: 10,
      }),
      prisma.satellite.groupBy({
        by: ['launchDate'],
        where: {
          isActive: true,
          launchDate: {
            gte: new Date('2020-01-01'),
            not: null,
          },
        },
        _count: true,
        orderBy: { launchDate: 'asc' },
      }),
      prisma.satellite.findMany({
        where: {
          isActive: true,
          apogee: { not: null },
        },
        select: {
          apogee: true,
          type: true,
        },
      }),
    ]);

    // Process altitude distribution
    const altitudeRanges = {
      'LEO (< 2000km)': 0,
      'MEO (2000-35786km)': 0,
      'GEO (35786km)': 0,
      'HEO (> 35786km)': 0,
    };

    altitudeDistribution.forEach(sat => {
      if (sat.apogee! < 2000) altitudeRanges['LEO (< 2000km)']++;
      else if (sat.apogee! < 35786) altitudeRanges['MEO (2000-35786km)']++;
      else if (Math.abs(sat.apogee! - 35786) < 100) altitudeRanges['GEO (35786km)']++;
      else altitudeRanges['HEO (> 35786km)']++;
    });

    res.json({
      distribution: {
        byType: distributionByType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byStatus: distributionByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byCountry: distributionByCountry.reduce((acc, item) => {
          acc[item.country || 'Unknown'] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byAltitude: altitudeRanges,
      },
      trends: {
        launches: launchTrends.map(item => ({
          date: item.launchDate,
          count: item._count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get collision risk analytics
router.get('/risks', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const [
      riskDistribution,
      riskTrends,
      topRisks,
      risksByType,
    ] = await Promise.all([
      prisma.collisionRisk.groupBy({
        by: ['riskLevel'],
        where: { isActive: true },
        _count: true,
      }),
      prisma.collisionRisk.groupBy({
        by: ['createdAt'],
        where: {
          isActive: true,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        _count: true,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.collisionRisk.findMany({
        where: { isActive: true },
        include: {
          primarySatellite: {
            select: { id: true, name: true, type: true },
          },
        },
        orderBy: { probability: 'desc' },
        take: 10,
      }),
      prisma.collisionRisk.findMany({
        where: { isActive: true },
        include: {
          primarySatellite: {
            select: { type: true },
          },
        },
      }),
    ]);

    // Process risks by satellite type
    const risksByTypeMap = new Map<string, number>();
    risksByType.forEach(risk => {
      const type = risk.primarySatellite.type;
      risksByTypeMap.set(type, (risksByTypeMap.get(type) || 0) + 1);
    });

    res.json({
      distribution: {
        byRiskLevel: riskDistribution.reduce((acc, item) => {
          acc[item.riskLevel] = item._count;
          return acc;
        }, {} as Record<string, number>),
        bySatelliteType: Object.fromEntries(risksByTypeMap),
      },
      trends: riskTrends.map(item => ({
        date: item.createdAt,
        count: item._count,
      })),
      topRisks: topRisks.map(risk => ({
        id: risk.id,
        primarySatellite: risk.primarySatellite,
        secondaryObject: risk.secondaryObjName,
        probability: risk.probability,
        riskLevel: risk.riskLevel,
        timeOfClosest: risk.timeOfClosest,
        missDistance: risk.missDistance,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get space weather analytics
router.get('/weather', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      alertDistribution,
      weatherTrends,
      averageConditions,
      extremeEvents,
    ] = await Promise.all([
      prisma.spaceWeather.groupBy({
        by: ['alertLevel'],
        where: { timestamp: { gte: last30Days } },
        _count: true,
      }),
      prisma.spaceWeather.findMany({
        where: { timestamp: { gte: last30Days } },
        orderBy: { timestamp: 'asc' },
        select: {
          timestamp: true,
          alertLevel: true,
          solarFluxIndex: true,
          geomagneticIndex: true,
          solarWindSpeed: true,
        },
      }),
      prisma.spaceWeather.aggregate({
        where: { timestamp: { gte: last30Days } },
        _avg: {
          solarFluxIndex: true,
          geomagneticIndex: true,
          solarWindSpeed: true,
        },
        _max: {
          solarFluxIndex: true,
          geomagneticIndex: true,
          solarWindSpeed: true,
          xrayFlux: true,
        },
        _min: {
          solarFluxIndex: true,
          geomagneticIndex: true,
          solarWindSpeed: true,
        },
      }),
      prisma.spaceWeather.findMany({
        where: {
          timestamp: { gte: last30Days },
          alertLevel: { in: ['ORANGE', 'RED'] },
        },
        orderBy: { timestamp: 'desc' },
        take: 20,
      }),
    ]);

    res.json({
      distribution: {
        byAlertLevel: alertDistribution.reduce((acc, item) => {
          acc[item.alertLevel] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      trends: weatherTrends,
      statistics: {
        averages: averageConditions._avg,
        maximums: averageConditions._max,
        minimums: averageConditions._min,
      },
      extremeEvents,
    });
  } catch (error) {
    next(error);
  }
});

// Get user engagement analytics (admin only)
router.get('/engagement', requireRole(['ADMIN', 'ANALYST']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      userRegistrations,
      activeUsers,
      trackedSatellites,
      alertEngagement,
      sessionStats,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: last30Days } },
        _count: true,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.user.count({
        where: {
          lastLogin: { gte: last30Days },
        },
      }),
      prisma.userSatelliteTracking.groupBy({
        by: ['addedAt'],
        where: { addedAt: { gte: last30Days } },
        _count: true,
        orderBy: { addedAt: 'asc' },
      }),
      prisma.alert.groupBy({
        by: ['isRead'],
        where: { createdAt: { gte: last30Days } },
        _count: true,
      }),
      prisma.userSession.aggregate({
        where: { createdAt: { gte: last30Days } },
        _count: true,
        _avg: {
          // Calculate session duration if we had logout timestamps
        },
      }),
    ]);

    const readAlerts = alertEngagement.find(item => item.isRead)?._count || 0;
    const unreadAlerts = alertEngagement.find(item => !item.isRead)?._count || 0;
    const alertEngagementRate = readAlerts + unreadAlerts > 0 ? (readAlerts / (readAlerts + unreadAlerts)) * 100 : 0;

    res.json({
      userActivity: {
        registrations: userRegistrations,
        activeUsers: activeUsers,
        totalSessions: sessionStats._count,
      },
      engagement: {
        satelliteTracking: trackedSatellites,
        alertEngagement: {
          rate: alertEngagementRate,
          read: readAlerts,
          unread: unreadAlerts,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get performance metrics (admin only)
router.get('/performance', requireRole(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const [
      databaseStats,
      apiMetrics,
      systemHealth,
    ] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables 
        ORDER BY n_live_tup DESC
        LIMIT 10
      `,
      // In a real implementation, you would track API metrics
      {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
      },
      {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        version: process.version,
      },
    ]);

    res.json({
      database: databaseStats,
      api: apiMetrics,
      system: systemHealth,
      timestamp: new Date(),
    });
  } catch (error) {
    next(error);
  }
});

export { router as analyticsRoutes };