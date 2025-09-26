import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/orbital_insight_db',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // External APIs
  celestrakApiKey: process.env.CELESTRAK_API_KEY,
  spaceTrackUsername: process.env.SPACE_TRACK_USERNAME,
  spaceTrackPassword: process.env.SPACE_TRACK_PASSWORD,
  nasaApiKey: process.env.NASA_API_KEY,
  noaaApiKey: process.env.NOAA_API_KEY,
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // API endpoints
  celestrakTleUrl: 'https://celestrak.org/NORAD/elements/gp.php',
  spaceTrackBaseUrl: 'https://www.space-track.org',
  nasaApiBaseUrl: 'https://api.nasa.gov',
  noaaSpaceWeatherUrl: 'https://services.swpc.noaa.gov/json',
  
  // Satellite tracking
  updateInterval: 60000, // 1 minute
  maxSatellites: 10000,
  maxHistoryDays: 30,
  
  // Collision detection
  collisionThreshold: 10, // km
  riskUpdateInterval: 300000, // 5 minutes
  
  // Space weather
  weatherUpdateInterval: 600000, // 10 minutes
  
  // WebSocket
  wsHeartbeatInterval: 30000, // 30 seconds
  wsMaxConnections: 1000,
};