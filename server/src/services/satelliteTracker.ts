import axios from 'axios';
import * as satellite from 'satellite.js';
import cron from 'node-cron';
import { prisma } from '../utils/database.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

interface TLEData {
  satelliteId: number;
  name: string;
  line1: string;
  line2: string;
}

interface SatellitePosition {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp: Date;
}

export class SatelliteTracker {
  private isInitialized = false;
  private tleCache = new Map<number, satellite.SatRec>();
  private updateInterval: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Satellite Tracker...');
      
      // Load initial TLE data
      await this.updateTLEData();
      
      // Schedule periodic updates
      this.scheduleUpdates();
      
      this.isInitialized = true;
      logger.info('✅ Satellite Tracker initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Satellite Tracker:', error);
      throw error;
    }
  }

  private scheduleUpdates(): void {
    // Update TLE data every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      try {
        await this.updateTLEData();
        logger.info('Scheduled TLE update completed');
      } catch (error) {
        logger.error('Scheduled TLE update failed:', error);
      }
    });

    // Update satellite positions every minute
    cron.schedule('* * * * *', async () => {
      try {
        await this.updateSatellitePositions();
      } catch (error) {
        logger.error('Position update failed:', error);
      }
    });

    // Calculate collision risks every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.calculateCollisionRisks();
      } catch (error) {
        logger.error('Collision risk calculation failed:', error);
      }
    });
  }

  private async updateTLEData(): Promise<void> {
    try {
      logger.info('Updating TLE data from Celestrak...');
      
      // Fetch TLE data from various sources
      const tleCategories = [
        'active', // Active satellites
        'weather', // Weather satellites
        'noaa', // NOAA satellites
        'goes', // GOES satellites
        'resource', // Earth resources satellites
        'sarsat', // Search & rescue satellites
        'dmc', // Disaster monitoring satellites
        'tdrss', // Tracking and data relay satellites
        'geo', // Geostationary satellites
        'intelsat', // Intelsat satellites
        'gorizont', // Gorizont satellites
        'raduga', // Raduga satellites
        'molniya', // Molniya satellites
        'iridium', // Iridium satellites
        'orbcomm', // Orbcomm satellites
        'globalstar', // Globalstar satellites
        'amateur', // Amateur radio satellites
        'x-comm', // Experimental communications
        'other-comm', // Other communications satellites
        'gps-ops', // GPS operational satellites
        'glo-ops', // GLONASS operational satellites
        'galileo', // Galileo satellites
        'beidou', // BeiDou satellites
        'sbas', // Satellite-based augmentation systems
        'nnss', // Navy navigation satellite system
        'musson', // Russian LEO navigation satellites
        'science', // Space & earth science satellites
        'geodetic', // Geodetic satellites
        'engineering', // Engineering satellites
        'education', // Educational satellites
      ];

      const allTLEData: TLEData[] = [];

      for (const category of tleCategories) {
        try {
          const response = await axios.get(`${config.celestrakTleUrl}?GROUP=${category}&FORMAT=tle`, {
            timeout: 30000,
          });

          const tleLines = response.data.split('\n').filter((line: string) => line.trim());
          
          for (let i = 0; i < tleLines.length; i += 3) {
            if (i + 2 < tleLines.length) {
              const name = tleLines[i].trim();
              const line1 = tleLines[i + 1].trim();
              const line2 = tleLines[i + 2].trim();
              
              // Extract NORAD ID from line 1
              const noradId = parseInt(line1.substring(2, 7));
              
              if (noradId && line1.length >= 69 && line2.length >= 69) {
                allTLEData.push({
                  satelliteId: noradId,
                  name,
                  line1,
                  line2,
                });
              }
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
        } catch (error) {
          logger.warn(`Failed to fetch TLE data for category ${category}:`, error);
        }
      }

      logger.info(`Fetched ${allTLEData.length} TLE records`);

      // Process and store TLE data
      await this.processTLEData(allTLEData);
      
    } catch (error) {
      logger.error('Failed to update TLE data:', error);
      throw error;
    }
  }

  private async processTLEData(tleDataArray: TLEData[]): Promise<void> {
    const batchSize = 100;
    let processed = 0;

    for (let i = 0; i < tleDataArray.length; i += batchSize) {
      const batch = tleDataArray.slice(i, i + batchSize);
      
      await prisma.$transaction(async (tx) => {
        for (const tleData of batch) {
          try {
            // Parse TLE to extract orbital parameters
            const satrec = satellite.twoline2satrec(tleData.line1, tleData.line2);
            
            if (satrec.error !== 0) {
              logger.warn(`Invalid TLE for satellite ${tleData.satelliteId}: ${satrec.error}`);
              continue;
            }

            // Cache the satellite record for position calculations
            this.tleCache.set(tleData.satelliteId, satrec);

            // Extract orbital parameters
            const inclination = satrec.inclo * (180 / Math.PI); // Convert to degrees
            const period = (2 * Math.PI) / satrec.no / 60; // Convert to minutes
            const eccentricity = satrec.ecco;
            
            // Calculate apogee and perigee
            const semiMajorAxis = Math.pow(398600.4418 / (satrec.no * satrec.no), 1/3); // km
            const apogee = semiMajorAxis * (1 + eccentricity) - 6371; // km above Earth
            const perigee = semiMajorAxis * (1 - eccentricity) - 6371; // km above Earth

            // Determine satellite type based on name and orbital characteristics
            const satelliteType = this.determineSatelliteType(tleData.name, inclination, apogee);

            // Upsert satellite record
            await tx.satellite.upsert({
              where: { noradId: tleData.satelliteId },
              update: {
                name: tleData.name,
                type: satelliteType,
                period: period,
                inclination: inclination,
                apogee: apogee > 0 ? apogee : null,
                perigee: perigee > 0 ? perigee : null,
                updatedAt: new Date(),
              },
              create: {
                noradId: tleData.satelliteId,
                name: tleData.name,
                type: satelliteType,
                period: period,
                inclination: inclination,
                apogee: apogee > 0 ? apogee : null,
                perigee: perigee > 0 ? perigee : null,
                status: 'ACTIVE',
              },
            });

            // Mark previous TLE data as not latest
            await tx.tleData.updateMany({
              where: {
                satellite: { noradId: tleData.satelliteId },
                isLatest: true,
              },
              data: { isLatest: false },
            });

            // Store new TLE data
            await tx.tleData.create({
              data: {
                satellite: {
                  connect: { noradId: tleData.satelliteId },
                },
                line0: tleData.name,
                line1: tleData.line1,
                line2: tleData.line2,
                epoch: new Date(), // This should ideally be parsed from the TLE epoch
                isLatest: true,
              },
            });

            processed++;
          } catch (error) {
            logger.error(`Failed to process TLE for satellite ${tleData.satelliteId}:`, error);
          }
        }
      });

      logger.info(`Processed ${Math.min(i + batchSize, tleDataArray.length)}/${tleDataArray.length} TLE records`);
    }

    logger.info(`✅ Successfully processed ${processed} satellite TLE records`);
  }

  private determineSatelliteType(name: string, inclination: number, apogee: number): string {
    const nameLower = name.toLowerCase();
    
    // Geostationary satellites
    if (apogee > 35000 && Math.abs(inclination) < 5) {
      return 'COMMUNICATION';
    }
    
    // Weather satellites
    if (nameLower.includes('noaa') || nameLower.includes('goes') || nameLower.includes('metop') || 
        nameLower.includes('weather') || nameLower.includes('meteor')) {
      return 'WEATHER';
    }
    
    // Navigation satellites
    if (nameLower.includes('gps') || nameLower.includes('glonass') || nameLower.includes('galileo') || 
        nameLower.includes('beidou') || nameLower.includes('navstar')) {
      return 'NAVIGATION';
    }
    
    // Earth observation satellites
    if (nameLower.includes('landsat') || nameLower.includes('spot') || nameLower.includes('sentinel') || 
        nameLower.includes('terra') || nameLower.includes('aqua') || nameLower.includes('modis')) {
      return 'EARTH_OBSERVATION';
    }
    
    // Communication satellites
    if (nameLower.includes('intelsat') || nameLower.includes('iridium') || nameLower.includes('globalstar') || 
        nameLower.includes('orbcomm') || nameLower.includes('starlink')) {
      return 'COMMUNICATION';
    }
    
    // Scientific satellites
    if (nameLower.includes('hubble') || nameLower.includes('chandra') || nameLower.includes('kepler') || 
        nameLower.includes('tess') || nameLower.includes('science')) {
      return 'SCIENTIFIC';
    }
    
    // Amateur satellites
    if (nameLower.includes('amateur') || nameLower.includes('oscar') || nameLower.includes('ao-') || 
        nameLower.includes('fo-') || nameLower.includes('so-')) {
      return 'AMATEUR';
    }
    
    // Default classification based on orbital characteristics
    if (apogee < 2000) {
      return 'EARTH_OBSERVATION';
    } else if (apogee > 35000) {
      return 'COMMUNICATION';
    }
    
    return 'UNKNOWN';
  }

  private async updateSatellitePositions(): Promise<void> {
    try {
      const now = new Date();
      const positions: any[] = [];
      
      // Get a sample of tracked satellites to avoid overwhelming the system
      const trackedSatellites = await prisma.satellite.findMany({
        where: { 
          isActive: true,
          status: 'ACTIVE',
        },
        take: 1000, // Limit to prevent performance issues
        orderBy: { updatedAt: 'desc' },
      });

      for (const sat of trackedSatellites) {
        const satrec = this.tleCache.get(sat.noradId);
        if (!satrec) continue;

        try {
          const position = this.calculateSatellitePosition(satrec, now);
          if (position) {
            positions.push({
              satelliteId: sat.id,
              ...position,
            });
          }
        } catch (error) {
          logger.debug(`Position calculation failed for satellite ${sat.noradId}:`, error);
        }
      }

      // Batch insert positions
      if (positions.length > 0) {
        await prisma.satellitePosition.createMany({
          data: positions,
          skipDuplicates: true,
        });

        // Clean up old positions (keep only last 24 hours)
        const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        await prisma.satellitePosition.deleteMany({
          where: {
            timestamp: { lt: cutoffTime },
          },
        });
      }

      logger.debug(`Updated positions for ${positions.length} satellites`);
    } catch (error) {
      logger.error('Failed to update satellite positions:', error);
    }
  }

  private calculateSatellitePosition(satrec: satellite.SatRec, time: Date): SatellitePosition | null {
    try {
      const positionAndVelocity = satellite.propagate(satrec, time);
      
      if (!positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') {
        return null;
      }

      const gmst = satellite.gstime(time);
      const geodeticCoords = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
      
      const latitude = satellite.degreesLat(geodeticCoords.latitude);
      const longitude = satellite.degreesLong(geodeticCoords.longitude);
      const altitude = geodeticCoords.height;
      
      // Calculate velocity magnitude
      let velocity = 0;
      if (positionAndVelocity.velocity && typeof positionAndVelocity.velocity !== 'boolean') {
        const vel = positionAndVelocity.velocity;
        velocity = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
      }

      return {
        latitude,
        longitude,
        altitude,
        velocity,
        timestamp: time,
      };
    } catch (error) {
      return null;
    }
  }

  private async calculateCollisionRisks(): Promise<void> {
    try {
      // This is a simplified collision risk calculation
      // In a real system, this would be much more sophisticated
      
      const activeSatellites = await prisma.satellite.findMany({
        where: { 
          isActive: true,
          status: 'ACTIVE',
        },
        include: {
          positions: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });

      const risks: any[] = [];
      const riskThreshold = config.collisionThreshold; // km

      for (let i = 0; i < activeSatellites.length; i++) {
        const sat1 = activeSatellites[i];
        if (!sat1.positions[0]) continue;

        for (let j = i + 1; j < activeSatellites.length; j++) {
          const sat2 = activeSatellites[j];
          if (!sat2.positions[0]) continue;

          const distance = this.calculateDistance(
            sat1.positions[0],
            sat2.positions[0]
          );

          if (distance < riskThreshold) {
            const probability = Math.max(0, 1 - (distance / riskThreshold));
            const riskLevel = this.determineRiskLevel(probability);

            risks.push({
              primarySatId: sat1.id,
              secondaryObjId: sat2.id,
              secondaryObjName: sat2.name,
              probability,
              timeOfClosest: new Date(Date.now() + 60 * 60 * 1000), // Estimate 1 hour from now
              missDistance: distance,
              riskLevel,
            });
          }
        }
      }

      // Clear old risks and insert new ones
      await prisma.$transaction(async (tx) => {
        await tx.collisionRisk.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });

        if (risks.length > 0) {
          await tx.collisionRisk.createMany({
            data: risks,
            skipDuplicates: true,
          });
        }
      });

      if (risks.length > 0) {
        logger.info(`Identified ${risks.length} potential collision risks`);
      }
    } catch (error) {
      logger.error('Failed to calculate collision risks:', error);
    }
  }

  private calculateDistance(pos1: any, pos2: any): number {
    const R = 6371; // Earth radius in km
    const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const dLon = (pos2.longitude - pos1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1.latitude * Math.PI / 180) * Math.cos(pos2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const surfaceDistance = R * c;
    
    // Add altitude difference
    const altitudeDiff = Math.abs(pos2.altitude - pos1.altitude);
    return Math.sqrt(surfaceDistance * surfaceDistance + altitudeDiff * altitudeDiff);
  }

  private determineRiskLevel(probability: number): string {
    if (probability >= 0.7) return 'CRITICAL';
    if (probability >= 0.4) return 'HIGH';
    if (probability >= 0.1) return 'MEDIUM';
    return 'LOW';
  }

  public async getSatellitePosition(noradId: number): Promise<SatellitePosition | null> {
    const satrec = this.tleCache.get(noradId);
    if (!satrec) return null;

    return this.calculateSatellitePosition(satrec, new Date());
  }

  public async getTrackedSatellites(): Promise<number[]> {
    return Array.from(this.tleCache.keys());
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}