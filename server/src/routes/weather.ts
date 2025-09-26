import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database.js';
import { createError } from '../middleware/errorHandler.js';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const weatherQuerySchema = z.object({
  hours: z.string().transform(Number).pipe(z.number().min(1).max(168)).optional().default(24), // Max 1 week
  alertLevel: z.enum(['GREEN', 'YELLOW', 'ORANGE', 'RED']).optional(),
});

// Get current space weather conditions
router.get('/current', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const currentWeather = await prisma.spaceWeather.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    if (!currentWeather) {
      throw createError('No space weather data available', 404, 'NO_WEATHER_DATA');
    }

    res.json({
      timestamp: currentWeather.timestamp,
      solarFluxIndex: currentWeather.solarFluxIndex,
      geomagneticIndex: currentWeather.geomagneticIndex,
      solarWindSpeed: currentWeather.solarWindSpeed,
      protonFlux: currentWeather.protonFlux,
      electronFlux: currentWeather.electronFlux,
      xrayFlux: currentWeather.xrayFlux,
      alertLevel: currentWeather.alertLevel,
      description: currentWeather.description,
    });
  } catch (error) {
    next(error);
  }
});

// Get space weather history
router.get('/history', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = weatherQuerySchema.parse(req.query);
    const { hours, alertLevel } = query;
    
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const where: any = {
      timestamp: { gte: since },
    };
    
    if (alertLevel) {
      where.alertLevel = alertLevel;
    }

    const weatherHistory = await prisma.spaceWeather.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    });

    res.json({
      timeRange: {
        hours,
        since,
        until: new Date(),
      },
      data: weatherHistory.map(record => ({
        timestamp: record.timestamp,
        solarFluxIndex: record.solarFluxIndex,
        geomagneticIndex: record.geomagneticIndex,
        solarWindSpeed: record.solarWindSpeed,
        protonFlux: record.protonFlux,
        electronFlux: record.electronFlux,
        xrayFlux: record.xrayFlux,
        alertLevel: record.alertLevel,
        description: record.description,
      })),
      count: weatherHistory.length,
    });
  } catch (error) {
    next(error);
  }
});

// Get space weather statistics
router.get('/stats', async (req, res, next) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      currentConditions,
      alertDistribution24h,
      alertDistribution7d,
      averageConditions24h,
      extremeEvents7d,
    ] = await Promise.all([
      prisma.spaceWeather.findFirst({
        orderBy: { timestamp: 'desc' },
        select: { alertLevel: true, timestamp: true },
      }),
      prisma.spaceWeather.groupBy({
        by: ['alertLevel'],
        where: { timestamp: { gte: last24Hours } },
        _count: true,
      }),
      prisma.spaceWeather.groupBy({
        by: ['alertLevel'],
        where: { timestamp: { gte: last7Days } },
        _count: true,
      }),
      prisma.spaceWeather.aggregate({
        where: { timestamp: { gte: last24Hours } },
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
      }),
      prisma.spaceWeather.findMany({
        where: {
          timestamp: { gte: last7Days },
          alertLevel: { in: ['ORANGE', 'RED'] },
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          timestamp: true,
          alertLevel: true,
          description: true,
          solarFluxIndex: true,
          geomagneticIndex: true,
          xrayFlux: true,
        },
      }),
    ]);

    res.json({
      current: currentConditions,
      distribution: {
        last24Hours: alertDistribution24h.reduce((acc, item) => {
          acc[item.alertLevel] = item._count;
          return acc;
        }, {} as Record<string, number>),
        last7Days: alertDistribution7d.reduce((acc, item) => {
          acc[item.alertLevel] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      averages: {
        last24Hours: {
          solarFluxIndex: averageConditions24h._avg.solarFluxIndex,
          geomagneticIndex: averageConditions24h._avg.geomagneticIndex,
          solarWindSpeed: averageConditions24h._avg.solarWindSpeed,
        },
        maximums: {
          solarFluxIndex: averageConditions24h._max.solarFluxIndex,
          geomagneticIndex: averageConditions24h._max.geomagneticIndex,
          solarWindSpeed: averageConditions24h._max.solarWindSpeed,
          xrayFlux: averageConditions24h._max.xrayFlux,
        },
      },
      extremeEvents: extremeEvents7d,
    });
  } catch (error) {
    next(error);
  }
});

// Get space weather alerts for specific conditions
router.get('/alerts', async (req, res, next) => {
  try {
    const minAlertLevel = (req.query.minLevel as string) || 'YELLOW';
    const hours = parseInt(req.query.hours as string) || 24;
    
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const alertLevels = ['GREEN', 'YELLOW', 'ORANGE', 'RED'];
    const minIndex = alertLevels.indexOf(minAlertLevel);
    const relevantLevels = minIndex >= 0 ? alertLevels.slice(minIndex) : ['YELLOW', 'ORANGE', 'RED'];

    const alerts = await prisma.spaceWeather.findMany({
      where: {
        timestamp: { gte: since },
        alertLevel: { in: relevantLevels },
      },
      orderBy: { timestamp: 'desc' },
      select: {
        timestamp: true,
        alertLevel: true,
        description: true,
        solarFluxIndex: true,
        geomagneticIndex: true,
        solarWindSpeed: true,
        xrayFlux: true,
      },
    });

    res.json({
      alerts,
      count: alerts.length,
      timeRange: { hours, since, until: new Date() },
      minAlertLevel,
    });
  } catch (error) {
    next(error);
  }
});

// Get space weather forecast (simplified prediction based on trends)
router.get('/forecast', async (req, res, next) => {
  try {
    // Get recent data to analyze trends
    const recentData = await prisma.spaceWeather.findMany({
      orderBy: { timestamp: 'desc' },
      take: 24, // Last 24 data points (4 hours if updated every 10 minutes)
      select: {
        timestamp: true,
        solarFluxIndex: true,
        geomagneticIndex: true,
        solarWindSpeed: true,
        alertLevel: true,
      },
    });

    if (recentData.length < 3) {
      throw createError('Insufficient data for forecast', 400, 'INSUFFICIENT_DATA');
    }

    // Simple trend analysis
    const latest = recentData[0];
    const previous = recentData[Math.floor(recentData.length / 2)];
    
    const trends = {
      solarFlux: this.calculateTrend(previous.solarFluxIndex, latest.solarFluxIndex),
      geomagneticActivity: this.calculateTrend(previous.geomagneticIndex, latest.geomagneticIndex),
      solarWind: this.calculateTrend(previous.solarWindSpeed, latest.solarWindSpeed),
    };

    // Generate simple forecast
    const forecast = this.generateForecast(latest, trends);

    res.json({
      currentConditions: latest,
      trends,
      forecast,
      confidence: this.calculateConfidence(recentData),
      dataPoints: recentData.length,
      lastUpdated: latest.timestamp,
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to calculate trend
function calculateTrend(previous: number | null, current: number | null): string {
  if (!previous || !current) return 'stable';
  
  const change = ((current - previous) / previous) * 100;
  
  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
}

// Helper function to generate forecast
function generateForecast(latest: any, trends: any): any {
  const forecastHours = [6, 12, 24];
  
  return forecastHours.map(hours => {
    let predictedAlertLevel = latest.alertLevel;
    let confidence = 'medium';
    
    // Simple logic: if multiple parameters are increasing, raise alert level
    const increasingCount = Object.values(trends).filter(trend => trend === 'increasing').length;
    const decreasingCount = Object.values(trends).filter(trend => trend === 'decreasing').length;
    
    if (increasingCount >= 2) {
      const levels = ['GREEN', 'YELLOW', 'ORANGE', 'RED'];
      const currentIndex = levels.indexOf(latest.alertLevel);
      if (currentIndex < levels.length - 1) {
        predictedAlertLevel = levels[currentIndex + 1];
      }
      confidence = 'low'; // Trend-based predictions have low confidence
    } else if (decreasingCount >= 2) {
      const levels = ['GREEN', 'YELLOW', 'ORANGE', 'RED'];
      const currentIndex = levels.indexOf(latest.alertLevel);
      if (currentIndex > 0) {
        predictedAlertLevel = levels[currentIndex - 1];
      }
      confidence = 'low';
    }
    
    return {
      hours,
      predictedAlertLevel,
      confidence,
      description: `Predicted conditions in ${hours} hours based on current trends`,
    };
  });
}

// Helper function to calculate confidence
function calculateConfidence(data: any[]): string {
  // Simple confidence calculation based on data consistency
  const alertLevels = data.map(d => d.alertLevel);
  const uniqueLevels = new Set(alertLevels).size;
  
  if (uniqueLevels === 1) return 'high';
  if (uniqueLevels <= 2) return 'medium';
  return 'low';
}

export { router as weatherRoutes };