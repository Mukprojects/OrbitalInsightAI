import bcrypt from 'bcryptjs';
import { prisma } from '../utils/database.js';
import { logger } from '../utils/logger.js';

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@orbital-insight.ai' },
      update: {},
      create: {
        email: 'admin@orbital-insight.ai',
        username: 'admin',
        password: adminPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        preferences: {
          create: {
            theme: 'dark',
            notifications: true,
            emailAlerts: true,
          },
        },
      },
    });

    // Create demo user
    const demoPassword = await bcrypt.hash('demo123', 12);
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@orbital-insight.ai' },
      update: {},
      create: {
        email: 'demo@orbital-insight.ai',
        username: 'demo',
        password: demoPassword,
        firstName: 'Demo',
        lastName: 'User',
        role: 'USER',
        preferences: {
          create: {
            theme: 'dark',
            notifications: true,
            emailAlerts: false,
          },
        },
      },
    });

    // Create sample satellites
    const satellites = [
      {
        noradId: 25544,
        name: 'ISS (ZARYA)',
        commonName: 'International Space Station',
        type: 'SCIENTIFIC',
        country: 'MULTINATIONAL',
        owner: 'International',
        launchDate: new Date('1998-11-20'),
        period: 92.68,
        inclination: 51.64,
        apogee: 408,
        perigee: 398,
        status: 'ACTIVE',
      },
      {
        noradId: 20580,
        name: 'HST',
        commonName: 'Hubble Space Telescope',
        type: 'SCIENTIFIC',
        country: 'US',
        owner: 'NASA',
        launchDate: new Date('1990-04-24'),
        period: 96.4,
        inclination: 28.47,
        apogee: 547,
        perigee: 537,
        status: 'ACTIVE',
      },
      {
        noradId: 43013,
        name: 'NOAA-19',
        commonName: 'NOAA-19',
        type: 'WEATHER',
        country: 'US',
        owner: 'NOAA',
        launchDate: new Date('2009-02-06'),
        period: 102.1,
        inclination: 99.19,
        apogee: 870,
        perigee: 854,
        status: 'ACTIVE',
      },
      {
        noradId: 41866,
        name: 'GOES-15',
        commonName: 'GOES-15',
        type: 'WEATHER',
        country: 'US',
        owner: 'NOAA',
        launchDate: new Date('2010-03-04'),
        period: 1436.1,
        inclination: 0.3,
        apogee: 35803,
        perigee: 35769,
        status: 'ACTIVE',
      },
      {
        noradId: 37849,
        name: 'SPOT-5',
        commonName: 'SPOT-5',
        type: 'EARTH_OBSERVATION',
        country: 'FR',
        owner: 'CNES',
        launchDate: new Date('2002-05-04'),
        period: 101.4,
        inclination: 98.7,
        apogee: 832,
        perigee: 822,
        status: 'ACTIVE',
      },
    ];

    for (const satData of satellites) {
      await prisma.satellite.upsert({
        where: { noradId: satData.noradId },
        update: {},
        create: satData,
      });
    }

    // Create sample debris objects
    const debrisObjects = [
      {
        noradId: 12345,
        name: 'COSMOS 2251 DEB',
        type: 'FRAGMENTATION_DEBRIS',
        size: 0.5,
        mass: 2.3,
        lastObserved: new Date(),
        decayPrediction: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
      {
        noradId: 23456,
        name: 'IRIDIUM 33 DEB',
        type: 'FRAGMENTATION_DEBRIS',
        size: 1.2,
        mass: 5.8,
        lastObserved: new Date(),
        decayPrediction: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
      },
      {
        noradId: 34567,
        name: 'ARIANE 5 R/B',
        type: 'ROCKET_BODY',
        size: 15.0,
        mass: 2400.0,
        lastObserved: new Date(),
        decayPrediction: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 years from now
      },
    ];

    for (const debrisData of debrisObjects) {
      await prisma.debrisObject.upsert({
        where: { noradId: debrisData.noradId },
        update: {},
        create: debrisData,
      });
    }

    // Create sample launch events
    const launches = [
      {
        name: 'Falcon 9 Block 5 | Starlink Group 7-1',
        launchDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        rocket: 'Falcon 9 Block 5',
        launchSite: 'Kennedy Space Center LC-39A',
        mission: 'Starlink constellation deployment',
        status: 'SCHEDULED' as const,
        payloads: JSON.stringify(['Starlink v2.0 x23']),
        description: 'SpaceX will launch 23 Starlink satellites to low Earth orbit.',
        liveStream: 'https://www.spacex.com/launches/',
      },
      {
        name: 'Atlas V 541 | USSF-51',
        launchDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        rocket: 'Atlas V 541',
        launchSite: 'Cape Canaveral SLC-41',
        mission: 'Military satellite deployment',
        status: 'SCHEDULED' as const,
        payloads: JSON.stringify(['Classified payload']),
        description: 'ULA Atlas V rocket will deploy a classified military satellite.',
      },
      {
        name: 'Falcon Heavy | Artemis Mission',
        launchDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
        rocket: 'Falcon Heavy',
        launchSite: 'Kennedy Space Center LC-39A',
        mission: 'Moon mission support',
        status: 'SUCCESS' as const,
        payloads: JSON.stringify(['Orion Service Module']),
        description: 'Successfully launched Artemis mission components.',
      },
    ];

    for (const launchData of launches) {
      await prisma.launchEvent.create({
        data: launchData,
      });
    }

    // Create sample space weather data
    const now = new Date();
    for (let i = 0; i < 48; i++) {
      const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000); // Every 30 minutes for last 24 hours
      
      await prisma.spaceWeather.create({
        data: {
          timestamp,
          solarFluxIndex: 120 + Math.random() * 80,
          geomagneticIndex: Math.random() * 5,
          solarWindSpeed: 350 + Math.random() * 200,
          protonFlux: Math.random() * 100,
          electronFlux: Math.random() * 1000,
          xrayFlux: Math.random() * 1e-6,
          alertLevel: Math.random() > 0.8 ? 'YELLOW' : 'GREEN',
          description: 'Normal space weather conditions',
        },
      });
    }

    // Create sample alerts for demo user
    const alertTypes = ['COLLISION_RISK', 'SATELLITE_ANOMALY', 'SPACE_WEATHER', 'SYSTEM_ALERT'] as const;
    const severities = ['LOW', 'MEDIUM', 'HIGH'] as const;

    for (let i = 0; i < 10; i++) {
      await prisma.alert.create({
        data: {
          userId: demoUser.id,
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          title: `Sample Alert ${i + 1}`,
          message: `This is a sample alert message for demonstration purposes.`,
          severity: severities[Math.floor(Math.random() * severities.length)],
          isRead: Math.random() > 0.5,
          metadata: JSON.stringify({
            sampleData: true,
            alertNumber: i + 1,
          }),
        },
      });
    }

    // Create daily analytics entries for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      await prisma.analytics.upsert({
        where: { date },
        update: {},
        create: {
          date,
          totalSatellites: 5000 + Math.floor(Math.random() * 100),
          activeSatellites: 4800 + Math.floor(Math.random() * 100),
          totalDebris: 34000 + Math.floor(Math.random() * 500),
          collisionRisks: Math.floor(Math.random() * 20),
          spaceWeatherEvents: Math.floor(Math.random() * 5),
          userSessions: 100 + Math.floor(Math.random() * 200),
          apiCalls: 10000 + Math.floor(Math.random() * 5000),
        },
      });
    }

    logger.info('✅ Database seeding completed successfully');
    logger.info('Demo credentials:');
    logger.info('Admin: admin@orbital-insight.ai / admin123');
    logger.info('User: demo@orbital-insight.ai / demo123');

  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedDatabase };