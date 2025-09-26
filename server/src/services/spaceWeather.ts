import axios from 'axios';
import cron from 'node-cron';
import { prisma } from '../utils/database.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

interface SpaceWeatherData {
  timestamp: Date;
  solarFluxIndex?: number;
  geomagneticIndex?: number;
  solarWindSpeed?: number;
  protonFlux?: number;
  electronFlux?: number;
  xrayFlux?: number;
  alertLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  description?: string;
}

export class SpaceWeatherService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Space Weather Service...');
      
      // Get initial space weather data
      await this.updateSpaceWeatherData();
      
      // Schedule periodic updates
      this.scheduleUpdates();
      
      this.isInitialized = true;
      logger.info('✅ Space Weather Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Space Weather Service:', error);
      throw error;
    }
  }

  private scheduleUpdates(): void {
    // Update space weather data every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
      try {
        await this.updateSpaceWeatherData();
      } catch (error) {
        logger.error('Scheduled space weather update failed:', error);
      }
    });
  }

  private async updateSpaceWeatherData(): Promise<void> {
    try {
      logger.debug('Updating space weather data...');
      
      // Fetch data from multiple sources
      const [solarData, geomagneticData, solarWindData] = await Promise.allSettled([
        this.fetchSolarFluxData(),
        this.fetchGeomagneticData(),
        this.fetchSolarWindData(),
      ]);

      const weatherData: SpaceWeatherData = {
        timestamp: new Date(),
        alertLevel: 'GREEN',
        description: 'Normal space weather conditions',
      };

      // Process solar flux data
      if (solarData.status === 'fulfilled' && solarData.value) {
        weatherData.solarFluxIndex = solarData.value.solarFlux;
        weatherData.xrayFlux = solarData.value.xrayFlux;
      }

      // Process geomagnetic data
      if (geomagneticData.status === 'fulfilled' && geomagneticData.value) {
        weatherData.geomagneticIndex = geomagneticData.value.kpIndex;
      }

      // Process solar wind data
      if (solarWindData.status === 'fulfilled' && solarWindData.value) {
        weatherData.solarWindSpeed = solarWindData.value.speed;
        weatherData.protonFlux = solarWindData.value.protonFlux;
        weatherData.electronFlux = solarWindData.value.electronFlux;
      }

      // Determine alert level based on conditions
      weatherData.alertLevel = this.determineAlertLevel(weatherData);
      weatherData.description = this.generateDescription(weatherData);

      // Store in database
      await prisma.spaceWeather.create({
        data: {
          timestamp: weatherData.timestamp,
          solarFluxIndex: weatherData.solarFluxIndex,
          geomagneticIndex: weatherData.geomagneticIndex,
          solarWindSpeed: weatherData.solarWindSpeed,
          protonFlux: weatherData.protonFlux,
          electronFlux: weatherData.electronFlux,
          xrayFlux: weatherData.xrayFlux,
          alertLevel: weatherData.alertLevel,
          description: weatherData.description,
        },
      });

      // Clean up old data (keep only last 30 days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      await prisma.spaceWeather.deleteMany({
        where: {
          timestamp: { lt: cutoffDate },
        },
      });

      logger.debug(`Space weather data updated: Alert level ${weatherData.alertLevel}`);
      
      // If alert level is elevated, create alerts for users
      if (weatherData.alertLevel !== 'GREEN') {
        await this.createSpaceWeatherAlerts(weatherData);
      }

    } catch (error) {
      logger.error('Failed to update space weather data:', error);
    }
  }

  private async fetchSolarFluxData(): Promise<{ solarFlux: number; xrayFlux: number } | null> {
    try {
      // Fetch from NOAA Space Weather Prediction Center
      const response = await axios.get(`${config.noaaSpaceWeatherUrl}/solar_flux.json`, {
        timeout: 10000,
      });

      if (response.data && response.data.length > 0) {
        const latest = response.data[0];
        return {
          solarFlux: parseFloat(latest.flux) || 0,
          xrayFlux: parseFloat(latest.xray_flux) || 0,
        };
      }

      return null;
    } catch (error) {
      logger.warn('Failed to fetch solar flux data:', error);
      return null;
    }
  }

  private async fetchGeomagneticData(): Promise<{ kpIndex: number } | null> {
    try {
      const response = await axios.get(`${config.noaaSpaceWeatherUrl}/geomagnetic_activity.json`, {
        timeout: 10000,
      });

      if (response.data && response.data.length > 0) {
        const latest = response.data[0];
        return {
          kpIndex: parseFloat(latest.kp_index) || 0,
        };
      }

      return null;
    } catch (error) {
      logger.warn('Failed to fetch geomagnetic data:', error);
      return null;
    }
  }

  private async fetchSolarWindData(): Promise<{ speed: number; protonFlux: number; electronFlux: number } | null> {
    try {
      const response = await axios.get(`${config.noaaSpaceWeatherUrl}/solar_wind.json`, {
        timeout: 10000,
      });

      if (response.data && response.data.length > 0) {
        const latest = response.data[0];
        return {
          speed: parseFloat(latest.speed) || 0,
          protonFlux: parseFloat(latest.proton_flux) || 0,
          electronFlux: parseFloat(latest.electron_flux) || 0,
        };
      }

      return null;
    } catch (error) {
      logger.warn('Failed to fetch solar wind data:', error);
      return null;
    }
  }

  private determineAlertLevel(data: SpaceWeatherData): 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' {
    let riskScore = 0;

    // Solar flux risk
    if (data.solarFluxIndex) {
      if (data.solarFluxIndex > 300) riskScore += 3;
      else if (data.solarFluxIndex > 200) riskScore += 2;
      else if (data.solarFluxIndex > 150) riskScore += 1;
    }

    // Geomagnetic risk
    if (data.geomagneticIndex) {
      if (data.geomagneticIndex >= 8) riskScore += 3; // Severe storm
      else if (data.geomagneticIndex >= 6) riskScore += 2; // Strong storm
      else if (data.geomagneticIndex >= 4) riskScore += 1; // Minor storm
    }

    // Solar wind risk
    if (data.solarWindSpeed) {
      if (data.solarWindSpeed > 800) riskScore += 2;
      else if (data.solarWindSpeed > 600) riskScore += 1;
    }

    // X-ray flux risk
    if (data.xrayFlux) {
      if (data.xrayFlux > 1e-4) riskScore += 3; // X-class flare
      else if (data.xrayFlux > 1e-5) riskScore += 2; // M-class flare
      else if (data.xrayFlux > 1e-6) riskScore += 1; // C-class flare
    }

    // Determine alert level based on total risk score
    if (riskScore >= 7) return 'RED';
    if (riskScore >= 4) return 'ORANGE';
    if (riskScore >= 2) return 'YELLOW';
    return 'GREEN';
  }

  private generateDescription(data: SpaceWeatherData): string {
    const conditions: string[] = [];

    if (data.solarFluxIndex && data.solarFluxIndex > 150) {
      conditions.push(`Elevated solar activity (${data.solarFluxIndex.toFixed(1)} SFU)`);
    }

    if (data.geomagneticIndex && data.geomagneticIndex >= 4) {
      const stormLevel = data.geomagneticIndex >= 8 ? 'severe' : 
                        data.geomagneticIndex >= 6 ? 'strong' : 'minor';
      conditions.push(`${stormLevel} geomagnetic storm (Kp ${data.geomagneticIndex.toFixed(1)})`);
    }

    if (data.solarWindSpeed && data.solarWindSpeed > 600) {
      conditions.push(`High solar wind speed (${data.solarWindSpeed.toFixed(0)} km/s)`);
    }

    if (data.xrayFlux && data.xrayFlux > 1e-6) {
      const flareClass = data.xrayFlux > 1e-4 ? 'X' : 
                        data.xrayFlux > 1e-5 ? 'M' : 'C';
      conditions.push(`${flareClass}-class solar flare detected`);
    }

    if (conditions.length === 0) {
      return 'Normal space weather conditions. No significant disturbances detected.';
    }

    return conditions.join('. ') + '. Satellite operations may be affected.';
  }

  private async createSpaceWeatherAlerts(data: SpaceWeatherData): Promise<void> {
    try {
      // Get all users who want space weather alerts
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          preferences: {
            notifications: true,
          },
        },
        select: { id: true },
      });

      if (users.length === 0) return;

      const alertData = users.map(user => ({
        userId: user.id,
        type: 'SPACE_WEATHER' as const,
        title: `Space Weather Alert - ${data.alertLevel} Level`,
        message: data.description || 'Space weather conditions have changed',
        severity: this.mapAlertLevelToSeverity(data.alertLevel),
        metadata: {
          alertLevel: data.alertLevel,
          solarFluxIndex: data.solarFluxIndex,
          geomagneticIndex: data.geomagneticIndex,
          solarWindSpeed: data.solarWindSpeed,
        },
      }));

      await prisma.alert.createMany({
        data: alertData,
        skipDuplicates: true,
      });

      logger.info(`Created ${alertData.length} space weather alerts for ${data.alertLevel} level event`);
    } catch (error) {
      logger.error('Failed to create space weather alerts:', error);
    }
  }

  private mapAlertLevelToSeverity(alertLevel: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (alertLevel) {
      case 'RED': return 'CRITICAL';
      case 'ORANGE': return 'HIGH';
      case 'YELLOW': return 'MEDIUM';
      default: return 'LOW';
    }
  }

  public async getCurrentSpaceWeather(): Promise<SpaceWeatherData | null> {
    try {
      const latest = await prisma.spaceWeather.findFirst({
        orderBy: { timestamp: 'desc' },
      });

      if (!latest) return null;

      return {
        timestamp: latest.timestamp,
        solarFluxIndex: latest.solarFluxIndex || undefined,
        geomagneticIndex: latest.geomagneticIndex || undefined,
        solarWindSpeed: latest.solarWindSpeed || undefined,
        protonFlux: latest.protonFlux || undefined,
        electronFlux: latest.electronFlux || undefined,
        xrayFlux: latest.xrayFlux || undefined,
        alertLevel: latest.alertLevel as 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED',
        description: latest.description || undefined,
      };
    } catch (error) {
      logger.error('Failed to get current space weather:', error);
      return null;
    }
  }

  public async getSpaceWeatherHistory(hours: number = 24): Promise<SpaceWeatherData[]> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const records = await prisma.spaceWeather.findMany({
        where: {
          timestamp: { gte: since },
        },
        orderBy: { timestamp: 'asc' },
      });

      return records.map(record => ({
        timestamp: record.timestamp,
        solarFluxIndex: record.solarFluxIndex || undefined,
        geomagneticIndex: record.geomagneticIndex || undefined,
        solarWindSpeed: record.solarWindSpeed || undefined,
        protonFlux: record.protonFlux || undefined,
        electronFlux: record.electronFlux || undefined,
        xrayFlux: record.xrayFlux || undefined,
        alertLevel: record.alertLevel as 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED',
        description: record.description || undefined,
      }));
    } catch (error) {
      logger.error('Failed to get space weather history:', error);
      return [];
    }
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}