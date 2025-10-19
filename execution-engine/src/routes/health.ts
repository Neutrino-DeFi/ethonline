import { Router, Request, Response } from 'express';
import { config } from '../config/environment';
import { HealthCheckResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import database from '../config/database';

const router = Router();

// Get memory usage information
const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  const total = usage.heapTotal;
  const used = usage.heapUsed;
  const percentage = Math.round((used / total) * 100);

  return {
    used: `${Math.round(used / 1024 / 1024)} MB`,
    total: `${Math.round(total / 1024 / 1024)} MB`,
    percentage,
  };
};

// Get CPU usage (simplified)
const getCpuUsage = async (): Promise<{ usage: number }> => {
  return new Promise((resolve) => {
    const startUsage = process.cpuUsage();
    
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage);
      const usage = (endUsage.user + endUsage.system) / 1000000; // Convert to seconds
      resolve({ usage: Math.round(usage * 100) / 100 });
    }, 100);
  });
};

// Basic health check endpoint
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const healthCheck: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: config.app.version,
    environment: config.env,
    memory: getMemoryUsage(),
  };

  res.status(200).json(healthCheck);
}));

// Detailed health check endpoint
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const memory = getMemoryUsage();
  const cpu = await getCpuUsage();
  
  const healthCheck: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: config.app.version,
    environment: config.env,
    memory,
    cpu,
  };

  res.status(200).json(healthCheck);
}));

// Readiness probe endpoint (for Kubernetes)
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  // Add any readiness checks here (database connections, external services, etc.)
  const isReady = true; // Placeholder for actual readiness checks
  
  if (isReady) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
    });
  }
}));

// Liveness probe endpoint (for Kubernetes)
router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  // Basic liveness check - if this endpoint responds, the process is alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
}));

// Database health check endpoint
router.get('/database', asyncHandler(async (req: Request, res: Response) => {
  const dbHealth = await database.healthCheck();

  const statusCode = dbHealth.status === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    timestamp: new Date().toISOString(),
    database: {
      ...dbHealth,
      readyStateDescription: getReadyStateDescription(dbHealth.readyState),
    },
  });
}));

// Helper function to describe mongoose connection ready state
const getReadyStateDescription = (state: number): string => {
  const states: { [key: number]: string } = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[state] || 'unknown';
};

export default router;
