import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { authRoutes } from './routes/auth.js';
import { satelliteRoutes } from './routes/satellites.js';
import { userRoutes } from './routes/users.js';
import { analyticsRoutes } from './routes/analytics.js';
import { weatherRoutes } from './routes/weather.js';
import { debrisRoutes } from './routes/debris.js';
import { launchRoutes } from './routes/launches.js';
import { alertRoutes } from './routes/alerts.js';
import { WebSocketServer } from './services/websocket.js';
import { SatelliteTracker } from './services/satelliteTracker.js';
import { SpaceWeatherService } from './services/spaceWeather.js';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/satellites', satelliteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/debris', debrisRoutes);
app.use('/api/launches', launchRoutes);
app.use('/api/alerts', alertRoutes);

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Orbital Insight AI API',
    version: '1.0.0',
    description: 'Advanced satellite tracking and space analytics API',
    endpoints: {
      auth: '/api/auth',
      satellites: '/api/satellites',
      users: '/api/users',
      analytics: '/api/analytics',
      weather: '/api/weather',
      debris: '/api/debris',
      launches: '/api/launches',
      alerts: '/api/alerts',
    },
    websocket: 'ws://localhost:3001',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize services
const initializeServices = async () => {
  try {
    // Initialize WebSocket server
    const wsServer = new WebSocketServer(server);
    
    // Initialize satellite tracker
    const satelliteTracker = new SatelliteTracker();
    await satelliteTracker.initialize();
    
    // Initialize space weather service
    const spaceWeatherService = new SpaceWeatherService();
    await spaceWeatherService.initialize();
    
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await initializeServices();
    
    server.listen(config.port, () => {
      logger.info(`🚀 Orbital Insight AI API server running on port ${config.port}`);
      logger.info(`📊 Health check: http://localhost:${config.port}/health`);
      logger.info(`📖 API docs: http://localhost:${config.port}/api/docs`);
      logger.info(`🔌 WebSocket: ws://localhost:${config.port}`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      logger.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    logger.info('Server closed successfully');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();