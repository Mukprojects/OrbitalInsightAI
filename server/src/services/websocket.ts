import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../utils/database.js';
import { logger } from '../utils/logger.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export class WebSocketServer {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private satelliteSubscriptions = new Map<string, Set<string>>(); // satelliteId -> Set of socketIds

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.startHeartbeat();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, config.jwtSecret) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, username: true, isActive: true },
        });

        if (!user || !user.isActive) {
          return next(new Error('Invalid or inactive user'));
        }

        socket.userId = user.id;
        socket.username = user.username;
        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`User ${socket.username} connected via WebSocket`, { socketId: socket.id, userId: socket.userId });

      // Track connected user
      if (socket.userId) {
        if (!this.connectedUsers.has(socket.userId)) {
          this.connectedUsers.set(socket.userId, new Set());
        }
        this.connectedUsers.get(socket.userId)!.add(socket.id);
      }

      // Handle satellite subscription
      socket.on('subscribe:satellite', (satelliteId: string) => {
        if (!satelliteId) return;
        
        logger.debug(`User ${socket.username} subscribed to satellite ${satelliteId}`);
        socket.join(`satellite:${satelliteId}`);
        
        if (!this.satelliteSubscriptions.has(satelliteId)) {
          this.satelliteSubscriptions.set(satelliteId, new Set());
        }
        this.satelliteSubscriptions.get(satelliteId)!.add(socket.id);
      });

      // Handle satellite unsubscription
      socket.on('unsubscribe:satellite', (satelliteId: string) => {
        if (!satelliteId) return;
        
        logger.debug(`User ${socket.username} unsubscribed from satellite ${satelliteId}`);
        socket.leave(`satellite:${satelliteId}`);
        
        const subscribers = this.satelliteSubscriptions.get(satelliteId);
        if (subscribers) {
          subscribers.delete(socket.id);
          if (subscribers.size === 0) {
            this.satelliteSubscriptions.delete(satelliteId);
          }
        }
      });

      // Handle global data subscriptions
      socket.on('subscribe:global', () => {
        socket.join('global-updates');
        logger.debug(`User ${socket.username} subscribed to global updates`);
      });

      socket.on('unsubscribe:global', () => {
        socket.leave('global-updates');
        logger.debug(`User ${socket.username} unsubscribed from global updates`);
      });

      // Handle collision alerts subscription
      socket.on('subscribe:alerts', () => {
        if (socket.userId) {
          socket.join(`user:${socket.userId}:alerts`);
          logger.debug(`User ${socket.username} subscribed to personal alerts`);
        }
      });

      // Handle space weather subscription
      socket.on('subscribe:weather', () => {
        socket.join('space-weather');
        logger.debug(`User ${socket.username} subscribed to space weather updates`);
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        logger.info(`User ${socket.username} disconnected`, { reason, socketId: socket.id });
        
        // Clean up user tracking
        if (socket.userId) {
          const userSockets = this.connectedUsers.get(socket.userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              this.connectedUsers.delete(socket.userId);
            }
          }
        }

        // Clean up satellite subscriptions
        this.satelliteSubscriptions.forEach((subscribers, satelliteId) => {
          subscribers.delete(socket.id);
          if (subscribers.size === 0) {
            this.satelliteSubscriptions.delete(satelliteId);
          }
        });
      });

      // Send initial connection confirmation
      socket.emit('connected', {
        message: 'Connected to Orbital Insight AI',
        timestamp: new Date().toISOString(),
        userId: socket.userId,
      });
    });
  }

  private startHeartbeat() {
    setInterval(() => {
      this.io.emit('heartbeat', {
        timestamp: new Date().toISOString(),
        connectedUsers: this.connectedUsers.size,
        activeSubscriptions: this.satelliteSubscriptions.size,
      });
    }, config.wsHeartbeatInterval);
  }

  // Public methods for broadcasting data
  public broadcastSatelliteUpdate(satelliteId: string, data: any) {
    this.io.to(`satellite:${satelliteId}`).emit('satellite:update', {
      satelliteId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastGlobalUpdate(type: string, data: any) {
    this.io.to('global-updates').emit('global:update', {
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastAlert(userId: string, alert: any) {
    this.io.to(`user:${userId}:alerts`).emit('alert', {
      ...alert,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastSpaceWeather(data: any) {
    this.io.to('space-weather').emit('weather:update', {
      data,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  public getActiveSubscriptions(): number {
    return this.satelliteSubscriptions.size;
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}