import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/database.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { createError } from '../middleware/errorHandler.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Apply rate limiting to auth routes
router.use(authRateLimiter);

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username },
        ],
      },
    });

    if (existingUser) {
      throw createError(
        existingUser.email === validatedData.email 
          ? 'Email already registered' 
          : 'Username already taken',
        409,
        'USER_EXISTS'
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);

    // Create user with transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          username: validatedData.username,
          password: hashedPassword,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      // Create default user preferences
      await tx.userPreferences.create({
        data: {
          userId: user.id,
        },
      });

      return user;
    });

    logger.info(`New user registered: ${result.username} (${result.email})`);

    res.status(201).json({
      message: 'User registered successfully',
      user: result,
    });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        preferences: true,
      },
    });

    if (!user || !user.isActive) {
      throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    if (!isPasswordValid) {
      throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    // Create session record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        expiresAt,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    logger.info(`User logged in: ${user.username} (${user.email})`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        preferences: user.preferences,
        lastLogin: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Remove session
      await prisma.userSession.deleteMany({
        where: {
          userId: req.user!.id,
          token,
        },
      });
    }

    logger.info(`User logged out: ${req.user!.username}`);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        preferences: true,
        trackedSatellites: {
          include: {
            satellite: {
              select: {
                id: true,
                name: true,
                type: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            alerts: { where: { isRead: false } },
          },
        },
      },
    });

    if (!user) {
      throw createError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        preferences: user.preferences,
        trackedSatellites: user.trackedSatellites,
        unreadAlerts: user._count.alerts,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const updateSchema = z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      username: z.string().min(3).max(30).optional(),
    });

    const validatedData = updateSchema.parse(req.body);

    // Check if username is already taken (if provided)
    if (validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          id: { not: req.user!.id },
        },
      });

      if (existingUser) {
        throw createError('Username already taken', 409, 'USERNAME_TAKEN');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/password', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validatedData = changePasswordSchema.parse(req.body);

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      throw createError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(validatedData.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw createError('Current password is incorrect', 401, 'INVALID_PASSWORD');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, saltRounds);

    // Update password and invalidate all sessions except current
    const token = req.headers.authorization?.split(' ')[1];
    
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      });

      // Remove all sessions except current
      await tx.userSession.deleteMany({
        where: {
          userId: user.id,
          token: { not: token },
        },
      });
    });

    logger.info(`Password changed for user: ${user.username}`);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    // Generate new token
    const newToken = jwt.sign(
      { userId: req.user!.id, email: req.user!.email, role: req.user!.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    // Update session with new token
    const oldToken = req.headers.authorization?.split(' ')[1];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.$transaction(async (tx) => {
      // Remove old session
      await tx.userSession.deleteMany({
        where: {
          userId: req.user!.id,
          token: oldToken,
        },
      });

      // Create new session
      await tx.userSession.create({
        data: {
          userId: req.user!.id,
          token: newToken,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          expiresAt,
        },
      });
    });

    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };